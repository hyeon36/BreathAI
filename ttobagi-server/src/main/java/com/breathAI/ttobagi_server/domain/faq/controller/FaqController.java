package com.breathAI.ttobagi_server.domain.faq.controller;

import com.breathAI.ttobagi_server.domain.faq.dto.*;
import com.breathAI.ttobagi_server.domain.faq.service.FaqService;
import com.breathAI.ttobagi_server.global.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// FAQ 조회 및 관리 API
// 조회는 전체 사용자, 생성·수정·삭제는 관리자로 제한
@RestController
@RequestMapping("/api/v1/faq")
@RequiredArgsConstructor
public class FaqController {

    private final FaqService faqService;

    // FAQ 목록 조회
    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<FaqListResponse>> getFaqList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(faqService.getFaqList(page, size)));
    }

    // FAQ 단건 상세 조회
    @GetMapping("/{faqId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<FaqDetailResponse>> getFaqDetail(
            @PathVariable Long faqId) {
        return ResponseEntity.ok(ApiResponse.success(faqService.getFaqDetail(faqId), "FAQ를 성공적으로 조회했습니다."));
    }

    // FAQ 수정, 전달된 필드만 반영
    @PatchMapping("/{faqId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FaqListUpdateResponse>> updateFaq(
            @PathVariable Long faqId,
            @RequestBody @Valid FaqListUpdateRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(faqService.updateFaq(faqId, request, email), "FAQ가 성공적으로 수정되었습니다."));
    }

    // FAQ 삭제, 비활성 처리
    @DeleteMapping("/{faqId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteFaq(@PathVariable Long faqId) {
        faqService.deleteFaq(faqId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // FAQ 수정 이력 조회
    @GetMapping("/history/{faqId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<FaqEditHistoryResponse>> getFaqHistory(
            @PathVariable Long faqId) {
        return ResponseEntity.ok(ApiResponse.success(faqService.getFaqHistory(faqId), "FAQ 수정 이력을 성공적으로 조회했습니다."));
    }

    // 분석 결과 기반 FAQ 후보 추천 목록 조회
    @GetMapping("/recommendations/{analysisId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<FaqCandidateListResponse>> getFaqRecommendations(
            @PathVariable Long analysisId) {
        return ResponseEntity.ok(ApiResponse.success(faqService.getFaqRecommendations(analysisId), "추천 FAQ 리스트를 성공적으로 조회했습니다."));
    }

    // FAQ 후보를 운영 FAQ로 반영
    @PostMapping("/apply")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FaqApplyResponse>> applyFaqCandidate(
            @RequestBody @Valid FaqApplyRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(faqService.applyFaqCandidate(request, email), "신규 FAQ가 성공적으로 반영되었습니다."));
    }
}
