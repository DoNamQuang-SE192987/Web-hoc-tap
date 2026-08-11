package com.flashcard.repository;

import com.flashcard.entity.CardProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CardProgressRepository extends JpaRepository<CardProgress, UUID> {
    
    // Lấy tiến độ học của một Card đối với một User
    Optional<CardProgress> findByUserIdAndCardId(UUID userId, UUID cardId);

    // Lấy danh sách các Card cần học HÔM NAY (nextReviewDate <= hôm nay)
    // Custom query để join với bảng Card và Deck (nếu cần lấy thông tin)
    @Query("SELECT cp FROM CardProgress cp " +
           "JOIN FETCH cp.card c " +
           "WHERE cp.user.id = :userId " +
           "AND cp.nextReviewTime <= :now")
    List<CardProgress> findDueCards(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    // Lấy danh sách các thẻ "thời điểm vàng 30 phút" cần nhắc nhở (chưa được nhắc nhở)
    @Query("SELECT cp FROM CardProgress cp " +
           "JOIN FETCH cp.user u " +
           "WHERE cp.nextReviewTime <= :now " +
           "AND cp.reminded = false " +
           "AND cp.interval = 0")
    List<CardProgress> findGoldenTimeDueCards(@Param("now") LocalDateTime now);

    // Lấy tất cả tiến độ học tập (các thẻ đã học) của một User
    @Query("SELECT cp FROM CardProgress cp " +
           "JOIN FETCH cp.card c " +
           "WHERE cp.user.id = :userId")
    List<CardProgress> findByUserId(@Param("userId") UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM CardProgress cp WHERE cp.card.id IN :cardIds")
    void deleteByCardIds(@Param("cardIds") List<UUID> cardIds);
}
