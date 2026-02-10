package com.dnproject.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponse<T> {

    // 실제 데이터 목록
    private List<T> content;

    // 현재 페이지 번호 (0부터 시작)
    private int page;

    // 페이지당 데이터 개수
    private int size;

    // 전체 데이터 개수
    private long totalElements;

    // 전체 페이지 수
    private int totalPages;

    // 첫 번째 페이지 여부
    private boolean first;

    // 마지막 페이지 여부
    private boolean last;
}
