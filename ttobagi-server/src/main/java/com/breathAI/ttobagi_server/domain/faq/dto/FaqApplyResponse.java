package com.breathAI.ttobagi_server.domain.faq.dto;

import lombok.*;
import jakarta.validation.constraints.NotNull;


@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// FAQ 후보 반영 결과, 생성된 FAQ ID 반환
public class FaqApplyResponse {
    @NotNull
    private Long appliedFaqId;
}