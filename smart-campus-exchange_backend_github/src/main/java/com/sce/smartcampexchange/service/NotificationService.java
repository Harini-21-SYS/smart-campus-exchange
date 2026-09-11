package com.sce.smartcampexchange.service;

import java.util.List;

import com.sce.smartcampexchange.dto.NotificationResponse;
import com.sce.smartcampexchange.entity.Notification;

public interface NotificationService {

    // ==========================================
    // CREATE NOTIFICATION
    // ==========================================

    Notification createNotification(
            StudentNotificationData data
    );


    // ==========================================
    // GET MY NOTIFICATIONS
    // ==========================================

    List<NotificationResponse> getMyNotifications();


    // ==========================================
    // MARK ONE NOTIFICATION AS READ
    // ==========================================

    NotificationResponse markAsRead(
            Long notificationId
    );


    // ==========================================
    // MARK ALL NOTIFICATIONS AS READ
    // ==========================================

    void markAllNotificationsAsRead();


    // ==========================================
    // GET UNREAD NOTIFICATION COUNT
    // ==========================================

    long getUnreadNotificationCount();

}