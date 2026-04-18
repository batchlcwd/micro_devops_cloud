package com.substring.blogapp.service.impl;

import com.substring.blogapp.dto.ArticleDto;
import com.substring.blogapp.entity.Article;
import com.substring.blogapp.exception.ResourceNotFoundException;
import com.substring.blogapp.repository.ArticleRepository;
import com.substring.blogapp.repository.CategoryRepository;
import com.substring.blogapp.repository.UserRepository;
import com.substring.blogapp.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Primary
public class ArticleServicedbImpl implements ArticleService {

    private final ArticleRepository articleRepository;
    private final ModelMapper modelMapper;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Override
    public Page<ArticleDto> getAll(Pageable pageable) {
        Page<Article> articlePage = articleRepository.findAll(pageable);
        return  articlePage.map(article -> modelMapper.map(article, ArticleDto.class));

//        List<Article> articles = articleRepository.findAll();
//        return articles.stream()
//                .map(article -> modelMapper.map(article, ArticleDto.class))
//                .toList();

    }

    @Override
    public ArticleDto getArticle(Long articleId) {
        var article = articleRepository.findById(articleId).orElseThrow(() -> new ResourceNotFoundException("Article Not Found"));
        return modelMapper.map(article, ArticleDto.class);

    }

    @Override
    public ArticleDto createArticle(ArticleDto articleDto) {

        validateArticle(articleDto);
        //change dto --> entity
        var entity = modelMapper.map(articleDto, Article.class);
        entity.setCreatedAt(LocalDateTime.now());
        if(articleDto.getCategoryId() != null){
            var category= categoryRepository.findById(articleDto.getCategoryId()).orElseThrow(() -> new ResourceNotFoundException("Category Not Found"));
            entity.setCategory(category);
        }

        var savedEntity = articleRepository.save(entity);
        //entity ---> dto
        return modelMapper.map(savedEntity, ArticleDto.class);

    }


    @Override
    public ArticleDto updateArticle(ArticleDto articleDto, Long articleId) {
        var article = articleRepository.findById(articleId).orElseThrow(() -> new ResourceNotFoundException("Article Not Found"));

        article.setTitle(articleDto.getTitle());
        article.setShortDesc(articleDto.getShortDesc());
        article.setContent(articleDto.getContent());
        article.setPaid(articleDto.getPaid());
        article.setStatus(articleDto.getStatus());
        article.setReadingMinutes(articleDto.getReadingMinutes());
        article.setRating(articleDto.getRating());
        article.setPrice(articleDto.getPrice());
        article.setPublishedAt(LocalDateTime.now());

        //there is no need to update the user
        //check for article
        if(articleDto.getCategoryId() != null){
            var category= categoryRepository.findById(articleDto.getCategoryId()).orElseThrow(() -> new ResourceNotFoundException("Category Not Found"));
            article.setCategory(category);
        }


        articleRepository.save(article);
        return modelMapper.map(article, ArticleDto.class);


    }

    @Override
    public void deleteArticle(Long articleId) {
        var article = articleRepository.findById(articleId).orElseThrow(() -> new ResourceNotFoundException("Article Not Found"));

        articleRepository.delete(article);
    }

    @Override
    public List<ArticleDto> getArticleOfCategory(Long categoryId) {
        var category=categoryRepository.findById(categoryId).orElseThrow(() -> new ResourceNotFoundException("Category Not Found"));
        List<Article> articles = articleRepository.findByCategory(category);
        return articles.stream().map(article -> modelMapper.map(article,ArticleDto.class)).toList();
    }

    @Override
    public List<ArticleDto> getArticleOfUser(Long userId) {

        var user= userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User Not Found"));
        return articleRepository.findByUser(user).stream().map(article -> modelMapper.map(article,ArticleDto.class)).toList();

    }

    private void validateArticle(ArticleDto articleDto) {
        //manul check:
    }

}
