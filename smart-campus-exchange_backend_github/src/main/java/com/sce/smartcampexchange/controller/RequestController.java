package com.sce.smartcampexchange.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sce.smartcampexchange.dto.AcceptRequestRequest;
import com.sce.smartcampexchange.dto.RequestResponse;
import com.sce.smartcampexchange.dto.CreateRequestRequest;
import com.sce.smartcampexchange.service.RequestService;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    // =========================================================
    // CREATE REQUEST
    // =========================================================

    @PostMapping
    public ResponseEntity<RequestResponse> addRequest(
            @RequestBody CreateRequestRequest request) {

        return new ResponseEntity<>(
                requestService.addRequest(request),
                HttpStatus.CREATED
        );
    }

    // =========================================================
    // GET ALL REQUESTS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<RequestResponse>> getAllRequests() {

        return ResponseEntity.ok(
                requestService.getAllRequests()
        );
    }

    // =========================================================
    // MY REQUESTS
    // =========================================================

    @GetMapping("/my")
    public ResponseEntity<List<RequestResponse>> getMyRequests() {

        return ResponseEntity.ok(
                requestService.getMyRequests()
        );
    }

    // =========================================================
    // INCOMING REQUESTS
    // =========================================================

    @GetMapping("/incoming")
    public ResponseEntity<List<RequestResponse>> getIncomingRequests() {

        return ResponseEntity.ok(
                requestService.getIncomingRequests()
        );
    }

    // =========================================================
    // GET REQUEST BY ID
    // Used by getRequestById() in requestService.js to fetch pickup
    // details for a REQUEST_ACCEPTED notification.
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<RequestResponse> getRequestById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                requestService.getRequestById(id)
        );
    }

    // =========================================================
    // ACCEPT REQUEST + CREATE PICKUP SCHEDULE
    // =========================================================

    @PutMapping("/{id}/accept")
    public ResponseEntity<RequestResponse> acceptRequest(
            @PathVariable Long id,
            @RequestBody AcceptRequestRequest acceptRequestRequest) {

        return ResponseEntity.ok(
                requestService.acceptRequest(
                        id,
                        acceptRequestRequest
                )
        );
    }

    // =========================================================
    // REJECT REQUEST
    // =========================================================

    @PutMapping("/{id}/reject")
    public ResponseEntity<RequestResponse> rejectRequest(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                requestService.rejectRequest(id)
        );
    }

    // =========================================================
    // DELETE REQUEST
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(
            @PathVariable Long id) {

        requestService.deleteRequest(id);

        return ResponseEntity.noContent().build();
    }
}