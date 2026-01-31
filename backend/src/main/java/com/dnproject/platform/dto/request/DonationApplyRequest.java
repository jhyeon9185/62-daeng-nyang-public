package com.dnproject.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationApplyRequest {

    @NotNull(message = "물품 요청 ID는 필수입니다")
    private Long requestId;

    @NotBlank(message = "물품명은 필수입니다")
    private String itemName;

    @NotNull(message = "수량은 필수입니다")
    @Positive
    private Integer quantity;

    @NotBlank(message = "배송 방식은 필수입니다")
    private String deliveryMethod;

    private String trackingNumber;
}
