package com.sce.smartcampexchange.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sce.smartcampexchange.entity.PickupSchedule;
import com.sce.smartcampexchange.entity.Request;

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
}