package com.flashcard.controller;

import com.flashcard.dto.request.ReviewRequest;
import com.flashcard.dto.response.ApiResponse;
import com.flashcard.dto.response.CardProgressResponse;
import com.flashcard.service.SrsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final SrsService srsService;

    // API: GET /api/decks/due (Thay vì truyền deckId, ta lấy tất cả due cards của user cho dễ học, hoặc có thể tùy biến thêm param deckId)
    @GetMapping("/decks/due")
    public ResponseEntity<ApiResponse<List<CardProgressResponse>>> getDueCards(Authentication authentication) {
        String userEmail = authentication.getName();
        List<CardProgressResponse> dueCards = srsService.getDueCards(userEmail);
        return ResponseEntity.ok(ApiResponse.success(dueCards, "Lấy danh sách thẻ cần học thành công"));
    }

    // API: POST /api/review
    @PostMapping("/review")
    public ResponseEntity<ApiResponse<CardProgressResponse>> submitReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        CardProgressResponse response = srsService.processReview(userEmail, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật tiến trình học thành công"));
    }

    // API: GET /api/decks/learned
    @GetMapping("/decks/learned")
    public ResponseEntity<ApiResponse<List<CardProgressResponse>>> getLearnedCards(Authentication authentication) {
        String userEmail = authentication.getName();
        List<CardProgressResponse> learnedCards = srsService.getLearnedCards(userEmail);
        return ResponseEntity.ok(ApiResponse.success(learnedCards, "Lấy danh sách thẻ đã học thành công"));
    }
}
