package com.flashcard.repository;

import com.flashcard.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeckRepository extends JpaRepository<Deck, UUID> {
    
    // Lấy danh sách Deck của một User cụ thể hoặc Deck công khai (public)
    List<Deck> findByUserIdOrIsPublicTrue(UUID userId);
}
