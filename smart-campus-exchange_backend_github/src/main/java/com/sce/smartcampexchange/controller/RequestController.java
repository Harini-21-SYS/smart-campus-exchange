package com.sce.smartcampexchange.controller;

import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.service.RequestService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    // Add Request
    @PostMapping
    public ResponseEntity<Request> addRequest(
            @RequestBody Request request) {

        Request savedRequest =
                requestService.addRequest(request);

        return new ResponseEntity<>(
                savedRequest,
                HttpStatus.CREATED);
    }

    // Get All Requests
    @GetMapping
    public ResponseEntity<List<Request>> getAllRequests() {

        return ResponseEntity.ok(
                requestService.getAllRequests());
    }

    // Get Request By ID
    @GetMapping("/{id}")
    public ResponseEntity<Request> getRequestById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                requestService.getRequestById(id));
    }

    // Update Request
    @PutMapping("/{id}")
    public ResponseEntity<Request> updateRequest(
            @PathVariable Long id,
            @RequestBody Request request) {

        return ResponseEntity.ok(
                requestService.updateRequest(id, request));
    }

    // Delete Request
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(
            @PathVariable Long id) {

        requestService.deleteRequest(id);

        return ResponseEntity.noContent().build();
    }
}
