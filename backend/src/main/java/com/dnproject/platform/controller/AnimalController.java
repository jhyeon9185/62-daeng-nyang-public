package com.dnproject.platform.controller;

import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import com.dnproject.platform.dto.request.AnimalCreateRequest;
import com.dnproject.platform.dto.response.AnimalResponse;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.AnimalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Animal", description = "동물 API")
@RestController
@RequestMapping("/api/animals")
@RequiredArgsConstructor
public class AnimalController {

    private final AnimalService animalService;

    @Operation(summary = "선호도 기반 추천 동물 목록 (인증 필요)")
    @GetMapping("/recommendations")
    public ApiResponse<PageResponse<AnimalResponse>> getRecommendations(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<AnimalResponse> data = animalService.findRecommended(userId, pageable);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "동물 목록 조회")
    @GetMapping
    public ApiResponse<PageResponse<AnimalResponse>> getAll(
            @RequestParam(required = false) Species species,
            @RequestParam(required = false) AnimalStatus status,
            @RequestParam(name = "animalSize", required = false) Size animalSize,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String sigungu,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int sizeParam,
            @RequestParam(defaultValue = "random") String sort) {
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        Pageable pageable;
        if (sort != null && sort.trim().toLowerCase().startsWith("random")) {
            pageable = PageRequest.of(page, sizeParam);
            return ApiResponse.success("조회 성공", animalService.findAllRandom(species, status, animalSize, region, sigungu, searchParam, pageable));
        }
        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1])
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        pageable = PageRequest.of(page, sizeParam, Sort.by(direction, sortParts[0]));
        PageResponse<AnimalResponse> data = animalService.findAll(species, status, animalSize, region, sigungu, searchParam, pageable);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "동물 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<AnimalResponse> getById(@PathVariable Long id) {
        AnimalResponse data = animalService.findById(id);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "동물 등록 (관리자/보호소)")
    @PostMapping
    public ApiResponse<AnimalResponse> create(@RequestBody AnimalCreateRequest request) {
        AnimalResponse data = animalService.create(request);
        return ApiResponse.created("등록 완료", data);
    }

    @Operation(summary = "동물 수정 (관리자/보호소)")
    @PutMapping("/{id}")
    public ApiResponse<AnimalResponse> update(@PathVariable Long id, @RequestBody AnimalCreateRequest request) {
        AnimalResponse data = animalService.update(id, request);
        return ApiResponse.success("수정 완료", data);
    }

    @Operation(summary = "동물 삭제 (관리자/보호소)")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        animalService.delete(id);
        return ApiResponse.success("삭제 완료", null);
    }
}
