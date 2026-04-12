package com.substring.blogapp.controller;


//request handle for articles

import com.substring.blogapp.dto.ArticleDto;
import com.substring.blogapp.service.ArticleService;
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
public class ArticleController {


    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

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
    public List<ArticleDto> getAll() {
        return articleService.getAll();
    }

    @DeleteMapping("/{articleId}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long articleId) {
        articleService.deleteArticle(articleId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

}
