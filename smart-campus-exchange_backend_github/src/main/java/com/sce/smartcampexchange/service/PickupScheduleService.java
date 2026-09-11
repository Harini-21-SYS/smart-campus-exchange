package com.sce.smartcampexchange.service;

import java.util.List;

import com.sce.smartcampexchange.dto.DeliveryIssueRequest;
import com.sce.smartcampexchange.dto.PickupScheduleRequest;
import com.sce.smartcampexchange.dto.PickupScheduleResponse;

public interface PickupScheduleService {

    // =========================================
    // CREATE PICKUP
    // =========================================

    PickupScheduleResponse createPickupSchedule(
            Long requestId,
            PickupScheduleRequest request
    );


    // =========================================
    // GET PICKUP
    // =========================================

    PickupScheduleResponse getPickupById(
            Long pickupId
    );


    PickupScheduleResponse getPickupByRequestId(
            Long requestId
    );


    List<PickupScheduleResponse> getAllPickups();


    // =========================================
    // SELLER HANDOVER
    // =========================================

    PickupScheduleResponse markAsHandedOver(
            Long pickupId
    );


    // =========================================
    // BUYER CONFIRM RECEIVED
    // =========================================

    PickupScheduleResponse confirmProductReceived(
            Long pickupId
    );


    // =========================================
    // BUYER REPORTS NOT RECEIVED
    // =========================================

    PickupScheduleResponse reportProductNotReceived(
            Long pickupId
    );


    // =========================================
    // BUYER REPORTS DELIVERY ISSUE
    // =========================================

    PickupScheduleResponse reportDeliveryIssue(
            Long pickupId,
            DeliveryIssueRequest deliveryIssueRequest
    );


    // =========================================
    // CANCEL PICKUP
    // =========================================

    PickupScheduleResponse cancelPickup(
            Long pickupId
    );
}