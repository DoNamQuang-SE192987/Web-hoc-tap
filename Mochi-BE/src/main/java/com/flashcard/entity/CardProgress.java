package com.flashcard.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "card_progress",
    indexes = {
        @Index(name = "idx_user_next_review", columnList = "user_id, next_review_time")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @Column(nullable = false)
    @Builder.Default
    private Integer interval = 0; // Ngày tới lần ôn tiếp

    @Column(nullable = false)
    @Builder.Default
    private Integer repetition = 0; // Lần ôn thành công liên tiếp

    @Column(name = "ease_factor", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal easeFactor = new BigDecimal("2.50"); // Hệ số dễ mặc định là 2.5

    @Column(name = "next_review_time", nullable = false)
    private LocalDateTime nextReviewTime;

    @Column(name = "reminded", nullable = false)
    @Builder.Default
    private Boolean reminded = false; // Đánh dấu xem thẻ này đã được gửi email 30 phút chưa

    @Column(name = "last_quality")
    private Integer lastQuality; // Quality 1-4 lần gần nhất

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;
}
