package com.dnproject.platform.service;

import com.dnproject.platform.domain.Adoption;
import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.AdoptionStatus;
import com.dnproject.platform.dto.request.AdoptionRequest;
import com.dnproject.platform.dto.response.AdoptionResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.CustomException;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.repository.AdoptionRepository;
import com.dnproject.platform.repository.AnimalRepository;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdoptionService {

    private final AdoptionRepository adoptionRepository;
    private final UserRepository userRepository;
    private final AnimalRepository animalRepository;
    private final ShelterRepository shelterRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public AdoptionResponse apply(Long userId, AdoptionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        Animal animal = animalRepository.findById(request.getAnimalId())
                .orElseThrow(() -> new NotFoundException("동물을 찾을 수 없습니다."));
        Adoption adoption = Adoption.builder()
                .user(user)
                .animal(animal)
                .type(request.getType())
                .status(AdoptionStatus.PENDING)
                .reason(request.getReason())
                .experience(request.getExperience())
                .livingEnv(request.getLivingEnv())
                .familyAgreement(request.getFamilyAgreement())
                .build();
        adoption = adoptionRepository.save(adoption);
        String typeLabel = request.getType() != null && request.getType().name().equals("FOSTERING") ? "임시보호" : "입양";
        emailService.sendApplicationReceivedEmail(user.getEmail(), user.getName(), typeLabel);
        notifyAndEmailAdmin(adoption, user.getName(), animal);
        return toResponse(adoption);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdoptionResponse> getPendingByShelter(Long shelterId, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var adoptions = adoptionRepository.findByAnimal_Shelter_IdAndStatusOrderByCreatedAtDesc(shelterId, AdoptionStatus.PENDING, pageable);
        List<AdoptionResponse> content = adoptions.stream().map(this::toResponse).toList();
        return PageResponse.<AdoptionResponse>builder()
                .content(content)
                .page(adoptions.getNumber())
                .size(adoptions.getSize())
                .totalElements(adoptions.getTotalElements())
                .totalPages(adoptions.getTotalPages())
                .first(adoptions.isFirst())
                .last(adoptions.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<AdoptionResponse> getPendingByShelterForCurrentUser(Long userId, int page, int size) {
        var shelter = shelterRepository.findByManager_Id(userId)
                .orElseThrow(() -> new CustomException("보호소 관리자만 조회할 수 있습니다.", HttpStatus.FORBIDDEN, "FORBIDDEN"));
        return getPendingByShelter(shelter.getId(), page, size);
    }

    /** 시스템 관리자: 전체 입양/임보 신청 내역 (최신순) */
    @Transactional(readOnly = true)
    public PageResponse<AdoptionResponse> getAllForAdmin(int page, int size) {
        var pageable = PageRequest.of(page, size);
        var adoptions = adoptionRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<AdoptionResponse> content = adoptions.stream().map(this::toResponse).toList();
        return PageResponse.<AdoptionResponse>builder()
                .content(content)
                .page(adoptions.getNumber())
                .size(adoptions.getSize())
                .totalElements(adoptions.getTotalElements())
                .totalPages(adoptions.getTotalPages())
                .first(adoptions.isFirst())
                .last(adoptions.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<AdoptionResponse> getMyList(Long userId, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var adoptions = adoptionRepository.findByUser_IdOrderByCreatedAtDesc(userId, pageable);
        List<AdoptionResponse> content = adoptions.stream().map(this::toResponse).toList();
        return PageResponse.<AdoptionResponse>builder()
                .content(content)
                .page(adoptions.getNumber())
                .size(adoptions.getSize())
                .totalElements(adoptions.getTotalElements())
                .totalPages(adoptions.getTotalPages())
                .first(adoptions.isFirst())
                .last(adoptions.isLast())
                .build();
    }

    @Transactional
    public AdoptionResponse cancel(Long id, Long userId) {
        Adoption adoption = adoptionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("신청을 찾을 수 없습니다."));
        if (!adoption.getUser().getId().equals(userId)) {
            throw new CustomException("본인의 신청만 취소할 수 있습니다.", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }
        if (adoption.getStatus() != AdoptionStatus.PENDING) {
            throw new CustomException("대기 중인 신청만 취소할 수 있습니다.", HttpStatus.BAD_REQUEST, "INVALID_STATUS");
        }
        adoption.setStatus(AdoptionStatus.CANCELLED);
        adoption = adoptionRepository.save(adoption);
        return toResponse(adoption);
    }

    @Transactional
    public AdoptionResponse approve(Long id) {
        Adoption adoption = adoptionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("신청을 찾을 수 없습니다."));
        if (adoption.getStatus() != AdoptionStatus.PENDING) {
            throw new CustomException("대기 중인 신청만 승인할 수 있습니다.", HttpStatus.BAD_REQUEST, "INVALID_STATUS");
        }
        adoption.setStatus(AdoptionStatus.APPROVED);
        adoption.setProcessedAt(LocalDateTime.now());
        adoption = adoptionRepository.save(adoption);
        String typeLabel = adoption.getType() != null && adoption.getType().name().equals("FOSTERING") ? "임시보호" : "입양";
        emailService.sendApprovalEmail(adoption.getUser().getEmail(), adoption.getUser().getName(), typeLabel);
        return toResponse(adoption);
    }

    @Transactional
    public AdoptionResponse reject(Long id, String rejectReason) {
        Adoption adoption = adoptionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("신청을 찾을 수 없습니다."));
        if (adoption.getStatus() != AdoptionStatus.PENDING) {
            throw new CustomException("대기 중인 신청만 거절할 수 있습니다.", HttpStatus.BAD_REQUEST, "INVALID_STATUS");
        }
        adoption.setStatus(AdoptionStatus.REJECTED);
        adoption.setRejectReason(rejectReason);
        adoption.setProcessedAt(LocalDateTime.now());
        adoption = adoptionRepository.save(adoption);
        String typeLabel = adoption.getType() != null && adoption.getType().name().equals("FOSTERING") ? "임시보호" : "입양";
        emailService.sendRejectionEmail(adoption.getUser().getEmail(), adoption.getUser().getName(), typeLabel, rejectReason);
        return toResponse(adoption);
    }

    private void notifyAndEmailAdmin(Adoption adoption, String applicantName, Animal animal) {
        var shelter = animal.getShelter();
        if (shelter == null) return;
        var manager = shelter.getManager();
        String typeLabel = "입양/임보";
        String detail = String.format("동물: %s (ID %d)", animal.getName() != null ? animal.getName() : "이름 없음", animal.getId());
        if (manager != null) {
            notificationService.create(manager.getId(), "ADOPTION_APPLICATION",
                    applicantName + "님의 " + typeLabel + " 신청이 접수되었습니다.",
                    "/admin?tab=applications");
        }
        String adminEmail = (manager != null && manager.getEmail() != null && !manager.getEmail().isBlank()) ? manager.getEmail() : (shelter.getEmail() != null && !shelter.getEmail().isBlank() ? shelter.getEmail() : null);
        if (adminEmail != null) {
            emailService.sendApplicationReceivedToAdmin(adminEmail, applicantName, typeLabel, detail);
        } else {
            log.warn("관리자(보호소) 이메일 없음 - 입양/임보 신청 알림 미발송: shelterId={}, applicant={}", shelter.getId(), applicantName);
        }
    }

    private AdoptionResponse toResponse(Adoption a) {
        String animalName = a.getAnimal() != null && a.getAnimal().getName() != null ? a.getAnimal().getName() : null;
        return AdoptionResponse.builder()
                .id(a.getId())
                .userId(a.getUser() != null ? a.getUser().getId() : null)
                .animalId(a.getAnimal() != null ? a.getAnimal().getId() : null)
                .applicantName(a.getUser() != null ? a.getUser().getName() : null)
                .animalName(animalName)
                .type(a.getType())
                .status(a.getStatus())
                .reason(a.getReason())
                .experience(a.getExperience())
                .livingEnv(a.getLivingEnv())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
