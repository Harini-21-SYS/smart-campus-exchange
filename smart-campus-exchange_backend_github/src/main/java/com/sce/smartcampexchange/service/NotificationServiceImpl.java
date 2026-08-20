package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.entity.Notification;
import com.sce.smartcampexchange.repository.NotificationRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository) {

        this.notificationRepository = notificationRepository;
    }

    @Override
    public Notification addNotification(Notification notification) {

        return notificationRepository.save(notification);
    }

    @Override
    public List<Notification> getAllNotifications() {

        return notificationRepository.findAll();
    }

    @Override
    public Notification getNotificationById(Long id) {

        return notificationRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Notification not found with id: " + id));
    }

    @Override
    public Notification updateNotification(
            Long id,
            Notification notification) {

        Notification existingNotification =
                getNotificationById(id);

        existingNotification.setRecipientType(
                notification.getRecipientType());

        existingNotification.setStudent(
                notification.getStudent());

        existingNotification.setNotifyType(
                notification.getNotifyType());

        existingNotification.setRelatedId(
                notification.getRelatedId());

        existingNotification.setRead(
                notification.isRead());

        return notificationRepository.save(
                existingNotification);
    }

    @Override
    public void deleteNotification(Long id) {

        Notification existingNotification =
                getNotificationById(id);

        notificationRepository.delete(
                existingNotification);
    }
}