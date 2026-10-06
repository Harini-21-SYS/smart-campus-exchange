package com.sce.smartcampexchange.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.sce.smartcampexchange.entity.PickupSchedule;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.repository.PickupScheduleRepository;

// Runs every 2 minutes. Two jobs in one pass over every CONFIRMED
// pickup:
//   1. If the scheduled time is within the next 10 minutes and no
//      reminder has been sent yet, notify BOTH buyer and seller.
//   2. If the scheduled time has already passed, move the pickup to
//      BUYER_CONFIRMATION_PENDING and notify the buyer — this replaces
//      the seller having to manually call markAsHandedOver for the
//      normal flow; the deadline itself triggers it. (markAsHandedOver
//      still exists and still works if a seller wants to mark it early
//      for some reason.)
//
// FIX: was a 30-minute window checked every 5 minutes. Changed to a
// 10-minute window per the actual requirement. The poll interval was
// also tightened from 5 to 2 minutes — with a 10-minute window and a
// 5-minute poll, a reminder could fire anywhere from ~5 to ~10 minutes
// before the scheduled time depending on where the pickup's time fell
// between two poll cycles; a 2-minute poll keeps that slop down to
// ~8-10 minutes instead, closer to what "10 minutes before" implies.
@Component
public class PickupReminderScheduler {

    private final PickupScheduleRepository pickupScheduleRepository;
    private final NotificationService notificationService;

    public PickupReminderScheduler(
            PickupScheduleRepository pickupScheduleRepository,
            NotificationService notificationService) {

        this.pickupScheduleRepository = pickupScheduleRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 2 * 60 * 1000) // every 2 minutes
    public void checkPickups() {

        List<PickupSchedule> confirmedPickups =
                pickupScheduleRepository.findByStatus("CONFIRMED");

        LocalDateTime now = LocalDateTime.now();

        for (PickupSchedule pickup : confirmedPickups) {

            LocalDate date = pickup.getPickupDate();
            LocalTime time = pickup.getPickupTime();

            if (date == null || time == null) continue;

            LocalDateTime scheduledAt = LocalDateTime.of(date, time);
            Request request = pickup.getRequest();

            // ---- Deadline passed: hand off to buyer confirmation ----
            if (!scheduledAt.isAfter(now)) {

                pickup.setStatus("BUYER_CONFIRMATION_PENDING");
                pickup.setBuyerConfirmationSent(true);
                pickupScheduleRepository.save(pickup);

                notificationService.createNotification(
                        new StudentNotificationData(
                                request.getRequester().getStudentId(),
                                "STUDENT",
                                "BUYER_CONFIRMATION_REQUIRED",
                                pickup.getPickupId()
                        )
                );

                continue;
            }

            // ---- Within 10 minutes: send reminder once ----
            long minutesUntil = java.time.Duration.between(now, scheduledAt).toMinutes();

            if (minutesUntil <= 10 && !pickup.isReminderSent()) {

                pickup.setReminderSent(true);
                pickupScheduleRepository.save(pickup);

                notificationService.createNotification(
                        new StudentNotificationData(
                                request.getRequester().getStudentId(),
                                "STUDENT",
                                "PICKUP_REMINDER",
                                pickup.getPickupId()
                        )
                );

                notificationService.createNotification(
                        new StudentNotificationData(
                                request.getSeller().getStudentId(),
                                "STUDENT",
                                "PICKUP_REMINDER",
                                pickup.getPickupId()
                        )
                );
            }
        }
    }
}