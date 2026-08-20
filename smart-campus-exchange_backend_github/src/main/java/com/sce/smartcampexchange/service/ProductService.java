package com.sce.smartcampexchange.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.sce.smartcampexchange.dto.ProductImageResponse;
import com.sce.smartcampexchange.dto.ProductRequest;
import com.sce.smartcampexchange.dto.ProductResponse;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.ProductImageRepository;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.StudentRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    private final ProductImageRepository productImageRepository;

    private final StudentRepository studentRepository;

    public ProductService(
            ProductRepository productRepository,
            ProductImageRepository productImageRepository,
            StudentRepository studentRepository) {

        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.studentRepository = studentRepository;
    }

    // =========================================================
    // Get Logged-in Student
    // =========================================================

    private Student getLoggedInStudent() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated");
        }

        String email = authentication.getName();

        return studentRepository
                .findByCollegeEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Logged-in student not found"));
    }

    // =========================================================
    // Add Product
    // =========================================================

    public ProductResponse addProduct(ProductRequest request) {

        Student student = getLoggedInStudent();

        Product product = new Product();

        // Set logged-in student as owner
        product.setOwner(student);

        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setType(request.getType());
        product.setPrice(request.getPrice());
        product.setCondition(request.getCondition());

        // Product requires admin approval
        product.setStatus("PENDING");

        Product savedProduct =
                productRepository.save(product);

        List<ProductImageResponse> imageResponses =
                new ArrayList<>();

        if (request.getImageUrls() != null) {

            boolean firstImage = true;

            for (String imageUrl : request.getImageUrls()) {

                ProductImage image =
                        new ProductImage();

                image.setProduct(savedProduct);
                image.setImageUrl(imageUrl);
                image.setPrimary(firstImage);

                ProductImage savedImage =
                        productImageRepository.save(image);

                imageResponses.add(
                        new ProductImageResponse(
                                savedImage.getId(),
                                savedImage.getImageUrl(),
                                savedImage.isPrimary()
                        )
                );

                firstImage = false;
            }
        }

        return new ProductResponse(
                savedProduct.getId(),

                savedProduct.getOwner().getStudentId(),

                savedProduct.getOwner().getFullName(),

                savedProduct.getTitle(),
                savedProduct.getDescription(),
                savedProduct.getCategory(),
                savedProduct.getType(),
                savedProduct.getPrice(),
                savedProduct.getCondition(),
                savedProduct.getStatus(),
                savedProduct.getCreatedAt(),
                savedProduct.getUpdatedAt(),

                imageResponses
        );
    }

    // =========================================================
    // Get All Products
    // =========================================================

    public List<ProductResponse> getAllProducts() {

        List<Product> products =
                productRepository.findAll();

        List<ProductResponse> responses =
                new ArrayList<>();

        for (Product product : products) {

            responses.add(
                    convertToProductResponse(product)
            );
        }

        return responses;
    }

    // =========================================================
    // Get Product By ID
    // =========================================================

    public ProductResponse getProductById(Long id) {

        Product product =
                productRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Product not found with id: "
                                                + id));

        return convertToProductResponse(product);
    }

    // =========================================================
    // Update Product
    // =========================================================

    public ProductResponse updateProduct(
            Long id,
            ProductRequest request) {

        Student loggedInStudent =
                getLoggedInStudent();

        Product product =
                productRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Product not found with id: "
                                                + id));

        // Ownership check
        if (!product.getOwner()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to update this product");
        }

        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setType(request.getType());
        product.setPrice(request.getPrice());
        product.setCondition(request.getCondition());

        Product updatedProduct =
                productRepository.save(product);

        return convertToProductResponse(
                updatedProduct
        );
    }

    // =========================================================
    // Delete Product
    // =========================================================

    public void deleteProduct(Long id) {

        Student loggedInStudent =
                getLoggedInStudent();

        Product product =
                productRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Product not found with id: "
                                                + id));

        // Ownership check
        if (!product.getOwner()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to delete this product");
        }

        productRepository.delete(product);
    }

    // =========================================================
    // Convert Product Entity → ProductResponse
    // =========================================================

    private ProductResponse convertToProductResponse(
            Product product) {

        List<ProductImageResponse> imageResponses =
                new ArrayList<>();

        if (product.getImages() != null) {

            for (ProductImage image :
                    product.getImages()) {

                imageResponses.add(
                        new ProductImageResponse(
                                image.getId(),
                                image.getImageUrl(),
                                image.isPrimary()
                        )
                );
            }
        }

        Long ownerId = null;

        String ownerName = null;

        if (product.getOwner() != null) {

            ownerId =
                    product.getOwner().getStudentId();

            ownerName =
                    product.getOwner().getFullName();
        }

        return new ProductResponse(
                product.getId(),
                ownerId,
                ownerName,
                product.getTitle(),
                product.getDescription(),
                product.getCategory(),
                product.getType(),
                product.getPrice(),
                product.getCondition(),
                product.getStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt(),
                imageResponses
        );
    }
}