package com.dnproject.platform.mapper;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.dto.response.AnimalResponse;
import org.springframework.stereotype.Component;

@Component
public class AnimalMapper {

    public AnimalResponse toResponse(Animal a) {
        Shelter shelter = a.getShelter();
        String shelterName = shelter != null ? shelter.getName() : null;
        String shelterAddress = shelter != null ? shelter.getAddress() : null;
        String shelterPhone = shelter != null ? shelter.getPhone() : null;
        Double shelterLat = shelter != null && shelter.getLatitude() != null ? shelter.getLatitude().doubleValue()
                : null;
        Double shelterLng = shelter != null && shelter.getLongitude() != null ? shelter.getLongitude().doubleValue()
                : null;
        return AnimalResponse.builder()
                .id(a.getId())
                .publicApiAnimalId(a.getPublicApiAnimalId())
                .orgName(a.getOrgName())
                .chargeName(a.getChargeName())
                .chargePhone(a.getChargePhone())
                .shelterId(shelter != null ? shelter.getId() : null)
                .shelterName(shelterName)
                .shelterAddress(shelterAddress)
                .shelterPhone(shelterPhone)
                .shelterLatitude(shelterLat)
                .shelterLongitude(shelterLng)
                .species(a.getSpecies())
                .breed(a.getBreed())
                .name(a.getName())
                .age(a.getAge())
                .gender(a.getGender())
                .size(a.getSize())
                .description(a.getDescription())
                .imageUrl(a.getImageUrl())
                .neutered(a.getNeutered())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
