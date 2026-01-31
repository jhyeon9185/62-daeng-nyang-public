package com.dnproject.platform.controller;

import com.dnproject.platform.domain.constant.BoardType;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.BoardResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.service.BoardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 시스템 관리자 전용 - 게시판 목록 조회, 고정/삭제
 */
@Tag(name = "Admin - Board", description = "관리자 게시판 API")
@RestController
@RequestMapping("/api/admin/boards")
@RequiredArgsConstructor
public class AdminBoardController {

    private final BoardService boardService;

    @Operation(summary = "게시글 목록 (관리자)")
    @GetMapping
    public ApiResponse<PageResponse<BoardResponse>> list(
            @RequestParam(required = false) BoardType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<BoardResponse> data = boardService.findAll(type,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "isPinned").and(Sort.by(Sort.Direction.DESC, "createdAt"))));
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "게시글 상단 고정/해제")
    @PutMapping("/{id}/pin")
    public ApiResponse<BoardResponse> setPinned(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean pinned = body != null && Boolean.TRUE.equals(body.get("pinned"));
        BoardResponse data = boardService.setPinned(id, pinned);
        return ApiResponse.success(pinned ? "상단 고정되었습니다." : "고정 해제되었습니다.", data);
    }

    @Operation(summary = "게시글 삭제 (관리자)")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        boardService.deleteByAdmin(id);
        return ApiResponse.success("삭제 완료", null);
    }
}
