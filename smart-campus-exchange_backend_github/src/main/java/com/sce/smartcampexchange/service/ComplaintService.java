package com.sce.smartcampexchange.service;

import java.util.List;

import com.sce.smartcampexchange.dto.ComplaintReplyRequest;
import com.sce.smartcampexchange.dto.ComplaintResponse;
import com.sce.smartcampexchange.dto.CreateComplaintRequest;

public interface ComplaintService {

    // =========================================================
    // CREATE COMPLAINT
    // =========================================================

    ComplaintResponse createComplaint(
            CreateComplaintRequest request
    );


    // =========================================================
    // GET MY COMPLAINTS
    // =========================================================

    List<ComplaintResponse> getMyComplaints();


    // =========================================================
    // GET COMPLAINTS AGAINST ME
    // =========================================================

    List<ComplaintResponse> getComplaintsAgainstMe();


    // =========================================================
    // GET COMPLAINT BY ID
    // =========================================================

    ComplaintResponse getComplaintById(
            Long complaintId
    );


    // =========================================================
    // GET ALL COMPLAINTS
    // =========================================================

    List<ComplaintResponse> getAllComplaints();


    // =========================================================
    // UPDATE COMPLAINT STATUS
    // =========================================================

    ComplaintResponse updateComplaintStatus(
            Long complaintId,
            String status
    );


    // =========================================================
    // ADD REPLY TO COMPLAINT
    // =========================================================

    ComplaintResponse addComplaintReply(
            Long complaintId,
            ComplaintReplyRequest request
    );

}