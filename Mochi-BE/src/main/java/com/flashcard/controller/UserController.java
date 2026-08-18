package com.flashcard.controller;

import com.flashcard.dto.request.NotifySettingsRequest;
import com.flashcard.dto.response.ApiResponse;
import com.flashcard.dto.response.UserProfileResponse;
import com.flashcard.entity.Role;
import com.flashcard.entity.User;
import com.flashcard.exception.ResourceNotFoundException;
import com.flashcard.repository.UserRepository;
import com.flashcard.service.NotificationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public UserController(UserRepository userRepository, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng"));

        UserProfileResponse response = UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .role(user.getRole() != null ? user.getRole().name() : Role.ROLE_USER.name())
                .notifyTime(user.getNotifyTime())
                .timezone(user.getTimezone())
                .streakCount(user.getStreakCount())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin người dùng thành công"));
    }

    @PutMapping("/notify-settings")
    public ResponseEntity<ApiResponse<Object>> updateNotifySettings(
            @Valid @RequestBody NotifySettingsRequest request,
            Authentication authentication) {
        
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        try {
            // Parse time flexibly (cho phép định dạng "8:30" hoặc "08:30")
            String notifyTimeStr = request.getNotifyTime().trim();
            String[] parts = notifyTimeStr.split(":");
            if (parts.length != 2) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Định dạng giờ không hợp lệ, vui lòng dùng định dạng HH:mm (ví dụ: 08:30)"));
            }
            int hour = Integer.parseInt(parts[0].trim());
            int minute = Integer.parseInt(parts[1].trim());
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Giờ phải từ 00 đến 23, phút phải từ 00 đến 59"));
            }

            LocalTime time = LocalTime.of(hour, minute);
            user.setNotifyTime(time);
            user.setTimezone(request.getTimezone());
            
            userRepository.save(user);

            // Gửi email thông báo xác nhận cài đặt trực tiếp
            try {
                notificationService.sendNotificationSettingsConfirmationEmail(
                        user.getEmail(),
                        user.getDisplayName(),
                        String.format("%02d:%02d", hour, minute),
                        request.getTimezone()
                );
            } catch (Exception mailEx) {
                log.warn("Không thể gửi email xác nhận cho user {}: {}", user.getEmail(), mailEx.getMessage());
            }

            return ResponseEntity.ok(ApiResponse.success(null, "Cài đặt nhắc nhở thành công"));
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật cài đặt nhắc nhở: ", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi khi cập nhật cài đặt: " + e.getMessage()));
        }
    }
}
