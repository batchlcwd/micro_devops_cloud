package com.substring.blogapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "articles")
@Getter
@Setter
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String shortDesc;

    //    @Column(name = "article_content",nullable = false,length = 235425)
    @Lob
    private String content;

    private Boolean paid;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;

    private Double rating;
    private Double price;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private  Category category;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private  User user;


}
