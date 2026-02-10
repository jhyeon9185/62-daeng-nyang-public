# DN Platform API 명세서

## Base URL
- Development: `http://localhost:8080/api/v1`
- Production: `https://api.dnplatform.com/api/v1`

## 인증
JWT Bearer Token 방식 사용
```
Authorization: Bearer {accessToken}
```

---

## 1. Auth API

### 1.1 회원가입
```
POST /auth/signup
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "address": "서울시 강남구"
}
```

**Response** `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "홍길동",
  "role": "USER"
}
```

### 1.2 로그인
```
POST /auth/login
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "USER"
  }
}
```

### 1.3 내 정보 조회
```
GET /auth/me
Authorization: Bearer {token}
```

**Response** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "role": "USER"
}
```

---

## 2. Animal API

### 2.1 동물 목록 조회
```
GET /animals
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | 페이지 번호 (0부터 시작) |
| size | int | 페이지 크기 (기본: 20) |
| species | string | 종류 (DOG, CAT) |
| size | string | 크기 (SMALL, MEDIUM, LARGE) |
| status | string | 상태 (PROTECTED, ADOPTED, FOSTERING) |
| region | string | 지역 |

**Response** `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "shelterName": "서울시 동물보호센터",
      "species": "DOG",
      "breed": "믹스견",
      "name": "콩이",
      "age": 2,
      "gender": "MALE",
      "size": "MEDIUM",
      "imageUrl": "https://...",
      "status": "PROTECTED"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5
}
```

### 2.2 동물 상세 조회
```
GET /animals/{id}
```

**Response** `200 OK`
```json
{
  "id": 1,
  "shelterId": 1,
  "shelterName": "서울시 동물보호센터",
  "species": "DOG",
  "breed": "믹스견",
  "name": "콩이",
  "age": 2,
  "gender": "MALE",
  "size": "MEDIUM",
  "weight": 12.5,
  "description": "온순하고 사람을 좋아합니다",
  "temperament": "온순함",
  "healthStatus": "건강",
  "neutered": true,
  "vaccinated": true,
  "imageUrl": "https://...",
  "status": "PROTECTED",
  "shelter": {
    "id": 1,
    "name": "서울시 동물보호센터",
    "address": "서울시 마포구...",
    "phone": "02-1234-5678"
  },
  "images": [
    { "id": 1, "imageUrl": "https://...", "isMain": true }
  ]
}
```

---

## 3. Adoption API

### 3.1 입양 신청
```
POST /adoptions
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "animalId": 1,
  "type": "ADOPTION",
  "reason": "반려동물과 함께 생활하고 싶습니다",
  "experience": "이전에 강아지를 5년간 키웠습니다",
  "livingEnv": "아파트, 단독 주택",
  "familyAgreement": true
}
```

**Response** `201 Created`
```json
{
  "id": 1,
  "status": "PENDING",
  "createdAt": "2024-01-15T10:00:00"
}
```

### 3.2 내 신청 목록
```
GET /adoptions/my
Authorization: Bearer {token}
```

### 3.3 승인 (보호소 관리자)
```
PUT /adoptions/{id}/approve
Authorization: Bearer {token}
```

### 3.4 거절 (보호소 관리자)
```
PUT /adoptions/{id}/reject
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "reason": "거절 사유"
}
```

---

## 4. Volunteer API

### 4.1 모집공고 목록
```
GET /volunteers/recruitments
```

### 4.2 모집공고 등록 (보호소 관리자)
```
POST /volunteers/recruitments
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "title": "강아지 산책 봉사자 모집",
  "content": "매주 토요일 오전 산책 봉사자를 모집합니다",
  "activityField": "산책",
  "maxApplicants": 5,
  "volunteerDate": "2024-02-01",
  "deadline": "2024-01-25",
  "isUrgent": false
}
```

### 4.3 봉사 신청
```
POST /volunteers
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "recruitmentId": 1,
  "applicantName": "홍길동",
  "applicantPhone": "010-1234-5678",
  "applicantEmail": "user@example.com",
  "activityRegion": "서울시 마포구",
  "activityField": "산책",
  "volunteerDateStart": "2024-02-01",
  "activityCycle": "REGULAR",
  "volunteerType": "INDIVIDUAL"
}
```

---

## 5. Donation API

### 5.1 기부 요청 목록
```
GET /donations/requests
```

### 5.2 기부 요청 등록 (보호소 관리자)
```
POST /donations/requests
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "title": "겨울철 담요 후원 요청",
  "content": "추운 겨울을 대비해 담요가 필요합니다",
  "itemCategory": "이불/담요",
  "targetQuantity": 50,
  "deadline": "2024-02-15",
  "isUrgent": true
}
```

### 5.3 기부 신청
```
POST /donations
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "requestId": 1,
  "donorName": "홍길동",
  "donorPhone": "010-1234-5678",
  "donorEmail": "user@example.com",
  "itemName": "담요",
  "quantity": 10,
  "deliveryMethod": "택배",
  "receiptRequested": true
}
```

---

## 6. Board API

### 6.1 게시글 목록
```
GET /boards
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | 게시판 유형 (NOTICE, FAQ, FREE) |
| keyword | string | 검색어 |

### 6.2 게시글 작성
```
POST /boards
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "type": "FREE",
  "title": "입양 후기입니다",
  "content": "콩이를 입양하고 정말 행복합니다..."
}
```

### 6.3 댓글 작성
```
POST /boards/{id}/comments
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "content": "축하합니다!"
}
```

---

## Error Response

모든 에러는 다음 형식을 따릅니다:

```json
{
  "status": 400,
  "message": "에러 메시지",
  "timestamp": "2024-01-15T10:00:00"
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |
