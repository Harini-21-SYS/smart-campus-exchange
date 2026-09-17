package com.sce.smartcampexchange.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sce.smartcampexchange.dto.ComplaintReplyRequest;
import com.sce.smartcampexchange.dto.ComplaintResponse;
import com.sce.smartcampexchange.dto.CreateComplaintRequest;

import com.sce.smartcampexchange.entity.Complaint;
import com.sce.smartcampexchange.entity.ComplaintReply;
import com.sce.smartcampexchange.entity.PickupSchedule;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;

import com.sce.smartcampexchange.repository.ComplaintReplyRepository;
import com.sce.smartcampexchange.repository.ComplaintRepository;
import com.sce.smartcampexchange.repository.PickupScheduleRepository;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.RequestRepository;
import com.sce.smartcampexchange.repository.StudentRepository;
import com.sce.smartcampexchange.entity.ProductImage;
@Service
public class ComplaintServiceImpl
        implements ComplaintService {

    private final ComplaintRepository complaintRepository;

    private final ComplaintReplyRepository complaintReplyRepository;

    private final ProductRepository productRepository;

    private final RequestRepository requestRepository;

    private final StudentRepository studentRepository;

    private final PickupScheduleRepository pickupScheduleRepository;


    public ComplaintServiceImpl(

            ComplaintRepository complaintRepository,

            ComplaintReplyRepository complaintReplyRepository,

            ProductRepository productRepository,

            RequestRepository requestRepository,

            StudentRepository studentRepository,

            PickupScheduleRepository pickupScheduleRepository
    ) {

        this.complaintRepository =
                complaintRepository;

        this.complaintReplyRepository =
                complaintReplyRepository;

        this.productRepository =
                productRepository;

        this.requestRepository =
                requestRepository;

        this.studentRepository =
                studentRepository;

        this.pickupScheduleRepository =
                pickupScheduleRepository;
    }


    // =========================================================
    // CREATE COMPLAINT
    // =========================================================

    @Override
@Transactional
public ComplaintResponse createComplaint(
        CreateComplaintRequest complaintRequest) {

    // =========================================
    // VALIDATE REQUEST
    // =========================================

    if (complaintRequest == null) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Complaint details are required"
        );
    }


    // =========================================
    // VALIDATE REQUEST ID
    // =========================================

    if (complaintRequest.getRequestId() == null) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Transaction request ID is required"
        );
    }


    // =========================================
    // VALIDATE COMPLAINT TYPE
    // =========================================

    if (complaintRequest.getComplaintType() == null ||
            complaintRequest.getComplaintType().isBlank()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Complaint type is required"
        );
    }


    // =========================================
    // VALIDATE DESCRIPTION
    // =========================================

    if (complaintRequest.getDescription() == null ||
            complaintRequest.getDescription().isBlank()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Complaint description is required"
        );
    }


    // =========================================
    // GET LOGGED-IN STUDENT
    // =========================================

    Student loggedInStudent =
            getLoggedInStudent();


    // =========================================
    // GET TRANSACTION REQUEST
    // =========================================

    Request transactionRequest =
            requestRepository
                    .findById(
                            complaintRequest
                                    .getRequestId()
                    )
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Transaction request not found"
                            )
                    );


    // =========================================
    // CHECK TRANSACTION IS COMPLETED
    // OR THE PICKUP HAS AN OPEN DELIVERY ISSUE
    //
    // FIX: a buyer reporting "product not received" via
    // reportDeliveryIssue() calls into this method while the
    // Request itself is still ACCEPTED (it only becomes COMPLETED
    // once the buyer later confirms receipt). Only checking the
    // Request status meant that legitimate mid-handover complaints
    // were always rejected with "can only be raised after a
    // completed transaction". A complaint is now also allowed when
    // the associated pickup schedule is in DELIVERY_ISSUE status.
    // =========================================

    boolean isRequestCompleted =
            "COMPLETED".equalsIgnoreCase(
                    transactionRequest.getStatus()
            );

    boolean hasOpenDeliveryIssue =
            pickupScheduleRepository
                    .findByRequest(transactionRequest)
                    .map(PickupSchedule::getStatus)
                    .map(status -> "DELIVERY_ISSUE"
                            .equalsIgnoreCase(status))
                    .orElse(false);

    if (!isRequestCompleted && !hasOpenDeliveryIssue) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Complaint can only be raised after a completed transaction or a reported delivery issue"
        );
    }


    // =========================================
    // GET REQUESTER AND SELLER
    // =========================================

    Student requester =
            transactionRequest.getRequester();

    Student seller =
            transactionRequest.getSeller();


    // =========================================
    // CHECK LOGGED-IN STUDENT BELONGS
    // TO THIS TRANSACTION
    // =========================================

    boolean isRequester =
            requester.getStudentId().equals(
                    loggedInStudent.getStudentId()
            );

    boolean isSeller =
            seller.getStudentId().equals(
                    loggedInStudent.getStudentId()
            );


    if (!isRequester && !isSeller) {

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You are not part of this transaction"
        );
    }


    // =========================================
    // AUTOMATICALLY DETERMINE
    // STUDENT AGAINST WHOM COMPLAINT IS RAISED
    // =========================================

    Student againstStudent;

    if (isRequester) {

        // Buyer raises complaint against seller

        againstStudent = seller;

    } else {

        // Seller raises complaint against requester

        againstStudent = requester;
    }


    // =========================================
    // AUTOMATICALLY GET PRODUCT
    // =========================================

    Product product =
            transactionRequest.getProduct();


    // =========================================
    // CREATE COMPLAINT
    // =========================================

    Complaint complaint =
            new Complaint();


    complaint.setStudent(
            loggedInStudent
    );


    complaint.setAgainstStudent(
            againstStudent
    );


    complaint.setProduct(
            product
    );


    complaint.setRequest(
            transactionRequest
    );


    complaint.setComplaintType(
            complaintRequest
                    .getComplaintType()
                    .trim()
                    .toUpperCase()
    );


    complaint.setDescription(
            complaintRequest
                    .getDescription()
                    .trim()
    );


    complaint.setStatus(
            "PENDING"
    );


    // =========================================
    // SAVE COMPLAINT
    // =========================================

    Complaint savedComplaint =
            complaintRepository
                    .save(complaint);


    return convertToResponse(
            savedComplaint
    );
}


    // =========================================================
    // GET MY COMPLAINTS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse>
            getMyComplaints() {

        Student student =
                getLoggedInStudent();


        List<Complaint> complaints =
                complaintRepository
                        .findByStudentOrderByCreatedAtDesc(
                                student
                        );


        List<ComplaintResponse> responses =
                new ArrayList<>();


        for (Complaint complaint : complaints) {

            responses.add(
                    convertToResponse(
                            complaint
                    )
            );
        }


        return responses;
    }


    // =========================================================
    // GET COMPLAINT BY ID
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(
            Long complaintId) {

        Complaint complaint =
                complaintRepository
                        .findById(complaintId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Complaint not found"
                                )
                        );


        Student loggedInStudent =
                getLoggedInStudent();


        boolean isComplaintOwner =
                complaint.getStudent()
                        .getStudentId()
                        .equals(
                                loggedInStudent
                                        .getStudentId()
                        );


        boolean isAgainstStudent =
                complaint.getAgainstStudent() != null &&
                complaint.getAgainstStudent()
                        .getStudentId()
                        .equals(
                                loggedInStudent
                                        .getStudentId()
                        );


        if (!isComplaintOwner &&
                !isAgainstStudent) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to access this complaint"
            );
        }


        return convertToResponse(
                complaint
        );
    }


    // =========================================================
    // GET ALL COMPLAINTS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse>
            getAllComplaints() {

        List<Complaint> complaints =
                complaintRepository
                        .findAll();


        List<ComplaintResponse> responses =
                new ArrayList<>();


        for (Complaint complaint : complaints) {

            responses.add(
                    convertToResponse(
                            complaint
                    )
            );
        }


        return responses;
    }


    // =========================================================
    // UPDATE COMPLAINT STATUS
    // =========================================================

    @Override
    @Transactional
    public ComplaintResponse updateComplaintStatus(
            Long complaintId,
            String status) {

        Complaint complaint =
                complaintRepository
                        .findById(complaintId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Complaint not found"
                                )
                        );


        if (status == null ||
                status.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Complaint status is required"
            );
        }


        String updatedStatus =
                status.toUpperCase();


        List<String> validStatuses =
                List.of(

                        "PENDING",

                        "UNDER_REVIEW",

                        "RESOLVED",

                        "REJECTED",

                        "ESCALATED"
                );


        if (!validStatuses.contains(
                updatedStatus)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid complaint status"
            );
        }


        complaint.setStatus(
                updatedStatus
        );


        // =========================================
        // SET RESOLVED TIME
        // =========================================

        if ("RESOLVED".equals(
                updatedStatus)) {

            complaint.setResolvedAt(
                    LocalDateTime.now()
            );
        }


        Complaint savedComplaint =
                complaintRepository
                        .save(complaint);


        return convertToResponse(
                savedComplaint
        );
    }


    // =========================================================
    // ADD COMPLAINT REPLY
    // =========================================================

    @Override
    @Transactional
    public ComplaintResponse addComplaintReply(
            Long complaintId,
            ComplaintReplyRequest replyRequest) {

        // =========================================
        // VALIDATE REPLY
        // =========================================

        if (replyRequest == null ||
                replyRequest.getResponseText() == null ||
                replyRequest.getResponseText().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Complaint reply is required"
            );
        }


        // =========================================
        // GET COMPLAINT
        // =========================================

        Complaint complaint =
                complaintRepository
                        .findById(complaintId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Complaint not found"
                                )
                        );


        // =========================================
        // CREATE REPLY
        // =========================================

        ComplaintReply reply =
                new ComplaintReply();


        reply.setComplaint(
                complaint
        );


        reply.setResponseText(
                replyRequest
                        .getResponseText()
        );


        complaintReplyRepository
                .save(reply);


        // =========================================
        // CHANGE STATUS TO UNDER REVIEW
        // =========================================

        if ("PENDING".equalsIgnoreCase(
                complaint.getStatus())) {

            complaint.setStatus(
                    "UNDER_REVIEW"
            );

            complaintRepository
                    .save(complaint);
        }


        return convertToResponse(
                complaint
        );
    }


    // =========================================================
    // CONVERT TO RESPONSE
    // =========================================================

    private ComplaintResponse convertToResponse(
            Complaint complaint) {

        Student student =
                complaint.getStudent();


        Student againstStudent =
                complaint.getAgainstStudent();


        Product product =
                complaint.getProduct();


        Request request =
                complaint.getRequest();


        Long studentId =
                student != null
                        ? student.getStudentId()
                        : null;


        String studentName =
                student != null
                        ? student.getFullName()
                        : null;


        Long againstStudentId =
                againstStudent != null
                        ? againstStudent.getStudentId()
                        : null;


        String againstStudentName =
                againstStudent != null
                        ? againstStudent.getFullName()
                        : null;


        Long productId =
                product != null
                        ? product.getId()
                        : null;


        String productTitle =
                product != null
                        ? product.getTitle()
                        : null;


        Long requestId =
                request != null
                        ? request.getId()
                        : null;

        String productImage = null;

        if (product != null &&
                product.getImages() != null &&
                !product.getImages().isEmpty()) {

            productImage =
                    product.getImages()
                            .stream()
                            .filter(ProductImage::isPrimary)
                            .findFirst()
                            .orElse(
                                    product.getImages().get(0)
                            )
                            .getImageUrl();
        }

        return new ComplaintResponse(

                complaint.getComplaintId(),

                studentId,
                studentName,

                againstStudentId,
                againstStudentName,

                productId,
                productTitle,
                productImage,

                requestId,

                complaint.getComplaintType(),

                complaint.getDescription(),

                complaint.getStatus(),

                complaint.getCreatedAt(),

                complaint.getResolvedAt(),

                // FIX: these two fields didn't exist on ComplaintResponse
                // at all before — the admin's resolveComplaint() had
                // been writing resolutionNote/warningNote onto Complaint
                // for two turns now, but nothing ever read them back out
                // to the student. This is what actually lets the
                // complainant see the resolution note, and the student
                // a warning was issued against see the warning text.
                complaint.getResolutionNote(),

                complaint.getWarningNote()
        );
    }


    // =========================================================
    // GET LOGGED-IN STUDENT
    // =========================================================

    private Student getLoggedInStudent() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }


        String email =
                authentication.getName();


        return studentRepository
                .findByCollegeEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Logged-in student not found"
                        )
                );
    }
   // =========================================================
// GET COMPLAINTS AGAINST ME
// =========================================================

@Override
@Transactional(readOnly = true)
public List<ComplaintResponse> getComplaintsAgainstMe() {

    Student currentStudent =
            getLoggedInStudent();

    List<Complaint> complaints =
            complaintRepository
                    .findByAgainstStudentOrderByCreatedAtDesc(
                            currentStudent
                    );

    return complaints
            .stream()
            .map(
                    this::convertToResponse
            )
            .toList();
}
}