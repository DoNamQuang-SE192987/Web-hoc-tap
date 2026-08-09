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
}
