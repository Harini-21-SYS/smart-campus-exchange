package com.sce.smartcampexchange.service;


import java.time.LocalDateTime;
import java.util.List;

import java.util.stream.Collectors;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import com.sce.smartcampexchange.dto.AdminDashboardResponse;
import com.sce.smartcampexchange.dto.AdminStudentResponse;
import com.sce.smartcampexchange.dto.AdminProductResponse;
import com.sce.smartcampexchange.dto.AdminProductImageResponse;
import com.sce.smartcampexchange.dto.AdminComplaintResponse;
import com.sce.smartcampexchange.dto.AdminRequestSummaryResponse;
import com.sce.smartcampexchange.dto.ResolveComplaintRequest;


import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.Complaint;   // ADJUST package if different
import com.sce.smartcampexchange.entity.Request;     // ADJUST package/name if different
import com.sce.smartcampexchange.entity.PickupSchedule; // ADJUST — only needed if Request.getPickupSchedule() below doesn't compile as-is


import com.sce.smartcampexchange.repository.StudentRepository;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.ComplaintRepository;   // assumed to already exist
import com.sce.smartcampexchange.repository.RequestRepository;     // assumed to already exist
import com.sce.smartcampexchange.repository.NotificationRepository; // assumed to already exist
import com.sce.smartcampexchange.repository.PickupScheduleRepository;



@Service
public class AdminService {



    private final StudentRepository studentRepository;

    private final ProductRepository productRepository;

    private final ComplaintRepository complaintRepository;

    private final RequestRepository requestRepository;

    private final NotificationRepository notificationRepository;

    private final PickupScheduleRepository pickupScheduleRepository;

    private final NotificationService notificationService;




    public AdminService(
            StudentRepository studentRepository,
            ProductRepository productRepository,
            ComplaintRepository complaintRepository,
            RequestRepository requestRepository,
            NotificationRepository notificationRepository,
            PickupScheduleRepository pickupScheduleRepository,
            NotificationService notificationService) {


        this.studentRepository = studentRepository;

        this.productRepository = productRepository;

        this.complaintRepository = complaintRepository;

        this.requestRepository = requestRepository;

        this.notificationRepository = notificationRepository;

        this.pickupScheduleRepository = pickupScheduleRepository;

        this.notificationService = notificationService;

    }





    // =================================
    // ADMIN DASHBOARD
    // =================================


    public AdminDashboardResponse getDashboardData() {


        long totalStudents =
                studentRepository.count();



        long totalProducts =
                productRepository.count();

        long totalRequests =
                requestRepository.count();

        long totalComplaints =
                complaintRepository.count();

        // ADJUST: assumes Complaint.getStatus() returns a String like
        // "PENDING". If your status is an enum, compare against the
        // enum constant instead (e.g. ComplaintStatus.PENDING).
        long pendingComplaints =
                complaintRepository.findAll().stream()
                        .filter(c -> "PENDING".equalsIgnoreCase(c.getStatus()))
                        .count();

        long totalNotifications =
                notificationRepository.count();



        return new AdminDashboardResponse(

                totalStudents,

                totalProducts,

                totalRequests,

                totalComplaints,

                pendingComplaints,

                totalNotifications

        );

    }






    // =================================
    // VIEW ALL STUDENTS
    // =================================


    public List<AdminStudentResponse> getAllStudents() {


        List<Student> students =
                studentRepository.findAll();



        return students.stream()

                .map(student -> new AdminStudentResponse(


                        student.getStudentId(),

                        student.getFullName(),

                        student.getCollegeEmail(),

                        student.getRegisterNumber(),

                        student.getDepartment(),

                        student.getMobileNumber(),

                        student.getProfileImage(),

                        student.getRole().name(),

                        student.isAccountEnabled(),

                        student.isEmailVerified()

                ))

                .collect(Collectors.toList());

    }
    public List<AdminProductResponse> getAllProducts() {

        List<Product> products = productRepository.findAll();

        return products.stream()
                .map(product -> {

                    List<AdminProductImageResponse> images = product.getImages()
                            .stream()
                            .map(img -> new AdminProductImageResponse(
                                    img.getImageUrl(),
                                    img.isPrimary()
                            ))
                            .collect(Collectors.toList());

                    Student owner = product.getOwner();

                    return new AdminProductResponse(
                            product.getId(),
                            product.getTitle(),
                            product.getDescription(),
                            product.getCategory(),
                            product.getType(),
                            product.getPrice(),
                            product.getCondition(),
                            product.getStatus(),
                            owner.getCollegeEmail(),
                            owner.getStudentId(),
                            owner.getFullName(),
                            owner.getDepartment(),
                            owner.getProfileImage(),
                            images
                    );
                })
                .collect(Collectors.toList());
    }




