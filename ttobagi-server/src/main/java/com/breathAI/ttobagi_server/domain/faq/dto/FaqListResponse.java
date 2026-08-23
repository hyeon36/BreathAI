package com.breathAI.ttobagi_server.domain.faq.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
// FAQ 목록 조회 응답, 페이징 정보 포함
public class FaqListResponse {

    private long totalCount;
    private List<FaqItem> faqList;
    private int totalPages;
    private int currentPage;
    private int size;

    @Getter
    @Builder
    // FAQ 단건
    public static class FaqItem {
        private Long faqId;
        private String question;
        private String answer;
        private List<String> keywords;

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        private LocalDate createdAt;

    }
}