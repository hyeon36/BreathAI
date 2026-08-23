package com.breathAI.ttobagi_server.domain.dashboard.repository;

import com.breathAI.ttobagi_server.domain.auth.entity.User;
import com.breathAI.ttobagi_server.domain.dashboard.entity.UploadFile;
import com.breathAI.ttobagi_server.domain.dashboard.entity.UploadFile.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 업로드 파일 리포지토리
public interface UploadFileRepository extends JpaRepository<UploadFile, String> {
    Optional<UploadFile> findByUploadId(String uploadId);
    List<UploadFile> findByUploadedBy(User user);
    Optional<UploadFile> findByFileName(String fileName);
    Page<UploadFile> findByUploadedByOrderByCreatedAtDesc(User uploadedBy, Pageable pageable);
    List<UploadFile> findByStatusOrderByCreatedAtDesc(Status status);
    boolean existsByFileNameAndUploadedBy(String fileName, User uploadedBy);
    long countByUploadedBy(User uploadedBy);
    void deleteByUploadedBy(User user);
    Optional<UploadFile> findByFileHash(String fileHash);
}