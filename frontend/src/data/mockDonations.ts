/**
 * 물품 기부 요청 목업 데이터
 */

import type { DonationRequest } from '@/types/entities';

export const mockDonationRequests: DonationRequest[] = [
  {
    id: 1,
    shelterId: 1,
    shelterName: '서울 행복보호소',
    title: '[긴급] 겨울 사료 지원 요청',
    content: `안녕하세요, 서울 행복보호소입니다.

겨울철 보호 동물 수가 급증하면서 사료가 부족한 상황입니다.
특히 강아지 사료가 시급합니다.

필요 물품:
- 성견용 사료 (어떤 브랜드든 환영)
- 자견용 사료
- 노령견 전용 사료

보호 중인 강아지: 45마리
예상 소요: 월 120kg

작은 정성도 큰 도움이 됩니다. 감사합니다.`,
    itemCategory: '사료',
    targetQuantity: 120,
    currentQuantity: 68,
    deadline: '2026-02-15',
    status: 'OPEN',
    createdAt: '2026-01-20T09:00:00',
  },
  {
    id: 2,
    shelterId: 2,
    shelterName: '경기 사랑보호소',
    title: '고양이 모래 정기 후원 요청',
    content: `고양이 52마리를 보호 중인 경기 사랑보호소입니다.

매달 고양이 모래 구입 비용이 큰 부담입니다.
벤토나이트, 두부, 우드 어떤 종류든 감사히 받겠습니다.

현재 필요량:
- 월 평균 80포대 (5kg 기준)
- 연간 약 1000포대

정기 후원하실 수 있는 분들의 많은 관심 부탁드립니다.`,
    itemCategory: '고양이 모래',
    targetQuantity: 80,
    currentQuantity: 32,
    deadline: '2026-02-28',
    status: 'OPEN',
    createdAt: '2026-01-18T14:00:00',
  },
  {
    id: 3,
    shelterId: 3,
    shelterName: '인천 희망보호소',
    title: '겨울 담요 및 방석 지원',
    content: `추운 겨울을 따뜻하게 보낼 수 있도록 담요와 방석을 모집합니다.

필요 물품:
- 담요 (중고 가능, 깨끗한 것)
- 방석, 쿠션
- 난방 패드 (동물용)
- 수건, 헝겊

사용하지 않는 물품도 괜찮습니다.
세탁해서 보내주시면 감사히 사용하겠습니다.

보호소 주소:
인천광역시 ○○구 ○○로 123
희망보호소`,
    itemCategory: '담요/방석',
    targetQuantity: 100,
    currentQuantity: 73,
    deadline: '2026-02-10',
    status: 'OPEN',
    createdAt: '2026-01-22T10:30:00',
  },
  {
    id: 4,
    shelterId: 1,
    shelterName: '서울 행복보호소',
    title: '간식 및 영양제 지원 요청',
    content: `보호 중인 아이들의 건강을 위해 간식과 영양제를 모집합니다.

필요 물품:
- 강아지/고양이 간식
- 멀티 비타민
- 관절 영양제 (노령견/묘)
- 프로바이오틱스
- 피부 영양제

특히 노령 동물들의 건강 관리를 위해
영양제가 시급합니다.`,
    itemCategory: '간식/영양제',
    targetQuantity: 50,
    currentQuantity: 18,
    deadline: '2026-02-20',
    status: 'OPEN',
    createdAt: '2026-01-25T11:00:00',
  },
  {
    id: 5,
    shelterId: 2,
    shelterName: '경기 사랑보호소',
    title: '청소 용품 및 소독제 지원',
    content: `보호소 위생 관리를 위한 청소 용품을 모집합니다.

필요 물품:
- 락스, 소독제
- 걸레, 청소포
- 쓰레기봉투 (대형)
- 고무장갑
- 탈취제

매일 사용하는 소모품이라 항상 부족합니다.
대용량 제품도 환영합니다!`,
    itemCategory: '청소용품',
    targetQuantity: 200,
    currentQuantity: 156,
    deadline: '2026-03-31',
    status: 'OPEN',
    createdAt: '2026-01-15T13:20:00',
  },
  {
    id: 6,
    shelterId: 3,
    shelterName: '인천 희망보호소',
    title: '장난감 및 놀이용품 기부',
    content: `아이들의 스트레스 해소와 운동을 위한 장난감을 모집합니다.

필요 물품:
- 터그놀이 장난감
- 공, 인형
- 캣타워, 스크래처
- 낚시대형 고양이 장난감
- 노즈워크 장난감

사용하던 것도 괜찮습니다 (깨끗한 것만 부탁드려요)
아이들이 지루하지 않게 즐거운 시간을 만들어주세요!`,
    itemCategory: '장난감',
    targetQuantity: 60,
    currentQuantity: 41,
    deadline: '2026-02-28',
    status: 'OPEN',
    createdAt: '2026-01-27T15:45:00',
  },
  {
    id: 7,
    shelterId: 1,
    shelterName: '서울 행복보호소',
    title: '[완료] 설 명절 특식 지원 - 감사합니다!',
    content: `설 명절에 아이들에게 특별한 간식을 선물해주신 모든 분들께 감사드립니다.
덕분에 아이들이 행복한 명절을 보낼 수 있었습니다!`,
    itemCategory: '간식',
    targetQuantity: 30,
    currentQuantity: 30,
    deadline: '2026-02-08',
    status: 'COMPLETED',
    createdAt: '2026-01-10T10:00:00',
  },
];