     // ==========================
 // BLOCK STUDENT
 // ==========================

 public String blockStudent(Long studentId) {


     Student student = studentRepository.findById(studentId)
             .orElseThrow(() ->
                     new RuntimeException("Student not found")
             );


     student.setAccountEnabled(false);


     studentRepository.save(student);


     return "Student blocked successfully";
 }




 // ==========================
 // UNBLOCK STUDENT
 // ==========================

 public String unblockStudent(Long studentId) {


     Student student = studentRepository.findById(studentId)
             .orElseThrow(() ->
                     new RuntimeException("Student not found")
             );


     student.setAccountEnabled(true);


     studentRepository.save(student);


     return "Student unblocked successfully";
 }
//==========================
//DELETE PRODUCT
//==========================

public String deleteProduct(Long productId) {


  if(!productRepository.existsById(productId)) {

      throw new RuntimeException(
              "Product not found"
      );
  }


  productRepository.deleteById(productId);


  return "Product deleted successfully";
}


    // =================================
    // COMPLAINT MANAGEMENT
    // =================================

    // ADJUST: every getter below (getProduct(), getRequest(), getStudent(),
    // getAgainstStudent(), getComplaintType(), etc.) is inferred from the
    // JSON keys your frontend's mapBackendComplaint() already reads
    // (complaintId, productId, productTitle, requestId, complaintType,
    // description, status, studentId/studentName, againstStudentId/Name,
    // createdAt, resolvedAt). If your entity names these relations or
    // fields differently, rename the calls below to match — the shape
    // of AdminComplaintResponse itself does not need to change.
    public List<AdminComplaintResponse> getAllComplaints() {

        List<Complaint> complaints = complaintRepository.findAll();

        return complaints.stream()
                .map(this::toAdminComplaintResponse)
                .collect(Collectors.toList());
    }

    private AdminComplaintResponse toAdminComplaintResponse(Complaint c) {

        Product product = c.getProduct(); // ADJUST if relation is named differently
        Student complainant = c.getStudent(); // ADJUST — the student who filed it
        Student against = c.getAgainstStudent(); // ADJUST — the student it's filed against

        String productImage = null;
        if (product != null && product.getImages() != null && !product.getImages().isEmpty()) {
            productImage = product.getImages().stream()
                    .filter(img -> img.isPrimary())
                    .findFirst()
                    .map(img -> img.getImageUrl())
                    .orElse(product.getImages().get(0).getImageUrl());
        }

        return new AdminComplaintResponse(
                c.getComplaintId(), // ADJUST if it's just getId()
                product != null ? product.getId() : null,
                product != null ? product.getTitle() : null,
                productImage,
                c.getRequest() != null ? c.getRequest().getId() : null, // ADJUST if flat requestId field
                c.getComplaintType(),
                c.getDescription(),
                c.getStatus(),
                c.getResolutionNote(),
                c.getCreatedAt(),
                c.getResolvedAt(),
                complainant != null ? complainant.getStudentId() : null,
                complainant != null ? complainant.getFullName() : null,
                against != null ? against.getStudentId() : null,
                against != null ? against.getFullName() : null
        );
    }

