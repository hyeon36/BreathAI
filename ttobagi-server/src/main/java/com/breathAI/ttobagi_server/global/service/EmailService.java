package com.breathAI.ttobagi_server.global.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

// 메일 발송 서비스 (비밀번호 재설정 안내 전용)
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender emailSender;

    // 발신자 주소 (Gmail 사용 시 앱 비밀번호 필요)
    @Value("${spring.mail.username:noreply@ttobagi.com}")
    private String fromEmail;

    // 재설정 토큰 안내 메일 발송 (유효기간 30분)
    public void sendPasswordResetEmail(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("[또바기] 비밀번호 재설정 안내입니다.");
        
        String content = String.format(
            "안녕하세요, 또바기 서비스입니다.\n\n" +
            "비밀번호 재설정을 위해 아래의 인증 토큰을 입력해 주세요.\n" +
            "토큰: %s\n\n" +
            "이 토큰은 30분 동안만 유효합니다.", 
            token
        );
        
        message.setText(content);

        emailSender.send(message);
    }
}
