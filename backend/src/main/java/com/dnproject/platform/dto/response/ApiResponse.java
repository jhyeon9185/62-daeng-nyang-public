package com.dnproject.platform.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // null인 필드는 JSON 응답에서 제외
public class ApiResponse<T> {

    // HTTP 상태 코드 (예: 200, 400, 404)
    private int status;

    // 응답 메시지 (예: "성공했습니다.", "잘못된 요청입니다.")
    private String message;

    // 실제 데이터 (제네릭 T로 유연하게 처리)
    private T data;

    // 응답 발생 시간
    private String timestamp;

    public static <T> ApiResponse<T> success(int status, String message, T data) {
        return ApiResponse.<T>builder()
                .status(status)
                .message(message)
                .data(data)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return success(200, message, data);
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return success(201, message, data);
    }
}
