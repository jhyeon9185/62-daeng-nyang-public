package com.dnproject.platform.service;

import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.Role;
import com.dnproject.platform.domain.constant.VerificationStatus;
import com.dnproject.platform.dto.request.LoginRequest;
import com.dnproject.platform.dto.request.ShelterSignupRequest;
import com.dnproject.platform.dto.request.SignupRequest;
import com.dnproject.platform.dto.request.UpdateMeRequest;
import com.dnproject.platform.dto.response.ShelterSignupResponse;
import com.dnproject.platform.dto.response.TokenResponse;
import com.dnproject.platform.dto.response.UserResponse;
import com.dnproject.platform.exception.CustomException;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.repository.UserRepository;
import com.dnproject.platform.util.AddressRegionParser;
import com.dnproject.platform.security.JwtProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token={idToken}";

    private final UserRepository userRepository;
    private final ShelterRepository shelterRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final WebClient.Builder webClientBuilder;

    @Transactional
    public UserResponse signup(SignupRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword().trim() : "";
        if (userRepository.existsByEmailTrimmed(email)) {
            throw new CustomException("이미 사용 중인 이메일입니다.", HttpStatus.CONFLICT, "EMAIL_EXISTS");
        }
        String encodedPassword = passwordEncoder.encode(rawPassword);
        User user = User.builder()
                .email(email)
                .password(encodedPassword)
                .name(request.getName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .build();
        user = userRepository.save(user);
        userRepository.flush();
        User refetched = userRepository.findById(user.getId()).orElse(null);
        if (refetched != null && !passwordEncoder.matches(rawPassword, refetched.getPassword())) {
            log.error("회원가입 직후 비밀번호 검증 실패: DB 저장값과 불일치. id={} encodedLen={} refetchedLen={}",
                    user.getId(), encodedPassword.length(), refetched.getPassword() != null ? refetched.getPassword().length() : 0);
            throw new CustomException("비밀번호 저장에 실패했습니다. 다시 시도해 주세요.", HttpStatus.INTERNAL_SERVER_ERROR, "PASSWORD_SAVE_FAILED");
        }
        return toUserResponse(user);
    }

    @Transactional
    public ShelterSignupResponse shelterSignup(ShelterSignupRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword().trim() : "";
        if (userRepository.existsByEmailTrimmed(email)) {
            throw new CustomException("이미 사용 중인 이메일입니다.", HttpStatus.CONFLICT, "EMAIL_EXISTS");
        }
        String bizNo = request.getBusinessRegistrationNumber() != null ? request.getBusinessRegistrationNumber().trim().replaceAll("-", "") : null;
        if (bizNo != null && !bizNo.isEmpty() && shelterRepository.findByBusinessRegistrationNumber(bizNo).isPresent()) {
            throw new CustomException("이미 등록된 사업자등록번호입니다.", HttpStatus.CONFLICT, "BUSINESS_REG_EXISTS");
        }
        String encodedPassword = passwordEncoder.encode(rawPassword);
        User user = User.builder()
                .email(email)
                .password(encodedPassword)
                .name(request.getManagerName())
                .phone(request.getManagerPhone())
                .address(request.getAddress())
                .role(Role.SHELTER_ADMIN)
                .build();
        user = userRepository.save(user);
        userRepository.flush();
        /* UNIQUE 컬럼에 빈 문자열 저장 시 중복 오류 방지 */
        String bizNoForDb = (bizNo != null && !bizNo.isEmpty()) ? bizNo : null;
        String addr = request.getAddress() != null ? request.getAddress() : "";
        String[] region = AddressRegionParser.parse(addr);
        Shelter shelter = Shelter.builder()
                .name(request.getShelterName())
                .address(addr)
                .regionSido(region[0])
                .regionSigungu(region[1])
                .phone(request.getShelterPhone())
                .email(email)
                .manager(user)
                .managerName(request.getManagerName())
                .managerPhone(request.getManagerPhone())
                .businessRegistrationNumber(bizNoForDb)
                .businessRegistrationFile(request.getBusinessRegistrationFile())
                .verificationStatus(VerificationStatus.PENDING)
                .build();
        shelter = shelterRepository.save(shelter);
        return ShelterSignupResponse.builder()
                .userId(user.getId())
                .shelterId(shelter.getId())
                .verificationStatus(VerificationStatus.PENDING)
                .message("보호소 가입 신청이 완료되었습니다. 관리자 인증 후 서비스 이용이 가능합니다.")
                .build();
    }

    /**
     * 구글 ID 토큰을 검증한 뒤 사용자 조회/생성 후 JWT 발급.
     * tokeninfo API로 검증 후 email로 기존 사용자 조회, 없으면 신규 생성(비밀번호는 난수 해시 저장).
     */
    public TokenResponse googleLogin(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new UnauthorizedException("구글 ID 토큰이 없습니다.");
        }
        Map<String, Object> tokenInfo;
        try {
            tokenInfo = webClientBuilder.build()
                    .get()
                    .uri(GOOGLE_TOKENINFO_URL, idToken)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.warn("구글 tokeninfo 실패: status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UnauthorizedException("구글 로그인이 만료되었거나 유효하지 않습니다. 다시 시도해 주세요.");
        }
        if (tokenInfo == null) {
            throw new UnauthorizedException("구글 토큰 검증에 실패했습니다.");
        }
        String email = Optional.ofNullable(tokenInfo.get("email")).map(Object::toString).map(String::trim).orElse(null);
        if (email == null || email.isEmpty()) {
            log.warn("구글 tokeninfo에 email 없음: {}", tokenInfo.keySet());
            throw new UnauthorizedException("구글 계정 정보를 확인할 수 없습니다.");
        }
        String name = Optional.ofNullable(tokenInfo.get("name")).map(Object::toString).map(String::trim).orElse(null);
        final String displayName = (name == null || name.isBlank())
                ? Optional.ofNullable(tokenInfo.get("given_name")).map(Object::toString).map(String::trim).orElse(email)
                : name;

        User user = userRepository.findByEmailTrimmed(email)
                .orElseGet(() -> createGoogleUser(email, displayName));
        String accessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = jwtProvider.createRefreshToken(user.getEmail());
        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessValiditySeconds())
                .user(toUserResponse(user))
                .build();
    }

    @Transactional
    protected User createGoogleUser(String email, String name) {
        String randomPassword = passwordEncoder.encode(UUID.randomUUID().toString());
        User user = User.builder()
                .email(email)
                .password(randomPassword)
                .name(name != null && !name.isBlank() ? name : email)
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    public TokenResponse login(LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword().trim() : "";
        log.debug("로그인 시도 email={} rawPasswordLen={}", email, rawPassword != null ? rawPassword.length() : 0);
        User user = userRepository.findByEmailTrimmed(email)
                .orElseThrow(() -> {
                    log.warn("로그인 실패: 이메일 없음 email={}", email);
                    return new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
                });
        String storedPassword = user.getPassword();
        if (storedPassword == null || !passwordEncoder.matches(rawPassword, storedPassword)) {
            log.warn("로그인 실패: 비밀번호 불일치 email={} storedHashLength={}",
                    email, storedPassword != null ? storedPassword.length() : 0);
            throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        String accessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = jwtProvider.createRefreshToken(user.getEmail());
        UserResponse userResponse = toUserResponse(user);
        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessValiditySeconds())
                .user(userResponse)
                .build();
    }

    public TokenResponse refreshToken(String refreshToken) {
        if (refreshToken == null || !jwtProvider.validateRefreshToken(refreshToken)) {
            throw new UnauthorizedException("유효하지 않은 갱신 토큰입니다.");
        }
        Claims claims = jwtProvider.parseRefreshToken(refreshToken);
        String email = claims.getSubject();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
        String newAccessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name(), user.getId());
        String newRefreshToken = jwtProvider.createRefreshToken(user.getEmail());
        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessValiditySeconds())
                .user(toUserResponse(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateMe(Long userId, UpdateMeRequest request) {
        if (request == null) {
            throw new CustomException("수정할 항목을 입력해 주세요.", HttpStatus.BAD_REQUEST, "INVALID_REQUEST");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
        boolean changed = false;
        if (request.getName() != null && !request.getName().isBlank()) {
            String name = request.getName().trim();
            if (!name.equals(user.getName())) {
                user.setName(name);
                changed = true;
            }
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String email = request.getEmail().trim();
            if (!email.equals(user.getEmail())) {
                userRepository.findByEmailTrimmed(email).ifPresent(other -> {
                    if (!other.getId().equals(userId)) {
                        throw new CustomException("이미 사용 중인 이메일입니다.", HttpStatus.CONFLICT, "EMAIL_EXISTS");
                    }
                });
                user.setEmail(email);
                changed = true;
            }
        }
        if (!changed) {
            return toUserResponse(user);
        }
        User saved = userRepository.save(user);
        if (saved.getRole() == Role.SHELTER_ADMIN) {
            User manager = saved;
            shelterRepository.findByManager_Id(userId).ifPresent(shelter -> {
                shelter.setEmail(manager.getEmail());
                shelter.setManagerName(manager.getName());
                shelterRepository.save(shelter);
            });
        }
        return toUserResponse(saved);
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
