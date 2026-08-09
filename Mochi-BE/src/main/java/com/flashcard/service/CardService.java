package com.flashcard.service;

import com.flashcard.dto.request.CardRequest;
import com.flashcard.dto.response.CardResponse;
import com.flashcard.entity.Card;
import com.flashcard.entity.Deck;
import com.flashcard.exception.ResourceNotFoundException;
import com.flashcard.repository.CardRepository;
import com.flashcard.repository.DeckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final DeckRepository deckRepository;

    @Transactional
    public CardResponse createCard(UUID deckId, String userEmail, CardRequest request) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));

        // Chỉ chủ nhân Deck mới được thêm Card
        if (!deck.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Bạn không có quyền thêm thẻ vào Deck này");
        }

        Card card = Card.builder()
                .deck(deck)
                .front(request.getFront())
                .back(request.getBack())
                .exampleSentence(request.getExampleSentence())
                .pronunciation(request.getPronunciation())
                .imageUrl(request.getImageUrl())
                .build();

        cardRepository.save(card);
        
        // Cập nhật số lượng thẻ của Deck
        deck.setCardCount(deck.getCardCount() + 1);
        deckRepository.save(deck);

        return mapToResponse(card);
    }

    public List<CardResponse> getCardsByDeckId(UUID deckId, String userEmail) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));

        if (!deck.getUser().getEmail().equals(userEmail) && !deck.getIsPublic()) {
            throw new RuntimeException("Bạn không có quyền xem Deck này");
        }

        return cardRepository.findByDeckId(deckId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CardResponse mapToResponse(Card card) {
        return CardResponse.builder()
                .id(card.getId())
                .deckId(card.getDeck().getId())
                .front(card.getFront())
                .back(card.getBack())
                .exampleSentence(card.getExampleSentence())
                .pronunciation(card.getPronunciation())
                .imageUrl(card.getImageUrl())
                .createdAt(card.getCreatedAt())
                .build();
    }
}
