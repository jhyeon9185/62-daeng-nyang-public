package com.dnproject.platform.util;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 주소 문자열에서 시·도, 시·군·구를 추출하여 필터용 정규값으로 반환.
 * 프론트 시/도·시군구 드롭다운 값과 동일한 형식(예: 서울, 경기, 남양주시).
 */
public final class AddressRegionParser {

    private AddressRegionParser() {
    }

    /** 시·도 패턴 (긴 문자열 우선 매칭). 패턴 -> 정규값 */
    private static final List<PatternValue> SIDO_PATTERNS = buildSidoPatterns();

    /** 시·군·구 이름 목록 (긴 문자열 우선 매칭) */
    private static final List<String> SIGUNGU_NAMES = buildSigunguNamesSortedByLengthDesc();

    private static List<PatternValue> buildSidoPatterns() {
        List<PatternValue> list = new ArrayList<>();
        // 긴 패턴 먼저 (경기도 -> 경기 매칭 후 경기 단독 매칭 방지)
        add(list, "서울특별시", "서울");
        add(list, "부산광역시", "부산");
        add(list, "대구광역시", "대구");
        add(list, "인천광역시", "인천");
        add(list, "광주광역시", "광주");
        add(list, "대전광역시", "대전");
        add(list, "울산광역시", "울산");
        add(list, "세종특별자치시", "세종");
        add(list, "경기도", "경기");
        add(list, "강원특별자치도", "강원");
        add(list, "강원도", "강원");
        add(list, "충청북도", "충북");
        add(list, "충청남도", "충남");
        add(list, "전북특별자치도", "전북");
        add(list, "전라북도", "전북");
        add(list, "전라남도", "전남");
        add(list, "경상북도", "경북");
        add(list, "경상남도", "경남");
        add(list, "제주특별자치도", "제주");
        add(list, "제주도", "제주");
        // 단일 명칭
        add(list, "서울", "서울");
        add(list, "부산", "부산");
        add(list, "대구", "대구");
        add(list, "인천", "인천");
        add(list, "광주", "광주");
        add(list, "대전", "대전");
        add(list, "울산", "울산");
        add(list, "세종", "세종");
        add(list, "경기", "경기");
        add(list, "강원", "강원");
        add(list, "충북", "충북");
        add(list, "충남", "충남");
        add(list, "전북", "전북");
        add(list, "전남", "전남");
        add(list, "경북", "경북");
        add(list, "경남", "경남");
        add(list, "제주", "제주");
        list.sort(Comparator.comparingInt((PatternValue p) -> p.pattern.length()).reversed());
        return list;
    }

    private static void add(List<PatternValue> list, String pattern, String value) {
        list.add(new PatternValue(pattern, value));
    }

