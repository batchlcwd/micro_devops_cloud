package com.substring.blogapp;

import com.substring.blogapp.service.CategoryService;
import com.substring.blogapp.utils.ArticleModelMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class BlogAppApplicationTests {

    //field injection
//    @Autowired
    @Autowired
    private  CategoryService categoryService;
    @Autowired
    private ArticleModelMapper articleModelMapper;

//    public BlogAppApplicationTests(@Autowired CategoryService categoryService) {
//        this.categoryService = categoryService;
//    }

    @Test
    public void testBean(){
        System.out.println("testing bean");
        categoryService.create();
        System.out.println(articleModelMapper);
    }

}
