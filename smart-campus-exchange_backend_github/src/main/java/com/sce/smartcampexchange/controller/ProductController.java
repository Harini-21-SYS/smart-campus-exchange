package com.sce.smartcampexchange.controller;

import com.sce.smartcampexchange.dto.ProductRequest;
import com.sce.smartcampexchange.dto.ProductResponse;
import com.sce.smartcampexchange.service.ProductService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // Add Product
    @PostMapping
    public ResponseEntity<ProductResponse> addProduct(
            @RequestBody ProductRequest request) {

        ProductResponse response =
                productService.addProduct(request);

        return new ResponseEntity<>(
                response,
                HttpStatus.CREATED
        );
    }

    // Get All Products
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {

        return ResponseEntity.ok(
                productService.getAllProducts()
        );
    }

    // Get Product By ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                productService.getProductById(id)
        );
    }

    // Update Product
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductRequest request) {

        return ResponseEntity.ok(
                productService.updateProduct(id, request)
        );
    }

    // Delete Product
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id) {

        productService.deleteProduct(id);

        return ResponseEntity.noContent().build();
    }
}