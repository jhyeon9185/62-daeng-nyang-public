package com.dnproject.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentCreateRequest {

    @NotBlank(message = "댓글 내용은 필수입니다")
    private String content;
}
