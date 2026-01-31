import AnimatedSection from '@/components/motion/AnimatedSection';

const faqs = [
  {
    q: '입양 비용이 드나요?',
    a: '입양 자체는 무료입니다. 다만 동물 등록, 예방접종, 중성화 등 일부 비용이 발생할 수 있으며, 보호소마다 정책이 다를 수 있습니다. 상세 내용은 각 동물 상세 페이지에서 확인해 주세요.',
  },
  {
    q: '임보와 입양의 차이는?',
    a: '임시보호(임보)는 입양 전까지 일정 기간 집에서 돌봐 주시는 것입니다. 입양은 평생 가족이 되어 함께 사는 것을 말해요. 임보 후 입양으로 이어지는 경우도 많습니다.',
  },
  {
    q: '이미 반려동물이 있는데 가능한가요?',
    a: '가능합니다. 다만 보호소와 상담을 통해 기존 반려동물과의 궁합, 공간, 관리 가능 여부를 함께 확인하는 것이 좋습니다.',
  },
  {
    q: '입양 후 지원이 있나요?',
    a: '네. 입양 후 사후 지원 프로그램을 통해 상담, 건강 관리 안내, 행동 교정 팁 등을 제공합니다. 보호소별로 차이가 있으니 문의해 주세요.',
  },
  {
    q: '“두 개의 62” 데이터는 어디서 나온 건가요?',
    a: '입양 의향(61.6%)은 KB금융지주 경영연구소 ‘한국 반려동물 보고서(2021)’를, 발생/처리(자연사+안락사 등)와 운영비는 농림축산식품부·검역본부 및 지자체 보호센터 공개 통계를 기반으로 요약했습니다. (연도/지표는 추후 공지/링크로 더 명확히 표기할 예정입니다.)',
  },
];

export default function FAQSection() {
  return (
    <section className="landing-section landing-magnet">
      <div className="landing-inner">
        <AnimatedSection>
          <h2 className="landing-section-title landing-section-title--center">자주 묻는 질문</h2>
          <div className="landing-faq-list">
            {faqs.map(({ q, a }) => (
              <div key={q} className="landing-faq-item">
                <p className="landing-faq-q">{q}</p>
                <p className="landing-faq-a">{a}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
