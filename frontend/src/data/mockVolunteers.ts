/**
 * 봉사 모집공고 목업 데이터
 */

import type { VolunteerRecruitment } from '@/types/entities';

export const mockVolunteerRecruitments: VolunteerRecruitment[] = [
  {
    id: 1,
    shelterId: 1,
    shelterName: '서울 행복보호소',
    title: '설 연휴 임시보호 봉사자 모집 (급구)',
    content: `설 연휴 기간 동안 보호소 운영이 중단됨에 따라 임시보호 봉사자를 모집합니다.

📅 기간: 2026년 2월 9일(금) ~ 2월 12일(월)
👥 모집: 10명
🐕 활동: 강아지/고양이 임시보호 (가정에서)

제공사항:
- 4일분 사료 및 간식
- 임시 용품 (이동장, 급수기 등)
- 24시간 응급연락 지원

신청 시 선호 동물 종류를 알려주세요!`,
    maxApplicants: 10,
    currentApplicants: 6,
    deadline: '2026-02-07',
    status: 'OPEN',
    createdAt: '2026-01-25T10:00:00',
  },
  {
    id: 2,
    shelterId: 2,
    shelterName: '경기 사랑보호소',
    title: '주말 산책 봉사자 상시 모집',
    content: `매주 주말 강아지 산책 봉사자를 모집합니다.

⏰ 시간: 매주 토/일 오전 10시 ~ 오후 4시
   (2시간 단위로 신청 가능)
👥 모집: 상시 모집
🐕 활동: 보호소 강아지 산책 및 놀이

준비물:
- 편한 운동화
- 산책 가능한 복장

※ 초보자 환영! 오리엔테이션 제공
※ 정기 봉사자에게는 봉사활동 확인서 발급`,
    maxApplicants: 20,
    currentApplicants: 12,
    deadline: '2026-12-31',
    status: 'OPEN',
    createdAt: '2026-01-20T14:30:00',
  },
  {
    id: 3,
    shelterId: 3,
    shelterName: '인천 희망보호소',
    title: '보호소 청소 및 급식 봉사 (평일)',
    content: `평일 오전 보호소 청소 및 급식 봉사자를 모집합니다.

⏰ 시간: 월~금 오전 9시 ~ 12시
👥 모집: 5명
🧹 활동:
   - 보호소 청소 및 소독
   - 사료/물 급여
   - 배설물 처리
   - 간단한 건강 체크

※ 체력이 필요한 활동입니다
※ 장갑, 앞치마 등 제공
※ 교통비 일부 지원 (5,000원/일)`,
    maxApplicants: 5,
    currentApplicants: 3,
    deadline: '2026-02-15',
    status: 'OPEN',
    createdAt: '2026-01-22T09:00:00',
  },
  {
    id: 4,
    shelterId: 1,
    shelterName: '서울 행복보호소',
    title: '고양이 사회화 봉사자 모집',
    content: `사람을 무서워하는 고양이들의 사회화 훈련을 도와주실 분을 찾습니다.

⏰ 시간: 주 2회 이상, 1회당 2시간
👥 모집: 3명
🐱 활동:
   - 고양이와 놀이 시간 갖기
   - 간식 주기 및 교감
   - 행동 관찰 일지 작성

자격:
- 고양이 양육 경험 필수
- 인내심과 책임감
- 최소 3개월 이상 활동 가능

※ 사전 교육 2시간 필수 이수`,
    maxApplicants: 3,
    currentApplicants: 1,
    deadline: '2026-02-10',
    status: 'OPEN',
    createdAt: '2026-01-27T11:20:00',
  },
  {
    id: 5,
    shelterId: 2,
    shelterName: '경기 사랑보호소',
    title: '입양 행사 도우미 (2월 8일)',
    content: `2월 8일 대형마트에서 진행하는 입양 행사 도우미를 모집합니다.

📅 일시: 2026년 2월 8일(토) 10:00 ~ 18:00
📍 장소: ○○마트 광장 (경기도 ○○시)
👥 모집: 8명
📋 활동:
   - 부스 운영 보조
   - 입양 상담 지원
   - 동물 케어
   - 행사 안내

혜택:
- 식사 및 간식 제공
- 교통비 지원 (10,000원)
- 봉사활동 확인서 발급

※ 전일 참여 가능한 분 우대`,
    maxApplicants: 8,
    currentApplicants: 5,
    deadline: '2026-02-05',
    status: 'OPEN',
    createdAt: '2026-01-28T16:00:00',
  },
  {
    id: 6,
    shelterId: 3,
    shelterName: '인천 희망보호소',
    title: '[마감] 겨울철 보온 작업 봉사',
    content: `겨울철 보호소 보온 작업이 완료되었습니다.
참여해주신 모든 분들께 감사드립니다!`,
    maxApplicants: 15,
    currentApplicants: 15,
    deadline: '2026-01-20',
    status: 'COMPLETED',
    createdAt: '2026-01-10T10:00:00',
  },
];
