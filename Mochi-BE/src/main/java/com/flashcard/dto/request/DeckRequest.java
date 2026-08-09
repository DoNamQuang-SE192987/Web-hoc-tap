package com.flashcard.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeckRequest {

    @NotBlank(message = "Tên bộ thẻ không được để trống")
    private String name;

    private String description;

    private String language;

    private Boolean isPublic = false;

    private String imageUrl;
}
