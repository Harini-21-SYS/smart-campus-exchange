package com.sce.smartcampexchange.controller;

import com.sce.smartcampexchange.dto.NotificationRequest;
import com.sce.smartcampexchange.dto.NotificationResponse;
import com.sce.smartcampexchange.service.NotificationService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService = notificationService;
    }

    // =========================
    // Add Notification
    // =========================

    @PostMapping
    public ResponseEntity<NotificationResponse> addNotification(
            @RequestBody NotificationRequest request) {

        NotificationResponse response =
                notificationService.addNotification(request);

        return new ResponseEntity<>(
                response,
                HttpStatus.CREATED
        );
    }

    // =========================
    // Get All Notifications
    // =========================

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAllNotifications() {

        return ResponseEntity.ok(
                notificationService.getAllNotifications()
        );
    }

    // =========================
    // Get Notification By ID
    // =========================

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getNotificationById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                notificationService.getNotificationById(id)
        );
    }

    // =========================
    // Delete Notification
    // =========================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id) {

        notificationService.deleteNotification(id);

        return ResponseEntity.noContent().build();
    }
}