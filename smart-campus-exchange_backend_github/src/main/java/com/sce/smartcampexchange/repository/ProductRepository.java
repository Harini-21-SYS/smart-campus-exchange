package com.sce.smartcampexchange.repository;

import com.sce.smartcampexchange.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}