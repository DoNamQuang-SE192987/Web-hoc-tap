package com.flashcard.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DeckResponse {
    private UUID id;
    private String name;
    private String description;
    private String language;
    private Boolean isPublic;
    private Integer cardCount;
    private String imageUrl;
    private LocalDateTime createdAt;
}
