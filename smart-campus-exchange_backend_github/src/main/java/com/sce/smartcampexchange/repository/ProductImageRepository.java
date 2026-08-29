package com.sce.smartcampexchange.repository;

<<<<<<< HEAD
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
=======
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;
>>>>>>> f8b079a (Product backend)

public interface ProductImageRepository
        extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProduct(Product product);
}