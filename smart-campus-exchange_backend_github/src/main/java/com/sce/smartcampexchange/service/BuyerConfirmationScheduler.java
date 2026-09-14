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
public class BuyerConfirmationScheduler {

    private final PickupScheduleRepository
            pickupScheduleRepository;

    private final NotificationService
            notificationService;


    public BuyerConfirmationScheduler(

            PickupScheduleRepository
                    pickupScheduleRepository,

            NotificationService
                    notificationService) {

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
    public void sendBuyerConfirmationNotification() {

        LocalDateTime now =
                LocalDateTime.now();


        List<PickupSchedule> pickups =
                pickupScheduleRepository.findAll();


        for (PickupSchedule pickup : pickups) {


            // =============================================
            // ONLY HANDED OVER PICKUPS
            // =============================================

            if (!"HANDED_OVER".equalsIgnoreCase(
                    pickup.getStatus())) {

                continue;
            }


            // =============================================
            // SKIP IF ALREADY SENT
            // =============================================

            if (pickup.isBuyerConfirmationSent()) {

                continue;
            }


            // =============================================
            // HANDOVER TIME REQUIRED
            // =============================================

            if (pickup.getDeliveredAt() == null) {

                continue;
            }


            // =============================================
            // 1 HOUR AFTER HANDOVER
            // =============================================

            LocalDateTime confirmationTime =
                    pickup.getDeliveredAt()
                            .plusHours(1);


            // =============================================
            // CHECK TIME
            // =============================================

            if (!now.isBefore(confirmationTime)) {


                Request request =
                        pickup.getRequest();


                // =========================================
                // NOTIFY BUYER ONLY
                // =========================================

                notificationService.createNotification(

                        new StudentNotificationData(

                                request.getRequester()
                                        .getStudentId(),

                                "STUDENT",

                                "BUYER_CONFIRMATION",

                                pickup.getPickupId()
                        )
                );


                pickup.setStatus(
                        "BUYER_CONFIRMATION_PENDING"
                );
                
                // =========================================
                // MARK AS SENT
                // =========================================

                pickup.setBuyerConfirmationSent(
                        true
                );


                pickupScheduleRepository.save(
                        pickup
                );


                System.out.println(

                        "Buyer confirmation notification sent "
                                + "for Pickup ID: "
                                + pickup.getPickupId()
                );
            }
        }
    }
}