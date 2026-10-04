package com.breathAI.ttobagi_server.domain.faq.repository;

import com.breathAI.ttobagi_server.domain.faq.entity.FaqVersionItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;

// 버전별 FAQ 사본 리포지토리
public interface FaqVersionItemRepository extends JpaRepository<FaqVersionItem, Long> {

    // 현재 활성 FAQ 전체를 해당 버전의 사본으로 적재
    @Modifying
    @Query(value = "INSERT INTO gold_faq_version_item "
            + "(version_id, faq_id, q_type, category, question, answer, keywords, faq_created_at) "
            + "SELECT :versionId, f.faq_id, f.q_type, f.category, f.question, f.answer, f.keywords, f.created_at "
            + "FROM gold_faq f WHERE f.is_active = 1",
            nativeQuery = true)
    int snapshotActiveFaqs(@Param("versionId") Long versionId);

    // 버전의 FAQ 목록 검색, 조건의 의미는 운영 FAQ 검색과 같다
    @Query("SELECT i FROM FaqVersionItem i WHERE i.version.versionId = :versionId "
            + "AND (:filterByQType = false OR i.qType IN :qTypes) "
            + "AND (:keyword IS NULL "
            + "     OR i.question LIKE CONCAT('%', :keyword, '%') "
            + "     OR i.answer LIKE CONCAT('%', :keyword, '%') "
            + "     OR i.keywords LIKE CONCAT('%', :keyword, '%'))")
    Page<FaqVersionItem> search(@Param("versionId") Long versionId,
                                @Param("filterByQType") boolean filterByQType,
                                @Param("qTypes") Collection<Integer> qTypes,
                                @Param("keyword") String keyword,
                                Pageable pageable);

    long countByVersion_VersionId(Long versionId);
}
