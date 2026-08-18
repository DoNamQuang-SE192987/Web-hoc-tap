package com.flashcard.scheduler;

import com.flashcard.entity.CardProgress;
import com.flashcard.entity.User;
import com.flashcard.repository.CardProgressRepository;
import com.flashcard.repository.UserRepository;
import com.flashcard.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final UserRepository userRepository;
    private final CardProgressRepository cardProgressRepository;
    private final NotificationService notificationService;

    public NotificationScheduler(UserRepository userRepository, CardProgressRepository cardProgressRepository, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.cardProgressRepository = cardProgressRepository;
        this.notificationService = notificationService;
    }

    // Chạy mỗi phút 1 lần ở giây thứ 0 (0 * * * * *)
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void scheduleEmailReminders() {
        LocalTime now = LocalTime.now();
        int hour = now.getHour();
        int minute = now.getMinute();

        log.info("Bắt đầu quét gửi email nhắc nhở lúc {}:{}", hour, minute);

        LocalDateTime currentDateTime = LocalDateTime.now();

        // --- 1. Luồng nhắc nhở THỜI ĐIỂM VÀNG (30 phút) ---
        List<CardProgress> goldenCards = cardProgressRepository.findGoldenTimeDueCards(currentDateTime);
        
        if (!goldenCards.isEmpty()) {
            // Nhóm thẻ theo User
            Map<User, List<CardProgress>> cardsByUser = goldenCards.stream()
                    .collect(Collectors.groupingBy(CardProgress::getUser));
            
            for (Map.Entry<User, List<CardProgress>> entry : cardsByUser.entrySet()) {
                User user = entry.getKey();
                List<CardProgress> userCards = entry.getValue();
                
                // Gửi email thời điểm vàng
                notificationService.sendGoldenTimeReminderEmail(
                        user.getEmail(),
                        user.getDisplayName(),
                        userCards.size(),
                        user.getStreakCount()
                );
                
                // Đánh dấu là đã gửi để không bị gửi lại ở phút tiếp theo
                for (CardProgress cp : userCards) {
                    cp.setReminded(true);
                }
                cardProgressRepository.saveAll(userCards);
                log.info("Đã gửi email Thời điểm vàng 30 phút cho user {}", user.getEmail());
            }
        }

        // --- 2. Luồng nhắc nhở DAILY (theo notify_time và timezone của user) ---
        List<User> usersWithNotify = userRepository.findAllWithNotifyTime();

        for (User user : usersWithNotify) {
            LocalTime userNotifyTime = user.getNotifyTime();
            if (userNotifyTime == null) continue;

            // Xác định múi giờ của user (mặc định Asia/Ho_Chi_Minh nếu không có)
            java.time.ZoneId userZone;
            try {
                userZone = (user.getTimezone() != null && !user.getTimezone().isBlank())
                        ? java.time.ZoneId.of(user.getTimezone())
                        : java.time.ZoneId.of("Asia/Ho_Chi_Minh");
            } catch (Exception e) {
                userZone = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
            }

            LocalTime userCurrentTime = LocalTime.now(userZone);
            if (userCurrentTime.getHour() == userNotifyTime.getHour() && userCurrentTime.getMinute() == userNotifyTime.getMinute()) {
                // Đếm số thẻ cần ôn
                int dueCardCount = cardProgressRepository.findDueCards(user.getId(), currentDateTime).size();

                if (dueCardCount > 0) {
                    notificationService.sendReminderEmail(
                            user.getEmail(),
                            user.getDisplayName(),
                            dueCardCount,
                            user.getStreakCount()
                    );
                    log.info("Đã gửi email nhắc nhở hàng ngày cho user {} (lúc {}:{})", user.getEmail(), userCurrentTime.getHour(), userCurrentTime.getMinute());
                }
            }
        }
    }
}
