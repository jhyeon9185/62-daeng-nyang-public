package com.dnproject.platform.config;

import com.dnproject.platform.domain.Board;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.BoardType;
import com.dnproject.platform.repository.BoardRepository;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * dev 프로필에서만 실행. 게시글이 하나도 없을 때만 공지/FAQ/자유 더미 게시글을 넣어 관리자 게시판 관리에서 확인할 수 있게 함.
 */
@Profile("dev")
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DevBoardDataLoader implements ApplicationRunner {

    private final BoardRepository boardRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (boardRepository.count() > 0) {
            return;
        }
        List<User> users = userRepository.findAll(PageRequest.of(0, 1)).getContent();
        if (users.isEmpty()) {
            log.debug("게시판 더미 데이터: 회원이 없어 스킵");
            return;
        }
        User author = users.get(0);

        Board notice = Board.builder()
                .user(author)
                .type(BoardType.NOTICE)
                .title("[공지] 62댕냥이 서비스 이용 안내")
                .content("62댕냥이에 오신 것을 환영합니다. 입양·봉사·기부 문의는 각 메뉴를 이용해 주세요.")
                .views(0)
                .isPinned(true)
                .build();

        Board faq = Board.builder()
                .user(author)
                .type(BoardType.FAQ)
                .title("[FAQ] 입양 신청은 어떻게 하나요?")
                .content("입양 희망 동물 상세 페이지에서 '입양 신청하기' 버튼을 눌러 신청서를 작성해 주시면 됩니다.")
                .views(0)
                .isPinned(false)
                .build();

        Board free = Board.builder()
                .user(author)
                .type(BoardType.FREE)
                .title("자유게시판 첫 글 (더미)")
                .content("관리자 게시판 관리에서 더미 데이터 확인용입니다.")
                .views(0)
                .isPinned(false)
                .build();

        boardRepository.saveAll(List.of(notice, faq, free));
        log.info("게시판 더미 데이터 3건 등록 완료 (공지, FAQ, 자유)");
    }
}
