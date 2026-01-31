package com.dnproject.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationRequestCreateRequest {

    @NotNull(message = "보호소 ID는 필수입니다")
    private Long shelterId;

    @NotBlank(message = "제목은 필수입니다")
    private String title;

    @NotBlank(message = "내용은 필수입니다")
    private String content;

    @NotBlank(message = "물품 종류는 필수입니다")
    private String itemCategory;

    @NotNull(message = "목표 수량은 필수입니다")
    @Positive
    private Integer targetQuantity;

    @NotNull(message = "마감일은 필수입니다")
    private LocalDate deadline;
}
