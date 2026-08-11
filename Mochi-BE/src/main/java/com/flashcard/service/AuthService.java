package com.flashcard.service;

import com.flashcard.dto.request.LoginRequest;
import com.flashcard.dto.request.RegisterRequest;
import com.flashcard.dto.response.AuthResponse;
import com.flashcard.entity.User;
import com.flashcard.repository.UserRepository;
import com.flashcard.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .build();

        userRepository.save(user);

        String jwtToken = jwtUtil.generateToken(user.getEmail());
        
        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // authenticationManager sẽ kiểm tra email và password, nếu sai sẽ throw Exception
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        String jwtToken = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse googleLogin(com.flashcard.dto.request.GoogleLoginRequest request) {
        String googleTokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getIdToken();
        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        
        try {
            java.util.Map<String, Object> googleResponse = restTemplate.getForObject(googleTokenInfoUrl, java.util.Map.class);
            
            if (googleResponse == null || googleResponse.containsKey("error_description")) {
                throw new RuntimeException("Google ID Token không hợp lệ!");
            }
            
            String email = (String) googleResponse.get("email");
            String name = (String) googleResponse.get("name");
            
            if (email == null) {
                throw new RuntimeException("Không lấy được thông tin email từ Google Token");
            }
            
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .email(email)
                                .displayName(name != null ? name : "Google User")
                                .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                                .role(com.flashcard.entity.Role.ROLE_USER)
                                .build();
                        return userRepository.save(newUser);
                    });
            
            String jwtToken = jwtUtil.generateToken(user.getEmail());
            
            return AuthResponse.builder()
                    .token(jwtToken)
                    .email(user.getEmail())
                    .displayName(user.getDisplayName())
                    .role(user.getRole().name())
                    .build();
            
        } catch (Exception e) {
            throw new RuntimeException("Xác thực Google thất bại: " + e.getMessage());
        }
    }
}
