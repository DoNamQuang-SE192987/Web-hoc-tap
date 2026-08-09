package com.flashcard.service;

import com.flashcard.dto.request.ReviewRequest;
import com.flashcard.dto.response.CardProgressResponse;
import com.flashcard.entity.Card;
import com.flashcard.entity.CardProgress;
import com.flashcard.entity.User;
import com.flashcard.repository.CardProgressRepository;
import com.flashcard.repository.CardRepository;
import com.flashcard.repository.ReviewLogRepository;
import com.flashcard.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SrsServiceTest {

    @Mock
    private CardProgressRepository cardProgressRepository;
    @Mock
    private CardRepository cardRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ReviewLogRepository reviewLogRepository;

    @InjectMocks
    private SrsService srsService;

    private User mockUser;
    private Card mockCard;
    private ReviewRequest mockRequest;

    @BeforeEach
    void setUp() {
        mockUser = User.builder().id(UUID.randomUUID()).email("test@gmail.com").build();
        mockCard = Card.builder().id(UUID.randomUUID()).front("Hello").back("Xin chào").build();
        mockRequest = new ReviewRequest();
        mockRequest.setCardId(mockCard.getId());
    }

    @Test
    void processReview_quality1_shouldResetRepetition() {
        // Arrange
        mockRequest.setQuality(1); // Chọn quên hoàn toàn

        CardProgress progress = CardProgress.builder()
                .user(mockUser).card(mockCard)
                .interval(10).repetition(5).easeFactor(new BigDecimal("2.50"))
                .nextReviewTime(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(cardRepository.findById(any())).thenReturn(Optional.of(mockCard));
        when(cardProgressRepository.findByUserIdAndCardId(any(), any())).thenReturn(Optional.of(progress));

        // Act
        CardProgressResponse response = srsService.processReview("test@gmail.com", mockRequest);

        // Assert
        assertEquals(0, response.getRepetition()); // Repetition phải về 0
        assertEquals(0, response.getInterval()); // Interval phải về 0 (30 phút ôn tập lại)
        // Tính Ease Factor: 2.50 + 0.1 - (4 - 1) * 0.08 = 2.50 + 0.1 - 0.24 = 2.36
        assertEquals(new BigDecimal("2.36"), response.getEaseFactor());
        verify(reviewLogRepository, times(1)).save(any());
    }

    @Test
    void processReview_quality4_shouldIncreaseInterval() {
        // Arrange
        mockRequest.setQuality(4); // Nhớ hoàn hảo

        CardProgress progress = CardProgress.builder()
                .user(mockUser).card(mockCard)
                .interval(6).repetition(2).easeFactor(new BigDecimal("2.50"))
                .nextReviewTime(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(mockUser));
        when(cardRepository.findById(any())).thenReturn(Optional.of(mockCard));
        when(cardProgressRepository.findByUserIdAndCardId(any(), any())).thenReturn(Optional.of(progress));

        // Act
        CardProgressResponse response = srsService.processReview("test@gmail.com", mockRequest);

        // Assert
        assertEquals(3, response.getRepetition()); // Repetition tăng lên 3
        // Interval: 6 * 2.50 = 15
        assertEquals(15, response.getInterval()); 
        // Tính Ease Factor: 2.50 + 0.1 - (4 - 4) * 0.08 = 2.60
        assertEquals(new BigDecimal("2.60"), response.getEaseFactor());
    }
}
