package com.dnproject.platform.service;

import com.dnproject.platform.exception.CustomException;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.SendEmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Resend API를 통한 이메일 발송.
 * - 신청 접수 시: 신청자에게 접수 완료 메일, 관리자(보호소)에게 새 신청 알림 메일 발송.
 * - 승인/반려 시: 신청자에게 결과 메일 발송.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final Resend resend;

    @Value("${resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${resend.from-name:62댕냥이}")
    private String fromName;

    @Value("${resend.logo-url:}")
    private String logoUrl;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /** 이메일 공통 레이아웃: 로고·박스·푸터 (인라인 CSS, 이메일 클라이언트 호환) */
    private String emailLayout(String title, String bodyHtml) {
        String logoBlock = (logoUrl != null && !logoUrl.isBlank())
                ? "<img src=\"" + logoUrl.replace("\"", "&quot;") + "\" alt=\"62댕냥이\" style=\"max-height:48px; max-width:180px; display:block; margin:0 auto;\" />"
                : "<span style=\"font-size:26px; font-weight:700; color:#fff; letter-spacing:-0.5px;\">62댕냥이</span>";
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0; padding:0; background:#f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;">
            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f4f8; padding:32px 16px;">
              <tr><td align="center">
            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg, #2d7a8c 0%%, #3d9cad 100%%); padding:28px 24px; text-align:center;">
                  %s
                  <p style="margin:8px 0 0; font-size:13px; color:rgba(255,255,255,0.92);">입양·봉사·기부 매칭 플랫폼</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 24px; color:#333; font-size:15px; line-height:1.65;">
                  <h2 style="margin:0 0 20px; font-size:18px; font-weight:600; color:#1a1a1a;">%s</h2>
                  %s
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px; background:#f8fafb; border-top:1px solid #e8ecef; font-size:12px; color:#6b7280;">
                  본 메일은 62댕냥이 플랫폼에서 발송되었습니다.
                </td>
              </tr>
            </table>
              </td></tr>
            </table>
            </body>
            </html>
            """.formatted(logoBlock, title.replace("<", "&lt;").replace(">", "&gt;"), bodyHtml);
    }

    public void sendWelcomeEmail(String toEmail, String userName) {
        String subject = "회원가입을 환영합니다";
        String body = String.format("""
            <p style="margin:0 0 12px;">%s님, 가입해 주셔서 감사합니다.</p>
            <p style="margin:0; color:#4b5563;">62댕냥이 매칭 플랫폼에서 따뜻한 입양·봉사·기부 활동을 시작해 보세요.</p>
            """, userName.replace("<", "&lt;").replace(">", "&gt;"));
        send(toEmail, subject, emailLayout("회원가입을 환영합니다", body));
    }

    public void sendApprovalEmail(String toEmail, String applicantName, String type) {
        String subject = type + " 신청이 승인되었습니다";
        String body = String.format("""
            <p style="margin:0 0 12px;">%s님의 %s 신청이 <strong style="color:#059669;">승인</strong>되었습니다.</p>
            <p style="margin:0; color:#4b5563;">관련 안내에 따라 다음 단계를 진행해 주세요.</p>
            """, applicantName.replace("<", "&lt;"), type);
        send(toEmail, subject, emailLayout(type + " 신청 승인 안내", body));
    }

    public void sendRejectionEmail(String toEmail, String applicantName, String type, String reason) {
        String subject = type + " 신청 결과 안내";
        String r = reason != null && !reason.isBlank() ? reason.replace("<", "&lt;") : "별도 안내 없음";
        String body = String.format("""
            <p style="margin:0 0 12px;">%s님의 %s 신청이 거절되었습니다.</p>
            <div style="margin:16px 0 0; padding:14px; background:#fef2f2; border-radius:8px; border-left:4px solid #dc2626;">
              <p style="margin:0; font-size:14px; color:#991b1b;">사유: %s</p>
            </div>
            """, applicantName.replace("<", "&lt;"), type, r);
        send(toEmail, subject, emailLayout(type + " 신청 결과 안내", body));
    }

    public void sendApplicationReceivedEmail(String toEmail, String applicantName, String type) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("신청 접수 메일 미발송(수신 이메일 없음): type={}, applicant={}", type, applicantName);
            return;
        }
        String subject = type + " 신청이 접수되었습니다";
        String body = String.format("""
            <p style="margin:0 0 12px;">%s님의 %s 신청이 접수되었습니다.</p>
            <div style="margin:16px 0 0; padding:16px; background:#f0fdf4; border-radius:8px; border-left:4px solid #22c55e;">
              <p style="margin:0; font-size:14px; color:#166534;">보호소 관리자 검토 후 결과를 이메일로 알려드리겠습니다.</p>
            </div>
            """, applicantName.replace("<", "&lt;"), type);
        send(toEmail, subject, emailLayout(type + " 신청 접수 완료", body));
    }

    /**
     * Resend를 통해 관리자(보호소) 메일로 새 신청 접수 알림 발송.
     * 수신처: 담당자(manager) 이메일 우선, 없으면 보호소(shelter) 이메일.
     * 참고: Resend 샌드박스(onboarding@resend.dev) 사용 시 수신 주소는 Resend 계정에 등록된 이메일로만 가능. 다른 주소는 도메인 인증 후 발신 주소 변경 필요.
     */
    public void sendApplicationReceivedToAdmin(String toEmail, String applicantName, String type, String detailSummary) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("관리자(보호소) 이메일이 없어 신청 알림 미발송: type={}, applicant={}", type, applicantName);
            return;
        }
        String subject = "[62댕냥이] 새 " + type + " 신청이 접수되었습니다";
        String detail = detailSummary != null && !detailSummary.isBlank()
                ? "<div style=\"margin:12px 0 0; padding:14px; background:#f8fafc; border-radius:8px; font-size:14px; color:#475569; white-space:pre-wrap;\">" + detailSummary.replace("<", "&lt;").replace(">", "&gt;") + "</div>"
                : "";
        String adminLoginHref = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") + "/admin/login" : "#";
        String body = String.format("""
            <p style="margin:0 0 8px;"><strong>%s</strong>님의 %s 신청이 접수되었습니다.</p>
            %s
            <p style="margin:24px 0 0;"><a href="%s" style="display:inline-block; padding:12px 24px; background:#2d7a8c; color:#fff; text-decoration:none; border-radius:8px; font-size:14px; font-weight:500;">관리자 로그인 바로가기</a></p>
            """, applicantName.replace("<", "&lt;"), type, detail, adminLoginHref);
        boolean sent = send(toEmail, subject, emailLayout("새 " + type + " 신청 접수", body));
        if (sent) {
            log.info("관리자 신청 알림 발송 성공: to={}, type={}, applicant={}", toEmail, type, applicantName);
        } else {
            log.warn("관리자 신청 알림 발송 실패(Resend 오류). to={}, type={}. Resend 샌드박스면 수신 주소를 Resend 계정 이메일로만 사용 가능.", toEmail, type);
        }
    }

    /**
     * 테스트 발송 (Resend 설정 확인용). 관리자 API에서만 호출.
     * 발송 실패 시 예외를 던져 API에서 오류 응답을 반환할 수 있게 함.
     */
    public void sendTestEmail(String toEmail) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalArgumentException("수신 이메일 주소가 필요합니다.");
        }
        String subject = "[62댕냥이] 이메일 테스트";
        String body = """
            <p style="margin:0 0 12px;">테스트 메일입니다.</p>
            <p style="margin:0; color:#4b5563;">Resend를 통한 이메일 발송이 정상적으로 동작하고 있습니다.</p>
            """;
        String html = emailLayout("이메일 테스트", body);
        try {
            SendEmailRequest params = SendEmailRequest.builder()
                    .from(fromName + " <" + fromEmail + ">")
                    .to(toEmail)
                    .subject(subject)
                    .html(html)
                    .build();
            resend.emails().send(params);
            log.info("테스트 이메일 발송: to={}", toEmail);
        } catch (ResendException e) {
            log.error("이메일 발송 실패: to={}, subject={}, error={}", toEmail, subject, e.getMessage());
            String msg = e.getMessage();
            if (msg != null && (msg.contains("403") || msg.contains("your own email address") || msg.contains("verify a domain"))) {
                throw new CustomException(
                        "Resend 샌드박스(onboarding@resend.dev)에서는 Resend 계정에 등록된 이메일로만 발송할 수 있습니다. "
                                + "테스트 시 수신 주소를 비우면 로그인한 관리자 이메일로 발송되며, 그 이메일이 Resend 계정과 같아야 합니다. "
                                + "다른 주소로 보내려면 resend.com/domains 에서 도메인을 인증하고 RESEND_FROM_EMAIL을 해당 도메인 이메일로 설정하세요.",
                        HttpStatus.FORBIDDEN, "RESEND_SANDBOX_RESTRICTION");
            }
            throw new CustomException("이메일 발송에 실패했습니다. RESEND_API_KEY와 발신 도메인을 확인해 주세요.", HttpStatus.INTERNAL_SERVER_ERROR, "EMAIL_SEND_FAILED");
        } catch (Exception e) {
            log.error("이메일 발송 실패: to={}, subject={}, error={}", toEmail, subject, e.getMessage());
            throw new CustomException("이메일 발송에 실패했습니다. RESEND_API_KEY와 발신 도메인을 확인해 주세요.", HttpStatus.INTERNAL_SERVER_ERROR, "EMAIL_SEND_FAILED");
        }
    }

    /** @return 발송 성공 여부 (실패 시 로그만 남기고 false) */
    private boolean send(String toEmail, String subject, String html) {
        try {
            SendEmailRequest params = SendEmailRequest.builder()
                    .from(fromName + " <" + fromEmail + ">")
                    .to(toEmail)
                    .subject(subject)
                    .html(html)
                    .build();
            resend.emails().send(params);
            return true;
        } catch (ResendException e) {
            log.error("이메일 발송 실패: to={}, subject={}, error={}", toEmail, subject, e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("이메일 발송 실패: to={}, subject={}, error={}", toEmail, subject, e.getMessage());
            return false;
        }
    }
}
