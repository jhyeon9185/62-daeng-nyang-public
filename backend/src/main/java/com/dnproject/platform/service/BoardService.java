package com.dnproject.platform.service;

import com.dnproject.platform.domain.Board;
import com.dnproject.platform.domain.Comment;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.BoardType;
import com.dnproject.platform.domain.constant.Role;
import com.dnproject.platform.dto.request.BoardCreateRequest;
import com.dnproject.platform.dto.request.CommentCreateRequest;
import com.dnproject.platform.dto.response.BoardResponse;
import com.dnproject.platform.dto.response.CommentResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.repository.BoardRepository;
import com.dnproject.platform.repository.CommentRepository;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ShelterRepository shelterRepository;

    @Transactional(readOnly = true)
    public PageResponse<BoardResponse> findAll(BoardType type, Pageable pageable) {
        Page<Board> page = type != null
                ? boardRepository.findByTypeOrderByIsPinnedDescCreatedAtDesc(type, pageable)
                : boardRepository.findAllByOrderByIsPinnedDescCreatedAtDesc(pageable);
        return PageResponse.<BoardResponse>builder()
                .content(page.getContent().stream().map(this::toBoardResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public BoardResponse findById(Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다."));
        board.setViews(board.getViews() + 1);
        boardRepository.save(board);
        return toBoardResponse(board);
    }

    @Transactional
    public BoardResponse create(Long userId, BoardCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        if (request.getType() == BoardType.NOTICE || request.getType() == BoardType.FAQ) {
            if (user.getRole() != Role.SUPER_ADMIN) {
                throw new com.dnproject.platform.exception.CustomException(
                        "공지사항·FAQ 게시판에는 시스템 관리자만 글을 작성할 수 있습니다.",
                        org.springframework.http.HttpStatus.FORBIDDEN, "FORBIDDEN");
            }
        }
        Board board = Board.builder()
                .user(user)
                .shelter(request.getShelterId() != null
                        ? shelterRepository.findById(request.getShelterId()).orElse(null)
                        : null)
                .type(request.getType())
                .title(request.getTitle())
                .content(request.getContent())
                .views(0)
                .isPinned(false)
                .build();
        board = boardRepository.save(board);
        return toBoardResponse(board);
    }

    @Transactional
    public BoardResponse update(Long id, Long userId, BoardCreateRequest request) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        boolean isNoticeOrFaq = request.getType() == BoardType.NOTICE || request.getType() == BoardType.FAQ
                || board.getType() == BoardType.NOTICE || board.getType() == BoardType.FAQ;
        if (isNoticeOrFaq && user.getRole() != Role.SUPER_ADMIN) {
            throw new com.dnproject.platform.exception.CustomException(
                    "공지사항·FAQ 게시판 글은 시스템 관리자만 수정할 수 있습니다.",
                    org.springframework.http.HttpStatus.FORBIDDEN, "FORBIDDEN");
        }
        if (!board.getUser().getId().equals(userId)) {
            throw new com.dnproject.platform.exception.CustomException("본인의 글만 수정할 수 있습니다.",
                    org.springframework.http.HttpStatus.FORBIDDEN, "FORBIDDEN");
        }
        board.setType(request.getType());
        board.setTitle(request.getTitle());
        board.setContent(request.getContent());
        if (request.getShelterId() != null) {
            board.setShelter(shelterRepository.findById(request.getShelterId()).orElse(null));
        }
        board = boardRepository.save(board);
        return toBoardResponse(board);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다."));
        if (!board.getUser().getId().equals(userId)) {
            throw new com.dnproject.platform.exception.CustomException("본인의 글만 삭제할 수 있습니다.",
                    org.springframework.http.HttpStatus.FORBIDDEN, "FORBIDDEN");
        }
        boardRepository.delete(board);
    }

    @Transactional
    public BoardResponse setPinned(Long id, boolean pinned) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다."));
        board.setIsPinned(pinned);
        board = boardRepository.save(board);
        return toBoardResponse(board);
    }

    @Transactional
    public void deleteByAdmin(Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다."));
        boardRepository.delete(board);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다."));
        List<Comment> comments = commentRepository.findByBoard_IdOrderByCreatedAtAsc(board.getId(),
                org.springframework.data.domain.PageRequest.of(0, 100)).getContent();
        return comments.stream().map(this::toCommentResponse).toList();
    }

    @Transactional
    public CommentResponse addComment(Long boardId, Long userId, CommentCreateRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        Comment comment = Comment.builder()
                .board(board)
                .user(user)
                .content(request.getContent())
                .build();
        comment = commentRepository.save(comment);
        return toCommentResponse(comment);
    }

    private BoardResponse toBoardResponse(Board b) {
        String userName = b.getUser() != null ? b.getUser().getName() : null;
        Long shelterId = b.getShelter() != null ? b.getShelter().getId() : null;
        return BoardResponse.builder()
                .id(b.getId())
                .userId(b.getUser() != null ? b.getUser().getId() : null)
                .userName(userName)
                .shelterId(shelterId)
                .type(b.getType())
                .title(b.getTitle())
                .content(b.getContent())
                .views(b.getViews())
                .isPinned(b.getIsPinned())
                .createdAt(b.getCreatedAt())
                .build();
    }

    private CommentResponse toCommentResponse(Comment c) {
        String userName = c.getUser() != null ? c.getUser().getName() : null;
        return CommentResponse.builder()
                .id(c.getId())
                .boardId(c.getBoard() != null ? c.getBoard().getId() : null)
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .userName(userName)
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
