package com.sce.smartcampexchange.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sce.smartcampexchange.dto.ExchangeRequest;
import com.sce.smartcampexchange.entity.Exchange;
import com.sce.smartcampexchange.service.ExchangeService;

@RestController
@RequestMapping("/api/exchanges")
public class ExchangeController {

    private final ExchangeService exchangeService;


    public ExchangeController(
            ExchangeService exchangeService) {

        this.exchangeService =
                exchangeService;
    }


    // =========================================================
    // Create Exchange Request
    // =========================================================

    @PostMapping
    public ResponseEntity<Exchange>
    createExchange(
            @RequestBody ExchangeRequest request) {

        Exchange exchange =
                exchangeService.createExchange(
                        request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(exchange);
    }


    // =========================================================
    // Get Exchange
    // =========================================================

    @GetMapping("/{exchangeId}")
    public ResponseEntity<Exchange>
    getExchange(
            @PathVariable Long exchangeId) {

        return ResponseEntity.ok(
                exchangeService.getExchangeById(
                        exchangeId));
    }


    // =========================================================
    // Accept Exchange
    // =========================================================

    @PutMapping("/{exchangeId}/accept")
    public ResponseEntity<Exchange>
    acceptExchange(
            @PathVariable Long exchangeId) {

        return ResponseEntity.ok(
                exchangeService.acceptExchange(
                        exchangeId));
    }


    // =========================================================
    // Reject Exchange
    // =========================================================

    @PutMapping("/{exchangeId}/reject")
    public ResponseEntity<Exchange>
    rejectExchange(
            @PathVariable Long exchangeId) {

        return ResponseEntity.ok(
                exchangeService.rejectExchange(
                        exchangeId));
    }
}