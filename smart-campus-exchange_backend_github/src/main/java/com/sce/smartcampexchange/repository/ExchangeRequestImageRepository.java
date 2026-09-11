package com.sce.smartcampexchange.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sce.smartcampexchange.entity.ExchangeRequestImage;
import com.sce.smartcampexchange.entity.Request;

public interface ExchangeRequestImageRepository
        extends JpaRepository<ExchangeRequestImage, Long> {

    List<ExchangeRequestImage> findByRequest(
            Request request
    );
}