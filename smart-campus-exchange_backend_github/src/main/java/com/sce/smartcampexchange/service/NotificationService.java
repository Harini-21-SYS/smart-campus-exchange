package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.dto.NotificationRequest;
import com.sce.smartcampexchange.dto.NotificationResponse;

import java.util.List;

public interface NotificationService {

    NotificationResponse addNotification(
            NotificationRequest request);

    List<NotificationResponse> getAllNotifications();

    NotificationResponse getNotificationById(Long id);

    void deleteNotification(Long id);
}