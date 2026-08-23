package com.breathAI.ttobagi_server.domain.faq.repository;

import com.breathAI.ttobagi_server.domain.faq.entity.FaqEditHistory;
import com.breathAI.ttobagi_server.domain.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query; 
import org.springframework.data.repository.query.Param;

import java.util.List;

// FAQ 수정 이력 리포지토리
public interface FaqEditHistoryRepository extends JpaRepository<FaqEditHistory, Long> {

    // FAQ 단위 수정 이력 조회
    List<FaqEditHistory> findByFaq_FaqId(Long faqId);
    // FAQ 단위 수정 이력 최신순 조회
    List<FaqEditHistory> findByFaq_FaqIdOrderByCreatedAtDesc(Long faqId);

    // 분석 단위 수정 이력 조회
    List<FaqEditHistory> findByAnalysisJobAnalysisId(Long analysisId);
    // 수정자 기준 이력 조회
    List<FaqEditHistory> findByEditedBy_UserId(Long userId);
    // 분석 및 수정자 복합 조회
    List<FaqEditHistory> findByAnalysisJob_AnalysisIdAndEditedBy_UserId(Long analysisId, Long userId);

    // 회원 탈퇴 시 사용자 참조 해제
    @Modifying
    @Query("UPDATE FaqEditHistory f SET f.editedBy = null WHERE f.editedBy = :user")
    void clearEditedBy(@Param("user") User user);
}