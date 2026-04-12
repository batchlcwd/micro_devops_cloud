package com.substring.blogapp.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ArticleDto {
    private Long id;
    private String title;
    private String shortDescription;
    private String content;
    private Boolean paid;
    private Double price;
    private Integer readingMinutes;

}
