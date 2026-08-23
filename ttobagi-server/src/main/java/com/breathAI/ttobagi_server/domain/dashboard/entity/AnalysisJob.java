package com.breathAI.ttobagi_server.domain.dashboard.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.DynamicInsert;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 데이터 분석 작업 이력 및 상태
@Entity
@Getter
@DynamicInsert
@Table(
    name = "gold_analysis_job",
    comment = "데이터 분석 작업 이력 및 상태"
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnalysisJob {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "analysis_id")
    private Long analysisId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "upload_id", nullable = false, foreignKey = @ForeignKey(name = "fk_analysis_upload_id"))
    private UploadFile uploadFile;

    @Column(name = "status", nullable = false, length = 20, 
            columnDefinition = "VARCHAR(20) COMMENT 'PENDING, PREPROCESSING, ANALYZING, COMPLETED, FAIL'")
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "error_message", columnDefinition = "TEXT COMMENT '실패 시 에러 로그'")
    private String errorMessage;

    @Column(name = "started_at", columnDefinition = "DATETIME COMMENT '분석 시작 시각'")
    private LocalDateTime startedAt;

    @Column(name = "finished_at", columnDefinition = "DATETIME COMMENT '분석 종료 시각'")
    private LocalDateTime finishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @ColumnDefault("CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "period_start_date", columnDefinition = "DATE COMMENT '분석 대상 시작일'")
    private LocalDate periodStartDate;

    @Column(name = "period_end_date", columnDefinition = "DATE COMMENT '분석 대상 종료일'")
    private LocalDate periodEndDate;

    @Column(name = "file_name", nullable = false, length = 255, columnDefinition = "VARCHAR(255) COMMENT '업로드 당시 파일명 참조'")
    private String fileName;

    @Column(name = "is_masking_enabled")
    @ColumnDefault("0")
    private Boolean isMaskingEnabled;

    @Column(name = "is_translation_enabled")
    @ColumnDefault("0")
    private Boolean isTranslationEnabled;

    public enum Status {
        PENDING, PREPROCESSING, ANALYZING, COMPLETED, FAIL
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = Status.PENDING;
        if (this.isMaskingEnabled == null) this.isMaskingEnabled = false;
        if (this.isTranslationEnabled == null) this.isTranslationEnabled = false;
    }

    @Builder
    public AnalysisJob(UploadFile uploadFile, String fileName,
                       Boolean isMaskingEnabled, Boolean isTranslationEnabled,
                       LocalDate periodStartDate, LocalDate periodEndDate) {
        this.uploadFile = uploadFile;
        this.fileName = fileName;
        this.isMaskingEnabled = isMaskingEnabled != null ? isMaskingEnabled : false;
        this.isTranslationEnabled = isTranslationEnabled != null ? isTranslationEnabled : false;
        this.periodStartDate = periodStartDate;
        this.periodEndDate = periodEndDate;
        this.status = Status.PENDING;
    }

    // 전처리 단계 진입, 분석 시작 시각 기록
    public void startPreprocessing() {
        this.status = Status.PREPROCESSING;
        this.startedAt = LocalDateTime.now();
    }

    // AI 분석 단계 진입
    public void startAnalyzing() {
        this.status = Status.ANALYZING;
    }

    // 분석 완료 처리
    public void finish() {
        this.status = Status.COMPLETED;
        this.finishedAt = LocalDateTime.now();
    }

    // 분석 실패 처리, 사유 기록
    public void fail(String errorMessage) {
        this.status = Status.FAIL;
        this.errorMessage = errorMessage;
        this.finishedAt = LocalDateTime.now();
    }

}
