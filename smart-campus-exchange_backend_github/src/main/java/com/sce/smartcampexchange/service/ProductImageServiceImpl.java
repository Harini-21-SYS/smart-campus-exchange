package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;
import com.sce.smartcampexchange.repository.ProductImageRepository;
import com.sce.smartcampexchange.repository.ProductRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductImageServiceImpl implements ProductImageService {

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;

    public ProductImageServiceImpl(
            ProductImageRepository productImageRepository,
            ProductRepository productRepository) {

        this.productImageRepository = productImageRepository;
        this.productRepository = productRepository;
    }

    @Override
    public ProductImage addImage(ProductImage productImage) {

        Long productId = productImage.getProduct().getId();

        Product existingProduct = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: " + productId));

        productImage.setProduct(existingProduct);

        return productImageRepository.save(productImage);
    }

    @Override
    public List<ProductImage> getAllImages() {
        return productImageRepository.findAll();
    }

    @Override
    public ProductImage getImageById(Long id) {

        return productImageRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product image not found with id: " + id));
    }

    @Override
    public void deleteImage(Long id) {

        ProductImage existingImage = getImageById(id);

        productImageRepository.delete(existingImage);
    }
}