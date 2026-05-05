package com.substring.easybuy.products.service.impl;

import com.substring.easybuy.products.service.ImageStorageService;
import org.springframework.web.multipart.MultipartFile;

public class ImageAwsS3StorageServiceImpl implements ImageStorageService {
    @Override
    public String upload(MultipartFile file) {
        //code to upload image to s3...
        return "";
    }
}
