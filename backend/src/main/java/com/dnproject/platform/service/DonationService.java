package com.dnproject.platform.service;

import com.dnproject.platform.domain.Donation;
import com.dnproject.platform.domain.DonationRequest;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.DonationStatus;
import com.dnproject.platform.domain.constant.DonationType;
import com.dnproject.platform.domain.constant.DonorType;
import com.dnproject.platform.domain.constant.PaymentMethod;
import com.dnproject.platform.domain.constant.RequestStatus;
import com.dnproject.platform.dto.request.DonationApplyRequest;
import com.dnproject.platform.dto.request.DonationRequestCreateRequest;
import com.dnproject.platform.dto.response.DonationRequestResponse;
import com.dnproject.platform.dto.response.DonationResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.CustomException;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.repository.DonationRepository;
import com.dnproject.platform.repository.DonationRequestRepository;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final DonationRequestRepository donationRequestRepository;
    private final UserRepository userRepository;
    private final ShelterRepository shelterRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public DonationRequestResponse createRequest(Long userId, DonationRequestCreateRequest request) {
        DonationRequest dr = DonationRequest.builder()
                .shelter(shelterRepository.findById(request.getShelterId())
                        .orElseThrow(() -> new NotFoundException("보호소를 찾을 수 없습니다.")))
                .title(request.getTitle())
                .content(request.getContent())
                .itemCategory(request.getItemCategory())
                .targetQuantity(request.getTargetQuantity())
                .currentQuantity(0)
                .deadline(request.getDeadline())
                .status(RequestStatus.OPEN)
                .build();
        dr = donationRequestRepository.save(dr);
        return toRequestResponse(dr);
    }

    @Transactional(readOnly = true)
    public PageResponse<DonationRequestResponse> getAllRequests(Pageable pageable) {
        Page<DonationRequest> page = donationRequestRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PageResponse.<DonationRequestResponse>builder()
                .content(page.getContent().stream().map(this::toRequestResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public DonationRequestResponse getRequestById(Long id) {
        DonationRequest dr = donationRequestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("물품 요청을 찾을 수 없습니다."));
        return toRequestResponse(dr);
    }

    @Transactional
    public DonationResponse donate(Long userId, DonationApplyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        DonationRequest dr = donationRequestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new NotFoundException("물품 요청을 찾을 수 없습니다."));
        if (dr.getStatus() != RequestStatus.OPEN) {
            throw new CustomException("요청이 마감되었습니다.", HttpStatus.BAD_REQUEST, "REQUEST_CLOSED");
        }
        String donorEmail = user.getEmail() != null && !user.getEmail().isBlank() ? user.getEmail() : "";
        Donation donation = Donation.builder()
                .user(user)
                .shelter(dr.getShelter())
                .request(dr)
                .donorName(user.getName())
                .donorPhone(user.getPhone() != null ? user.getPhone() : "")
                .donorEmail(donorEmail)
                .donorType(DonorType.INDIVIDUAL)
                .donationType(DonationType.ONE_TIME)
                .donationCategory(dr.getItemCategory())
                .amount(BigDecimal.ZERO)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .itemName(request.getItemName())
                .quantity(request.getQuantity())
                .deliveryMethod(request.getDeliveryMethod())
                .trackingNumber(request.getTrackingNumber())
                .status(DonationStatus.PENDING)
                .build();
        donation = donationRepository.save(donation);
        dr.setCurrentQuantity(dr.getCurrentQuantity() + request.getQuantity());
        donationRequestRepository.save(dr);
        try {
            if (donorEmail != null && !donorEmail.isBlank()) {
                emailService.sendApplicationReceivedEmail(donorEmail, user.getName(), "기부");
            }
            notifyAndEmailAdmin(donation, user.getName(), dr.getTitle());
        } catch (Exception e) {
            log.warn("기부 신청 알림/이메일 처리 중 오류 (신청은 완료됨): {}", e.getMessage());
        }
        return toDonationResponse(donation);
    }

    @Transactional(readOnly = true)
    public PageResponse<DonationResponse> getPendingByShelter(Long shelterId, int page, int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        var list = donationRepository.findByShelter_IdAndStatus(shelterId, DonationStatus.PENDING, pageable);
        List<DonationResponse> content = list.stream().map(this::toDonationResponse).toList();
        return PageResponse.<DonationResponse>builder()
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
    public PageResponse<DonationResponse> getPendingByShelterForCurrentUser(Long userId, int page, int size) {
        var shelter = shelterRepository.findByManager_Id(userId)
                .orElseThrow(() -> new CustomException("보호소 관리자만 조회할 수 있습니다.", HttpStatus.FORBIDDEN, "FORBIDDEN"));
        return getPendingByShelter(shelter.getId(), page, size);
    }

    /** 시스템 관리자: 전체 기부 신청 내역 (최신순) */
    @Transactional(readOnly = true)
    public PageResponse<DonationResponse> getAllForAdmin(int page, int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        var list = donationRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<DonationResponse> content = list.stream().map(this::toDonationResponse).toList();
        return PageResponse.<DonationResponse>builder()
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
    public PageResponse<DonationResponse> getMyList(Long userId, int page, int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        var list = donationRepository.findByUser_IdOrderByCreatedAtDesc(userId, pageable);
        List<DonationResponse> content = list.stream().map(this::toDonationResponse).toList();
        return PageResponse.<DonationResponse>builder()
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
    public DonationResponse complete(Long id) {
        Donation donation = donationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("기부 신청을 찾을 수 없습니다."));
        donation.setStatus(DonationStatus.COMPLETED);
        donation = donationRepository.save(donation);
        emailService.sendApprovalEmail(donation.getDonorEmail(), donation.getDonorName(), "기부");
        return toDonationResponse(donation);
    }

    @Transactional
    public DonationResponse reject(Long id, String rejectReason) {
        Donation donation = donationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("기부 신청을 찾을 수 없습니다."));
        if (donation.getStatus() != DonationStatus.PENDING) {
            throw new CustomException("대기 중인 신청만 거절할 수 있습니다.", HttpStatus.BAD_REQUEST, "INVALID_STATUS");
        }
        donation.setStatus(DonationStatus.CANCELLED);
        donation.setRejectReason(rejectReason);
        donation = donationRepository.save(donation);
        emailService.sendRejectionEmail(donation.getDonorEmail(), donation.getDonorName(), "기부", rejectReason);
        return toDonationResponse(donation);
    }

    private void notifyAndEmailAdmin(Donation donation, String donorName, String requestTitle) {
        var shelter = donation.getShelter();
        if (shelter == null) return;
        var manager = shelter.getManager();
        if (manager != null) {
            notificationService.create(manager.getId(), "DONATION_APPLICATION",
                    donorName + "님의 기부 신청이 접수되었습니다. (" + requestTitle + ")",
                    "/admin?tab=applications");
        }
        String adminEmail = (manager != null && manager.getEmail() != null && !manager.getEmail().isBlank()) ? manager.getEmail() : (shelter.getEmail() != null && !shelter.getEmail().isBlank() ? shelter.getEmail() : null);
        if (adminEmail != null) {
            StringBuilder detail = new StringBuilder();
            detail.append("요청: ").append(requestTitle);
            detail.append("\n기부자: ").append(donorName);
            if (donation.getDonorPhone() != null && !donation.getDonorPhone().isBlank()) {
                detail.append("\n연락처: ").append(donation.getDonorPhone());
            }
            if (donation.getDonorEmail() != null && !donation.getDonorEmail().isBlank()) {
                detail.append("\n이메일: ").append(donation.getDonorEmail());
            }
            if (donation.getItemName() != null && !donation.getItemName().isBlank()) {
                detail.append("\n물품명: ").append(donation.getItemName());
            }
            if (donation.getQuantity() != null) {
                detail.append("\n수량: ").append(donation.getQuantity());
            }
            if (donation.getDeliveryMethod() != null && !donation.getDeliveryMethod().isBlank()) {
                detail.append("\n배송 방법: ").append(donation.getDeliveryMethod());
            }
            if (donation.getTrackingNumber() != null && !donation.getTrackingNumber().isBlank()) {
                detail.append("\n운송장 번호: ").append(donation.getTrackingNumber());
            }
            emailService.sendApplicationReceivedToAdmin(adminEmail, donorName, "기부", detail.toString());
        } else {
            log.warn("관리자(보호소) 이메일 없음 - 기부 신청 알림 미발송: shelterId={}, donor={}", shelter.getId(), donorName);
        }
    }

    private DonationRequestResponse toRequestResponse(DonationRequest r) {
        String shelterName = r.getShelter() != null ? r.getShelter().getName() : null;
        return DonationRequestResponse.builder()
                .id(r.getId())
                .shelterId(r.getShelter() != null ? r.getShelter().getId() : null)
                .shelterName(shelterName)
                .title(r.getTitle())
                .content(r.getContent())
                .itemCategory(r.getItemCategory())
                .targetQuantity(r.getTargetQuantity())
                .currentQuantity(r.getCurrentQuantity())
                .deadline(r.getDeadline())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private DonationResponse toDonationResponse(Donation d) {
        String shelterName = d.getShelter() != null ? d.getShelter().getName() : null;
        Long requestId = d.getRequest() != null ? d.getRequest().getId() : null;
        String requestTitle = d.getRequest() != null ? d.getRequest().getTitle() : null;
        return DonationResponse.builder()
                .id(d.getId())
                .requestId(requestId)
                .requestTitle(requestTitle)
                .userId(d.getUser() != null ? d.getUser().getId() : null)
                .shelterName(shelterName)
                .donorName(d.getDonorName())
                .donorPhone(d.getDonorPhone())
                .donorEmail(d.getDonorEmail())
                .itemName(d.getItemName())
                .quantity(d.getQuantity())
                .deliveryMethod(d.getDeliveryMethod())
                .trackingNumber(d.getTrackingNumber())
                .status(d.getStatus())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
