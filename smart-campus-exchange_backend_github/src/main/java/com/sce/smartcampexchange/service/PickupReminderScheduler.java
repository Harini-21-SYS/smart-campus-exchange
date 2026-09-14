package com.sce.smartcampexchange.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.sce.smartcampexchange.entity.PickupSchedule;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.repository.PickupScheduleRepository;

@Component
public class PickupReminderScheduler {

    private final PickupScheduleRepository pickupScheduleRepository;

    private final NotificationService notificationService;


    public PickupReminderScheduler(
            PickupScheduleRepository pickupScheduleRepository,
            NotificationService notificationService) {

        this.pickupScheduleRepository =
                pickupScheduleRepository;

        this.notificationService =
                notificationService;
    }


    // =====================================================
    // RUN EVERY MINUTE
    // =====================================================

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void sendPickupReminders() {

        LocalDateTime now =
                LocalDateTime.now();


        // Get all scheduled pickups
        List<PickupSchedule> pickups =
                pickupScheduleRepository.findAll();


        for (PickupSchedule pickup : pickups) {

            // =============================================
            // ONLY SCHEDULED PICKUPS
            // =============================================

            if (!"SCHEDULED".equalsIgnoreCase(
                    pickup.getStatus())) {

                continue;
            }


            // =============================================
            // SKIP IF REMINDER ALREADY SENT
            // =============================================

            if (pickup.isReminderSent()) {

                continue;
            }


            // =============================================
            // CREATE PICKUP DATE TIME
            // =============================================

            LocalDateTime pickupDateTime =
                    LocalDateTime.of(
                            pickup.getPickupDate(),
                            pickup.getPickupTime()
                    );


            // =============================================
            // REMINDER TIME
            // =============================================

            LocalDateTime reminderTime =
                    pickupDateTime.minusMinutes(30);


            // =============================================
            // CHECK REMINDER TIME
            // =============================================

            if (!now.isBefore(reminderTime)
                    && now.isBefore(pickupDateTime)) {

                Request request =
                        pickup.getRequest();


                // =========================================
                // SELLER NOTIFICATION
                // =========================================

                notificationService.createNotification(

                        new StudentNotificationData(

                                request.getSeller()
                                        .getStudentId(),

                                "STUDENT",

                                "PICKUP_REMINDER",

                                pickup.getPickupId()
                        )
                );


                // =========================================
                // BUYER NOTIFICATION
                // =========================================

                notificationService.createNotification(

                        new StudentNotificationData(

                                request.getRequester()
                                        .getStudentId(),

                                "STUDENT",

                                "PICKUP_REMINDER",

                                pickup.getPickupId()
                        )
                );


                // =========================================
                // MARK REMINDER AS SENT
                // =========================================

                pickup.setReminderSent(true);

                pickupScheduleRepository.save(pickup);


                System.out.println(
                        "Pickup reminder sent for Pickup ID: "
                                + pickup.getPickupId()
                );
            }
        }
    }
}