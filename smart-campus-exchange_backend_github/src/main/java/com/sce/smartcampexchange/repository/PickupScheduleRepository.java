package com.sce.smartcampexchange.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sce.smartcampexchange.entity.PickupSchedule;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;

public interface PickupScheduleRepository
        extends JpaRepository<PickupSchedule, Long> {

    Optional<PickupSchedule> findByRequest(
            Request request
    );

    boolean existsByRequest(
            Request request
    );

    // FIX: needed by the new reminder/deadline scheduled job to find
    // every CONFIRMED pickup so it can check which ones are within 30
    // minutes of their scheduled time, or already past it.
    List<PickupSchedule> findByStatus(String status);


    // =========================================================
    // TRUST SCORE SUPPORT
    //
    // Counts how many times a buyer reported that this student, acting
    // as the seller, failed to deliver properly. The pickup itself has
    // no seller column, so the count walks through the linked request.
    // =========================================================

    @Query("SELECT COUNT(p) FROM PickupSchedule p " +
           "WHERE p.request.seller = :student " +
           "AND UPPER(p.status) = 'DELIVERY_ISSUE'")
    long countDeliveryIssuesAgainstSeller(@Param("student") Student student);
}