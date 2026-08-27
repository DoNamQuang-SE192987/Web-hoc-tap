package com.flashcard.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CardRequest {

    @NotBlank(message = "Mặt trước của thẻ không được để trống")
    private String front;

    @NotBlank(message = "Mặt sau của thẻ không được để trống")
    private String back;

    private String exampleSentence;

    private String pronunciation;

    private String synonyms;

    private String imageUrl;
}
