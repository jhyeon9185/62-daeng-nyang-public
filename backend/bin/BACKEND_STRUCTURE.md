# backend 디렉터리 트리 구조

> `build/`, `uploads/`, `.env`, `.DS_Store` 제외

```
backend/
├── .env.example
├── .gitignore
├── build.gradle.kts
├── settings.gradle.kts
├── gradlew
├── gradle/
│   └── wrapper/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── dnproject/
│   │   │           └── platform/
│   │   │               ├── DnPlatformApplication.java
│   │   │               ├── config/
│   │   │               │   ├── CorsConfig.java
│   │   │               │   ├── DevBoardDataLoader.java
│   │   │               │   ├── PublicApiSyncScheduler.java
│   │   │               │   ├── ResendConfig.java
│   │   │               │   ├── SecurityConfig.java
│   │   │               │   ├── ShelterRegionBackfillRunner.java
│   │   │               │   └── SwaggerConfig.java
│   │   │               ├── constant/
│   │   │               ├── controller/
│   │   │               │   ├── AdminAnimalController.java
│   │   │               │   ├── AdminApplicationController.java
│   │   │               │   ├── AdminBoardController.java
│   │   │               │   ├── AdminEmailController.java
│   │   │               │   ├── AdminShelterController.java
│   │   │               │   ├── AdminUserController.java
│   │   │               │   ├── AdoptionController.java
│   │   │               │   ├── AnimalController.java
│   │   │               │   ├── AuthController.java
│   │   │               │   ├── BoardController.java
│   │   │               │   ├── DonationController.java
│   │   │               │   ├── FavoriteController.java
│   │   │               │   ├── NotificationController.java
│   │   │               │   ├── UserPreferenceController.java
│   │   │               │   └── VolunteerController.java
│   │   │               ├── domain/
│   │   │               │   ├── Adoption.java
│   │   │               │   ├── Animal.java
│   │   │               │   ├── AnimalImage.java
│   │   │               │   ├── Board.java
│   │   │               │   ├── Comment.java
│   │   │               │   ├── Donation.java
│   │   │               │   ├── DonationRequest.java
│   │   │               │   ├── Favorite.java
│   │   │               │   ├── Notification.java
│   │   │               │   ├── Preference.java
│   │   │               │   ├── Shelter.java
│   │   │               │   ├── SyncHistory.java
│   │   │               │   ├── User.java
│   │   │               │   ├── Volunteer.java
│   │   │               │   ├── VolunteerRecruitment.java
│   │   │               │   └── constant/
│   │   │               │       ├── ActivityCycle.java
│   │   │               │       ├── AdoptionStatus.java
│   │   │               │       ├── AdoptionType.java
│   │   │               │       ├── AnimalStatus.java
│   │   │               │       ├── BoardType.java
│   │   │               │       ├── DonationStatus.java
│   │   │               │       ├── DonationType.java
│   │   │               │       ├── DonorType.java
│   │   │               │       ├── Gender.java
│   │   │               │       ├── PaymentMethod.java
│   │   │               │       ├── RecruitmentStatus.java
│   │   │               │       ├── RequestStatus.java
│   │   │               │       ├── Role.java
│   │   │               │       ├── Size.java
│   │   │               │       ├── Species.java
│   │   │               │       ├── SyncTriggerType.java
│   │   │               │       ├── VerificationStatus.java
│   │   │               │       ├── VolunteerStatus.java
│   │   │               │       └── VolunteerType.java
│   │   │               ├── dto/
│   │   │               │   ├── publicapi/
│   │   │               │   │   ├── AnimalItem.java
│   │   │               │   │   ├── KindItem.java
│   │   │               │   │   ├── PublicApiResponse.java
│   │   │               │   │   └── ShelterItem.java
│   │   │               │   ├── request/
│   │   │               │   │   ├── AdoptionRequest.java
│   │   │               │   │   ├── AnimalCreateRequest.java
│   │   │               │   │   ├── BoardCreateRequest.java
│   │   │               │   │   ├── CommentCreateRequest.java
│   │   │               │   │   ├── DonationApplyRequest.java
│   │   │               │   │   ├── DonationRequestCreateRequest.java
│   │   │               │   │   ├── LoginRequest.java
│   │   │               │   │   ├── PreferenceRequest.java
│   │   │               │   │   ├── ShelterSignupRequest.java
│   │   │               │   │   ├── ShelterVerifyRequest.java
│   │   │               │   │   ├── SignupRequest.java
│   │   │               │   │   ├── TestEmailRequest.java
│   │   │               │   │   ├── UpdateMeRequest.java
│   │   │               │   │   ├── VolunteerApplyRequest.java
│   │   │               │   │   └── VolunteerRecruitmentCreateRequest.java
│   │   │               │   └── response/
│   │   │               │       ├── AdoptionResponse.java
│   │   │               │       ├── AnimalResponse.java
│   │   │               │       ├── ApiResponse.java
│   │   │               │       ├── BoardResponse.java
│   │   │               │       ├── CommentResponse.java
│   │   │               │       ├── DonationRequestResponse.java
│   │   │               │       ├── DonationResponse.java
│   │   │               │       ├── ErrorResponse.java
│   │   │               │       ├── NotificationResponse.java
│   │   │               │       ├── PageResponse.java
│   │   │               │       ├── PreferenceResponse.java
│   │   │               │       ├── ShelterResponse.java
│   │   │               │       ├── ShelterSignupResponse.java
│   │   │               │       ├── TokenResponse.java
│   │   │               │       ├── UserResponse.java
│   │   │               │       ├── VolunteerRecruitmentResponse.java
│   │   │               │       └── VolunteerResponse.java
│   │   │               ├── exception/
│   │   │               │   ├── CustomException.java
│   │   │               │   ├── GlobalExceptionHandler.java
│   │   │               │   ├── NotFoundException.java
│   │   │               │   └── UnauthorizedException.java
│   │   │               ├── repository/
│   │   │               │   ├── AdoptionRepository.java
│   │   │               │   ├── AnimalImageRepository.java
│   │   │               │   ├── AnimalRepository.java
│   │   │               │   ├── BoardRepository.java
│   │   │               │   ├── CommentRepository.java
│   │   │               │   ├── DonationRepository.java
│   │   │               │   ├── DonationRequestRepository.java
│   │   │               │   ├── FavoriteRepository.java
│   │   │               │   ├── NotificationRepository.java
│   │   │               │   ├── PreferenceRepository.java
│   │   │               │   ├── ShelterRepository.java
│   │   │               │   ├── SyncHistoryRepository.java
│   │   │               │   ├── UserRepository.java
│   │   │               │   ├── VolunteerRecruitmentRepository.java
│   │   │               │   └── VolunteerRepository.java
│   │   │               ├── security/
│   │   │               │   ├── JwtAuthenticationFilter.java
│   │   │               │   ├── JwtProvider.java
│   │   │               │   └── UserDetailsServiceImpl.java
│   │   │               ├── service/
│   │   │               │   ├── AdoptionService.java
│   │   │               │   ├── AnimalService.java
│   │   │               │   ├── AnimalSyncService.java
│   │   │               │   ├── AuthService.java
│   │   │               │   ├── BoardService.java
│   │   │               │   ├── DonationService.java
│   │   │               │   ├── EmailService.java
│   │   │               │   ├── FavoriteService.java
│   │   │               │   ├── FileStorageService.java
│   │   │               │   ├── NotificationService.java
│   │   │               │   ├── PreferenceService.java
│   │   │               │   ├── PublicApiService.java
│   │   │               │   ├── ShelterService.java
│   │   │               │   ├── SyncHistoryService.java
│   │   │               │   └── VolunteerService.java
│   │   │               └── util/
│   │   │                   └── AddressRegionParser.java
│   │   └── resources/
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       ├── application.yml
│   │       └── db/
│   │           └── migration/
│   │               └── V5__add_sync_history.sql
│   └── test/
│       └── java/
│           └── com/
│               └── dnproject/
│                   └── platform/
```

## 패키지 요약

| 패키지 | 설명 |
|--------|------|
| `config` | CORS, Security, Swagger, Resend, 스케줄러 등 설정 |
| `controller` | REST API 컨트롤러 (Admin, Auth, Animal, Board 등) |
| `domain` | 엔티티 및 상수 (User, Animal, Shelter, Adoption 등) |
| `dto` | 요청/응답 DTO, 공공 API DTO |
| `exception` | 예외 클래스 및 전역 핸들러 |
| `repository` | JPA 리포지토리 |
| `security` | JWT, 인증 필터 |
| `service` | 비즈니스 로직 서비스 |
| `util` | 유틸리티 (주소/지역 파싱 등) |
