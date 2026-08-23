package com.breathAI.ttobagi_server.domain.faq.entity;

import com.breathAI.ttobagi_server.domain.auth.entity.User;
import com.breathAI.ttobagi_server.domain.dashboard.entity.AnalysisJob;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

// 운영 FAQ 수정 이력
@Entity
@Getter
@Table(name = "gold_faq_edit_history", comment = "현행 FAQ 직접 수정 이력")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FaqEditHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faq_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_edit_history_faq_id"))
    private Faq faq;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", foreignKey = @ForeignKey(name = "fk_edit_history_analysis_id"),
                columnDefinition = "BIGINT COMMENT '연관 분석 ID (수동 수정 시 NULL 가능)'")
    private AnalysisJob analysisJob;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "edited_by", foreignKey = @ForeignKey(name = "fk_edit_history_user_id"),
                columnDefinition = "BIGINT COMMENT '수정한 관리자 ID (탈퇴 시 NULL)'")
    private User editedBy;

    @Column(name = "before_question", columnDefinition = "TEXT COMMENT '수정 전 질문'")
    private String beforeQuestion;

    @Column(name = "before_answer", columnDefinition = "LONGTEXT COMMENT '수정 전 답변'")
    private String beforeAnswer;

    @Column(name = "after_question", columnDefinition = "TEXT COMMENT '수정 후 질문'")
    private String afterQuestion;

    @Column(name = "after_answer", columnDefinition = "LONGTEXT COMMENT '수정 후 답변'")
    private String afterAnswer;

    @Column(name = "edit_reason", columnDefinition = "TEXT COMMENT '수정 사유'")
    private String editReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @ColumnDefault("CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @Builder
    public FaqEditHistory(Faq faq, AnalysisJob analysisJob,
                        User editedBy, String beforeQuestion, String beforeAnswer,
                        String afterQuestion, String afterAnswer, String editReason) {
        this.faq = faq;
        this.analysisJob = analysisJob;
        this.editedBy = editedBy;
        this.beforeQuestion = beforeQuestion;
        this.beforeAnswer = beforeAnswer;
        this.afterQuestion = afterQuestion;
        this.afterAnswer = afterAnswer;
        this.editReason = editReason;
    }

}
