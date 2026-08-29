package com.sce.smartcampexchange.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.entity.TrustScore;

public interface TrustScoreRepository
        extends JpaRepository<TrustScore, Long> {

    Optional<TrustScore> findByStudent(Student student);

    Optional<TrustScore> findByStudentStudentId(Long studentId);
}