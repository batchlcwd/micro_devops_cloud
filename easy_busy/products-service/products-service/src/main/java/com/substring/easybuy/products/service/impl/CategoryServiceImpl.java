package com.substring.easybuy.products.service.impl;

import com.substring.easybuy.products.dto.CategoryDto;
import com.substring.easybuy.products.entity.Category;
import com.substring.easybuy.products.exception.ResourceNotFoundException;
import com.substring.easybuy.products.repository.CategoryRepo;
import com.substring.easybuy.products.repository.ProductRepo;
import com.substring.easybuy.products.service.CategoryService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepo categoryRepo;
    private final ProductRepo productRepo;

    public CategoryServiceImpl(CategoryRepo categoryRepo, ProductRepo productRepo) {
        this.categoryRepo = categoryRepo;
        this.productRepo = productRepo;
    }

    @Override
    public List<CategoryDto> getAllCategories() {
        return categoryRepo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public CategoryDto getCategoryById(Long categoryId) {
        return toDto(findCategory(categoryId));
    }

    @Override
    public List<CategoryDto> getCategoriesByProductId(UUID productId) {
        return categoryRepo.findByProductId(productId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public CategoryDto createCategory(CategoryDto categoryDto) {
        Category category = new Category();
        category.setTitle(categoryDto.getTitle());
        return toDto(categoryRepo.save(category));
    }

    @Override
    public CategoryDto updateCategory(Long categoryId, CategoryDto categoryDto) {
        Category category = findCategory(categoryId);
        category.setTitle(categoryDto.getTitle());
        return toDto(categoryRepo.save(category));
    }

    @Override
    public void deleteCategory(Long categoryId) {
        Category category = findCategory(categoryId);
        category.getProducts().forEach(product -> product.getCategories().remove(category));
        category.getProducts().clear();
        categoryRepo.save(category);
        categoryRepo.delete(category);
    }

    private Category findCategory(Long categoryId) {
        return categoryRepo.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }

    private CategoryDto toDto(Category category) {
        CategoryDto dto = new CategoryDto();
        dto.setId(category.getId());
        dto.setTitle(category.getTitle());
        dto.setProducts(category.getProducts() == null ? new ArrayList<>() : category.getProducts().stream().map(product -> {
            var productDto = new com.substring.easybuy.products.dto.ProductDto();
            productDto.setId(product.getId());
            productDto.setTitle(product.getTitle());
            productDto.setShortDesc(product.getShortDesc());
            productDto.setLongDesc(product.getLongDesc());
            productDto.setPrice(product.getPrice());
            productDto.setDiscount(product.getDiscount());
            productDto.setLive(product.getLive());
            productDto.setProductImages(product.getProductImages() == null ? new ArrayList<>() : new ArrayList<>(product.getProductImages()));
            productDto.setCategories(new ArrayList<>());
            productDto.setReviews(new ArrayList<>());
            return productDto;
        }).collect(Collectors.toList()));
        return dto;
    }
}
