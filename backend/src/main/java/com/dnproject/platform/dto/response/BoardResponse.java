package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.BoardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long shelterId;
    private BoardType type;
    private String title;
    private String content;
    private Integer views;
    private Boolean isPinned;
    private Instant createdAt;
}
