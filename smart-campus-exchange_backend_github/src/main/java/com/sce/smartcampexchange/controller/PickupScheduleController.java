package com.sce.smartcampexchange.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sce.smartcampexchange.dto.DeliveryIssueRequest;
import com.sce.smartcampexchange.dto.PickupScheduleRequest;
import com.sce.smartcampexchange.dto.PickupScheduleResponse;
import com.sce.smartcampexchange.dto.RescheduleReasonRequest;
import com.sce.smartcampexchange.dto.RatingRequest;
import com.sce.smartcampexchange.dto.PurchaseComplaintRequest;
import com.sce.smartcampexchange.service.PickupScheduleService;

@RestController
@RequestMapping("/api/pickups")
public class PickupScheduleController {

    private final PickupScheduleService pickupScheduleService;


    public PickupScheduleController(
            PickupScheduleService pickupScheduleService) {

        this.pickupScheduleService =
                pickupScheduleService;
    }


    // =========================================================
    // CREATE
    // =========================================================

    @PostMapping("/request/{requestId}")
    public ResponseEntity<PickupScheduleResponse>
            createPickup(
                    @PathVariable Long requestId,
                    @RequestBody PickupScheduleRequest request) {

        return new ResponseEntity<>(
                pickupScheduleService
                        .createPickupSchedule(
                                requestId,
                                request
                        ),
                HttpStatus.CREATED
        );
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @GetMapping("/{pickupId}")
    public ResponseEntity<PickupScheduleResponse>
            getPickupById(
                    @PathVariable Long pickupId) {

        return ResponseEntity.ok(
                pickupScheduleService
                        .getPickupById(pickupId)
        );
    }


    // =========================================================
    // GET BY REQUEST
    // =========================================================

    @GetMapping("/request/{requestId}")
    public ResponseEntity<PickupScheduleResponse>
            getPickupByRequest(
                    @PathVariable Long requestId) {

        return ResponseEntity.ok(
                pickupScheduleService
                        .getPickupByRequestId(requestId)
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @GetMapping
    public ResponseEntity<List<PickupScheduleResponse>>
            getAllPickups() {

        return ResponseEntity.ok(
                pickupScheduleService.getAllPickups()
        );
    }


    // =========================================================
    // BUYER CONFIRMS THE PROPOSED SCHEDULE
    // =========================================================

    @PutMapping("/{pickupId}/confirm-schedule")
    public ResponseEntity<PickupScheduleResponse>
            confirmSchedule(
                    @PathVariable Long pickupId) {

        return ResponseEntity.ok(
                pickupScheduleService.confirmSchedule(pickupId)
        );
    }


    // =========================================================
    // BUYER REQUESTS A RESCHEDULE
    // =========================================================

    @PutMapping("/{pickupId}/request-reschedule")
    public ResponseEntity<PickupScheduleResponse>
            requestReschedule(
                    @PathVariable Long pickupId,
                    @RequestBody RescheduleReasonRequest request) {

        return ResponseEntity.ok(
                pickupScheduleService.requestReschedule(pickupId, request)
        );
    }


    // =========================================================
    // SELLER RESCHEDULES (re-proposes a new time/location)
    // =========================================================

    @PutMapping("/{pickupId}/reschedule")
    public ResponseEntity<PickupScheduleResponse>
            reschedulePickup(
                    @PathVariable Long pickupId,
                    @RequestBody PickupScheduleRequest request) {

        return ResponseEntity.ok(
                pickupScheduleService.reschedulePickup(pickupId, request)
        );
    }


    // =========================================================
    // MARK HANDED OVER (physical handover, seller-side)
    // =========================================================

    @PutMapping("/{pickupId}/handover")
    public ResponseEntity<PickupScheduleResponse>
            markAsHandedOver(
                    @PathVariable Long pickupId) {

        return ResponseEntity.ok(
                pickupScheduleService
                        .markAsHandedOver(pickupId)
        );
    }


    // =========================================================
    // CANCEL
    // =========================================================

    @PutMapping("/{pickupId}/cancel")
    public ResponseEntity<PickupScheduleResponse>
            cancelPickup(
                    @PathVariable Long pickupId) {

        return ResponseEntity.ok(
                pickupScheduleService
                        .cancelPickup(pickupId)
        );
    }


    // =========================================================
    // BUYER CONFIRMS PRODUCT RECEIVED - YES
    // =========================================================

    @PutMapping("/{pickupId}/confirm-received")
    public ResponseEntity<PickupScheduleResponse>
            confirmProductReceived(
                    @PathVariable Long pickupId) {

        return ResponseEntity.ok(
                pickupScheduleService
                        .confirmProductReceived(pickupId)
        );
    }


    // =========================================================
    // BUYER REPORTS PRODUCT NOT RECEIVED - NO
    // (mid-handover only — see PickupScheduleServiceImpl)
    // =========================================================

    @PutMapping("/{pickupId}/report-delivery-issue")
    public ResponseEntity<PickupScheduleResponse>
            reportDeliveryIssue(
                    @PathVariable Long pickupId,
                    @RequestBody DeliveryIssueRequest request) {

        return ResponseEntity.ok(
                pickupScheduleService
                        .reportDeliveryIssue(
                                pickupId,
                                request
                        )
        );
    }


    // =========================================================
    // BUYER RATES THE SELLER (only after COMPLETED)
    // =========================================================

    @PutMapping("/{pickupId}/rate")
    public ResponseEntity<PickupScheduleResponse>
            rateSeller(
                    @PathVariable Long pickupId,
                    @RequestBody RatingRequest request) {

        return ResponseEntity.ok(
                pickupScheduleService.rateSeller(pickupId, request)
        );
    }


    // =========================================================
    // RAISE A COMPLAINT AFTER A COMPLETED TRANSACTION
    // (works even if the buyer already confirmed receipt —
    // separate path from report-delivery-issue above)
    // =========================================================

    @PostMapping("/{pickupId}/complaint")
    public ResponseEntity<Void>
            raiseComplaint(
                    @PathVariable Long pickupId,
                    @RequestBody PurchaseComplaintRequest request) {

        pickupScheduleService.raiseComplaint(pickupId, request);

        return ResponseEntity.ok().build();
    }
}