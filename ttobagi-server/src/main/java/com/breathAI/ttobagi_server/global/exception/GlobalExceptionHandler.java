package com.breathAI.ttobagi_server.global.exception;

import com.breathAI.ttobagi_server.global.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;

import java.util.HashMap;
import java.util.Map;

// 컨트롤러 예외를 공통 응답 포맷으로 변환하는 전역 핸들러
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 의도적으로 던진 비즈니스 예외 처리
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handlerCustomException(CustomException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        log.warn("CustomException: {}", errorCode.getMessage());
        // SSE처럼 JSON이 아닌 응답을 요청한 경우에도 오류는 JSON으로 내려준다
        return ResponseEntity
                .status(errorCode.getStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(ApiResponse.error(errorCode));
    }

    // @Valid 검증 실패 처리 (필드별 사유 반환)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.warn("Validation failed: {}", errors);

        return ResponseEntity.badRequest()
                    .body(new ApiResponse<> (false, "입력값 검증에 실패했습니다.", errors, 400));
    }

    // 본문 파싱 실패 처리 (잘못된 JSON, 깨진 인코딩 등)
    // 클라이언트 요청 오류이므로 500이 아닌 400으로 응답한다
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadableException(HttpMessageNotReadableException ex) {
        log.warn("요청 본문 파싱 실패: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("요청 본문을 읽을 수 없습니다.", 400));
    }

    // SSE 연결이 제한 시간에 도달해 끝나는 것은 정상 동작이므로 오류로 기록하지 않는다
    // 응답이 이미 이벤트 스트림으로 전송 중이라 본문은 쓰지 않는다
    @ExceptionHandler(AsyncRequestTimeoutException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public void handleAsyncRequestTimeout() {
        log.debug("비동기 요청이 제한 시간에 도달해 종료되었습니다.");
    }

    // 미처리 예외의 최후 방어선 (내부 정보 비노출)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenereicException(Exception ex) {
        log.error("Unexpected error occurred: ", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("서버 내부 오류가 발생했습니다.", 500));
    }
}
