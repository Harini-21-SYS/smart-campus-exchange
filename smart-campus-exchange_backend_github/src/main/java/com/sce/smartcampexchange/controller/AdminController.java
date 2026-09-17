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
 // ==========================

 @PutMapping("/students/{id}/block")
 public ResponseEntity<String> blockStudent(
         @PathVariable Long id) {


     return ResponseEntity.ok(
             adminService.blockStudent(id)
     );
 }




 // ==========================
 // UNBLOCK STUDENT
 // ==========================

 @PutMapping("/students/{id}/unblock")
 public ResponseEntity<String> unblockStudent(
         @PathVariable Long id) {


     return ResponseEntity.ok(
             adminService.unblockStudent(id)
     );
 }
//==========================
//DELETE PRODUCT
//==========================

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

    // FIX: this used to unpack just `note` and drop the rest of the
    // request body. The new warningRequired/warningNote fields need to
    // reach AdminService too, so the whole body is passed through now
    // instead of only its note field.
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


}