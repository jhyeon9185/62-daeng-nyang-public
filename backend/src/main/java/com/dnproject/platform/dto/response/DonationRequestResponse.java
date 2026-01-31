package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationRequestResponse {

    private Long id;
    private Long shelterId;
    private String shelterName;
    private String title;
    private String content;
    private String itemCategory;
    private Integer targetQuantity;
    private Integer currentQuantity;
    private LocalDate deadline;
    private RequestStatus status;
    private Instant createdAt;
}
