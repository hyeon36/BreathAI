package com.breathAI.ttobagi_server.domain.faq.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// FAQ 수정 이력 조회 응답
public class FaqEditHistoryResponse {
    private Long faqId;
    private List<HistoryItem> histories;

    @Getter
    @Builder
    // 수정 이력 단건
    public static class HistoryItem {
        private Long historyId;
        private Long analysisId;
        private String beforeQuestion;
        private String beforeAnswer;
        private String afterQuestion;
        private String afterAnswer;
        private String editReason;
        private String editedBy;

        @JsonFormat(
            shape = JsonFormat.Shape.STRING,
            pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'",
            timezone = "UTC"
        )
        private LocalDateTime createdAt;
    }
}