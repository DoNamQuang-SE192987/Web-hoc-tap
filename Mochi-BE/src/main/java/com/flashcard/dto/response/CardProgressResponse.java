package com.flashcard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardProgressResponse {
    private UUID cardId;
    private UUID deckId;
    private String front;
    private String back;
    private String exampleSentence;
    private String pronunciation;
    private String synonyms;
    private String imageUrl;
    private Integer interval;
    private Integer repetition;
    private BigDecimal easeFactor;
    private LocalDateTime nextReviewTime;
}
