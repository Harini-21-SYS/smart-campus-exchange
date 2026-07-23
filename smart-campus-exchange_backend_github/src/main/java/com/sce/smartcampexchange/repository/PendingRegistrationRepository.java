package com.sce.smartcampexchange.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sce.smartcampexchange.entity.PendingRegistration;

@Repository
public interface PendingRegistrationRepository
        extends JpaRepository<PendingRegistration, Long> {

    Optional<PendingRegistration> findByCollegeEmail(
            String collegeEmail);

    boolean existsByCollegeEmail(
            String collegeEmail);
}