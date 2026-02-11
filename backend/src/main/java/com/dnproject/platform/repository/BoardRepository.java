package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Board;
import com.dnproject.platform.domain.constant.BoardType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardRepository extends JpaRepository<Board, Long> {

        @org.springframework.data.jpa.repository.Query("SELECT b FROM Board b WHERE " +
                        "(:type IS NULL OR b.type = :type) AND " +
                        "(:keyword IS NULL OR :keyword = '' OR " +
                        "LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(b.user.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                        "ORDER BY b.isPinned DESC, b.createdAt DESC")
        Page<Board> findWithSearch(
                        @org.springframework.data.repository.query.Param("type") BoardType type,
                        @org.springframework.data.repository.query.Param("keyword") String keyword,
                        Pageable pageable);

        // Page<Board> findByTypeOrderByIsPinnedDescCreatedAtDesc(BoardType type,
        // Pageable pageable); // Deprecated by findWithSearch
        // Page<Board> findAllByOrderByIsPinnedDescCreatedAtDesc(Pageable pageable); //
        // Deprecated by findWithSearch

        Page<Board> findByShelter_IdAndType(Long shelterId, BoardType type, Pageable pageable);
}
