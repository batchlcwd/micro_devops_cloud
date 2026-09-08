package com.substring.blogapp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageUploadService {

    private final S3Client s3Client;

    @Value("${aws.bucket}")
    private String bucket;

    private final S3Presigner presigner;

    public String uploadImage(MultipartFile file) throws IOException {

        //image upload logic will go here
        String fileName = "articles/" + UUID.randomUUID() + "-" + file.getOriginalFilename();
        PutObjectRequest putObjectRequest = PutObjectRequest.builder().bucket(bucket).key(fileName).contentType(file.getContentType()).build();
        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
        return fileName;

    }


    public String generatePresignedUrl(String objectKey) {


        //GetObjectRequest
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build();

        //GetObjectPresignerRequest
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(10))
                .getObjectRequest(getObjectRequest)
                .build();


        PresignedGetObjectRequest presignedGetObjectRequest = presigner.presignGetObject(presignRequest);
        return presignedGetObjectRequest.url().toString();


    }


}
