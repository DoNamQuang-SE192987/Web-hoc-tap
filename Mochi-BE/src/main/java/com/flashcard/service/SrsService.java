package com.flashcard.service;

import com.flashcard.dto.request.ReviewRequest;
import com.flashcard.dto.response.CardProgressResponse;
import com.flashcard.entity.Card;
import com.flashcard.entity.CardProgress;
import com.flashcard.entity.ReviewLog;
import com.flashcard.entity.User;
import com.flashcard.exception.ResourceNotFoundException;
import com.flashcard.repository.CardProgressRepository;
import com.flashcard.repository.CardRepository;
import com.flashcard.repository.ReviewLogRepository;
import com.flashcard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SrsService {

    private final CardProgressRepository cardProgressRepository;
    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final ReviewLogRepository reviewLogRepository;

    public SrsService(CardProgressRepository cardProgressRepository,
                      CardRepository cardRepository,
                      UserRepository userRepository,
                      ReviewLogRepository reviewLogRepository) {
        this.cardProgressRepository = cardProgressRepository;
        this.cardRepository = cardRepository;
        this.userRepository = userRepository;
        this.reviewLogRepository = reviewLogRepository;
    }

    public List<CardProgressResponse> getDueCards(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        LocalDateTime now = LocalDateTime.now();
        List<CardProgress> dueCards = cardProgressRepository.findDueCards(user.getId(), now);

        return dueCards.stream().map(cp -> CardProgressResponse.builder()
                .cardId(cp.getCard().getId())
                .deckId(cp.getCard().getDeck().getId())
                .front(cp.getCard().getFront())
                .back(cp.getCard().getBack())
                .exampleSentence(cp.getCard().getExampleSentence())
                .pronunciation(cp.getCard().getPronunciation())
                .imageUrl(cp.getCard().getImageUrl())
                .interval(cp.getInterval())
                .repetition(cp.getRepetition())
                .easeFactor(cp.getEaseFactor())
                .nextReviewTime(cp.getNextReviewTime())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public CardProgressResponse processReview(String userEmail, ReviewRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Card card = cardRepository.findById(request.getCardId())
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        // Lấy progress hiện tại, nếu chưa có thì tạo mới
        CardProgress progress = cardProgressRepository.findByUserIdAndCardId(user.getId(), card.getId())
                .orElseGet(() -> CardProgress.builder()
                        .user(user)
                        .card(card)
                        .interval(0)
                        .repetition(0)
                        .easeFactor(new BigDecimal("2.50"))
                        .nextReviewTime(LocalDateTime.now())
                        .totalReviews(0)
                        .reminded(false)
                        .build());

        int quality = request.getQuality();
        int intervalBefore = progress.getInterval();

        // 1. Cập nhật Repetition và Interval
        if (quality < 2) {
            progress.setRepetition(0);
            progress.setInterval(0); // 0 tương đương với thời điểm vàng 30 phút
        } else {
            if (progress.getRepetition() == 0) {
                progress.setInterval(0); // Vừa học xong lần đầu -> Hẹn 30 phút sau ôn lại (Thời điểm vàng)
            } else if (progress.getRepetition() == 1) {
                progress.setInterval(1); // Ôn lại mốc 30 phút thành công -> Hẹn 1 ngày sau
            } else if (progress.getRepetition() == 2) {
                progress.setInterval(6); // Ôn lại mốc 1 ngày thành công -> Hẹn 6 ngày sau
            } else {
                // interval = round(interval * easeFactor)
                BigDecimal newInterval = BigDecimal.valueOf(progress.getInterval())
                        .multiply(progress.getEaseFactor());
                progress.setInterval(newInterval.setScale(0, RoundingMode.HALF_UP).intValue());
            }
            progress.setRepetition(progress.getRepetition() + 1);
        }

        // 2. Cập nhật EaseFactor: easeFactor = easeFactor + 0.1 - (4 - quality) * 0.08
        BigDecimal penalty = BigDecimal.valueOf((4 - quality) * 0.08);
        BigDecimal newEaseFactor = progress.getEaseFactor()
                .add(new BigDecimal("0.1"))
                .subtract(penalty);

        // easeFactor = max(1.3, easeFactor)
        if (newEaseFactor.compareTo(new BigDecimal("1.3")) < 0) {
            newEaseFactor = new BigDecimal("1.3");
        }
        progress.setEaseFactor(newEaseFactor.setScale(2, RoundingMode.HALF_UP));

        // 3. Cập nhật NextReviewTime và Reminded
        if (progress.getInterval() == 0) {
            progress.setNextReviewTime(LocalDateTime.now().plusMinutes(30));
        } else {
            progress.setNextReviewTime(LocalDateTime.now().plusDays(progress.getInterval()));
        }
        progress.setReminded(false); // Đặt lại trạng thái chưa nhắc
        progress.setLastQuality(quality);
        progress.setTotalReviews(progress.getTotalReviews() + 1);
        progress.setLastReviewedAt(LocalDateTime.now());

        cardProgressRepository.save(progress);

        // 4. Lưu lại lịch sử đánh giá (ReviewLog)
        ReviewLog log = ReviewLog.builder()
                .user(user)
                .card(card)
                .quality(quality)
                .intervalBefore(intervalBefore)
                .intervalAfter(progress.getInterval())
                .build();
        reviewLogRepository.save(log);
        
        // 5. Cập nhật last_studied_at của User
        user.setLastStudiedAt(LocalDateTime.now());
        userRepository.save(user);

        return CardProgressResponse.builder()
                .cardId(progress.getCard().getId())
                .deckId(progress.getCard().getDeck().getId())
                .front(progress.getCard().getFront())
                .back(progress.getCard().getBack())
                .exampleSentence(progress.getCard().getExampleSentence())
                .pronunciation(progress.getCard().getPronunciation())
                .imageUrl(progress.getCard().getImageUrl())
                .interval(progress.getInterval())
                .repetition(progress.getRepetition())
                .easeFactor(progress.getEaseFactor())
                .nextReviewTime(progress.getNextReviewTime())
                .build();
    }

    public List<CardProgressResponse> getLearnedCards(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return cardProgressRepository.findByUserId(user.getId())
                .stream().map(cp -> CardProgressResponse.builder()
                        .cardId(cp.getCard().getId())
                        .deckId(cp.getCard().getDeck().getId())
                        .front(cp.getCard().getFront())
                        .back(cp.getCard().getBack())
                        .exampleSentence(cp.getCard().getExampleSentence())
                        .pronunciation(cp.getCard().getPronunciation())
                        .imageUrl(cp.getCard().getImageUrl())
                        .interval(cp.getInterval())
                        .repetition(cp.getRepetition())
                        .easeFactor(cp.getEaseFactor())
                        .nextReviewTime(cp.getNextReviewTime())
                        .build()
                ).collect(Collectors.toList());
    }
}

