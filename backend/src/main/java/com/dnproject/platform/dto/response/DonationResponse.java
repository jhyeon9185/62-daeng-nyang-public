package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.DonationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationResponse {

    private Long id;
    private Long requestId;
    /** 어떤 요청(물품 요청)에 대한 기부인지 - 제목 */
    private String requestTitle;
    private Long userId;
    private String shelterName;
    private String donorName;
    private String donorPhone;
    private String donorEmail;
    /** 기부 물품명 */
    private String itemName;
    /** 기부 수량 */
    private Integer quantity;
    /** 배송 방식 */
    private String deliveryMethod;
    private String trackingNumber;
    private DonationStatus status;
    private Instant createdAt;
}