    private static List<String> buildSigunguNamesSortedByLengthDesc() {
        List<String> names = new ArrayList<>();
        names.add("남양주시"); names.add("고양시"); names.add("성남시"); names.add("수원시"); names.add("시흥시");
        names.add("안산시"); names.add("안성시"); names.add("안양시"); names.add("양주시"); names.add("여주시");
        names.add("오산시"); names.add("용인시"); names.add("의왕시"); names.add("의정부시"); names.add("이천시");
        names.add("파주시"); names.add("평택시"); names.add("포천시"); names.add("하남시"); names.add("화성시");
        names.add("부천시"); names.add("광명시"); names.add("광주시"); names.add("구리시"); names.add("군포시");
        names.add("김포시"); names.add("동두천시"); names.add("가평군"); names.add("과천시"); names.add("양평군");
        names.add("연천군");
        names.add("강남구"); names.add("강동구"); names.add("강북구"); names.add("강서구"); names.add("관악구");
        names.add("광진구"); names.add("구로구"); names.add("금천구"); names.add("노원구"); names.add("도봉구");
        names.add("동대문구"); names.add("동작구"); names.add("마포구"); names.add("서대문구"); names.add("서초구");
        names.add("성동구"); names.add("성북구"); names.add("송파구"); names.add("양천구"); names.add("영등포구");
        names.add("용산구"); names.add("은평구"); names.add("종로구"); names.add("중랑구");
        names.add("금정구"); names.add("기장군"); names.add("동래구"); names.add("부산진구"); names.add("사상구");
        names.add("사하구"); names.add("수영구"); names.add("연제구"); names.add("영도구"); names.add("해운대구");
        names.add("달서구"); names.add("수성구"); names.add("달성군");
        names.add("강화군"); names.add("계양구"); names.add("남동구"); names.add("미추홀구"); names.add("부평구");
        names.add("연수구"); names.add("옹진군");
        names.add("광산구");
        names.add("대덕구"); names.add("유성구");
        names.add("울주군");
        names.add("강릉시"); names.add("동해시"); names.add("삼척시"); names.add("속초시"); names.add("원주시");
        names.add("춘천시"); names.add("태백시"); names.add("고성군"); names.add("양구군"); names.add("양양군");
        names.add("영월군"); names.add("인제군"); names.add("정선군"); names.add("철원군"); names.add("평창군");
        names.add("홍천군"); names.add("화천군"); names.add("횡성군");
        names.add("괴산군"); names.add("단양군"); names.add("보은군"); names.add("영동군"); names.add("옥천군");
        names.add("음성군"); names.add("제천시"); names.add("진천군"); names.add("청주시"); names.add("충주시");
        names.add("증평군");
        names.add("계룡시"); names.add("공주시"); names.add("금산군"); names.add("논산시"); names.add("당진시");
        names.add("보령시"); names.add("부여군"); names.add("서산시"); names.add("서천군"); names.add("아산시");
        names.add("예산군"); names.add("천안시"); names.add("청양군"); names.add("태안군"); names.add("홍성군");
        names.add("고창군"); names.add("군산시"); names.add("김제시"); names.add("남원시"); names.add("무주군");
        names.add("부안군"); names.add("순창군"); names.add("완주군"); names.add("익산시"); names.add("임실군");
        names.add("장수군"); names.add("전주시"); names.add("정읍시"); names.add("진안군");
        names.add("강진군"); names.add("고흥군"); names.add("곡성군"); names.add("광양시"); names.add("구례군");
        names.add("나주시"); names.add("담양군"); names.add("목포시"); names.add("무안군"); names.add("보성군");
        names.add("순천시"); names.add("신안군"); names.add("여수시"); names.add("영광군"); names.add("영암군");
        names.add("완도군"); names.add("장성군"); names.add("장흥군"); names.add("진도군"); names.add("함평군");
        names.add("해남군"); names.add("화순군");
        names.add("경산시"); names.add("경주시"); names.add("고령군"); names.add("구미시"); names.add("김천시");
        names.add("문경시"); names.add("봉화군"); names.add("상주시"); names.add("성주군"); names.add("안동시");
        names.add("영덕군"); names.add("영양군"); names.add("영주시"); names.add("영천시"); names.add("예천군");
        names.add("울릉군"); names.add("울진군"); names.add("의성군"); names.add("청도군"); names.add("청송군");
        names.add("칠곡군"); names.add("포항시");
        names.add("거제시"); names.add("거창군"); names.add("김해시"); names.add("남해군"); names.add("밀양시");
        names.add("사천시"); names.add("산청군"); names.add("양산시"); names.add("의령군"); names.add("진주시");
        names.add("창녕군"); names.add("창원시"); names.add("통영시"); names.add("하동군"); names.add("함안군");
        names.add("함양군"); names.add("합천군");
        names.add("서귀포시"); names.add("제주시");
        names.add("남구"); names.add("동구"); names.add("북구"); names.add("서구"); names.add("중구");
        names.sort(Comparator.comparingInt(String::length).reversed());
        return names;
    }

    /**
     * 주소에서 시·도, 시·군·구를 추출.
     *
     * @param address 주소 문자열 (null/blank 가능)
     * @return [0]=시도 정규값, [1]=시군구 정규값 (없으면 null)
     */
    public static String[] parse(String address) {
        if (address == null || address.isBlank()) {
            return new String[]{null, null};
        }
        String trimmed = address.trim();
        String sido = null;
        for (PatternValue p : SIDO_PATTERNS) {
            if (trimmed.contains(p.pattern)) {
                sido = p.value;
                break;
            }
        }
        String sigungu = null;
        for (String name : SIGUNGU_NAMES) {
            if (trimmed.contains(name)) {
                sigungu = name;
                break;
            }
        }
        return new String[]{sido, sigungu};
    }

    private static final class PatternValue {
        final String pattern;
        final String value;

        PatternValue(String pattern, String value) {
            this.pattern = pattern;
            this.value = value;
        }
    }
}
