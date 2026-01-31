package com.dnproject.platform.service;

import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.Volunteer;
import com.dnproject.platform.domain.VolunteerRecruitment;
import com.dnproject.platform.domain.constant.ActivityCycle;
import com.dnproject.platform.domain.constant.RecruitmentStatus;
import com.dnproject.platform.domain.constant.VolunteerStatus;
import com.dnproject.platform.domain.constant.VolunteerType;
import com.dnproject.platform.dto.request.VolunteerApplyRequest;
import com.dnproject.platform.dto.request.VolunteerRecruitmentCreateRequest;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.dto.response.VolunteerRecruitmentResponse;
import com.dnproject.platform.dto.response.VolunteerResponse;
import com.dnproject.platform.exception.CustomException;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.repository.UserRepository;
import com.dnproject.platform.repository.VolunteerRecruitmentRepository;
import com.dnproject.platform.repository.VolunteerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VolunteerService {

    private final VolunteerRepository volunteerRepository;
    private final VolunteerRecruitmentRepository recruitmentRepository;
    private final UserRepository userRepository;
    private final ShelterRepository shelterRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public VolunteerRecruitmentResponse createRecruitment(Long userId, VolunteerRecruitmentCreateRequest request) {
        VolunteerRecruitment rec = VolunteerRecruitment.builder()
                .shelter(shelterRepository.findById(request.getShelterId())
                        .orElseThrow(() -> new NotFoundException("보호소를 찾을 수 없습니다.")))
                .title(request.getTitle())
                .content(request.getContent())
                .maxApplicants(request.getMaxApplicants())
                .deadline(request.getDeadline())
                .status(RecruitmentStatus.RECRUITING)
                .build();
        rec = recruitmentRepository.save(rec);
        return toRecruitmentResponse(rec);
    }

    @Transactional(readOnly = true)
    public PageResponse<VolunteerRecruitmentResponse> getAllRecruitments(Pageable pageable) {
        Page<VolunteerRecruitment> page = recruitmentRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PageResponse.<VolunteerRecruitmentResponse>builder()
                .content(page.getContent().stream().map(this::toRecruitmentResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public VolunteerRecruitmentResponse getRecruitmentById(Long id) {
        VolunteerRecruitment rec = recruitmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("모집공고를 찾을 수 없습니다."));
        return toRecruitmentResponse(rec);
    }

    @Transactional
    public VolunteerResponse apply(Long userId, VolunteerApplyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        VolunteerRecruitment recruitment = recruitmentRepository.findById(request.getRecruitmentId())
                .orElseThrow(() -> new NotFoundException("모집공고를 찾을 수 없습니다."));
        if (recruitment.getStatus() != RecruitmentStatus.RECRUITING) {
            throw new CustomException("모집이 마감되었습니다.", HttpStatus.BAD_REQUEST, "RECRUITMENT_CLOSED");
        }
        String phone = request.getApplicantPhone() != null ? request.getApplicantPhone() : "";
        String email = request.getApplicantEmail() != null ? request.getApplicantEmail() : user.getEmail();
        String activityRegion = (request.getActivityRegion() != null && !request.getActivityRegion().isBlank())
                ? request.getActivityRegion().trim() : "";
        int participantCount = (request.getParticipantCount() != null && request.getParticipantCount() >= 1)
                ? request.getParticipantCount() : 1;
        String specialNotes = request.getMessage() != null ? request.getMessage().trim() : null;
        Volunteer volunteer = Volunteer.builder()
                .user(user)
                .shelter(recruitment.getShelter())
                .recruitment(recruitment)
                .applicantName(request.getApplicantName())
                .applicantPhone(phone)
                .applicantEmail(email)
                .activityRegion(activityRegion)
                .activityField(request.getActivityField())
                .volunteerDateStart(request.getStartDate())
                .volunteerDateEnd(request.getEndDate())
                .activityCycle(ActivityCycle.IRREGULAR)
                .volunteerType(VolunteerType.INDIVIDUAL)
                .participantCount(participantCount)
                .specialNotes(specialNotes)
                .status(VolunteerStatus.PENDING)
                .build();
        volunteer = volunteerRepository.save(volunteer);
        emailService.sendApplicationReceivedEmail(email, request.getApplicantName(), "봉사");
        notifyAndEmailAdmin(volunteer, request.getApplicantName(), recruitment.getTitle());
        return toVolunteerResponse(volunteer);
    }

    @Transactional(readOnly = true)
    public PageResponse<VolunteerResponse> getPendingByShelter(Long shelterId, int page, int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        var list = volunteerRepository.findByShelter_IdAndStatus(shelterId, VolunteerStatus.PENDING, pageable);
        List<VolunteerResponse> content = list.stream().map(this::toVolunteerResponse).toList();
        return PageResponse.<VolunteerResponse>builder()
                .content(content)
                .page(list.getNumber())
                .size(list.getSize())
                .totalElements(list.getTotalElements())
                .totalPages(list.getTotalPages())
                .first(list.isFirst())
                .last(list.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<VolunteerResponse> getPendingByShelterForCurrentUser(Long userId, int page, int size) {
        var shelter = shelterRepository.findByManager_Id(userId)
                .orElseThrow(() -> new CustomException("보호소 관리자만 조회할 수 있습니다.", HttpStatus.FORBIDDEN, "FORBIDDEN"));
        return getPendingByShelter(shelter.getId(), page, size);
    }

    /** 시스템 관리자: 전체 봉사 신청 내역 (최신순) */
    @Transactional(readOnly = true)
    public PageResponse<VolunteerResponse> getAllForAdmin(int page, int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        var list = volunteerRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<VolunteerResponse> content = list.stream().map(this::toVolunteerResponse).toList();
        return PageResponse.<VolunteerResponse>builder()
                .content(content)
                .page(list.getNumber())
                .size(list.getSize())
                .totalElements(list.getTotalElements())
                .totalPages(list.getTotalPages())
                .first(list.isFirst())
                .last(list.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<VolunteerResponse> getMyList(Long userId, int page, int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        var list = volunteerRepository.findByUser_IdOrderByCreatedAtDesc(userId, pageable);
        List<VolunteerResponse> content = list.stream().map(this::toVolunteerResponse).toList();
        return PageResponse.<VolunteerResponse>builder()
                .content(content)
                .page(list.getNumber())
                .size(list.getSize())
                .totalElements(list.getTotalElements())
                .totalPages(list.getTotalPages())
                .first(list.isFirst())
                .last(list.isLast())
                .build();
    }

    @Transactional
    public VolunteerResponse approve(Long id) {
        Volunteer v = volunteerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("봉사 신청을 찾을 수 없습니다."));
        if (v.getStatus() != VolunteerStatus.PENDING) {
            throw new CustomException("대기 중인 신청만 승인할 수 있습니다.", HttpStatus.BAD_REQUEST, "INVALID_STATUS");
        }
        v.setStatus(VolunteerStatus.APPROVED);
        v = volunteerRepository.save(v);
        emailService.sendApprovalEmail(v.getApplicantEmail(), v.getApplicantName(), "봉사");
        return toVolunteerResponse(v);
    }

    @Transactional
    public VolunteerResponse reject(Long id, String rejectReason) {
        Volunteer v = volunteerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("봉사 신청을 찾을 수 없습니다."));
        if (v.getStatus() != VolunteerStatus.PENDING) {
            throw new CustomException("대기 중인 신청만 거절할 수 있습니다.", HttpStatus.BAD_REQUEST, "INVALID_STATUS");
        }
        v.setStatus(VolunteerStatus.REJECTED);
        v.setRejectReason(rejectReason);
        v = volunteerRepository.save(v);
        emailService.sendRejectionEmail(v.getApplicantEmail(), v.getApplicantName(), "봉사", rejectReason);
        return toVolunteerResponse(v);
    }

    private VolunteerRecruitmentResponse toRecruitmentResponse(VolunteerRecruitment r) {
        String shelterName = r.getShelter() != null ? r.getShelter().getName() : null;
        return VolunteerRecruitmentResponse.builder()
                .id(r.getId())
                .shelterId(r.getShelter() != null ? r.getShelter().getId() : null)
                .shelterName(shelterName)
                .title(r.getTitle())
                .content(r.getContent())
                .maxApplicants(r.getMaxApplicants())
                .deadline(r.getDeadline())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private void notifyAndEmailAdmin(Volunteer volunteer, String applicantName, String recruitmentTitle) {
        var shelter = volunteer.getShelter();
        if (shelter == null) return;
        var manager = shelter.getManager();
        if (manager != null) {
            notificationService.create(manager.getId(), "VOLUNTEER_APPLICATION",
                    applicantName + "님의 봉사 신청이 접수되었습니다. (" + recruitmentTitle + ")",
                    "/admin?tab=applications");
        }
        String adminEmail = (manager != null && manager.getEmail() != null && !manager.getEmail().isBlank()) ? manager.getEmail() : (shelter.getEmail() != null && !shelter.getEmail().isBlank() ? shelter.getEmail() : null);
        if (adminEmail != null) {
            emailService.sendApplicationReceivedToAdmin(adminEmail, applicantName, "봉사", "모집: " + recruitmentTitle);
        } else {
            log.warn("관리자(보호소) 이메일 없음 - 봉사 신청 알림 미발송: shelterId={}, applicant={}", shelter.getId(), applicantName);
        }
    }

    private VolunteerResponse toVolunteerResponse(Volunteer v) {
        String shelterName = v.getShelter() != null ? v.getShelter().getName() : null;
        String recruitmentTitle = v.getRecruitment() != null ? v.getRecruitment().getTitle() : null;
        return VolunteerResponse.builder()
                .id(v.getId())
                .recruitmentId(v.getRecruitment() != null ? v.getRecruitment().getId() : null)
                .recruitmentTitle(recruitmentTitle)
                .shelterName(shelterName)
                .applicantName(v.getApplicantName())
                .applicantPhone(v.getApplicantPhone())
                .applicantEmail(v.getApplicantEmail())
                .activityRegion(v.getActivityRegion())
                .activityField(v.getActivityField())
                .startDate(v.getVolunteerDateStart() != null ? v.getVolunteerDateStart().toString() : null)
                .endDate(v.getVolunteerDateEnd() != null ? v.getVolunteerDateEnd().toString() : null)
                .participantCount(v.getParticipantCount() != null ? v.getParticipantCount() : 1)
                .message(v.getSpecialNotes())
                .status(v.getStatus())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
