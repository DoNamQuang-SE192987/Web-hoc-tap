package com.flashcard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Base format chuẩn cho mọi response trả về cho Client.
 * Thống nhất format này giúp Frontend (như Next.js) dễ dàng parse data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;
    
    @Builder.Default
    private String timestamp = LocalDateTime.now().toString();

    // Utility method để trả về Success Response nhanh chóng
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .build();
    }

    // Utility method để trả về Error Response
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .data(null)
                .message(message)
                .build();
    }
}
