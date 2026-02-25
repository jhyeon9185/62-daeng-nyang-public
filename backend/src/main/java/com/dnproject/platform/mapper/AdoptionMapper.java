package com.dnproject.platform.mapper;

import com.dnproject.platform.domain.Adoption;
import com.dnproject.platform.dto.response.AdoptionResponse;
import org.springframework.stereotype.Component;

@Component
public class AdoptionMapper {

    public AdoptionResponse toResponse(Adoption a) {
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
