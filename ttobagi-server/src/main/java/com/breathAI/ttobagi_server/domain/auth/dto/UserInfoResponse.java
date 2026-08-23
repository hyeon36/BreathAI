package com.breathAI.ttobagi_server.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Builder;
import java.time.LocalDateTime;

// 회원 정보 조회 응답
@Getter
@Builder
public class UserInfoResponse {
    
    private Long userId;

    private String email;

    private String role;

    @JsonProperty("isActive")
    private boolean isActive;

    @JsonFormat(
        shape = JsonFormat.Shape.STRING,
        pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'",
        timezone = "UTC"
    )
    private LocalDateTime createdAt;

}
