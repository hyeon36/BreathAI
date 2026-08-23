package com.breathAI.ttobagi_server.global.util;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// 분석 진행 상태 실시간 전송을 위한 SSE 연결 관리자
// 제약: 연결을 메모리에 보관하므로 다중 인스턴스 환경에서 알림 유실 가능
@Component
public class SseEmitterManager {

    // analysisId 기준 구독 중인 연결 목록
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    // SSE 연결 생성 및 보관, 타임아웃 30분
    public SseEmitter create(Long analysisId) {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
        emitters.put(analysisId, emitter);
        emitter.onCompletion(() -> emitters.remove(analysisId));
        emitter.onTimeout(() -> emitters.remove(analysisId));
        return emitter;
    }

    // 클라이언트에 상태 변경 전송
    public void send(Long analysisId, String status, String message) {
        SseEmitter emitter = emitters.get(analysisId);
        if (emitter == null) return;
        try {
            emitter.send(SseEmitter.event()
                    .name("status")
                    .data("{\"status\":\"" + status + "\",\"message\":\"" + message + "\"}"));
            if ("COMPLETED".equals(status) || "FAIL".equals(status)) {
                emitter.complete();
            }
        } catch (Exception e) {
            emitters.remove(analysisId);
        }
    }
}
