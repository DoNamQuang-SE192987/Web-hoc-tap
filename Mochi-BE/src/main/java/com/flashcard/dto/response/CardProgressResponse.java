package com.flashcard.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CardProgressResponse {
    private UUID cardId;
    private String front;
    private String back;
    private Integer interval;
    private Integer repetition;
    private BigDecimal easeFactor;
    private LocalDateTime nextReviewTime;
}
