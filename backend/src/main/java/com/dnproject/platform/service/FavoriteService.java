package com.dnproject.platform.service;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Favorite;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.dto.response.AnimalResponse;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.repository.AnimalRepository;
import com.dnproject.platform.repository.FavoriteRepository;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final AnimalRepository animalRepository;
    private final AnimalService animalService;

    @Transactional
    public void add(Long userId, Long animalId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new NotFoundException("동물을 찾을 수 없습니다."));
        if (favoriteRepository.existsByUser_IdAndAnimal_Id(userId, animalId)) {
            return; // 이미 찜함 → idempotent
        }
        Favorite favorite = Favorite.builder()
                .user(user)
                .animal(animal)
                .build();
        favoriteRepository.save(favorite);
    }

    @Transactional
    public void remove(Long userId, Long animalId) {
        favoriteRepository.deleteByUser_IdAndAnimal_Id(userId, animalId);
    }

    @Transactional(readOnly = true)
    public PageResponse<AnimalResponse> getMyList(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Favorite> pageResult = favoriteRepository.findByUser_IdOrderByCreatedAtDesc(userId, pageable);
        List<AnimalResponse> content = pageResult.getContent().stream()
                .map(f -> animalService.toAnimalResponse(f.getAnimal()))
                .toList();
        return PageResponse.<AnimalResponse>builder()
                .content(content)
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .first(pageResult.isFirst())
                .last(pageResult.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<Long> getMyFavoriteAnimalIds(Long userId) {
        return favoriteRepository.findAnimalIdsByUser_Id(userId);
    }
}
