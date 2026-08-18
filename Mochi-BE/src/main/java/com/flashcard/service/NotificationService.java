package com.flashcard.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@flashcard-srs.com}")
    private String fromEmail;

    public NotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendGoldenTimeReminderEmail(String toEmail, String displayName, int cardCount, int streak) {
        if (cardCount == 0) return;

        String subject = "⏰ [Thời điểm vàng 30 phút] Đã đến lúc ôn lại từ vựng bạn vừa học!";
        String body = String.format(
            "Chào %s,\n\n" +
            "Đã 30 phút trôi qua kể từ khi bạn hoàn thành bài học từ mới.\n" +
            "Theo nghiên cứu khoa học về đường cong quên lãng (Spaced Repetition), đây chính là THỜI ĐIỂM VÀNG lý tưởng nhất để não bộ ghi nhớ sâu những từ vựng bạn vừa nạp!\n\n" +
            "📌 Số thẻ cần ôn ngay: %d từ\n" +
            "🔥 Chuỗi streak của bạn: %d ngày\n\n" +
            "Hãy mở CornMilk và dành 2-3 phút ôn tập ngay để không bị quên nhé: http://localhost:3000/review\n\n" +
            "Chúc bạn học tập thật tốt!\n" +
            "Đội ngũ CornMilk",
            displayName != null ? displayName : "bạn",
            cardCount,
            streak
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom(fromEmail);

        try {
            mailSender.send(message);
            log.info("Đã gửi email Thời điểm vàng tới {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email Thời điểm vàng tới {}: {}", toEmail, e.getMessage(), e);
        }
    }

    public void sendReminderEmail(String toEmail, String displayName, int dueCardCount, int streak) {
        if (dueCardCount == 0) return; // Không có thẻ cần học thì không gửi

        String subject = "📚 Tới giờ học rồi! " + dueCardCount + " thẻ đang chờ bạn";
        String body = String.format(
            "Chào %s,\n\n" +
            "Hôm nay bạn có %d thẻ Flashcard cần ôn tập để giữ vững trí nhớ.\n" +
            "Bạn đang có chuỗi học tập (streak) là %d ngày liên tiếp! Đừng làm đứt chuỗi nhé!\n\n" +
            "Truy cập ứng dụng ngay để hoàn thành bài ôn tập ngày hôm nay: http://localhost:3000/review\n\n" +
            "Thân mến,\n" +
            "Đội ngũ CornMilk",
            displayName != null ? displayName : "bạn",
            dueCardCount,
            streak
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom(fromEmail);

        try {
            mailSender.send(message);
            log.info("Đã gửi email nhắc nhở tới {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email tới {}: {}", toEmail, e.getMessage(), e);
        }
    }

    public void sendNotificationSettingsConfirmationEmail(String toEmail, String displayName, String notifyTime, String timezone) {
        String subject = "⏰ Cài đặt nhắc nhở học tập thành công!";
        String body = String.format(
            "Chào %s,\n\n" +
            "Bạn đã cài đặt mốc thời gian nhắc nhở học tập hàng ngày vào lúc %s (Múi giờ: %s) thành công.\n" +
            "Chúng tôi sẽ gửi email nhắc nhở học tập cho bạn vào khung giờ này mỗi ngày nếu bạn có thẻ cần ôn tập.\n\n" +
            "Chúc bạn học tập hiệu quả!\n" +
            "Đội ngũ CornMilk",
            displayName != null ? displayName : "bạn",
            notifyTime,
            timezone != null ? timezone : "Asia/Ho_Chi_Minh"
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom(fromEmail);

        try {
            mailSender.send(message);
            log.info("Đã gửi email xác nhận cài đặt nhắc nhở tới {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email tới {}: {}", toEmail, e.getMessage(), e);
        }
    }
}
