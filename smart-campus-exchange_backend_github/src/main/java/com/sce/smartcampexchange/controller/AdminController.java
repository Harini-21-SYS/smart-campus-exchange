package com.sce.smartcampexchange.controller;


import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import com.sce.smartcampexchange.dto.AdminDashboardResponse;
import com.sce.smartcampexchange.dto.AdminStudentResponse;
import com.sce.smartcampexchange.dto.AdminProductResponse;
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


}