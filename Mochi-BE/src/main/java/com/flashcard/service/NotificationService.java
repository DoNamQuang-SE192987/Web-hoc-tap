package com.flashcard.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;

    public void sendReminderEmail(String toEmail, String displayName, int dueCardCount, int streak) {
        if (dueCardCount == 0) return; // Không có thẻ cần học thì không gửi

        String subject = "📚 Tới giờ học rồi! " + dueCardCount + " thẻ đang chờ bạn";
        String body = String.format(
            "Chào %s,\n\n" +
            "Hôm nay bạn có %d thẻ Flashcard cần ôn tập để giữ vững trí nhớ.\n" +
            "Bạn đang có chuỗi học tập (streak) là %d ngày liên tiếp! Đừng làm đứt chuỗi nhé!\n\n" +
            "Truy cập ứng dụng ngay để hoàn thành bài ôn tập ngày hôm nay.\n\n" +
            "Thân mến,\n" +
            "Flashcard SRS Team",
            displayName != null ? displayName : "bạn",
            dueCardCount,
            streak
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom("noreply@flashcard-srs.com");

        try {
            mailSender.send(message);
            log.info("Đã gửi email nhắc nhở tới {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email tới {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendNotificationSettingsConfirmationEmail(String toEmail, String displayName, String notifyTime, String timezone) {
        String subject = "⏰ Cài đặt nhắc nhở học tập thành công!";
        String body = String.format(
            "Chào %s,\n\n" +
            "Bạn đã cài đặt mốc thời gian nhắc nhở học tập hàng ngày vào lúc %s (Múi giờ: %s) thành công.\n" +
            "Chúng tôi sẽ gửi email nhắc nhở học tập cho bạn vào khung giờ này mỗi ngày nếu bạn có thẻ cần ôn tập.\n\n" +
            "Chúc bạn học tập hiệu quả!\n" +
            "Flashcard SRS Team",
            displayName != null ? displayName : "bạn",
            notifyTime,
            timezone
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom("noreply@flashcard-srs.com");

        try {
            mailSender.send(message);
            log.info("Đã gửi email xác nhận cài đặt nhắc nhở tới {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email tới {}: {}", toEmail, e.getMessage());
        }
    }
}
