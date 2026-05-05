package com.substring.easybuy.products.service.impl;

import com.substring.easybuy.products.service.ImageKitStorageService;
import com.substring.easybuy.products.exception.InvalidRequestException;
import io.imagekit.client.ImageKitClient;
import io.imagekit.client.okhttp.ImageKitOkHttpClient;
import io.imagekit.models.files.FileUploadParams;
import io.imagekit.models.files.FileUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class ImageKitStorageServiceImpl implements ImageKitStorageService {

    private final String privateKey;
    private final String folder;

    public ImageKitStorageServiceImpl(
            @Value("${imagekit.private-key:}") String privateKey,
            @Value("${imagekit.folder:/products}") String folder
    ) {
        this.privateKey = privateKey;
        this.folder = folder;
    }

    @Override
    public String upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("Image file cannot be empty");
        }
        validateConfig();
        try {
            ImageKitClient client = ImageKitOkHttpClient.builder()
                    .privateKey(privateKey)
                    .build();

            FileUploadParams params = FileUploadParams.builder()
                    .file(file.getBytes())
                    .fileName(resolveFileName(file))
                    .folder(folder)
                    .build();

            FileUploadResponse response = client.files().upload(params);
            return response.url().orElseThrow(() -> new IllegalStateException("ImageKit did not return a public URL"));
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to upload product image to ImageKit", ex);
        }
    }

    private void validateConfig() {
        if (privateKey.isBlank()) {
            throw new InvalidRequestException("ImageKit credentials are not configured");
        }
    }

    private String resolveFileName(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            return UUID.randomUUID() + ".jpg";
        }
        return originalFileName;
    }
}
