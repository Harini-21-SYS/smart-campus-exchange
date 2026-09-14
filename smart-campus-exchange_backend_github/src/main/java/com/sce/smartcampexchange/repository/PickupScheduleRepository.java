package com.sce.smartcampexchange.repository;

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
}