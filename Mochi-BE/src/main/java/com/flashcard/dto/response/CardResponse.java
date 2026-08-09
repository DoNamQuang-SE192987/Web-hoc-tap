package com.flashcard.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CardResponse {
    private UUID id;
    private UUID deckId;
    private String front;
    private String back;
    private String exampleSentence;
    private String pronunciation;
    private String imageUrl;
    private LocalDateTime createdAt;
}
