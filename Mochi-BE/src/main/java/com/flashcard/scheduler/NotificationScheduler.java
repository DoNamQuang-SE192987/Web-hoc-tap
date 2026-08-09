package com.flashcard.scheduler;

import com.flashcard.entity.CardProgress;
import com.flashcard.entity.User;
import com.flashcard.repository.CardProgressRepository;
import com.flashcard.repository.UserRepository;
import com.flashcard.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final UserRepository userRepository;
    private final CardProgressRepository cardProgressRepository;
    private final NotificationService notificationService;

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
                notificationService.sendReminderEmail(
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
                log.info("Đã gửi email Thời điểm vàng cho user {}", user.getEmail());
            }
        }

        // --- 2. Luồng nhắc nhở DAILY (theo notify_time) ---
        List<User> usersToNotify = userRepository.findUsersToNotify(hour, minute);

        if (usersToNotify.isEmpty()) {
            return;
        }

        // Gửi email cho từng user nếu họ có thẻ cần ôn
        for (User user : usersToNotify) {
            // Đếm số thẻ cần ôn
            int dueCardCount = cardProgressRepository.findDueCards(user.getId(), currentDateTime).size();

            if (dueCardCount > 0) {
                notificationService.sendReminderEmail(
                        user.getEmail(),
                        user.getDisplayName(),
                        dueCardCount,
                        user.getStreakCount()
                );
            }
        }
    }
}