    @Transactional
    public AdminComplaintResponse resolveComplaint(Long complaintId, ResolveComplaintRequest request) {

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        String note = request != null ? request.getNote() : null;
        boolean warningRequired = request != null && request.isWarningRequired();
        String warningNote = request != null ? request.getWarningNote() : null;
        boolean shouldBlockStudent = request != null && request.isBlockStudent();
        boolean shouldDeleteProduct = request != null && request.isDeleteProduct();

        // =====================================================
        // ADMIN ENFORCEMENT ACTIONS — performed before finalizing
        // status, so a failure here leaves nothing half-resolved
        // (this whole method is @Transactional).
        // =====================================================

        if (shouldBlockStudent && complaint.getAgainstStudent() != null) {
            Student against = complaint.getAgainstStudent();
            against.setAccountEnabled(false);
            studentRepository.save(against);
        }

        if (shouldDeleteProduct && complaint.getProduct() != null) {

            Long productId = complaint.getProduct().getId();

            // This complaint's own prd_id FK has to be cleared before the
            // product row can be deleted, or the delete violates this
            // row's own foreign key constraint. Other tables that may
            // also reference the same product (Request, PickupSchedule)
            // are outside this method's control — that risk already
            // existed on the standalone DELETE /products/{id} endpoint
            // this reuses (deleteProduct below), not something new here.
            complaint.setProduct(null);

            if (productRepository.existsById(productId)) {
                productRepository.deleteById(productId);
            }
        }

        // =====================================================
        // FINALIZE RESOLUTION
        // =====================================================

        complaint.setStatus("RESOLVED"); // ADJUST if status is an enum
        complaint.setResolvedAt(LocalDateTime.now());

        if (note != null && !note.trim().isEmpty()) {
            complaint.setResolutionNote(note.trim());
        }

        boolean issuingWarning =
                warningRequired &&
                warningNote != null &&
                !warningNote.trim().isEmpty();

        if (issuingWarning) {
            complaint.setWarningNote(warningNote.trim());
        }

        Complaint savedComplaint = complaintRepository.save(complaint);

        // Buyer (the student who filed the complaint) always gets told
        // it's resolved — this is what lets them go read the
        // resolution note.
        if (savedComplaint.getStudent() != null) {
            notificationService.createNotification(
                    new StudentNotificationData(
                            savedComplaint.getStudent().getStudentId(),
                            "STUDENT",
                            "COMPLAINT_RESOLVED",
                            savedComplaint.getComplaintId()
                    )
            );
        }

        // Seller only gets notified when the admin explicitly issued a
        // warning alongside resolving. Blocking/deleting don't need a
        // separate notification — a blocked student finds out the next
        // time they try to log in, and a deleted product simply
        // disappears from their listings.
        if (issuingWarning && savedComplaint.getAgainstStudent() != null) {
            notificationService.createNotification(
                    new StudentNotificationData(
                            savedComplaint.getAgainstStudent().getStudentId(),
                            "STUDENT",
                            "SELLER_WARNING",
                            savedComplaint.getComplaintId()
                    )
            );
        }

        return toAdminComplaintResponse(savedComplaint);
    }

    public String deleteComplaint(Long complaintId) {

        if (!complaintRepository.existsById(complaintId)) {
            throw new RuntimeException("Complaint not found");
        }

        complaintRepository.deleteById(complaintId);

        return "Complaint deleted successfully";
    }


    // =================================
    // REQUEST MANAGEMENT (read-only monitoring — admin never
    // accepts/rejects; that stays entirely with buyer/seller)
    // =================================

    // ADJUST: getRequester()/getProduct() inferred as before. The
    // pickup lookup — r.getPickupSchedule() — assumes a one-to-one
    // relation from Request to its pickup schedule. If pickup info
    // instead lives behind a separate repository/service call (the
    // way the student side's pickupService.getPickupByRequestId()
    // suggests), swap the 3 lines under "pull pickup info" for a
    // lookup through that repository/service instead, keyed by
    // r.getId(); everything else here is unaffected either way.
    public List<AdminRequestSummaryResponse> getAllRequests() {

        List<Request> requests = requestRepository.findAll();

        return requests.stream()
                .map(r -> {
                    Product product = r.getProduct(); // ADJUST
                    Student requester = r.getRequester(); // ADJUST — the buyer
                    Student seller = product != null ? product.getOwner() : null;

                    // ---- pull pickup info, if a schedule has been proposed ----
                    String pickupLocation = null;
                    String pickupDate = null;
                    String pickupTime = null;

                    // FIX: Request has no pickupSchedule back-reference field —
                    // r.getPickupSchedule() doesn't exist on the entity. Every
                    // other file in this project looks a pickup up the other
                    // way, via PickupScheduleRepository.findByRequest(request),
                    // so this does the same instead.
                    PickupSchedule pickup =
                            pickupScheduleRepository.findByRequest(r).orElse(null);
                    if (pickup != null) {
                        // PickupSchedule's location field getter is
                        // getLocation(), not getPickupLocation() — that
                        // method doesn't exist on the entity.
                        pickupLocation = pickup.getLocation();
                        pickupDate = pickup.getPickupDate() != null ? String.valueOf(pickup.getPickupDate()) : null;
                        pickupTime = pickup.getPickupTime() != null ? String.valueOf(pickup.getPickupTime()) : null;
                    }

                    return new AdminRequestSummaryResponse(
                            r.getId(),
                            product != null ? product.getTitle() : "Untitled listing",
                            r.getRequestType(),
                            r.getStatus(),
                            requester != null ? requester.getFullName() : "Unknown Student",
                            seller != null ? seller.getFullName() : "Unknown Seller",
                            r.getCreatedAt(),
                            pickupLocation,
                            pickupDate,
                            pickupTime
                    );
                })
                .collect(Collectors.toList());
    }


}