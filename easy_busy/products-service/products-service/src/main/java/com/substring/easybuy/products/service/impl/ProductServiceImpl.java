package com.substring.easybuy.products.service.impl;

import com.substring.easybuy.products.dto.CategoryDto;
import com.substring.easybuy.products.dto.ProductDto;
import com.substring.easybuy.products.dto.PagedResponse;
import com.substring.easybuy.products.dto.ReviewDto;
import com.substring.easybuy.products.entity.Category;
import com.substring.easybuy.products.entity.Product;
import com.substring.easybuy.products.entity.Review;
import com.substring.easybuy.products.repository.CategoryRepo;
import com.substring.easybuy.products.repository.ProductRepo;
import com.substring.easybuy.products.repository.ReviewRepo;
import com.substring.easybuy.products.service.ImageKitStorageService;
import com.substring.easybuy.products.service.ProductService;
import com.substring.easybuy.products.exception.InvalidRequestException;
import com.substring.easybuy.products.exception.ResourceNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepo productRepo;
    private final CategoryRepo categoryRepo;
    private final ReviewRepo reviewRepo;
    private final ImageKitStorageService imageKitStorageService;

    public ProductServiceImpl(ProductRepo productRepo, CategoryRepo categoryRepo, ReviewRepo reviewRepo, ImageKitStorageService imageKitStorageService) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
        this.reviewRepo = reviewRepo;
        this.imageKitStorageService = imageKitStorageService;
    }

    @Override
    public PagedResponse<ProductDto> getAllProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepo.findAll(pageable);
        return toPagedResponse(productPage.map(this::toDto));
    }

    @Override
    public ProductDto getProductById(UUID productId) {
        return toDto(findProduct(productId));
    }

    @Override
    public PagedResponse<ProductDto> getProductsByCategoryId(Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepo.findByCategories_Id(categoryId, pageable);
        return toPagedResponse(productPage.map(this::toDto));
    }

    @Override
    public ProductDto createProduct(ProductDto productDto) {
        Product product = new Product();
        applyBasicFields(product, productDto);
        List<Category> categories = resolveCategories(productDto.getCategories());
        product.setCategories(categories);
        Product savedProduct = productRepo.save(product);
        syncCategoryLinks(savedProduct, categories);
        return toDto(savedProduct);
    }

    @Override
    public ProductDto updateProduct(UUID productId, ProductDto productDto) {
        Product product = findProduct(productId);
        applyBasicFields(product, productDto);
        if (productDto.getCategories() != null) {
            List<Category> categories = resolveCategories(productDto.getCategories());
            product.setCategories(categories);
            Product savedProduct = productRepo.save(product);
            syncCategoryLinks(savedProduct, categories);
            return toDto(savedProduct);
        }
        return toDto(productRepo.save(product));
    }

    @Override
    public void deleteProduct(UUID productId) {
        Product product = findProduct(productId);
        productRepo.delete(product);
    }

    @Override
    public ProductDto addCategoryToProduct(UUID productId, Long categoryId) {
        Product product = findProduct(productId);
        Category category = findCategory(categoryId);
        if (!product.getCategories().contains(category)) {
            product.getCategories().add(category);
        }
        if (!category.getProducts().contains(product)) {
            category.getProducts().add(product);
        }
        categoryRepo.save(category);
        return toDto(productRepo.save(product));
    }

    @Override
    public ProductDto removeCategoryFromProduct(UUID productId, Long categoryId) {
        Product product = findProduct(productId);
        Category category = findCategory(categoryId);
        product.getCategories().remove(category);
        category.getProducts().remove(product);
        categoryRepo.save(category);
        return toDto(productRepo.save(product));
    }

    @Override
    public ReviewDto addReviewToProduct(UUID productId, ReviewDto reviewDto) {
        Product product = findProduct(productId);
        Review review = new Review();
        review.setTitle(reviewDto.getTitle());
        review.setComment(reviewDto.getComment());
        review.setRating(reviewDto.getRating());
        review.setProduct(product);
        return toReviewDto(reviewRepo.save(review));
    }

    @Override
    public ProductDto addProductImages(UUID productId, List<MultipartFile> files) {
        Product product = findProduct(productId);
        List<String> uploadedUrls = uploadImages(files);
        if (product.getProductImages() == null) {
            product.setProductImages(new ArrayList<>());
        }
        product.getProductImages().addAll(uploadedUrls);
        return toDto(productRepo.save(product));
    }

    @Override
    public List<String> getProductImages(UUID productId) {
        Product product = findProduct(productId);
        return product.getProductImages() == null ? new ArrayList<>() : new ArrayList<>(product.getProductImages());
    }

    private Product findProduct(UUID productId) {
        return productRepo.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
    }

    private Category findCategory(Long categoryId) {
        return categoryRepo.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }

    private void applyBasicFields(Product product, ProductDto productDto) {
        product.setTitle(productDto.getTitle());
        product.setShortDesc(productDto.getShortDesc());
        product.setLongDesc(productDto.getLongDesc());
        product.setPrice(productDto.getPrice());
        product.setDiscount(productDto.getDiscount());
        if (productDto.getLive() != null) {
            product.setLive(productDto.getLive());
        }
        if (productDto.getProductImages() != null) {
            product.setProductImages(new ArrayList<>(productDto.getProductImages()));
        }
    }

    private List<Category> resolveCategories(List<CategoryDto> categoryDtos) {
        if (categoryDtos == null) {
            return new ArrayList<>();
        }
        List<Category> categories = new ArrayList<>();
        for (CategoryDto categoryDto : categoryDtos) {
            if (categoryDto.getId() == null) {
                Category category = new Category();
                category.setTitle(categoryDto.getTitle());
                categories.add(categoryRepo.save(category));
            } else {
                categories.add(findCategory(categoryDto.getId()));
            }
        }
        return categories;
    }

    private void syncCategoryLinks(Product product, List<Category> categories) {
        for (Category category : categories) {
            if (!category.getProducts().contains(product)) {
                category.getProducts().add(product);
            }
            categoryRepo.save(category);
        }
    }

    private List<String> uploadImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new InvalidRequestException("At least one product image is required");
        }
        List<String> uploadedUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            uploadedUrls.add(imageKitStorageService.upload(file));
        }
        return uploadedUrls;
    }

    private ProductDto toDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setTitle(product.getTitle());
        dto.setShortDesc(product.getShortDesc());
        dto.setLongDesc(product.getLongDesc());
        dto.setPrice(product.getPrice());
        dto.setDiscount(product.getDiscount());
        dto.setLive(product.getLive());
        dto.setProductImages(product.getProductImages() == null ? new ArrayList<>() : new ArrayList<>(product.getProductImages()));
        dto.setCategories(product.getCategories() == null ? new ArrayList<>() : product.getCategories().stream().map(this::toCategoryDtoShallow).collect(Collectors.toList()));
        dto.setReviews(product.getReviews() == null ? new ArrayList<>() : product.getReviews().stream().map(this::toReviewDtoShallow).collect(Collectors.toList()));
        return dto;
    }

    private CategoryDto toCategoryDtoShallow(Category category) {
        CategoryDto dto = new CategoryDto();
        dto.setId(category.getId());
        dto.setTitle(category.getTitle());
        dto.setProducts(new ArrayList<>());
        return dto;
    }

    private ReviewDto toReviewDtoShallow(Review review) {
        ReviewDto dto = new ReviewDto();
        dto.setId(review.getId());
        dto.setTitle(review.getTitle());
        dto.setComment(review.getComment());
        dto.setRating(review.getRating());
        dto.setProduct(null);
        return dto;
    }

    private ReviewDto toReviewDto(Review review) {
        ReviewDto dto = toReviewDtoShallow(review);
        if (review.getProduct() != null) {
            dto.setProduct(toProductDtoShallow(review.getProduct()));
        }
        return dto;
    }

    private ProductDto toProductDtoShallow(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setTitle(product.getTitle());
        dto.setShortDesc(product.getShortDesc());
        dto.setLongDesc(product.getLongDesc());
        dto.setPrice(product.getPrice());
        dto.setDiscount(product.getDiscount());
        dto.setLive(product.getLive());
        dto.setProductImages(product.getProductImages() == null ? new ArrayList<>() : new ArrayList<>(product.getProductImages()));
        dto.setCategories(new ArrayList<>());
        dto.setReviews(new ArrayList<>());
        return dto;
    }

    private PagedResponse<ProductDto> toPagedResponse(Page<ProductDto> page) {
        return new PagedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumberOfElements(),
                page.isFirst(),
                page.isLast()
        );
    }
}
