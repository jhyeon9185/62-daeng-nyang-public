# Anti-Gravity Java 오류 해결 가이드

> **프로젝트**: 62댕냥이 (DN_project01)  
> **문제 상황**: IntelliJ에서는 정상인데, Anti-Gravity에서 Java 파일에 빨간 줄과 "non-project file" 경고가 발생  
> **작성일**: 2026-02-12

---

## 📋 목차

| 순서 | 내용 |
|:---:|------|
| 1 | [오류 증상 정리](#1-오류-증상-정리) |
| 2 | [원인 분석](#2-원인-분석) |
| 3 | [해결 방법 1 — Lombok 확장 프로그램 설치](#3-해결-방법-1--lombok-확장-프로그램-설치) |
| 4 | [해결 방법 2 — 프로젝트 폴더 인식 문제 해결](#4-해결-방법-2--프로젝트-폴더-인식-문제-해결) |
| 5 | [해결 방법 3 — Java 워크스페이스 초기화](#5-해결-방법-3--java-워크스페이스-초기화) |
| 6 | [해결 방법 4 — JDK 버전 확인](#6-해결-방법-4--jdk-버전-확인) |
| 7 | [Anti-Gravity 마켓플레이스에서 검색 안 되는 확장 설치하기](#7-anti-gravity-마켓플레이스에서-검색-안-되는-확장-설치하기) |
| 8 | [추천 확장 프로그램 목록](#8-추천-확장-프로그램-목록) |

---

## 1. 오류 증상 정리

Anti-Gravity에서 Java 파일을 열었을 때 다음과 같은 증상이 나타날 수 있다.

| 증상 | 설명 |
|------|------|
| 패키지 선언에 빨간 줄 | `package com.dnproject.platform.config;`에 에러 표시 |
| "is a non-project file" 경고 | `CorsConfig.java is a non-project file, only syntax errors are reported` |
| import문 전체 빨간색 | `import org.springframework...` 등 라이브러리를 못 찾음 |
| Lombok 관련 빨간 줄 | `@RequiredArgsConstructor`, `@Getter` 등에서 에러 |
| 탐색기에서 파일 이름이 빨간색 | 에러가 있는 파일이 빨간색으로 표시됨 |

> [!IMPORTANT]
> 위 증상은 **코드가 틀려서가 아니라, Anti-Gravity의 환경 설정 문제**이다. IntelliJ에서 정상 빌드/실행이 되면 코드 자체에는 문제가 없다.

---

## 2. 원인 분석

### 원인 ①: Lombok 확장 미설치

이 프로젝트는 Lombok을 사용한다 (`build.gradle.kts`의 `compileOnly("org.projectlombok:lombok")`).

- **IntelliJ**: Lombok 플러그인이 기본 내장되어 있거나 자동으로 활성화된다.
- **Anti-Gravity**: Lombok 확장이 별도로 필요하다. 없으면 Lombok이 자동 생성하는 메서드(`getter`, `생성자` 등)를 인식하지 못해 빨간 줄이 뜬다.

### 원인 ②: 프로젝트 폴더 인식 실패 (non-project file)

현재 프로젝트 구조:

```
DN_project01/          ← Anti-Gravity가 여는 폴더 (루트)
├── frontend/          ← React 프로젝트
├── backend/           ← Spring Boot 프로젝트 (build.gradle.kts가 여기에 있음)
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── src/main/java/...
├── settings.gradle    ← 루트의 Gradle 설정
└── docs/
```

- Anti-Gravity의 Java 확장은 **현재 열린 폴더의 루트**에서 `build.gradle.kts`를 찾는다.
- `DN_project01` 루트에는 `build.gradle.kts`가 없고, `backend/` 안에만 존재한다.
- → **"이 Java 파일은 프로젝트에 속하지 않는 파일이야"**라고 판단 → `non-project file` 경고 발생

### 원인 ③: JDK 버전 불일치 (가능성)

프로젝트는 Java 21을 요구하는데 (`sourceCompatibility = JavaVersion.VERSION_21`), 시스템에 설치된 JDK 버전이 다르면 문법 오류가 발생할 수 있다.

---

## 3. 해결 방법 1 — Lombok 확장 프로그램 설치

### 마켓플레이스에서 검색되는 경우

1. 좌측 사이드바의 **확장(Extensions)** 탭 클릭 (또는 `Cmd + Shift + X`)
2. `Lombok` 검색
3. **"Lombok Annotations Support for VS Code"** (발행자: `vscjava`) 설치
4. Anti-Gravity 재시작 (`Cmd + Shift + P` → `Developer: Reload Window`)

### 마켓플레이스에서 검색이 안 되는 경우

Anti-Gravity의 마켓플레이스에서는 일부 확장이 검색되지 않을 수 있다. 이 경우 터미널에서 직접 설치한다. (아래 [7장](#7-anti-gravity-마켓플레이스에서-검색-안-되는-확장-설치하기) 참고)

```bash
# code 명령어가 PATH에 등록된 경우
code --install-extension vscjava.vscode-lombok

# PATH에 등록되지 않은 경우 (macOS 전체 경로 사용)
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --install-extension vscjava.vscode-lombok
```

설치 성공 메시지 확인:
```
Extension 'vscjava.vscode-lombok' v1.1.1 was successfully installed.
```

---

## 4. 해결 방법 2 — 프로젝트 폴더 인식 문제 해결

### 방법 A: `backend` 폴더를 직접 열기 (가장 확실 ⭐)

1. Anti-Gravity 메뉴: `파일(File)` → `폴더 열기(Open Folder)`
2. 경로: **`DN_project01/backend`** 선택 후 열기
3. 우측 하단에 "Importing Gradle project"가 뜨면 잠시 대기
4. 완료되면 모든 빨간 줄과 "non-project file" 메시지가 사라짐

> [!TIP]
> `backend` 폴더를 열면 Anti-Gravity가 루트에서 바로 `build.gradle.kts`를 발견하여, 프로젝트를 완벽하게 인식한다.

### 방법 B: 멀티 루트 워크스페이스 사용

프론트엔드와 백엔드를 동시에 열고 싶다면:

1. `파일(File)` → `작업 영역에 폴더 추가(Add Folder to Workspace)`
2. `backend` 폴더와 `frontend` 폴더를 각각 추가
3. `파일(File)` → `다른 이름으로 작업 영역 저장(Save Workspace As)`으로 `.code-workspace` 파일 저장

---

## 5. 해결 방법 3 — Java 워크스페이스 초기화

Anti-Gravity의 Java 엔진 캐시를 완전히 삭제하고 처음부터 다시 빌드하는 방법:

### 단계 1: Gradle Clean (터미널)

```bash
cd backend
chmod +x gradlew
./gradlew clean
```

### 단계 2: Java Language Server 초기화 (Anti-Gravity 내부 명령)

1. `Cmd + Shift + P` (macOS) / `Ctrl + Shift + P` (Windows)
2. `Java: Clean Java Language Server Workspace` 입력 후 실행
3. 팝업이 뜨면 **[Restart and Delete]** 클릭
4. Anti-Gravity가 자동으로 재시작되며 프로젝트를 처음부터 다시 인식

---

## 6. 해결 방법 4 — JDK 버전 확인

### 시스템 JDK 버전 확인

```bash
java -version
```

정상 출력 예시 (Java 21):
```
java version "21.0.9" 2025-10-21 LTS
Java(TM) SE Runtime Environment (build 21.0.9+7-LTS-338)
```

### Anti-Gravity에서 JDK 경로 설정하기

1. `Cmd + Shift + P` → `Preferences: Open Settings (JSON)` 실행
2. 다음 설정 추가:

```json
{
    "java.jdt.ls.java.home": "/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home"
}
```

> [!NOTE]
> JDK 설치 경로는 환경마다 다를 수 있다. `java -version`으로 먼저 확인하고, macOS에서는 `/usr/libexec/java_home -V`로 설치된 JDK 목록을 볼 수 있다.

---

## 7. Anti-Gravity 마켓플레이스에서 검색 안 되는 확장 설치하기

Anti-Gravity의 마켓플레이스 UI에서는 일부 확장이 검색되지 않을 수 있다. 이럴 때는 **터미널 CLI를 통해 직접 설치**한다.

### 기본 문법

```bash
code --install-extension <확장프로그램ID>
```

### macOS에서 `code` 명령어가 안 될 때

`code` 명령어가 PATH에 등록되어 있지 않으면 전체 경로를 사용한다:

```bash
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --install-extension <확장프로그램ID>
```

### 확장 프로그램 ID 찾는 법

1. [VS Code Marketplace](https://marketplace.visualstudio.com/vscode) 웹사이트에서 원하는 확장을 검색
2. 확장 상세 페이지 오른쪽의 **"Unique Identifier"** 항목이 확장 ID이다
3. 예: `vscjava.vscode-lombok`, `vmware.vscode-boot-dev-pack`

### 자주 사용하는 설치 명령어 모음

```bash
# Lombok 지원
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --install-extension vscjava.vscode-lombok

# Java Extension Pack (Java 개발 필수)
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --install-extension vscjava.vscode-java-pack

# Spring Boot Extension Pack
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --install-extension vmware.vscode-boot-dev-pack

# Error Lens (에러 인라인 표시)
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --install-extension usernamehw.errorlens

# ESLint (프론트엔드용)
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --install-extension dbaeumer.vscode-eslint

# Korean Language Pack (한글화)
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --install-extension MS-CEINTL.vscode-language-pack-ko
```

### 설치된 확장 목록 확인

```bash
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --list-extensions
```

---

## 8. 추천 확장 프로그램 목록

### Java 백엔드 (IntelliJ 수준으로 만들기)

| 확장 프로그램 | 확장 ID | 설명 |
|---|---|---|
| **Extension Pack for Java** | `vscjava.vscode-java-pack` | Java 개발 필수 패키지 (자동완성, 디버깅, 빌드) |
| **Lombok** | `vscjava.vscode-lombok` | Lombok 애너테이션 지원 |
| **Spring Boot Extension Pack** | `vmware.vscode-boot-dev-pack` | Spring Boot 설정 자동완성, Boot Dashboard |

### 에러 시각화

| 확장 프로그램 | 확장 ID | 설명 |
|---|---|---|
| **Error Lens** | `usernamehw.errorlens` | 에러 메시지를 코드 옆에 인라인으로 표시 |

### 프론트엔드 (React / TypeScript)

| 확장 프로그램 | 확장 ID | 설명 |
|---|---|---|
| **ESLint** | `dbaeumer.vscode-eslint` | JS/TS 문법 검사 및 코딩 컨벤션 체크 |
| **Prettier** | `esbenp.prettier-vscode` | 코드 자동 정렬 |

### 편의 기능

| 확장 프로그램 | 확장 ID | 설명 |
|---|---|---|
| **IntelliJ Keybindings** | `k--kato.intellij-idea-keybindings` | IntelliJ 단축키 그대로 사용 |
| **Korean Language Pack** | `MS-CEINTL.vscode-language-pack-ko` | Anti-Gravity 인터페이스 한글화 |

---

> **핵심 요약**  
> 1. IntelliJ에서 정상 → 코드는 정상, Anti-Gravity 환경 설정 문제  
> 2. **Lombok 확장** 설치가 1순위  
> 3. **`backend` 폴더를 직접 열기**가 "non-project file" 에러의 근본 해결책  
> 4. 마켓플레이스에서 안 보이면 **터미널 CLI**로 확장 ID를 직접 지정하여 설치  
