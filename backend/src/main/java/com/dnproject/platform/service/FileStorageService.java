package com.dnproject.platform.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path businessRegRoot;
    private final Path uploadRoot;

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.businessRegRoot = uploadRoot.resolve("business-reg");
        try {
            Files.createDirectories(businessRegRoot);
        } catch (IOException e) {
            log.warn("업로드 디렉토리 생성 실패: {}", businessRegRoot, e);
        }
    }

    /**
     * 사업자등록증 파일 저장. 파일명: {uuid}-{originalFilename}
     * @return 저장된 파일의 상대 경로 (예: business-reg/uuid-filename.pdf)
     */
    public String storeBusinessRegistration(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) originalFilename = "file";
        String safeName = UUID.randomUUID().toString().replace("-", "") + "-" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path target = businessRegRoot.resolve(safeName);
        Files.copy(file.getInputStream(), target);
        return "business-reg/" + safeName;
    }

    /**
     * 저장된 상대 경로(예: business-reg/xxx.pdf)로 파일 로드. path traversal 방지.
     */
    public Resource loadBusinessRegistration(String relativePath) throws IOException {
        if (relativePath == null || relativePath.contains("..")) {
            throw new IllegalArgumentException("잘못된 파일 경로입니다.");
        }
        Path fullPath = uploadRoot.resolve(relativePath).normalize();
        if (!fullPath.startsWith(uploadRoot)) {
            throw new IllegalArgumentException("잘못된 파일 경로입니다.");
        }
        if (!Files.exists(fullPath) || !Files.isRegularFile(fullPath)) {
            log.warn("사업자등록증 파일 없음: relativePath={}, fullPath={}, uploadRoot={}", relativePath, fullPath, uploadRoot);
            return null;
        }
        Resource resource = new UrlResource(fullPath.toUri());
        if (!resource.exists() || !resource.isReadable()) return null;
        return resource;
    }
}
