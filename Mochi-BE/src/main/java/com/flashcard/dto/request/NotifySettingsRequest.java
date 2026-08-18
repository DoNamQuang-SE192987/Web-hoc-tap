package com.flashcard.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NotifySettingsRequest {

    @NotBlank(message = "Giờ nhắc nhở không được để trống")
    private String notifyTime; // Định dạng HH:mm

    @NotBlank(message = "Múi giờ không được để trống")
    private String timezone;
}
