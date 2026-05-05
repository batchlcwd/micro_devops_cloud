package com.substring.easybuy.products.service;

import com.substring.easybuy.products.dto.CategoryDto;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    List<CategoryDto> getAllCategories();

    CategoryDto getCategoryById(Long categoryId);

    List<CategoryDto> getCategoriesByProductId(UUID productId);

    CategoryDto createCategory(CategoryDto categoryDto);

    CategoryDto updateCategory(Long categoryId, CategoryDto categoryDto);

    void deleteCategory(Long categoryId);
}
