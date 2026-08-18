package com.flashcard.repository;

import com.flashcard.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CardRepository extends JpaRepository<Card, UUID> {
    
    // Lấy danh sách tất cả các Card trong một Deck
    List<Card> findByDeckId(UUID deckId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Card c WHERE c.deck.id = :deckId")
    void deleteByDeckId(@org.springframework.data.repository.query.Param("deckId") UUID deckId);
}
