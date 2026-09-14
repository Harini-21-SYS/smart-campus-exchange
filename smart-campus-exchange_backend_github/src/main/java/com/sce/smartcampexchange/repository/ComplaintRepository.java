package com.sce.smartcampexchange.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sce.smartcampexchange.entity.Complaint;
import com.sce.smartcampexchange.entity.Student;

@Repository
public interface ComplaintRepository
        extends JpaRepository<Complaint, Long> {

    // =========================================
    // GET COMPLAINTS RAISED BY A STUDENT
    // =========================================

    List<Complaint> findByStudentOrderByCreatedAtDesc(
            Student student
    );


    // =========================================
    // GET COMPLAINTS AGAINST A STUDENT
    // =========================================

    List<Complaint> findByAgainstStudentOrderByCreatedAtDesc(
            Student againstStudent
    );


    // =========================================
    // GET COMPLAINTS BY STATUS
    // =========================================

    List<Complaint> findByStatusOrderByCreatedAtDesc(
            String status
    );


    // =========================================
    // GET COMPLAINTS FOR A REQUEST
    // =========================================

    List<Complaint> findByRequest_IdOrderByCreatedAtDesc(
            Long requestId
    );
}