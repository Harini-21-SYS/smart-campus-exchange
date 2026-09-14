package com.sce.smartcampexchange.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sce.smartcampexchange.entity.Exchange;
import com.sce.smartcampexchange.entity.Request;

@Repository
public interface ExchangeRepository
        extends JpaRepository<Exchange, Long> {

    Optional<Exchange> findByRequest(
            Request request);

    boolean existsByRequest(
            Request request);
}