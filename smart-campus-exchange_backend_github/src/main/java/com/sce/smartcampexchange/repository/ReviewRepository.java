package com.sce.smartcampexchange.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Review;
import com.sce.smartcampexchange.entity.Student;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByRequest(Request request);

    Optional<Review> findByRequest(Request request);

    List<Review> findByRevieweeOrderByCreatedAtDesc(Student reviewee);

    // Needed by TrustScoreService.recalculate() for the rating bonus —
    // how many reviews this student has received as a seller.
    long countByReviewee(Student reviewee);

    // Plain AVG isn't one of Spring Data's derived-query keywords, so
    // this needs an explicit JPQL query. Returns null (not 0) when the
    // student has no reviews yet, which TrustScoreService already
    // checks for via the accompanying count.
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewee = :reviewee")
    Double findAverageRatingByReviewee(@Param("reviewee") Student reviewee);
}