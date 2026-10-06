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

import com.sce.smartcampexchange.dto.CreateComplaintRequest;
import com.sce.smartcampexchange.dto.DeliveryIssueRequest;
import com.sce.smartcampexchange.dto.PickupScheduleRequest;
import com.sce.smartcampexchange.dto.PickupScheduleResponse;
import com.sce.smartcampexchange.dto.RescheduleReasonRequest;
import com.sce.smartcampexchange.dto.RatingRequest;
import com.sce.smartcampexchange.dto.PurchaseComplaintRequest;
import com.sce.smartcampexchange.entity.PickupSchedule;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.entity.Review;

import com.sce.smartcampexchange.repository.PickupScheduleRepository;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.RequestRepository;
import com.sce.smartcampexchange.repository.StudentRepository;
import com.sce.smartcampexchange.repository.ReviewRepository;


@Service
public class PickupScheduleServiceImpl
        implements PickupScheduleService {

    private final PickupScheduleRepository pickupScheduleRepository;

    private final RequestRepository requestRepository;

    private final StudentRepository studentRepository;

    private final NotificationService notificationService;

    private final ProductRepository productRepository;

    private final ComplaintService complaintService;

    private final ReviewRepository reviewRepository;

    private final TrustScoreService trustScoreService;

    public PickupScheduleServiceImpl(
        PickupScheduleRepository pickupScheduleRepository,
        RequestRepository requestRepository,
        StudentRepository studentRepository,
        ProductRepository productRepository,
        NotificationService notificationService,
        ComplaintService complaintService,
        ReviewRepository reviewRepository,
        TrustScoreService trustScoreService
    ) {
        this.pickupScheduleRepository = pickupScheduleRepository;
        this.requestRepository = requestRepository;
        this.studentRepository = studentRepository;
        this.productRepository = productRepository;
        this.notificationService = notificationService;
        this.complaintService = complaintService;
        this.reviewRepository = reviewRepository;
        this.trustScoreService = trustScoreService;
    }

    // =========================================================
    // CREATE PICKUP (seller proposes time/location)
    // =========================================================

    @Override
    @Transactional
    public PickupScheduleResponse createPickupSchedule(
            Long requestId,
            PickupScheduleRequest request) {

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pickup details are required"
            );
        }

        if (request.getLocation() == null ||
                request.getLocation().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pickup location is required"
            );
        }

        if (request.getPickupDate() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pickup date is required"
            );
        }

        if (request.getPickupTime() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pickup time is required"
            );
        }

        Request existingRequest =
                requestRepository.findById(requestId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Request not found with id: "
                                                + requestId
                                )
                        );

        if (!"ACCEPTED".equalsIgnoreCase(
                existingRequest.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pickup can be created only for an accepted request"
            );
        }

        Student loggedInStudent = getLoggedInStudent();

        // Only seller can create pickup
        if (!existingRequest.getSeller()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the seller can create the pickup schedule"
            );
        }

        if (pickupScheduleRepository
                .existsByRequest(existingRequest)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pickup schedule already exists for this request"
            );
        }

        PickupSchedule pickup = new PickupSchedule();

        pickup.setRequest(existingRequest);
        pickup.setLocation(request.getLocation());
        pickup.setPickupDate(request.getPickupDate());
        pickup.setPickupTime(request.getPickupTime());
        pickup.setStatus("SCHEDULED");
        pickup.setReminderSent(false);

        PickupSchedule savedPickup =
                pickupScheduleRepository.save(pickup);

        // Notify buyer/requester — "please confirm this schedule"
        notificationService.createNotification(
                new StudentNotificationData(
                        existingRequest.getRequester()
                                .getStudentId(),
                        "STUDENT",
                        "PICKUP_SCHEDULED",
                        savedPickup.getPickupId()
                )
        );

        return convertToResponse(savedPickup);
    }


    // =========================================================
    // GET PICKUP BY ID
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public PickupScheduleResponse getPickupById(Long pickupId) {

        PickupSchedule pickup =
                pickupScheduleRepository.findById(pickupId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        checkAccess(pickup);

        return convertToResponse(pickup);
    }


    // =========================================================
    // GET PICKUP BY REQUEST
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public PickupScheduleResponse getPickupByRequestId(Long requestId) {

        Request request =
                requestRepository.findById(requestId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Request not found"
                                )
                        );

        PickupSchedule pickup =
                pickupScheduleRepository.findByRequest(request)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        checkAccess(pickup);

        return convertToResponse(pickup);
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<PickupScheduleResponse> getAllPickups() {

        List<PickupSchedule> pickups =
                pickupScheduleRepository.findAll();

        List<PickupScheduleResponse> responses = new ArrayList<>();

        for (PickupSchedule pickup : pickups) {
            responses.add(convertToResponse(pickup));
        }

        return responses;
    }


    // =========================================================
    // BUYER CONFIRMS THE PROPOSED SCHEDULE (agrees to meet)
    //
    // This is a DIFFERENT action from confirmProductReceived — that
    // one confirms the item was physically handed over, this one just
    // confirms the buyer is OK with the proposed time/location. The
    // frontend must call this endpoint first, separately, before the
    // day-of reminder/handover logic applies.
    // =========================================================

    @Override
    @Transactional
    public PickupScheduleResponse confirmSchedule(Long pickupId) {

        PickupSchedule pickup =
                pickupScheduleRepository.findById(pickupId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        Request request = pickup.getRequest();

        Student loggedInStudent = getLoggedInStudent();

        if (!request.getRequester()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the buyer can confirm the schedule"
            );
        }

        if (!"SCHEDULED".equalsIgnoreCase(pickup.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only a proposed schedule can be confirmed"
            );
        }

        pickup.setStatus("CONFIRMED");

        PickupSchedule savedPickup = pickupScheduleRepository.save(pickup);

        notificationService.createNotification(
                new StudentNotificationData(
                        request.getSeller().getStudentId(),
                        "STUDENT",
                        "PICKUP_CONFIRMED",
                        savedPickup.getPickupId()
                )
        );

        return convertToResponse(savedPickup);
    }


    // =========================================================
    // BUYER REQUESTS A DIFFERENT TIME/LOCATION
    // =========================================================

    @Override
    @Transactional
    public PickupScheduleResponse requestReschedule(
            Long pickupId,
            RescheduleReasonRequest request) {

        if (request == null ||
                request.getReason() == null ||
                request.getReason().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A reason is required to request a reschedule"
            );
        }

        PickupSchedule pickup =
                pickupScheduleRepository.findById(pickupId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        Request pickupRequest = pickup.getRequest();

        Student loggedInStudent = getLoggedInStudent();

        if (!pickupRequest.getRequester()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the buyer can request a reschedule"
            );
        }

        if (!"SCHEDULED".equalsIgnoreCase(pickup.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only a proposed schedule can be rescheduled"
            );
        }

        pickup.setStatus("RESCHEDULE_REQUESTED");
        pickup.setDeliveryIssueDescription(request.getReason());

        PickupSchedule savedPickup = pickupScheduleRepository.save(pickup);

        notificationService.createNotification(
                new StudentNotificationData(
                        pickupRequest.getSeller().getStudentId(),
                        "STUDENT",
                        "RESCHEDULE_REQUESTED",
                        savedPickup.getPickupId()
                )
        );

        return convertToResponse(savedPickup);
    }


    // =========================================================
    // SELLER RE-PROPOSES A NEW TIME/LOCATION
    // =========================================================

    @Override
    @Transactional
    public PickupScheduleResponse reschedulePickup(
            Long pickupId,
            PickupScheduleRequest request) {

        if (request == null ||
                request.getLocation() == null ||
                request.getLocation().isBlank() ||
                request.getPickupDate() == null ||
                request.getPickupTime() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Location, date, and time are all required"
            );
        }

        PickupSchedule pickup =
                pickupScheduleRepository.findById(pickupId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        Request pickupRequest = pickup.getRequest();

        Student loggedInStudent = getLoggedInStudent();

        if (!pickupRequest.getSeller()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the seller can reschedule"
            );
        }

        if (!"RESCHEDULE_REQUESTED".equalsIgnoreCase(pickup.getStatus())
                && !"SCHEDULED".equalsIgnoreCase(pickup.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This pickup cannot be rescheduled right now"
            );
        }

        pickup.setLocation(request.getLocation());
        pickup.setPickupDate(request.getPickupDate());
        pickup.setPickupTime(request.getPickupTime());
        pickup.setStatus("SCHEDULED");
        pickup.setReminderSent(false); // reset so the 30-min job re-fires for the new time

        PickupSchedule savedPickup = pickupScheduleRepository.save(pickup);

        notificationService.createNotification(
                new StudentNotificationData(
                        pickupRequest.getRequester().getStudentId(),
                        "STUDENT",
                        "PICKUP_RESCHEDULED",
                        savedPickup.getPickupId()
                )
        );

        return convertToResponse(savedPickup);
    }


    // =========================================================
    // MARK HANDED OVER (physical handover, seller confirms at the meetup)
    //
    // Only allowed once the BUYER has confirmed the schedule
    // (status == CONFIRMED). This is what makes the day-of flow work:
    // SCHEDULED -> buyer confirms -> CONFIRMED -> seller hands over
    // at the meetup -> BUYER_CONFIRMATION_PENDING.
    // =========================================================

    @Override
    @Transactional
    public PickupScheduleResponse markAsHandedOver(Long pickupId) {

        PickupSchedule pickup =
                pickupScheduleRepository.findById(pickupId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        Request request = pickup.getRequest();

        Student loggedInStudent = getLoggedInStudent();

        if (!request.getSeller()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the seller can confirm handover"
            );
        }

        if (!"CONFIRMED".equalsIgnoreCase(pickup.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only a buyer-confirmed schedule can be marked as handed over"
            );
        }

        pickup.setDeliveredAt(LocalDateTime.now());
        pickup.setStatus("BUYER_CONFIRMATION_PENDING");

        PickupSchedule savedPickup = pickupScheduleRepository.save(pickup);

        notificationService.createNotification(
                new StudentNotificationData(
                        request.getRequester().getStudentId(),
                        "STUDENT",
                        "BUYER_CONFIRMATION_REQUIRED",
                        savedPickup.getPickupId()
                )
        );

        return convertToResponse(savedPickup);
    }


    // =========================================================
    // CANCEL
    // =========================================================

    @Override
    @Transactional
    public PickupScheduleResponse cancelPickup(Long pickupId) {

        PickupSchedule pickup =
                pickupScheduleRepository.findById(pickupId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        checkAccess(pickup);

        if (!"SCHEDULED".equalsIgnoreCase(pickup.getStatus())
                && !"CONFIRMED".equalsIgnoreCase(pickup.getStatus())
                && !"RESCHEDULE_REQUESTED".equalsIgnoreCase(pickup.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This pickup can no longer be cancelled"
            );
        }

        pickup.setStatus("CANCELLED");

        Request request = pickup.getRequest();
        request.setStatus("CANCELLED");
        requestRepository.save(request);

        Product product = request.getProduct();
        product.setStatus("AVAILABLE");
        productRepository.save(product);

        PickupSchedule savedPickup = pickupScheduleRepository.save(pickup);

        return convertToResponse(savedPickup);
    }


    // =========================================================
    // ACCESS CHECK
    // =========================================================

    private void checkAccess(PickupSchedule pickup) {

        Student loggedInStudent = getLoggedInStudent();

        Request request = pickup.getRequest();

        boolean isSeller =
                request.getSeller().getStudentId()
                        .equals(loggedInStudent.getStudentId());

        boolean isRequester =
                request.getRequester().getStudentId()
                        .equals(loggedInStudent.getStudentId());

        if (!isSeller && !isRequester) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to access this pickup"
            );
        }
    }


    // =========================================================
    // CONVERT
    // =========================================================

    private PickupScheduleResponse convertToResponse(PickupSchedule pickup) {

        Request request = pickup.getRequest();
        Product product = request.getProduct();
        Student seller = request.getSeller();
        Student requester = request.getRequester();

        Long productId = product != null ? product.getId() : null;
        String productTitle = product != null ? product.getTitle() : null;

        String productImage = null;

        if (product != null &&
                product.getImages() != null &&
                !product.getImages().isEmpty()) {

            for (ProductImage image : product.getImages()) {
                if (image.isPrimary()) {
                    productImage = image.getImageUrl();
                    break;
                }
            }

            if (productImage == null) {
                productImage = product.getImages().get(0).getImageUrl();
            }
        }

        Long sellerId = seller != null ? seller.getStudentId() : null;
        String sellerName = seller != null ? seller.getFullName() : null;
        String sellerDepartment = seller != null ? seller.getDepartment() : null;

        Long requesterId = requester != null ? requester.getStudentId() : null;
        String requesterName = requester != null ? requester.getFullName() : null;
        String requesterDepartment = requester != null ? requester.getDepartment() : null;

        return new PickupScheduleResponse(
                pickup.getPickupId(),
                request.getId(),
                productId,
                productTitle,
                productImage,
                sellerId,
                sellerName,
                sellerDepartment,
                requesterId,
                requesterName,
                requesterDepartment,
                pickup.getLocation(),
                pickup.getPickupDate(),
                pickup.getPickupTime(),
                pickup.getStatus(),
                pickup.getDeliveredAt(),
                pickup.getCreatedAt(),
                pickup.getUpdatedAt()
        );
    }


    // =========================================================
    // LOGGED IN STUDENT
    // =========================================================

    private Student getLoggedInStudent() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        String email = authentication.getName();

        return studentRepository.findByCollegeEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Logged-in student not found"
                        )
                );
    }


    // =========================================================
    // BUYER CONFIRMS PRODUCT RECEIVED
    // =========================================================

    @Override
    @Transactional
    public PickupScheduleResponse confirmProductReceived(Long pickupId) {

        PickupSchedule pickup =
                pickupScheduleRepository.findById(pickupId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        Request request = pickup.getRequest();

        Student loggedInStudent = getLoggedInStudent();

        if (!request.getRequester()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the buyer can confirm product receipt"
            );
        }

        if (!"BUYER_CONFIRMATION_PENDING".equalsIgnoreCase(pickup.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Buyer confirmation is not pending"
            );
        }

        pickup.setStatus("COMPLETED");

        request.setStatus("COMPLETED");
        requestRepository.save(request);

        String requestType = request.getRequestType();
        Product requestedProduct = request.getProduct();

        // FIX: this used to only flip status (SOLD/EXCHANGED/DONATED) and
        // never actually transferred ownership. The product's `owner`
        // field kept pointing at the original seller forever, even
        // though the app showed it in the buyer's My Purchases. That
        // meant re-offering a "purchased" item in a later Exchange
        // always failed RequestServiceImpl's
        // "You can only offer your own product" ownership check —
        // silently rolling back the whole new request (and its
        // notification) inside that other @Transactional method, since
        // the DB never agreed it was really yours.
        if ("BUY".equalsIgnoreCase(requestType)) {
            requestedProduct.setStatus("SOLD");
            requestedProduct.setOwner(request.getRequester());
            productRepository.save(requestedProduct);
        } else if ("EXCHANGE".equalsIgnoreCase(requestType)) {
            requestedProduct.setStatus("EXCHANGED");
            requestedProduct.setOwner(request.getRequester());
            productRepository.save(requestedProduct);

            Product offeredProduct = request.getOfferedProduct();
            if (offeredProduct != null) {
                offeredProduct.setStatus("EXCHANGED");
                offeredProduct.setOwner(request.getSeller());
                productRepository.save(offeredProduct);
            }
        } else if ("DONATE".equalsIgnoreCase(requestType)) {
            requestedProduct.setStatus("DONATED");
            requestedProduct.setOwner(request.getRequester());
            productRepository.save(requestedProduct);
        }

        PickupSchedule savedPickup = pickupScheduleRepository.save(pickup);

        // Notify seller — also the trigger point for "leave a rating" on the buyer side
        notificationService.createNotification(
                new StudentNotificationData(
                        request.getSeller().getStudentId(),
                        "STUDENT",
                        "TRANSACTION_COMPLETED",
                        request.getId()
                )
        );

        // A completed transaction affects the experience bonus for
        // both sides — the seller and the requester each gained one
        // completed transaction just now.
        trustScoreService.recalculate(request.getSeller());
        trustScoreService.recalculate(request.getRequester());

        return convertToResponse(savedPickup);
    }


    // =========================================================
    // BUYER RATES THE SELLER (once, after COMPLETED)
    //
    // One Review per Request, enforced both here (existsByRequest check)
    // and at the DB level (Review.request has a unique constraint).
    // Student has no stored trustScore column, so a seller's rating is
    // always computed on demand from ReviewRepository rather than kept
    // as a running total that could drift out of sync — see
    // getSellerAverageRating below for how a caller would read it back.
    // =========================================================

    @Override
    @Transactional
    public PickupScheduleResponse rateSeller(Long pickupId, RatingRequest ratingRequest) {

        if (ratingRequest == null || ratingRequest.getRating() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A rating is required"
            );
        }

        int ratingValue = ratingRequest.getRating();

        if (ratingValue < 1 || ratingValue > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Rating must be between 1 and 5"
            );
        }

        PickupSchedule pickup =
                pickupScheduleRepository.findById(pickupId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        Request request = pickup.getRequest();

        Student loggedInStudent = getLoggedInStudent();

        if (!request.getRequester()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the buyer can rate the seller"
            );
        }

        if (!"COMPLETED".equalsIgnoreCase(pickup.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You can only rate a completed transaction"
            );
        }

        if (reviewRepository.existsByRequest(request)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You have already rated this transaction"
            );
        }

        Review review = new Review();
        review.setRequest(request);
        review.setReviewer(request.getRequester());
        review.setReviewee(request.getSeller());
        review.setRating(ratingValue);
        review.setComment(ratingRequest.getComment());

        reviewRepository.save(review);

        notificationService.createNotification(
                new StudentNotificationData(
                        request.getSeller().getStudentId(),
                        "STUDENT",
                        "SELLER_RATED",
                        request.getId()
                )
        );

        trustScoreService.recalculate(request.getSeller());

        return convertToResponse(pickup);
    }


    // =========================================================
    // BUYER REPORTS A DELIVERY ISSUE (product not received / wrong / damaged etc.)
    // =========================================================

    @Override
    @Transactional
    public PickupScheduleResponse reportDeliveryIssue(
            Long pickupId,
            DeliveryIssueRequest deliveryIssueRequest) {

        if (deliveryIssueRequest == null ||
                deliveryIssueRequest.getIssueReason() == null ||
                deliveryIssueRequest.getIssueReason().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Delivery issue reason is required"
            );
        }

        PickupSchedule pickup =
                pickupScheduleRepository.findById(pickupId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        Request request = pickup.getRequest();

        Student loggedInStudent = getLoggedInStudent();

        if (!request.getRequester()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the buyer can report a delivery issue"
            );
        }

        if (!"BUYER_CONFIRMATION_PENDING".equalsIgnoreCase(pickup.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Delivery issue can only be reported after handover"
            );
        }

        String reason = deliveryIssueRequest.getIssueReason().toUpperCase();

        List<String> validReasons = List.of(
                "PRODUCT_NOT_RECEIVED",
                "SELLER_DID_NOT_COME",
                "WRONG_PRODUCT",
                "DAMAGED_PRODUCT",
                "SELLER_NOT_RESPONDING",
                "OTHER"
        );

        if (!validReasons.contains(reason)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid delivery issue reason"
            );
        }

        pickup.setStatus("DELIVERY_ISSUE");
        pickup.setDeliveryIssueReason(reason);
        pickup.setDeliveryIssueDescription(deliveryIssueRequest.getDescription());

        PickupSchedule savedPickup = pickupScheduleRepository.save(pickup);

        // Auto-create a complaint against the seller
        CreateComplaintRequest complaintRequest = new CreateComplaintRequest();
        complaintRequest.setRequestId(request.getId());

        String complaintType;
        switch (reason) {
            case "PRODUCT_NOT_RECEIVED":
                complaintType = "ITEM_NOT_RECEIVED";
                break;
            case "DAMAGED_PRODUCT":
            case "WRONG_PRODUCT":
                complaintType = "DAMAGED_ITEM";
                break;
            default:
                complaintType = "OTHER";
        }
        complaintRequest.setComplaintType(complaintType);

        String description = deliveryIssueRequest.getDescription();
        if (description == null || description.isBlank()) {
            description = "Buyer reported delivery issue: " + reason;
        }
        complaintRequest.setDescription(description);

        complaintService.createComplaint(complaintRequest);

        notificationService.createNotification(
                new StudentNotificationData(
                        request.getSeller().getStudentId(),
                        "STUDENT",
                        "DELIVERY_ISSUE_REPORTED",
                        request.getId()
                )
        );

        notificationService.createNotification(
                new StudentNotificationData(
                        request.getRequester().getStudentId(),
                        "STUDENT",
                        "DELIVERY_ISSUE_REPORTED",
                        request.getId()
                )
        );

        trustScoreService.recalculate(request.getSeller());

        return convertToResponse(savedPickup);
    }
    // =========================================================
    // RAISE A COMPLAINT AFTER A COMPLETED TRANSACTION
    //
    // Distinct from reportDeliveryIssue — that one only fires during
    // BUYER_CONFIRMATION_PENDING, before the pickup reaches COMPLETED.
    // This covers either party wanting to flag a problem on a
    // transaction that already finished (e.g. a buyer who confirmed
    // receipt but discovered damage afterward). Delegates to
    // ComplaintService, which requires the request to be COMPLETED
    // and figures out who the complaint is against.
    // =========================================================

    @Override
    @Transactional
    public void raiseComplaint(
            Long pickupId,
            PurchaseComplaintRequest complaintRequest) {

        if (complaintRequest == null ||
                complaintRequest.getComplaintType() == null ||
                complaintRequest.getComplaintType().isBlank() ||
                complaintRequest.getDescription() == null ||
                complaintRequest.getDescription().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Complaint type and description are required"
            );
        }

        PickupSchedule pickup =
                pickupScheduleRepository.findById(pickupId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pickup schedule not found"
                                )
                        );

        // checkAccess confirms the logged-in student is buyer or seller
        checkAccess(pickup);

        Request request = pickup.getRequest();

        CreateComplaintRequest createComplaintRequest =
                new CreateComplaintRequest();

        createComplaintRequest.setRequestId(request.getId());
        createComplaintRequest.setComplaintType(
                complaintRequest.getComplaintType());
        createComplaintRequest.setDescription(
                complaintRequest.getDescription());

        complaintService.createComplaint(createComplaintRequest);
    }
}