package com.breathAI.ttobagi_server.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 비밀번호 재설정 확인 요청, 메일로 받은 토큰과 새 비밀번호 전달
@Getter
@NoArgsConstructor
public class PasswordResetConfirmRequest {
    
    @NotBlank(message = "인증 토큰은 필수입니다.")
    private String token;

    @NotBlank(message = "새 비밀번호는 필수 입력 값입니다.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[a-z\\d@$!%*?&]{6,20}$",
        message = "비밀번호 형식이 올바르지 않습니다."
    )
    private String newPassword;
    
}
