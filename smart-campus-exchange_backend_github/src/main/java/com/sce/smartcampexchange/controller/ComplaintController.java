package com.sce.smartcampexchange.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sce.smartcampexchange.dto.ComplaintReplyRequest;
import com.sce.smartcampexchange.dto.ComplaintResponse;
import com.sce.smartcampexchange.dto.CreateComplaintRequest;
import com.sce.smartcampexchange.service.ComplaintService;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin
public class ComplaintController {

    private final ComplaintService complaintService;


    public ComplaintController(
            ComplaintService complaintService) {

        this.complaintService =
                complaintService;
    }


    // =========================================================
    // CREATE COMPLAINT
    // =========================================================

    @PostMapping
    public ResponseEntity<ComplaintResponse>
            createComplaint(
                    @RequestBody
                    CreateComplaintRequest request) {

        return ResponseEntity.ok(

                complaintService
                        .createComplaint(request)
        );
    }


    // =========================================================
    // GET MY COMPLAINTS
    // =========================================================

    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponse>>
            getMyComplaints() {

        return ResponseEntity.ok(

                complaintService
                        .getMyComplaints()
        );
    }


    // =========================================================
    // GET COMPLAINT BY ID
    // =========================================================

    @GetMapping("/{complaintId}")
    public ResponseEntity<ComplaintResponse>
            getComplaintById(

                    @PathVariable
                    Long complaintId) {

        return ResponseEntity.ok(

                complaintService
                        .getComplaintById(
                                complaintId
                        )
        );
    }


    
    


    // =========================================================
    // UPDATE COMPLAINT STATUS
    // =========================================================

    @PutMapping(
            "/{complaintId}/status"
    )
    public ResponseEntity<ComplaintResponse>
            updateComplaintStatus(

                    @PathVariable
                    Long complaintId,

                    @RequestParam
                    String status) {

        return ResponseEntity.ok(

                complaintService
                        .updateComplaintStatus(
                                complaintId,
                                status
                        )
        );
    }


    // =========================================================
    // ADD COMPLAINT REPLY
    // =========================================================

    @PostMapping(
            "/{complaintId}/reply"
    )
    public ResponseEntity<ComplaintResponse>
            addComplaintReply(

                    @PathVariable
                    Long complaintId,

                    @RequestBody
                    ComplaintReplyRequest request) {

        return ResponseEntity.ok(

                complaintService
                        .addComplaintReply(
                                complaintId,
                                request
                        )
        );
    }
 // =========================================================
 // GET COMPLAINTS AGAINST ME
 // =========================================================

 @GetMapping("/against-me")
 public ResponseEntity<List<ComplaintResponse>>
         getComplaintsAgainstMe() {

     return ResponseEntity.ok(
             complaintService
                     .getComplaintsAgainstMe()
     );
 }
    
}