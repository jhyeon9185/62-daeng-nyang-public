package com.dnproject.platform.controller;

import com.dnproject.platform.dto.response.AnimalResponse;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Favorite", description = "즐겨찾기(찜) API")
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @Operation(summary = "찜 추가")
    @PostMapping("/{animalId}")
    public ApiResponse<Void> add(HttpServletRequest request, @PathVariable Long animalId) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        favoriteService.add(userId, animalId);
        return ApiResponse.success("찜에 추가되었습니다.", null);
    }

    @Operation(summary = "찜 해제")
    @DeleteMapping("/{animalId}")
    public ApiResponse<Void> remove(HttpServletRequest request, @PathVariable Long animalId) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        favoriteService.remove(userId, animalId);
        return ApiResponse.success("찜이 해제되었습니다.", null);
    }

    @Operation(summary = "내 찜 목록")
    @GetMapping
    public ApiResponse<PageResponse<AnimalResponse>> getMyList(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        PageResponse<AnimalResponse> data = favoriteService.getMyList(userId, page, size);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "내 찜한 동물 ID 목록 (카드 하트 표시용)")
    @GetMapping("/ids")
    public ApiResponse<List<Long>> getMyFavoriteIds(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        List<Long> ids = favoriteService.getMyFavoriteAnimalIds(userId);
        return ApiResponse.success("조회 성공", ids);
    }
}
