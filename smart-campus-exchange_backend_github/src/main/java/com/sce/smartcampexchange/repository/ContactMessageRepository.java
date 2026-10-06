package com.sce.smartcampexchange.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sce.smartcampexchange.entity.ContactMessage;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

    List<ContactMessage> findAllByOrderByCreatedAtDesc();
}