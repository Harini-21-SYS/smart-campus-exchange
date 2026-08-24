package com.sce.smartcampexchange.repository;

import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductImageRepository
        extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProduct(Product product);
}