package com.flashcard.repository;

import com.flashcard.entity.ReviewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewLogRepository extends JpaRepository<ReviewLog, UUID> {
    
    // Lấy lịch sử học của một user
    List<ReviewLog> findByUserId(UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM ReviewLog rl WHERE rl.card.id IN :cardIds")
    void deleteByCardIds(@org.springframework.data.repository.query.Param("cardIds") List<UUID> cardIds);
}
