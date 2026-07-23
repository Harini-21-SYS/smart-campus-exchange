package com.sce.smartcampexchange.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sce.smartcampexchange.entity.Student;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    boolean existsByCollegeEmail(String collegeEmail);

    boolean existsByRegisterNumber(String registerNumber);

    boolean existsByMobileNumber(String mobileNumber);

    Optional<Student> findByCollegeEmail(String collegeEmail);
}