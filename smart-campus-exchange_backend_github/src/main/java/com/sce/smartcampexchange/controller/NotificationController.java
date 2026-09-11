package com.sce.smartcampexchange.controller;

import java.util.List;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import com.sce.smartcampexchange.service.NotificationService;
import com.sce.smartcampexchange.dto.NotificationResponse;
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;


    public NotificationController(
            NotificationService notificationService) {

        this.notificationService =
                notificationService;
    }


    // =========================================================
    // GET MY NOTIFICATIONS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<NotificationResponse>>
            getMyNotifications() {

        return ResponseEntity.ok(
                notificationService.getMyNotifications()
        );
    }
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long notificationId) {

        return ResponseEntity.ok(
                notificationService
                        .markAsRead(notificationId)
        );
    }
    
    // =========================================================
    // MARK ALL NOTIFICATIONS AS READ
    // =========================================================

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {

    	notificationService.markAllNotificationsAsRead();

        return ResponseEntity.ok().build();
    }
    
 // =========================================================
 // GET UNREAD NOTIFICATION COUNT
 // =========================================================

 @GetMapping("/unread-count")
 public ResponseEntity<Long> getUnreadNotificationCount() {

     return ResponseEntity.ok(
             notificationService.getUnreadNotificationCount()
     );
 }
 
}