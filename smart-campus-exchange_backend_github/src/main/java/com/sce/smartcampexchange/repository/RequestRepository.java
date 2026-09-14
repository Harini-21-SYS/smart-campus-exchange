package com.sce.smartcampexchange.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;

public interface RequestRepository
        extends JpaRepository<Request, Long> {

    // My Requests
    List<Request> findByRequesterOrderByCreatedAtDesc(
            Student requester
    );

    // Incoming Requests
    List<Request> findBySellerOrderByCreatedAtDesc(
            Student seller
    );

    // Get all requests for a product
    List<Request> findByProduct(
            Product product
    );

    // Check completed BUY or DONATE transaction
    boolean existsByRequesterAndRequestTypeAndStatus(
            Student requester,
            String requestType,
            String status
    );
}