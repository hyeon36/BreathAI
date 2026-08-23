package com.breathAI.ttobagi_server.domain.faq.repository;

import com.breathAI.ttobagi_server.domain.faq.entity.Faq;
import com.breathAI.ttobagi_server.domain.faq.entity.FaqCandidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.breathAI.ttobagi_server.domain.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query; 
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// 운영 FAQ 리포지토리
public interface FaqRepository extends JpaRepository<Faq, Long> {

    // 활성 FAQ 목록 페이징
    Page<Faq> findByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    // 단건 조회 (활성만)
    Optional<Faq> findByFaqIdAndIsActiveTrue(Long faqId);

    // 후보 기반 조회 (apply 중복 방지)
    Optional<Faq> findByCandidate(FaqCandidate candidate);

    // 키워드 검색
    Page<Faq> findByIsActiveTrueAndQuestionContaining(String keyword, Pageable pageable);

    // 회원 탈퇴 시 사용자 참조 해제
    @Modifying
    @Query("UPDATE Faq f SET f.createdBy = null WHERE f.createdBy = :user")
    void clearCreatedBy(@Param("user") User user);
}
