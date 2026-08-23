package com.breathAI.ttobagi_server.global.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

// AI 서버 호출 담당 유틸
@Slf4j
@Component
@RequiredArgsConstructor
public class WebClientUtil {

    private final WebClient webClient;

    // 업로드 파일을 AI 서버로 전달하여 분석 파이프라인 시작
    // 결과는 응답이 아닌 별도 콜백으로 수신
    @Async
    public void sendPipeline(
            String uploadId,
            Long analysisId,
            MultipartFile file,
            Boolean isMaskingEnabled,
            Boolean isTranslationEnabled,
            String periodStartDate,
            String periodEndDate) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("uploadId", uploadId);
            body.add("analysisId", analysisId.toString());
            body.add("isMaskingEnabled", isMaskingEnabled != null ? isMaskingEnabled.toString() : "true");
            body.add("isTranslationEnabled", isTranslationEnabled != null ? isTranslationEnabled.toString() : "false");
            body.add("periodStartDate", periodStartDate != null ? periodStartDate : "");
            body.add("periodEndDate", periodEndDate != null ? periodEndDate : "");
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });

            webClient.post()
                    .uri("/pipeline")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .doOnError(e -> log.error("AI 서버 파이프라인 요청 실패 uploadId: {}", uploadId, e))
                    .subscribe();

        } catch (Exception e) {
            log.error("AI 서버 파이프라인 요청 실패 uploadId: {}", uploadId, e);
            throw new RuntimeException("AI 서버 파이프라인 요청 실패", e);
        }
    }
}
