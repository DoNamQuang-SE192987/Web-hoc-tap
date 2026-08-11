package com.flashcard.controller;

import com.flashcard.dto.request.NotifySettingsRequest;
import com.flashcard.dto.response.ApiResponse;
import com.flashcard.entity.User;
import com.flashcard.exception.ResourceNotFoundException;
import com.flashcard.repository.UserRepository;
import com.flashcard.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @PutMapping("/notify-settings")
    public ResponseEntity<ApiResponse<Object>> updateNotifySettings(
            @Valid @RequestBody NotifySettingsRequest request,
            Authentication authentication) {
        
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        try {
            // Parse time from HH:mm format
            LocalTime time = LocalTime.parse(request.getNotifyTime(), DateTimeFormatter.ofPattern("HH:mm"));
            user.setNotifyTime(time);
            user.setTimezone(request.getTimezone());
            
            userRepository.save(user);

            // Gửi email thông báo xác nhận cài đặt trực tiếp
            notificationService.sendNotificationSettingsConfirmationEmail(
                    user.getEmail(),
                    user.getDisplayName(),
                    request.getNotifyTime(),
                    request.getTimezone()
            );

            return ResponseEntity.ok(ApiResponse.success(null, "Cài đặt nhắc nhở và gửi email thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Định dạng giờ không hợp lệ hoặc lỗi gửi email: " + e.getMessage()));
        }
    }
}
