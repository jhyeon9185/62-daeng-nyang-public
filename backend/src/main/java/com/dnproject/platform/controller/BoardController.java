package com.dnproject.platform.controller;

import com.dnproject.platform.domain.constant.BoardType;
import com.dnproject.platform.dto.request.BoardCreateRequest;
import com.dnproject.platform.dto.request.CommentCreateRequest;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.BoardResponse;
import com.dnproject.platform.dto.response.CommentResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.BoardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Board", description = "게시판 API")
@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    private Long getUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("인증이 필요합니다.");
        return userId;
    }

    @Operation(summary = "게시글 목록")
    @GetMapping
    public ApiResponse<PageResponse<BoardResponse>> getAll(
            @RequestParam(required = false) BoardType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<BoardResponse> data = boardService.findAll(type, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "게시글 상세")
    @GetMapping("/{id}")
    public ApiResponse<BoardResponse> getById(@PathVariable Long id) {
        BoardResponse data = boardService.findById(id);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "게시글 작성")
    @PostMapping
    public ApiResponse<BoardResponse> create(@Valid @RequestBody BoardCreateRequest request,
                                              HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        BoardResponse data = boardService.create(userId, request);
        return ApiResponse.created("작성 완료", data);
    }

    @Operation(summary = "게시글 수정")
    @PutMapping("/{id}")
    public ApiResponse<BoardResponse> update(@PathVariable Long id,
                                             @Valid @RequestBody BoardCreateRequest request,
                                             HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        BoardResponse data = boardService.update(id, userId, request);
        return ApiResponse.success("수정 완료", data);
    }

    @Operation(summary = "게시글 삭제")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        boardService.delete(id, userId);
        return ApiResponse.success("삭제 완료", null);
    }

    @Operation(summary = "댓글 목록")
    @GetMapping("/{id}/comments")
    public ApiResponse<List<CommentResponse>> getComments(@PathVariable Long id) {
        List<CommentResponse> data = boardService.getComments(id);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "댓글 작성")
    @PostMapping("/{id}/comments")
    public ApiResponse<CommentResponse> addComment(@PathVariable Long id,
                                                    @Valid @RequestBody CommentCreateRequest request,
                                                    HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        CommentResponse data = boardService.addComment(id, userId, request);
        return ApiResponse.created("댓글 작성 완료", data);
    }
}
