package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.dto.NotificationRequest;
import com.sce.smartcampexchange.dto.NotificationResponse;
import com.sce.smartcampexchange.entity.Notification;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.NotificationRepository;
import com.sce.smartcampexchange.repository.StudentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final StudentRepository studentRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            StudentRepository studentRepository) {

        this.notificationRepository = notificationRepository;
        this.studentRepository = studentRepository;
    }

    // =========================
    // Add Notification
    // =========================

    @Override
    public NotificationResponse addNotification(
            NotificationRequest request) {

        Student student =
                studentRepository.findById(request.getStudentId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Student not found with id: "
                                                + request.getStudentId()
                                ));

        Notification notification =
                new Notification();

        notification.setStudent(student);
        notification.setRecipientType(
                request.getRecipientType()
        );
        notification.setNotifyType(
                request.getNotifyType()
        );
        notification.setRelatedId(
                request.getRelatedId()
        );

        // @PrePersist automatically sets isRead = false
        Notification savedNotification =
                notificationRepository.save(notification);

        return convertToResponse(savedNotification);
    }

    // =========================
    // Get All Notifications
    // =========================

    @Override
    public List<NotificationResponse> getAllNotifications() {

        List<Notification> notifications =
                notificationRepository.findAll();

        List<NotificationResponse> responses =
                new ArrayList<>();

        for (Notification notification : notifications) {

            responses.add(
                    convertToResponse(notification)
            );
        }

        return responses;
    }

    // =========================
    // Get Notification By ID
    // =========================

    @Override
    public NotificationResponse getNotificationById(Long id) {

        Notification notification =
                notificationRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Notification not found with id: "
                                                + id
                                ));

        return convertToResponse(notification);
    }

    // =========================
    // Delete Notification
    // =========================

    @Override
    public void deleteNotification(Long id) {

        Notification notification =
                notificationRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Notification not found with id: "
                                                + id
                                ));

        notificationRepository.delete(notification);
    }

    // =========================
    // Convert Entity → Response
    // =========================

    private NotificationResponse convertToResponse(
            Notification notification) {

        Long studentId = null;
        String studentName = null;

        if (notification.getStudent() != null) {

            studentId =
                    notification.getStudent().getStudentId();

            studentName =
                    notification.getStudent().getFullName();
        }

        return new NotificationResponse(

                notification.getId(),

                studentId,

                studentName,

                notification.getRecipientType(),

                notification.getNotifyType(),

                notification.getRelatedId(),

                notification.isRead(),

                notification.getCreatedAt()
        );
    }
}