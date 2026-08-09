package com.flashcard.repository;

import com.flashcard.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    // Tìm kiếm user bằng email (Dùng cho đăng nhập)
    Optional<User> findByEmail(String email);
    
    // Kiểm tra email đã tồn tại chưa (Dùng cho đăng ký)
    boolean existsByEmail(String email);

    // Tìm user theo giờ nhận thông báo (Bỏ qua giây)
    @Query("SELECT u FROM User u WHERE EXTRACT(HOUR FROM u.notifyTime) = :hour AND EXTRACT(MINUTE FROM u.notifyTime) = :minute")
    List<User> findUsersToNotify(@org.springframework.data.repository.query.Param("hour") int hour, @org.springframework.data.repository.query.Param("minute") int minute);
}
