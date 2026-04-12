package com.substring.blogapp.service;

import com.substring.blogapp.dto.ArticleDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.atomic.AtomicReference;


//now object creation is needed manually

@Service
public class ArticleService {

    List<ArticleDto> articles = new ArrayList<>();

    Random random = new Random();


    public ArticleService() {
        ArticleDto article1 = ArticleDto.builder()
                .id(1L)
                .title("Java Collection Framework")
                .shortDescription("Store multiple objects in single entity.")
                .content("This is main content of article")
                .paid(true)
                .price(100.0)
                .readingMinutes(5)
                .build();
        ArticleDto article2 = ArticleDto.builder()
                .id(2L)
                .title("Java Multithreading")
                .shortDescription("running multiple task concurrently")
                .content("This is main content of article")
                .paid(false)
                .price(100.0)
                .readingMinutes(10)
                .build();

        articles.add(article1);
        articles.add(article2);

    }

    public List<ArticleDto> getAll() {
        //kuch articles return
        return articles;
    }


    public ArticleDto getArticle(Long articleId) {
        return articles.stream()
                .filter(articleDto -> articleDto.getId().equals(articleId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Article Not found"));

    }

    public ArticleDto createArticle(ArticleDto articleDto) {
        articleDto.setId(random.nextLong(235235223));
        articles.add(articleDto);
        return articleDto;
    }

    public void deleteArticle(Long articleId) {
//        articles= articles.stream()
//                .filter(articleDto -> !articleDto.getId().equals(articleId))
//                .toList();

        articles.removeIf(articleDto -> articleDto.getId().equals(articleId));
    }

    public ArticleDto updateArticle(ArticleDto articleDto1, Long articleId) {


        AtomicReference<ArticleDto> updatedArticleDto = new AtomicReference<>();
        List<ArticleDto> list = articles.stream().map(articleDto -> {
            if (articleDto.getId().equals(articleId)) {
                //update and return
                articleDto.setTitle(articleDto1.getTitle());
                articleDto.setShortDescription(articleDto1.getShortDescription());
                articleDto.setContent(articleDto1.getContent());
                articleDto.setPaid(articleDto1.getPaid());
                articleDto.setPrice(articleDto1.getPrice());
                articleDto.setReadingMinutes(articleDto1.getReadingMinutes());
                updatedArticleDto.set(ArticleDto.builder()
                        .id(articleDto.getId())
                        .title(articleDto.getTitle())
                        .shortDescription(articleDto.getShortDescription())
                        .content(articleDto.getContent())
                        .paid(articleDto.getPaid())
                        .price(articleDto.getPrice())
                        .readingMinutes(articleDto.getReadingMinutes())
                        .build());
                return articleDto;
            } else
                return articleDto;
        }).toList();


        return updatedArticleDto.get();
    }
}
