package com.substring.easybuy.products.service;

import org.springframework.web.multipart.MultipartFile;

public interface ImageStorageService {

    String upload(MultipartFile file);
}
