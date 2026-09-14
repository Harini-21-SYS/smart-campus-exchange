package com.sce.smartcampexchange.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sce.smartcampexchange.entity.Notification;
import com.sce.smartcampexchange.entity.Student;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification>
    findByStudentOrderByCreatedAtDesc(
            Student student
    );
    long countByStudentAndIsReadFalse(Student student);
}