package com.substring.blogapp.controller;


//request handle for articles

import com.substring.blogapp.dto.ArticleDto;
import com.substring.blogapp.service.ArticleService;
import com.substring.blogapp.service.impl.ArticleServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*

    @Controller-> accept and return the view name:-->  html page


    @RestController--> accept the request but return the data in json automatically

    @RestController= @Controller + @ResponseBody--> send the data directly to response:
 */
//@Controller
@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
public class ArticleController {


    private final ArticleService articleService;


    //we can not write logics directly in class

    //methods
    //url: api/v1/articles/create


    //@ResponseBody
    //@RequestMapping(value = "/",method = RequestMethod.POST)
    @PostMapping // requestmapping with post method
    public ResponseEntity<ArticleDto> createArticle(@RequestBody ArticleDto articleDto) {
        ArticleDto articleDto1 = articleService.createArticle(articleDto);
        return new ResponseEntity<>(articleDto1, HttpStatus.CREATED);
    }

    //url: api/v1/articles/update
//    @RequestMapping("/update")
//    public String updateArticles(){
//        return "articles updated";
//    }

    @PutMapping("/{articleId}")
    public ArticleDto update(@PathVariable Long articleId, @RequestBody ArticleDto articleDto) {
        return articleService.updateArticle(articleDto, articleId);
    }

    //url: api/v1/articles/get
//    @RequestMapping("/get")
    @GetMapping("/{articleId}")
    public ArticleDto getArticle(@PathVariable("articleId") Long articleId) {
        return articleService.getArticle(articleId);
    }

    @GetMapping
    public Page<ArticleDto> getAll( Pageable pageable) {
        return articleService.getAll(pageable);
    }



    //create api to get articles of specific category
    @GetMapping("/category/{categoryId}")
    public List<ArticleDto> getArticlesByCategory(@PathVariable("categoryId") Long categoryId) {
        return articleService.getArticleOfCategory(categoryId);
    }

    @GetMapping("/user/{userId}")
    public List<ArticleDto> getArticlesByUser(@PathVariable("userId") Long userId) {
        return articleService.getArticleOfUser(userId);
    }

}
