package com.dnproject.platform.service;

import com.dnproject.platform.domain.Preference;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.dto.request.PreferenceRequest;
import com.dnproject.platform.dto.response.PreferenceResponse;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.repository.PreferenceRepository;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PreferenceService {

    private final PreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PreferenceResponse getByUserId(Long userId) {
        return preferenceRepository.findByUser_Id(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public PreferenceResponse update(Long userId, PreferenceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        Preference preference = preferenceRepository.findByUser_Id(userId)
                .orElseGet(() -> {
                    Preference newPref = new Preference();
                    newPref.setUser(user);
                    return newPref;
                });

        if (request.getSpecies() != null) {
            preference.setSpecies(request.getSpecies());
        }
        if (request.getMinAge() != null) {
            preference.setMinAge(request.getMinAge());
        }
        if (request.getMaxAge() != null) {
            preference.setMaxAge(request.getMaxAge());
        }
        if (request.getSize() != null) {
            preference.setSize(request.getSize());
        }
        if (request.getRegion() != null) {
            String r = request.getRegion().trim();
            preference.setRegion(r.isEmpty() ? null : r);
        } else {
            preference.setRegion(null);
        }

        preference = preferenceRepository.save(preference);
        return toResponse(preference);
    }

    private PreferenceResponse toResponse(Preference p) {
        return PreferenceResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .species(p.getSpecies())
                .minAge(p.getMinAge())
                .maxAge(p.getMaxAge())
                .size(p.getSize())
                .region(p.getRegion())
                .build();
    }
}
