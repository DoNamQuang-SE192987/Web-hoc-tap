package com.flashcard.service;

import com.flashcard.dto.request.DeckRequest;
import com.flashcard.dto.response.DeckResponse;
import com.flashcard.entity.Deck;
import com.flashcard.entity.User;
import com.flashcard.exception.ResourceNotFoundException;
import com.flashcard.repository.DeckRepository;
import com.flashcard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final com.flashcard.repository.CardRepository cardRepository;
    private final com.flashcard.repository.CardProgressRepository cardProgressRepository;
    private final com.flashcard.repository.ReviewLogRepository reviewLogRepository;

    public DeckResponse createDeck(String userEmail, DeckRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Deck deck = Deck.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .language(request.getLanguage())
                .isPublic(request.getIsPublic())
                .imageUrl(request.getImageUrl())
                .build();

        deckRepository.save(deck);
        return mapToResponse(deck);
    }

    public List<DeckResponse> getUserDecks(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return deckRepository.findByUserIdOrIsPublicTrue(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DeckResponse getDeckById(UUID deckId, String userEmail) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));

        // Phân quyền: Đảm bảo user chỉ xem được deck của mình hoặc deck public
        if (!deck.getUser().getEmail().equals(userEmail) && !deck.getIsPublic()) {
            throw new RuntimeException("Bạn không có quyền xem Deck này");
        }

        return mapToResponse(deck);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteDeck(UUID deckId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));

        // Admin có quyền xóa bất kỳ deck nào, user thường chỉ được xóa deck của mình
        if (!deck.getUser().getEmail().equals(userEmail) && user.getRole() != com.flashcard.entity.Role.ROLE_ADMIN) {
            throw new RuntimeException("Bạn không có quyền xóa Deck này");
        }

        // Tìm tất cả cards của deck để xóa progress và logs
        List<com.flashcard.entity.Card> cards = cardRepository.findByDeckId(deckId);
        if (!cards.isEmpty()) {
            List<UUID> cardIds = cards.stream()
                    .map(com.flashcard.entity.Card::getId)
                    .collect(Collectors.toList());
            
            reviewLogRepository.deleteByCardIds(cardIds);
            cardProgressRepository.deleteByCardIds(cardIds);
            cardRepository.deleteByDeckId(deckId);
        }

        deckRepository.delete(deck);
    }

    // Helper method để map từ Entity sang Response DTO
    private DeckResponse mapToResponse(Deck deck) {
        return DeckResponse.builder()
                .id(deck.getId())
                .name(deck.getName())
                .description(deck.getDescription())
                .language(deck.getLanguage())
                .isPublic(deck.getIsPublic())
                .cardCount(deck.getCardCount())
                .imageUrl(deck.getImageUrl())
                .createdAt(deck.getCreatedAt())
                .build();
    }
}
