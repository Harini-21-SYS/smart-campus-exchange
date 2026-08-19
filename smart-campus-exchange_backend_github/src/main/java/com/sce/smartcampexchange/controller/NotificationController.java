package com.sce.smartcampexchange.controller;

import com.sce.smartcampexchange.entity.Notification;
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

    // Add Notification
    @PostMapping
    public ResponseEntity<Notification> addNotification(
            @RequestBody Notification notification) {

        Notification savedNotification =
                notificationService.addNotification(notification);

        return new ResponseEntity<>(
                savedNotification,
                HttpStatus.CREATED);
    }

    // Get All Notifications
    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {

        return ResponseEntity.ok(
                notificationService.getAllNotifications());
    }

    // Get Notification By ID
    @GetMapping("/{id}")
    public ResponseEntity<Notification> getNotificationById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                notificationService.getNotificationById(id));
    }

    // Delete Notification
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id) {

        notificationService.deleteNotification(id);

        return ResponseEntity.noContent().build();
    }
}