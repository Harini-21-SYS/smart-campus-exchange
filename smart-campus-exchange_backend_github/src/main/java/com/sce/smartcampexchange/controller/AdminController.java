package com.sce.smartcampexchange.controller;


import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import com.sce.smartcampexchange.dto.AdminDashboardResponse;
import com.sce.smartcampexchange.dto.AdminStudentResponse;
import com.sce.smartcampexchange.dto.AdminProductResponse;
import com.sce.smartcampexchange.dto.AdminComplaintResponse;
import com.sce.smartcampexchange.dto.AdminRequestSummaryResponse;
import com.sce.smartcampexchange.dto.ResolveComplaintRequest;
import com.sce.smartcampexchange.dto.BlockStudentRequest;
import com.sce.smartcampexchange.service.AdminService;



@RestController
@RequestMapping("/api/admin")
public class AdminController {


    private final AdminService adminService;


    public AdminController(AdminService adminService) {

        this.adminService = adminService;
    }


    // =================================
    // ADMIN DASHBOARD
    // =================================

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> dashboard() {

        return ResponseEntity.ok(
                adminService.getDashboardData()
        );
    }


    // =================================
    // VIEW ALL STUDENTS
    // =================================

    @GetMapping("/students")
    public ResponseEntity<List<AdminStudentResponse>> getAllStudents() {

        return ResponseEntity.ok(
                adminService.getAllStudents()
        );
    }


    // =================================
    // VIEW ALL PRODUCTS
    // =================================

    @GetMapping("/products")
    public ResponseEntity<List<AdminProductResponse>> getAllProducts() {

        return ResponseEntity.ok(
                adminService.getAllProducts()
        );
    }


    // ==========================
    // BLOCK STUDENT
    //
    // Now requires a reason in the request body — AdminService
    // rejects a missing/blank one. The reason is stored on the
    // student and surfaced to them at their next login attempt
    // (see AuthService.login()).
    // ==========================

    @PutMapping("/students/{id}/block")
    public ResponseEntity<String> blockStudent(
            @PathVariable Long id,
            @RequestBody(required = false) BlockStudentRequest body) {

        String reason = body != null ? body.getReason() : null;

        return ResponseEntity.ok(
                adminService.blockStudent(id, reason)
        );
    }


    // ==========================
    // UNBLOCK STUDENT
    // Also clears the stored block reason — see AdminService.
    // ==========================

    @PutMapping("/students/{id}/unblock")
    public ResponseEntity<String> unblockStudent(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                adminService.unblockStudent(id)
        );
    }


    // ==========================
    // BLOCK PRODUCT
    // Only AVAILABLE products can be blocked. The seller is
    // notified (PRODUCT_BLOCKED).
    // ==========================

    @PutMapping("/products/{id}/block")
    public ResponseEntity<String> blockProduct(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                adminService.blockProduct(id)
        );
    }


    // ==========================
    // UNBLOCK PRODUCT
    // Only BLOCKED products can be unblocked. The seller is
    // notified (PRODUCT_UNBLOCKED).
    // ==========================

    @PutMapping("/products/{id}/unblock")
    public ResponseEntity<String> unblockProduct(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                adminService.unblockProduct(id)
        );
    }


    // ==========================
    // DELETE PRODUCT
    // ==========================

    @DeleteMapping("/products/{id}")
    public ResponseEntity<String> deleteProduct(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                adminService.deleteProduct(id)
        );
    }


    // =================================
    // COMPLAINT MANAGEMENT
    // =================================

    @GetMapping("/complaints")
    public ResponseEntity<List<AdminComplaintResponse>> getAllComplaints() {

        return ResponseEntity.ok(
                adminService.getAllComplaints()
        );
    }

    // The whole request body is passed through (not just its note field)
    // so warningRequired/warningNote/blockStudent/deleteProduct reach
    // AdminService too.
    @PutMapping("/complaints/{id}/resolve")
    public ResponseEntity<AdminComplaintResponse> resolveComplaint(
            @PathVariable Long id,
            @RequestBody(required = false) ResolveComplaintRequest body) {

        return ResponseEntity.ok(
                adminService.resolveComplaint(id, body)
        );
    }

    @DeleteMapping("/complaints/{id}")
    public ResponseEntity<String> deleteComplaint(@PathVariable Long id) {

        return ResponseEntity.ok(
                adminService.deleteComplaint(id)
        );
    }


    // =================================
    // REQUEST MANAGEMENT
    // =================================

    @GetMapping("/requests")
    public ResponseEntity<List<AdminRequestSummaryResponse>> getAllRequests() {

        return ResponseEntity.ok(
                adminService.getAllRequests()
        );
    }


    // =================================
    // ONE-TIME PRODUCT OWNERSHIP BACKFILL
    //
    // Run this once after deploying the ownership-transfer fix in
    // PickupScheduleServiceImpl.confirmProductReceived(). Safe to call
    // more than once — already-correct rows are a no-op.
    // =================================

    @PostMapping("/backfill-product-ownership")
    public ResponseEntity<String> backfillProductOwnership() {

        return ResponseEntity.ok(
                adminService.backfillProductOwnership()
        );
    }

}