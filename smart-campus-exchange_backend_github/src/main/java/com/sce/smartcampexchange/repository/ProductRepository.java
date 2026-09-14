package com.sce.smartcampexchange.repository;

import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.Student;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    List<Product> findByOwner(Student owner);

    List<Product> findByOwnerNot(Student owner);

    List<Product> findByStatus(String status);

    List<Product> findByOwnerAndStatus(
            Student owner,
            String status
    );
}