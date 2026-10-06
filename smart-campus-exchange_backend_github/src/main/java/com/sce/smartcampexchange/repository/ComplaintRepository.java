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


    // =========================================
    // TRUST SCORE SUPPORT
    //
    // A complaint only counts against a student's trust score when the
    // admin actually upheld it, which in this system means resolving it
    // with a warning note attached. A complaint that was resolved
    // without a warning was decided in the student's favour and is not
    // penalised.
    //
    // Complaints still awaiting a decision apply a smaller temporary
    // penalty that disappears once the admin resolves them.
    // =========================================

    long countByAgainstStudentAndStatusAndWarningNoteIsNotNull(
            Student againstStudent,
            String status
    );

    long countByAgainstStudentAndStatusNot(
            Student againstStudent,
            String status
    );
}