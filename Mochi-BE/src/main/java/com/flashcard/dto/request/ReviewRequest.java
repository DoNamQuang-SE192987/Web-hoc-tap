package com.flashcard.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ReviewRequest {

    @NotNull(message = "Card ID không được để trống")
    private UUID cardId;

    @NotNull(message = "Quality không được để trống")
    @Min(value = 1, message = "Quality tối thiểu là 1")
    @Max(value = 4, message = "Quality tối đa là 4")
    private Integer quality;
}
