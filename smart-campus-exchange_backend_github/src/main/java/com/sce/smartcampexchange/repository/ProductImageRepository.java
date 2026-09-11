package com.sce.smartcampexchange.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;

public interface ProductImageRepository
        extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProduct(Product product);
}