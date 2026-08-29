package com.sce.smartcampexchange.controller;

import com.sce.smartcampexchange.entity.ProductImage;
import com.sce.smartcampexchange.service.ProductImageService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-images")
public class ProductImageController {

    private final ProductImageService productImageService;

    public ProductImageController(
            ProductImageService productImageService) {

        this.productImageService = productImageService;
    }

    // Add Product Image
    @PostMapping
    public ResponseEntity<ProductImage> addImage(
            @RequestBody ProductImage productImage) {

        ProductImage savedImage =
                productImageService.addImage(productImage);

        return new ResponseEntity<>(
                savedImage,
                HttpStatus.CREATED);
    }

    // Get All Product Images
    @GetMapping
    public ResponseEntity<List<ProductImage>> getAllImages() {

        return ResponseEntity.ok(
                productImageService.getAllImages());
    }

    // Get Product Image By ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductImage> getImageById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                productImageService.getImageById(id));
    }

    // Delete Product Image
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable Long id) {

        productImageService.deleteImage(id);

        return ResponseEntity.noContent().build();
    }
    
}