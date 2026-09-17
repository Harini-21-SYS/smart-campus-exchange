package com.sce.smartcampexchange.service;

import java.util.List;

import com.sce.smartcampexchange.dto.DeliveryIssueRequest;
import com.sce.smartcampexchange.dto.PickupScheduleRequest;
import com.sce.smartcampexchange.dto.PickupScheduleResponse;
import com.sce.smartcampexchange.dto.RescheduleReasonRequest;
import com.sce.smartcampexchange.dto.RatingRequest;
import com.sce.smartcampexchange.dto.PurchaseComplaintRequest;

public interface PickupScheduleService {

    PickupScheduleResponse createPickupSchedule(Long requestId, PickupScheduleRequest request);

    PickupScheduleResponse getPickupById(Long pickupId);

    PickupScheduleResponse getPickupByRequestId(Long requestId);

    List<PickupScheduleResponse> getAllPickups();

    PickupScheduleResponse markAsHandedOver(Long pickupId);

    PickupScheduleResponse cancelPickup(Long pickupId);

    PickupScheduleResponse confirmProductReceived(Long pickupId);

    PickupScheduleResponse reportDeliveryIssue(Long pickupId, DeliveryIssueRequest request);

    PickupScheduleResponse confirmSchedule(Long pickupId);

    PickupScheduleResponse requestReschedule(Long pickupId, RescheduleReasonRequest request);

    PickupScheduleResponse reschedulePickup(Long pickupId, PickupScheduleRequest request);

    // Buyer rates the seller after a COMPLETED pickup.
    PickupScheduleResponse rateSeller(Long pickupId, RatingRequest request);

    // Either party can raise a complaint tied to a COMPLETED pickup —
    // separate from reportDeliveryIssue, which only fires mid-handover.
    void raiseComplaint(Long pickupId, PurchaseComplaintRequest request);
}