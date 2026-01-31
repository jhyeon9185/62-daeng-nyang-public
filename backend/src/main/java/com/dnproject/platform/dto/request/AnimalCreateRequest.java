package com.dnproject.platform.dto.request;

import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Gender;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnimalCreateRequest {

    @NotNull
    private Long shelterId;
    @NotNull
    private Species species;
    private String breed;
    private String name;
    private Integer age;
    private Gender gender;
    private Size size;
    private String description;
    private String imageUrl;
    private Boolean neutered;
    private Boolean vaccinated;
    private AnimalStatus status;
}
