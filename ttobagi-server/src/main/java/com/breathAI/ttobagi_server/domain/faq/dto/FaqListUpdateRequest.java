package com.breathAI.ttobagi_server.domain.faq.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
// FAQ 수정 요청
public class FaqListUpdateRequest {

    @NotBlank(message = "질문은 필수 입력 값입니다.")
    private String question;

    @NotBlank(message = "답변은 필수 입력 값입니다.")
    private String answer;

    private List<String> keywords;
    
}