package com.dnproject.platform.dto.request;

import com.dnproject.platform.domain.constant.BoardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardCreateRequest {

    @NotNull(message = "게시판 유형은 필수입니다")
    private BoardType type;

    @NotBlank(message = "제목은 필수입니다")
    private String title;

    @NotBlank(message = "내용은 필수입니다")
    private String content;

    private Long shelterId;
}
