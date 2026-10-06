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


    // ADJUST: these assume Product.getStatus() returns a String. If it's
    // an enum (e.g. ProductStatus), replace the String comparisons and
    // setStatus(...) calls in blockProduct/unblockProduct with the enum
    // constants, and add BLOCKED to the enum.
    private static final String PRODUCT_STATUS_AVAILABLE = "AVAILABLE";
    private static final String PRODUCT_STATUS_BLOCKED = "BLOCKED";


    private final StudentRepository studentRepository;

    private final ProductRepository productRepository;

    private final ComplaintRepository complaintRepository;

    private final RequestRepository requestRepository;

    private final NotificationRepository notificationRepository;

    private final PickupScheduleRepository pickupScheduleRepository;

    private final NotificationService notificationService;

    private final TrustScoreService trustScoreService;



    public AdminService(
            StudentRepository studentRepository,
            ProductRepository productRepository,
            ComplaintRepository complaintRepository,
            RequestRepository requestRepository,
            NotificationRepository notificationRepository,
            PickupScheduleRepository pickupScheduleRepository,
            NotificationService notificationService,
            TrustScoreService trustScoreService) {


        this.studentRepository = studentRepository;

        this.productRepository = productRepository;

        this.complaintRepository = complaintRepository;

        this.requestRepository = requestRepository;

        this.notificationRepository = notificationRepository;

        this.pickupScheduleRepository = pickupScheduleRepository;

        this.notificationService = notificationService;

        this.trustScoreService = trustScoreService;

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
    //
    // A reason is now required — this is what the student sees back at
    // their next login attempt (see AuthService.login()). Stored on
    // Student.blockReason; cleared by unblockStudent() below.
    // ==========================

    public String blockStudent(Long studentId, String reason) {


        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new RuntimeException("Student not found")
                );

        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("A reason is required to block a student");
        }


        student.setAccountEnabled(false);
        student.setBlockReason(reason.trim());


        studentRepository.save(student);


        return "Student blocked successfully";
    }




    // ==========================
    // UNBLOCK STUDENT
    // Clears the stored block reason along with re-enabling the account.
    // ==========================

    public String unblockStudent(Long studentId) {


        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new RuntimeException("Student not found")
                );


        student.setAccountEnabled(true);
        student.setBlockReason(null);


        studentRepository.save(student);


        return "Student unblocked successfully";
    }




    // ==========================
    // BLOCK PRODUCT
    //
    // Only AVAILABLE products can be blocked. Marks the product
    // BLOCKED and notifies the seller (product owner) with a
    // PRODUCT_BLOCKED notification whose relatedId is the product id.
    //
    // NOTE: this only changes the status. For blocked products to
    // actually disappear for buyers, the student-facing product list
    // query must return AVAILABLE products only, and request creation
    // should reject BLOCKED products (both live outside this file).
    // ==========================

    @Transactional
    public String blockProduct(Long productId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!PRODUCT_STATUS_AVAILABLE.equalsIgnoreCase(String.valueOf(product.getStatus()))) {
            throw new RuntimeException("Only available products can be blocked");
        }

        product.setStatus(PRODUCT_STATUS_BLOCKED);
        productRepository.save(product);

        Student owner = product.getOwner();
        if (owner != null) {
            notificationService.createNotification(
                    new StudentNotificationData(
                            owner.getStudentId(),
                            "STUDENT",
                            "PRODUCT_BLOCKED",
                            product.getId()
                    )
            );
        }

        return "Product blocked successfully";
    }




    // ==========================
    // UNBLOCK PRODUCT
    //
    // Only BLOCKED products can be unblocked. Restores AVAILABLE and
    // tells the seller with a PRODUCT_UNBLOCKED notification.
    // ==========================

    @Transactional
    public String unblockProduct(Long productId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!PRODUCT_STATUS_BLOCKED.equalsIgnoreCase(String.valueOf(product.getStatus()))) {
            throw new RuntimeException("Only blocked products can be unblocked");
        }

        product.setStatus(PRODUCT_STATUS_AVAILABLE);
        productRepository.save(product);

        Student owner = product.getOwner();
        if (owner != null) {
            notificationService.createNotification(
                    new StudentNotificationData(
                            owner.getStudentId(),
                            "STUDENT",
                            "PRODUCT_UNBLOCKED",
                            product.getId()
                    )
            );
        }

        return "Product unblocked successfully";
    }




    // ==========================
    // DELETE PRODUCT
    // ==========================

    public String deleteProduct(Long productId) {


        if (!productRepository.existsById(productId)) {

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
    // JSON keys your frontend's mapAdminComplaint() reads. If your entity
    // names these relations or fields differently, rename the calls
    // below to match — the shape of AdminComplaintResponse itself does
    // not need to change.
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

        return new AdminComplaintResponse(
                c.getComplaintId(), // ADJUST if it's just getId()
                product != null ? product.getId() : null,
                product != null ? product.getTitle() : null,
                resolvePrimaryImage(product),
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

    // Shared by complaints and requests: picks the product's primary
    // image, falling back to its first image if none is flagged
    // primary, or null if the product has no images (or is itself
    // null — e.g. a deleted product, or an EXCHANGE request that
    // never had an offered product).
    private String resolvePrimaryImage(Product product) {

        if (product == null || product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }

        return product.getImages().stream()
                .filter(img -> img.isPrimary())
                .findFirst()
                .map(img -> img.getImageUrl())
                .orElse(product.getImages().get(0).getImageUrl());
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
        //
        // NOTE: this block-from-complaint path does NOT go through
        // blockStudent(Long, String) above, so it does not set a
        // blockReason — the student will see a generic "Account
        // Disabled" message at login rather than this complaint's
        // context. If you want this path to also require/store a
        // reason, say so and I'll wire ResolveComplaintRequest's
        // warningNote (or a new field) through to blockReason here.
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
            // existed on the standalone DELETE /products/{id} endpoint.
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
        // separate notification.
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

        // Recalculate regardless of whether a warning was issued —
        // moving a complaint out of "pending" changes the pending-
        // complaint penalty either way, and an upheld one on top of
        // that adds its own separate penalty.
        if (savedComplaint.getAgainstStudent() != null) {
            trustScoreService.recalculate(savedComplaint.getAgainstStudent());
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
    //
    // Sends productId/productImage for the seller's product, and
    // offeredProductId/offeredProductTitle/offeredProductImage for the
    // buyer's offered product on EXCHANGE requests (null for BUY/DONATE,
    // and for any EXCHANGE request whose offered product was deleted).
    // =================================
    public List<AdminRequestSummaryResponse> getAllRequests() {

        List<Request> requests = requestRepository.findAll();

        return requests.stream()
                .map(r -> {
                    Product product = r.getProduct(); // ADJUST
                    Product offeredProduct = r.getOfferedProduct();
                    Student requester = r.getRequester(); // ADJUST — the buyer
                    Student seller = product != null ? product.getOwner() : null;

                    // ---- pull pickup info, if a schedule has been proposed ----
                    String pickupLocation = null;
                    String pickupDate = null;
                    String pickupTime = null;

                    // Request has no pickupSchedule back-reference field, so
                    // the pickup is looked up the same way as everywhere
                    // else in the project: via
                    // PickupScheduleRepository.findByRequest(request).
                    PickupSchedule pickup =
                            pickupScheduleRepository.findByRequest(r).orElse(null);
                    if (pickup != null) {
                        pickupLocation = pickup.getLocation();
                        pickupDate = pickup.getPickupDate() != null ? String.valueOf(pickup.getPickupDate()) : null;
                        pickupTime = pickup.getPickupTime() != null ? String.valueOf(pickup.getPickupTime()) : null;
                    }

                    java.math.BigDecimal productPrice = null;
                    if (product != null) {
                        productPrice = product.getPrice();
                    }

                    return new AdminRequestSummaryResponse(
                            r.getId(),
                            product != null ? product.getId() : null,
                            product != null ? product.getTitle() : "Untitled listing",
                            resolvePrimaryImage(product),
                            productPrice,
                            offeredProduct != null ? offeredProduct.getId() : null,
                            offeredProduct != null ? offeredProduct.getTitle() : null,
                            resolvePrimaryImage(offeredProduct),
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


    // =================================
    // ONE-TIME PRODUCT OWNERSHIP BACKFILL
    //
    // PickupScheduleServiceImpl.confirmProductReceived() now transfers
    // product ownership on completion, but that only applies going
    // forward. This replays the same ownership logic against every
    // COMPLETED request that already exists, oldest first — so if a
    // product changed hands more than once, the most recent completed
    // transaction wins and sets the final, correct owner.
    //
    // Run this ONCE (e.g. via Postman or curl). Safe to run more than
    // once — anything already correct is a no-op.
    // =================================

    @Transactional
    public String backfillProductOwnership() {

        List<Request> completedRequests =
                requestRepository.findByStatusOrderByUpdatedAtAsc("COMPLETED");

        int productsUpdated = 0;

        for (Request request : completedRequests) {

            String requestType = request.getRequestType();
            Student requester = request.getRequester();
            Student seller = request.getSeller();
            Product requestedProduct = request.getProduct();

            if (requester == null || requestedProduct == null) {
                continue;
            }

            // BUY, EXCHANGE and DONATE all move the requested product
            // to the requester on completion.
            boolean requestedProductNeedsFix =
                    requestedProduct.getOwner() == null ||
                    !requestedProduct.getOwner()
                            .getStudentId()
                            .equals(requester.getStudentId());

            if (requestedProductNeedsFix) {
                requestedProduct.setOwner(requester);
                productRepository.save(requestedProduct);
                productsUpdated++;
            }

            // EXCHANGE additionally moves the offered product to the
            // original seller.
            if ("EXCHANGE".equalsIgnoreCase(requestType) && seller != null) {

                Product offeredProduct = request.getOfferedProduct();

                if (offeredProduct != null) {

                    boolean offeredProductNeedsFix =
                            offeredProduct.getOwner() == null ||
                            !offeredProduct.getOwner()
                                    .getStudentId()
                                    .equals(seller.getStudentId());

                    if (offeredProductNeedsFix) {
                        offeredProduct.setOwner(seller);
                        productRepository.save(offeredProduct);
                        productsUpdated++;
                    }
                }
            }
        }

        return "Backfill complete: checked " + completedRequests.size()
                + " completed request(s), corrected ownership on "
                + productsUpdated + " product row(s).";
    }
}