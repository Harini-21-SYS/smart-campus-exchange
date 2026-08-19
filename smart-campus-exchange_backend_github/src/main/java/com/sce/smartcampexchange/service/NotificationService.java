package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.entity.Notification;

import java.util.List;

public interface NotificationService {

    Notification addNotification(Notification notification);

    List<Notification> getAllNotifications();

    Notification getNotificationById(Long id);

    Notification updateNotification(Long id, Notification notification);

    void deleteNotification(Long id);
}