package com.flashcard.controller;

import com.flashcard.dto.request.DeckRequest;
import com.flashcard.dto.response.ApiResponse;
import com.flashcard.dto.response.DeckResponse;
import com.flashcard.service.DeckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;

    @PostMapping
    public ResponseEntity<ApiResponse<DeckResponse>> createDeck(
            @Valid @RequestBody DeckRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        DeckResponse response = deckService.createDeck(userEmail, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tạo bộ thẻ thành công"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DeckResponse>>> getUserDecks(Authentication authentication) {
        String userEmail = authentication.getName();
        List<DeckResponse> responses = deckService.getUserDecks(userEmail);
        return ResponseEntity.ok(ApiResponse.success(responses, "Lấy danh sách bộ thẻ thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeckResponse>> getDeckById(
            @PathVariable UUID id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        DeckResponse response = deckService.getDeckById(id, userEmail);
        return ResponseEntity.ok(ApiResponse.success(response, "Thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteDeck(
            @PathVariable UUID id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        deckService.deleteDeck(id, userEmail);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa bộ thẻ thành công"));
    }
}
