package com.sce.smartcampexchange.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sce.smartcampexchange.entity.Notification;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.NotificationRepository;
import com.sce.smartcampexchange.repository.StudentRepository;
import java.util.ArrayList;

import com.sce.smartcampexchange.dto.NotificationResponse;
@Service
public class NotificationServiceImpl
        implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final StudentRepository studentRepository;


    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            StudentRepository studentRepository) {

        this.notificationRepository = notificationRepository;
        this.studentRepository = studentRepository;
    }


    // =========================================================
    // CREATE NOTIFICATION
    // =========================================================

    @Override
    @Transactional
    public Notification createNotification(
            StudentNotificationData data) {

        if (data == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Notification data is required");
        }


        // -----------------------------------------------------
        // Find recipient student
        // -----------------------------------------------------

        Student student =
                studentRepository.findById(
                        data.getStudentId()
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Student not found"));


        // -----------------------------------------------------
        // Create notification
        // -----------------------------------------------------
        Notification notification = new Notification();

        notification.setStudent(student);

        notification.setStdId(
                student.getStudentId()
        );

        notification.setNotifyType(
                data.getNotifyType()
        );

        notification.setRecipientType(
                data.getRecipientType()
        );

        notification.setRelatedId(
                data.getRelatedId()
        );

        notification.setIsRead(false);

        return notificationRepository.save(
                notification
        );
    }


    // =========================================================
    // GET MY NOTIFICATIONS
    // =========================================================

    @Override
@Transactional(readOnly = true)
public List<NotificationResponse> getMyNotifications() {

    Authentication authentication =
            SecurityContextHolder
                    .getContext()
                    .getAuthentication();


    if (authentication == null ||
            !authentication.isAuthenticated()) {

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "User is not authenticated");
    }


    String email =
            authentication.getName();


    Student student =
            studentRepository
                    .findByCollegeEmail(email)
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.UNAUTHORIZED,
                                    "Student not found"));


    List<Notification> notifications =
            notificationRepository
                    .findByStudentOrderByCreatedAtDesc(
                            student
                    );


    List<NotificationResponse> responses =
            new ArrayList<>();


    for (Notification notification : notifications) {

        responses.add(
                convertToResponse(notification)
        );
    }


    return responses;
}
    @Override
    @Transactional(readOnly = true)
    public long getUnreadNotificationCount() {

        // Get authentication
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }


        // Get logged-in email
        String email = authentication.getName();


        // Find logged-in student
        Student student =
                studentRepository
                        .findByCollegeEmail(email)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Student not found"
                                )
                        );


        // Count unread notifications
        return notificationRepository
                .countByStudentAndIsReadFalse(student);
    }
    
    @Override
    @Transactional
    public void markAllNotificationsAsRead() {

        // Get logged-in student
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        String email = authentication.getName();

        Student student =
                studentRepository
                        .findByCollegeEmail(email)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Student not found"
                                )
                        );

        // Get all notifications of logged-in student
        List<Notification> notifications =
                notificationRepository
                        .findByStudentOrderByCreatedAtDesc(student);

        // Mark all as read
        for (Notification notification : notifications) {

            if (!notification.getIsRead()) {
                notification.setIsRead(true);
            }
        }

        // Save changes
        notificationRepository.saveAll(notifications);
    }
    
 // =========================================================
 // CONVERT TO RESPONSE
 // =========================================================

 private NotificationResponse convertToResponse(
         Notification notification) {

     return new NotificationResponse(

             notification.getNotifyId(),

             notification.getStudent() != null
                     ? notification.getStudent().getStudentId()
                     : null,

             notification.getNotifyType(),

             notification.getRecipientType(),

             notification.getRelatedId(),

             notification.getIsRead(),

             notification.getCreatedAt()
     );
 }   
 @Override
 @Transactional
 public NotificationResponse markAsRead(Long notificationId) {

     // Find notification
     Notification notification =
             notificationRepository
                     .findById(notificationId)
                     .orElseThrow(() ->
                             new ResponseStatusException(
                                     HttpStatus.NOT_FOUND,
                                     "Notification not found"
                             )
                     );


     // Get logged-in student
     Authentication authentication =
             SecurityContextHolder
                     .getContext()
                     .getAuthentication();


     if (authentication == null ||
             !authentication.isAuthenticated()) {

         throw new ResponseStatusException(
                 HttpStatus.UNAUTHORIZED,
                 "User is not authenticated"
         );
     }


     String email = authentication.getName();


     Student loggedInStudent =
             studentRepository
                     .findByCollegeEmail(email)
                     .orElseThrow(() ->
                             new ResponseStatusException(
                                     HttpStatus.UNAUTHORIZED,
                                     "Student not found"
                             )
                     );


     // Check notification belongs to logged-in student
     if (!notification.getStudent()
             .getStudentId()
             .equals(loggedInStudent.getStudentId())) {

         throw new ResponseStatusException(
                 HttpStatus.FORBIDDEN,
                 "You are not allowed to update this notification"
         );
     }


     // Mark as read
     notification.setIsRead(true);


     // Save
     Notification savedNotification =
             notificationRepository.save(notification);


     return convertToResponse(savedNotification);
 }
 
}