package com.sce.smartcampexchange.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Review;
import com.sce.smartcampexchange.entity.Student;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByRequest(Request request);

    Optional<Review> findByRequest(Request request);

    List<Review> findByRevieweeOrderByCreatedAtDesc(Student reviewee);
}