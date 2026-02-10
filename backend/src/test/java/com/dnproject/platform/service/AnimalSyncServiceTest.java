package com.dnproject.platform.service;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.dto.publicapi.AnimalItem;
import com.dnproject.platform.repository.AnimalRepository;
import com.dnproject.platform.repository.ShelterRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnimalSyncServiceTest {

    @Mock
    private PublicApiService publicApiService;

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private ShelterRepository shelterRepository;

    @InjectMocks
    private AnimalSyncService animalSyncService;

    @Test
    @DisplayName("DB에 있는 동물이 API에서 '종료' 상태로 넘어오면 DB에서 삭제되어야 한다")
    void shouldDeleteExistingAnimalWhenStatusIsTerminated() {
        // given
        String desertionNo = "test-123";
        AnimalItem item = new AnimalItem();
        item.setDesertionNo(desertionNo);
        item.setProcessState("종료(입양)"); // mapStatus에서 null을 반환하게 함

        Animal existingAnimal = Animal.builder()
                .id(1L)
                .publicApiAnimalId(desertionNo)
                .status(AnimalStatus.PROTECTED)
                .build();

        // Mocking: API에서 해당 아이템을 반환하도록 설정
        when(publicApiService.getAbandonedAnimals(any(), any(), anyString(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of(item)) // 첫 페이지에 아이템 반환
                .thenReturn(Collections.emptyList()); // 두 번째 호출 시 종료

        // Mocking: DB에 해당 아이템이 이미 존재함을 설정
        when(animalRepository.findByPublicApiAnimalId(desertionNo)).thenReturn(Optional.of(existingAnimal));

        // when
        AnimalSyncService.SyncResult result = animalSyncService.syncFromPublicApi(1, 1, "DOG");

        // then
        assertThat(result.removedCount()).isEqualTo(1);
        verify(animalRepository, times(1)).delete(existingAnimal);
        verify(animalRepository, never()).save(any());
    }

    @Test
    @DisplayName("DB에 없는 동물이 API에서 '종료' 상태로 넘어오면 아무것도 하지 않아야 한다 (Skip)")
    void shouldSkipNewAnimalWhenStatusIsTerminated() {
        // given
        String desertionNo = "new-456";
        AnimalItem item = new AnimalItem();
        item.setDesertionNo(desertionNo);
        item.setProcessState("종료(안락사)");

        // Mocking: API에서 해당 아이템을 반환하도록 설정
        when(publicApiService.getAbandonedAnimals(any(), any(), anyString(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of(item))
                .thenReturn(Collections.emptyList());

        // Mocking: DB에 해당 아이템이 없음을 설정
        when(animalRepository.findByPublicApiAnimalId(desertionNo)).thenReturn(Optional.empty());

        // when
        AnimalSyncService.SyncResult result = animalSyncService.syncFromPublicApi(1, 1, "DOG");

        // then
        assertThat(result.removedCount()).isEqualTo(0);
        assertThat(result.addedCount()).isEqualTo(0);
        verify(animalRepository, never()).delete(any());
        verify(animalRepository, never()).save(any());
    }
}
