package com.flashcard.service;

import com.flashcard.dto.request.CardRequest;
import com.flashcard.dto.response.CardResponse;
import com.flashcard.entity.Card;
import com.flashcard.entity.Deck;
import com.flashcard.entity.Role;
import com.flashcard.entity.User;
import com.flashcard.exception.ResourceNotFoundException;
import com.flashcard.repository.CardProgressRepository;
import com.flashcard.repository.CardRepository;
import com.flashcard.repository.DeckRepository;
import com.flashcard.repository.ReviewLogRepository;
import com.flashcard.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CardService {

    private final CardRepository cardRepository;
    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final CardProgressRepository cardProgressRepository;
    private final ReviewLogRepository reviewLogRepository;

    public CardService(CardRepository cardRepository,
                       DeckRepository deckRepository,
                       UserRepository userRepository,
                       CardProgressRepository cardProgressRepository,
                       ReviewLogRepository reviewLogRepository) {
        this.cardRepository = cardRepository;
        this.deckRepository = deckRepository;
        this.userRepository = userRepository;
        this.cardProgressRepository = cardProgressRepository;
        this.reviewLogRepository = reviewLogRepository;
    }

    @Transactional
    public CardResponse createCard(UUID deckId, String userEmail, CardRequest request) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Chủ nhân Deck HOẶC ADMIN mới được thêm Card
        if (!deck.getUser().getEmail().equals(userEmail) && user.getRole() != Role.ROLE_ADMIN) {
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

    @Transactional
    public CardResponse updateCard(UUID deckId, UUID cardId, String userEmail, CardRequest request) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Cho phép chủ nhân của Deck HOẶC user có role ROLE_ADMIN được sửa
        if (!deck.getUser().getEmail().equals(userEmail) && user.getRole() != Role.ROLE_ADMIN) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa thẻ trong Deck này");
        }

        card.setFront(request.getFront());
        card.setBack(request.getBack());
        card.setPronunciation(request.getPronunciation());
        card.setExampleSentence(request.getExampleSentence());
        if (request.getImageUrl() != null) {
            card.setImageUrl(request.getImageUrl());
        }

        cardRepository.save(card);
        return mapToResponse(card);
    }

    @Transactional
    public void deleteCard(UUID deckId, UUID cardId, String userEmail) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!deck.getUser().getEmail().equals(userEmail) && user.getRole() != Role.ROLE_ADMIN) {
            throw new RuntimeException("Bạn không có quyền xóa thẻ trong Deck này");
        }

        // Xóa các liên kết trong card_progress và review_logs
        cardProgressRepository.deleteByCardIds(List.of(cardId));
        reviewLogRepository.deleteByCardIds(List.of(cardId));
        cardRepository.delete(card);

        // Giảm số lượng thẻ của Deck
        deck.setCardCount(Math.max(0, deck.getCardCount() - 1));
        deckRepository.save(deck);
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
