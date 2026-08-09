package com.flashcard.controller;

import com.flashcard.dto.request.CardRequest;
import com.flashcard.dto.response.ApiResponse;
import com.flashcard.dto.response.CardResponse;
import com.flashcard.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/decks/{deckId}/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CardResponse>> createCard(
            @PathVariable UUID deckId,
            @Valid @RequestBody CardRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        CardResponse response = cardService.createCard(deckId, userEmail, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Thêm thẻ mới thành công"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CardResponse>>> getCardsByDeckId(
            @PathVariable UUID deckId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        List<CardResponse> responses = cardService.getCardsByDeckId(deckId, userEmail);
        return ResponseEntity.ok(ApiResponse.success(responses, "Lấy danh sách thẻ thành công"));
    }
}
