package com.substring.blogapp.controller;

import com.substring.blogapp.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/admin/api/v1/articles")
@RequiredArgsConstructor
@RestController
public class AdminArticleController {

    private final ArticleService articleService;

    @DeleteMapping("/{articleId}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long articleId) {
        articleService.deleteArticle(articleId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
