---
name: email-service
description: Creates email service using Resend API for sending notifications. Use when implementing email functionality, notification emails. Keywords: email, resend, notification, mail.
---

# Email Service Generator (Resend)

## Purpose
Generate email service using Resend API:
- Transaction emails
- Notification emails
- Email templates

## Dependencies
Add to `build.gradle.kts`:
```kotlin
implementation("com.resend:resend-java:2.2.1")
```

(Maven `pom.xml` 예시는 프로젝트가 Maven일 때만 참고.)

## Email Service Implementation
Location: `backend/src/main/java/com/dnproject/platform/service/EmailService.java`

```java
package com.dnproject.platform.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final Resend resend;
    private final String fromEmail;
    private final String fromName;

    public EmailService(
            @Value("${resend.api-key}") String apiKey,
            @Value("${resend.from-email}") String fromEmail,
            @Value("${resend.from-name}") String fromName) {
        this.resend = new Resend(apiKey);
        this.fromEmail = fromEmail;
        this.fromName = fromName;
    }

    @Async
    public void sendEmail(String to, String subject, String htmlContent) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromName + " <" + fromEmail + ">")
                    .to(to)
                    .subject(subject)
                    .html(htmlContent)
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            log.info("Email sent successfully. ID: {}", response.getId());
        } catch (ResendException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    // ============================================
    // Welcome Email
    // ============================================
    @Async
    public void sendWelcomeEmail(String to, String userName) {
        String subject = "[62댕냥이] 회원가입을 환영합니다!";
        String html = buildWelcomeEmailTemplate(userName);
        sendEmail(to, subject, html);
    }

    // ============================================
    // Adoption Application Received
    // ============================================
    @Async
    public void sendAdoptionReceivedEmail(String to, String userName, String animalName, String shelterName) {
        String subject = "[62댕냥이] 입양 신청이 접수되었습니다";
        String html = buildAdoptionReceivedTemplate(userName, animalName, shelterName);
        sendEmail(to, subject, html);
    }

    // ============================================
    // Adoption Approved
    // ============================================
    @Async
    public void sendAdoptionApprovedEmail(String to, String userName, String animalName, String shelterName, String shelterPhone) {
        String subject = "[62댕냥이] 🎉 입양 신청이 승인되었습니다!";
        String html = buildAdoptionApprovedTemplate(userName, animalName, shelterName, shelterPhone);
        sendEmail(to, subject, html);
    }

    // ============================================
    // Adoption Rejected
    // ============================================
    @Async
    public void sendAdoptionRejectedEmail(String to, String userName, String animalName, String reason) {
        String subject = "[62댕냥이] 입양 신청 결과 안내";
        String html = buildAdoptionRejectedTemplate(userName, animalName, reason);
        sendEmail(to, subject, html);
    }

    // ============================================
    // Volunteer Application Received
    // ============================================
    @Async
    public void sendVolunteerReceivedEmail(String to, String userName, String shelterName, String activityField) {
        String subject = "[62댕냥이] 봉사 신청이 접수되었습니다";
        String html = buildVolunteerReceivedTemplate(userName, shelterName, activityField);
        sendEmail(to, subject, html);
    }

    // ============================================
    // Donation Received
    // ============================================
    @Async
    public void sendDonationReceivedEmail(String to, String donorName, String itemName, int quantity, String shelterName, String shelterAddress) {
        String subject = "[62댕냥이] 물품 기부 신청이 접수되었습니다";
        String html = buildDonationReceivedTemplate(donorName, itemName, quantity, shelterName, shelterAddress);
        sendEmail(to, subject, html);
    }

    // ============================================
    // Admin Notification
    // ============================================
    @Async
    public void sendAdminNotificationEmail(String to, String notificationType, String content) {
        String subject = "[62댕냥이 관리자] 새로운 " + notificationType + " 알림";
        String html = buildAdminNotificationTemplate(notificationType, content);
        sendEmail(to, subject, html);
    }

    // ============================================
    // Email Templates
    // ============================================

    private String buildWelcomeEmailTemplate(String userName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 62댕냥이</h1>
                    </div>
                    <div class="content">
                        <h2>%s님, 환영합니다!</h2>
                        <p>62댕냥이 플랫폼에 가입해 주셔서 감사합니다.</p>
                        <p>이제 다양한 유기동물들을 만나보시고, 소중한 인연을 찾아보세요.</p>
                        <ul>
                            <li>🐕 입양/임시보호 신청</li>
                            <li>🤝 봉사활동 참여</li>
                            <li>💝 물품 후원</li>
                        </ul>
                        <a href="https://dnplatform.com" class="button">시작하기</a>
                    </div>
                    <div class="footer">
                        <p>본 메일은 발신 전용입니다.</p>
                        <p>© 2024 62댕냥이. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName);
    }

    private String buildAdoptionReceivedTemplate(String userName, String animalName, String shelterName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #4F46E5; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📋 입양 신청 접수</h1>
                    </div>
                    <div class="content">
                        <h2>%s님, 입양 신청이 접수되었습니다.</h2>
                        <div class="info-box">
                            <p><strong>동물 이름:</strong> %s</p>
                            <p><strong>보호소:</strong> %s</p>
                        </div>
                        <p>보호소에서 신청서를 검토한 후 결과를 알려드리겠습니다.</p>
                        <p>검토에는 영업일 기준 3-5일이 소요될 수 있습니다.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 62댕냥이. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, animalName, shelterName);
    }

    private String buildAdoptionApprovedTemplate(String userName, String animalName, String shelterName, String shelterPhone) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10B981; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 입양 승인</h1>
                    </div>
                    <div class="content">
                        <h2>축하합니다, %s님!</h2>
                        <p><strong>%s</strong>의 새로운 가족이 되셨습니다!</p>
                        <div class="info-box">
                            <p><strong>보호소:</strong> %s</p>
                            <p><strong>연락처:</strong> %s</p>
                        </div>
                        <p>보호소에 연락하시어 입양 절차를 진행해 주세요.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 62댕냥이. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, animalName, shelterName, shelterPhone);
    }

    private String buildAdoptionRejectedTemplate(String userName, String animalName, String reason) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #6B7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #6B7280; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📋 입양 신청 결과</h1>
                    </div>
                    <div class="content">
                        <h2>%s님, 안녕하세요.</h2>
                        <p><strong>%s</strong>에 대한 입양 신청 검토 결과를 안내드립니다.</p>
                        <div class="info-box">
                            <p><strong>사유:</strong> %s</p>
                        </div>
                        <p>다른 아이들도 가족을 기다리고 있습니다. 다시 한번 살펴봐 주세요.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 62댕냥이. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, animalName, reason);
    }

    private String buildVolunteerReceivedTemplate(String userName, String shelterName, String activityField) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #8B5CF6; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🤝 봉사 신청 접수</h1>
                    </div>
                    <div class="content">
                        <h2>%s님, 봉사 신청이 접수되었습니다.</h2>
                        <div class="info-box">
                            <p><strong>보호소:</strong> %s</p>
                            <p><strong>활동 분야:</strong> %s</p>
                        </div>
                        <p>보호소에서 신청서를 검토한 후 결과를 알려드리겠습니다.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 62댕냥이. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, shelterName, activityField);
    }

    private String buildDonationReceivedTemplate(String donorName, String itemName, int quantity, String shelterName, String shelterAddress) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #EC4899; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #EC4899; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💝 물품 기부 신청 접수</h1>
                    </div>
                    <div class="content">
                        <h2>%s님, 기부 신청이 접수되었습니다.</h2>
                        <div class="info-box">
                            <p><strong>물품:</strong> %s (수량: %d개)</p>
                            <p><strong>보호소:</strong> %s</p>
                            <p><strong>배송지:</strong> %s</p>
                        </div>
                        <p>물품 발송 후 운송장 번호를 입력해 주시면 보호소에서 확인할 수 있습니다.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 62댕냥이. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(donorName, itemName, quantity, shelterName, shelterAddress);
    }

    private String buildAdminNotificationTemplate(String notificationType, String content) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #F59E0B; }
                    .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔔 관리자 알림</h1>
                    </div>
                    <div class="content">
                        <h2>새로운 %s 알림</h2>
                        <div class="info-box">
                            %s
                        </div>
                        <a href="https://dnplatform.com/admin" class="button">관리자 페이지로 이동</a>
                    </div>
                    <div class="footer">
                        <p>© 2024 62댕냥이. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(notificationType, content);
    }
}
```

## Application Properties

```yaml
# Resend Configuration
resend:
  api-key: ${RESEND_API_KEY}
  from-email: noreply@dnplatform.com
  from-name: 62댕냥이
```

## Async Configuration
Location: `backend/src/main/java/com/dnproject/platform/config/AsyncConfig.java`

```java
package com.dnproject.platform.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class AsyncConfig {
    // Enables @Async annotation for non-blocking email sending
}
```
