package com.sce.smartcampexchange.service;

import java.util.ArrayList;
import java.util.List;
import com.sce.smartcampexchange.entity.ProductImage;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sce.smartcampexchange.dto.RequestResponse;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.RequestRepository;
import com.sce.smartcampexchange.repository.StudentRepository;
import com.sce.smartcampexchange.dto.AcceptRequestRequest;
import com.sce.smartcampexchange.entity.PickupSchedule;
import java.time.LocalDate;
import java.time.LocalTime;
import com.sce.smartcampexchange.repository.PickupScheduleRepository;
@Service


public class RequestServiceImpl implements RequestService {

    private final RequestRepository requestRepository;
    private final ProductRepository productRepository;
    private final StudentRepository studentRepository;
    private final NotificationService notificationService;

    private final PickupScheduleRepository pickupScheduleRepository;

    
   public RequestServiceImpl(

        RequestRepository requestRepository,

        ProductRepository productRepository,

        StudentRepository studentRepository,

        PickupScheduleRepository pickupScheduleRepository,

        NotificationService notificationService) {

    this.requestRepository = requestRepository;

    this.productRepository = productRepository;

    this.studentRepository = studentRepository;

    this.pickupScheduleRepository =
            pickupScheduleRepository;

    this.notificationService =
            notificationService;
}


    // =========================================================
    // ADD REQUEST
    // =========================================================

  @Override
@Transactional
public RequestResponse addRequest(Request request) {

    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (request == null ||
            request.getProduct() == null ||
            request.getProduct().getId() == null) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Requested product is required"
        );
    }


    // =========================================
    // GET REQUESTED PRODUCT
    // =========================================

    Long productId =
            request.getProduct().getId();


    Product product =
            productRepository.findById(productId)
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Product not found"
                            )
                    );


    // =========================================
    // PRODUCT MUST BE AVAILABLE
    // =========================================

    if (!"AVAILABLE".equalsIgnoreCase(
            product.getStatus())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "This product is no longer available"
        );
    }


    // =========================================
    // LOGGED-IN STUDENT
    // =========================================

    Student requester =
            getLoggedInStudent();


 // =========================================
 // VALIDATE PRODUCT TYPE
 // =========================================

 String productType =
         product.getType();


 String requestType =
         request.getRequestType();


 // =========================================
 // DEFAULT REQUEST TYPE
 // =========================================

 if (requestType == null ||
         requestType.isBlank()) {

     requestType = "BUY";

     request.setRequestType(
             requestType
     );
 }


 // =========================================
 // SELL PRODUCT
 // =========================================

 if ("SELL".equalsIgnoreCase(
         productType)) {

     if (!"BUY".equalsIgnoreCase(
             requestType)) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Sell products can only receive BUY requests"
         );
     }
 }


 // =========================================
 // EXCHANGE PRODUCT
 // =========================================

 else if ("EXCHANGE".equalsIgnoreCase(
         productType)) {

     if (!"EXCHANGE".equalsIgnoreCase(
             requestType)) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Exchange products can only receive EXCHANGE requests"
         );
     }
 }


 // =========================================
 // DONATE PRODUCT
 // =========================================

 else if ("DONATE".equalsIgnoreCase(
         productType)) {

     if (!"DONATE".equalsIgnoreCase(
             requestType)) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Donate products can only receive DONATE requests"
         );
     }
 }


 // =========================================
 // INVALID PRODUCT TYPE
 // =========================================

 else {

     throw new ResponseStatusException(
             HttpStatus.BAD_REQUEST,
             "Invalid product type"
     );
 }
    // =========================================
    // SELLER
    // =========================================

    Student seller =
            product.getOwner();


    if (seller == null) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Product seller not found"
        );
    }


    // =========================================
    // CANNOT REQUEST OWN PRODUCT
    // =========================================

    if (seller.getStudentId()
            .equals(requester.getStudentId())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "You cannot request your own product"
        );
    }


    // =========================================
    // SET BASIC REQUEST DATA
    // =========================================

    request.setProduct(product);

    request.setSeller(seller);

    request.setRequester(requester);


    

 // =========================================
 // EXCHANGE REQUEST
 // =========================================

 if ("EXCHANGE".equalsIgnoreCase(
         request.getRequestType())) {

     // =====================================
     // OFFERED PRODUCT REQUIRED
     // =====================================

     if (request.getOfferedProduct() == null ||
             request.getOfferedProduct().getId() == null) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Offered product is required for exchange"
         );
     }


     Long offeredProductId =
             request.getOfferedProduct()
                     .getId();


     Product offeredProduct =
             productRepository
                     .findById(offeredProductId)
                     .orElseThrow(() ->
                             new ResponseStatusException(
                                     HttpStatus.NOT_FOUND,
                                     "Offered product not found"
                             )
                     );


     // =====================================
     // OFFERED PRODUCT MUST BELONG
     // TO REQUESTER
     // =====================================

     if (offeredProduct.getOwner() == null ||
             !offeredProduct
                     .getOwner()
                     .getStudentId()
                     .equals(
                             requester.getStudentId()
                     )) {

         throw new ResponseStatusException(
                 HttpStatus.FORBIDDEN,
                 "You can only offer your own product"
         );
     }


     // =====================================
     // OFFERED PRODUCT MUST BE AVAILABLE
     // =====================================

     if (!"AVAILABLE".equalsIgnoreCase(
             offeredProduct.getStatus())) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Your offered product is not available"
         );
     }


     // =====================================
     // CANNOT OFFER SAME PRODUCT
     // =====================================

     if (offeredProduct.getId()
             .equals(product.getId())) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Requested product and offered product cannot be the same"
         );
     }


     // =====================================
     // SET OFFERED PRODUCT
     // =====================================

     request.setOfferedProduct(
             offeredProduct
     );
 }


 // =========================================
 // BUY OR DONATE REQUEST
 // =========================================

 else if ("BUY".equalsIgnoreCase(
         request.getRequestType())

         ||

         "DONATE".equalsIgnoreCase(
                 request.getRequestType())) {

     // No offered product needed
     request.setOfferedProduct(null);
 }


 // =========================================
 // INVALID REQUEST TYPE
 // =========================================

 else {

     throw new ResponseStatusException(
             HttpStatus.BAD_REQUEST,
             "Request type must be BUY, EXCHANGE or DONATE"
     );
 }

    // =========================================
    // SET STATUS
    // =========================================

    request.setStatus("PENDING");


    // =========================================
    // SAVE REQUEST
    // =========================================

    Request savedRequest =
            requestRepository.save(request);


    // =========================================
    // NOTIFY SELLER
    // =========================================

    notificationService.createNotification(
            new StudentNotificationData(
                    seller.getStudentId(),
                    "STUDENT",
                    "REQUEST_RECEIVED",
                    savedRequest.getId()
            )
    );


    // =========================================
    // RESPONSE
    // =========================================

    return convertToResponse(
            savedRequest
    );
}


    // =========================================================
    // GET ALL
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<RequestResponse> getAllRequests() {

        List<Request> requests =
                requestRepository.findAll();

        List<RequestResponse> responses =
                new ArrayList<>();


        for (Request request : requests) {

            responses.add(
                    convertToResponse(request)
            );
        }


        return responses;
    }


    // =========================================================
    // MY REQUESTS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<RequestResponse> getMyRequests() {

        Student student =
                getLoggedInStudent();


        List<Request> requests =
                requestRepository
                        .findByRequesterOrderByCreatedAtDesc(
                                student
                        );


        List<RequestResponse> responses =
                new ArrayList<>();


        for (Request request : requests) {

            responses.add(
                    convertToResponse(request)
            );
        }


        return responses;
    }


    // =========================================================
    // INCOMING REQUESTS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<RequestResponse> getIncomingRequests() {

        Student seller =
                getLoggedInStudent();


        List<Request> requests =
                requestRepository
                        .findBySellerOrderByCreatedAtDesc(
                                seller
                        );


        List<RequestResponse> responses =
                new ArrayList<>();


        for (Request request : requests) {

            responses.add(
                    convertToResponse(request)
            );
        }


        return responses;
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public RequestResponse getRequestById(Long id) {

        Request request =
                requestRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Request not found with id: "
                                                + id
                                )
                        );


        Student loggedIn =
                getLoggedInStudent();


        boolean isSeller =
                request.getSeller()
                        .getStudentId()
                        .equals(loggedIn.getStudentId());


        boolean isRequester =
                request.getRequester()
                        .getStudentId()
                        .equals(loggedIn.getStudentId());


        if (!isSeller && !isRequester) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to access this request"
            );
        }


        return convertToResponse(request);
    }

// =========================================================
// ACCEPT REQUEST + CREATE PICKUP SCHEDULE
// =========================================================

@Override
@Transactional
public RequestResponse acceptRequest(
        Long id,
        AcceptRequestRequest acceptRequestRequest) {

    // =========================================
    // VALIDATE PICKUP DETAILS
    // =========================================

    if (acceptRequestRequest == null) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Pickup details are required"
        );
    }


    if (acceptRequestRequest.getLocation() == null ||
            acceptRequestRequest.getLocation().isBlank()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Pickup location is required"
        );
    }


    if (acceptRequestRequest.getPickupDate() == null) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Pickup date is required"
        );
    }


    if (acceptRequestRequest.getPickupTime() == null) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Pickup time is required"
        );
    }


    // =========================================
    // GET REQUEST
    // =========================================

    Request request =
            requestRepository.findById(id)
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Request not found"
                            )
                    );


    // =========================================
    // LOGGED-IN SELLER
    // =========================================

    Student seller =
            getLoggedInStudent();


    // =========================================
    // ONLY SELLER CAN ACCEPT
    // =========================================

    if (!request.getSeller()
            .getStudentId()
            .equals(seller.getStudentId())) {

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only the seller can accept this request"
        );
    }


    // =========================================
    // ONLY PENDING REQUEST
    // =========================================

    if (!"PENDING".equalsIgnoreCase(
            request.getStatus())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only pending requests can be accepted"
        );
    }


    // =========================================
    // REQUESTED PRODUCT
    // =========================================

    Product product =
            request.getProduct();


    // Product must still be available
    if (!"AVAILABLE".equalsIgnoreCase(
            product.getStatus())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Product is no longer available"
        );
    }


    // =========================================
    // CHECK PICKUP ALREADY EXISTS
    // =========================================

    if (pickupScheduleRepository
            .existsByRequest(request)) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Pickup schedule already exists for this request"
        );
    }


    // =========================================
    // EXCHANGE PRODUCT VALIDATION
    // =========================================

    Product offeredProduct = null;


    if ("EXCHANGE".equalsIgnoreCase(
            request.getRequestType())) {

        offeredProduct =
                request.getOfferedProduct();


        if (offeredProduct == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Offered product not found for exchange"
            );
        }


        // Offered product must still be available
        if (!"AVAILABLE".equalsIgnoreCase(
                offeredProduct.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Offered product is no longer available"
            );
        }
    }


    // =========================================
    // REQUEST = ACCEPTED
    // =========================================

    request.setStatus("ACCEPTED");


    Request savedRequest =
            requestRepository.save(request);


    // =========================================
    // REQUESTED PRODUCT = RESERVED
    // =========================================

    product.setStatus("RESERVED");

    productRepository.save(product);


    // =========================================
    // EXCHANGE PRODUCT = RESERVED
    // =========================================

    if (offeredProduct != null) {

        offeredProduct.setStatus("RESERVED");

        productRepository.save(offeredProduct);
    }


    // =========================================
    // CREATE PICKUP SCHEDULE
    // =========================================

    PickupSchedule pickup =
            new PickupSchedule();


    pickup.setRequest(savedRequest);

    pickup.setLocation(
            acceptRequestRequest.getLocation()
    );

    pickup.setPickupDate(
            acceptRequestRequest.getPickupDate()
    );

    pickup.setPickupTime(
            acceptRequestRequest.getPickupTime()
    );

    pickup.setStatus("SCHEDULED");


    pickupScheduleRepository.save(pickup);


    // =========================================
    // REJECT OTHER PENDING REQUESTS
    // =========================================

    List<Request> otherRequests =
            requestRepository.findByProduct(product);


    for (Request otherRequest : otherRequests) {

        // Skip accepted request
        if (otherRequest.getId()
                .equals(savedRequest.getId())) {

            continue;
        }


        // Reject only pending requests
        if ("PENDING".equalsIgnoreCase(
                otherRequest.getStatus())) {

            otherRequest.setStatus("REJECTED");

            requestRepository.save(otherRequest);


            // Notify rejected requester
            notificationService.createNotification(
                    new StudentNotificationData(
                            otherRequest.getRequester()
                                    .getStudentId(),

                            "STUDENT",

                            "REQUEST_REJECTED",

                            otherRequest.getId()
                    )
            );
        }
    }


    // =========================================
    // NOTIFY ACCEPTED BUYER
    // =========================================

    notificationService.createNotification(
            new StudentNotificationData(
                    savedRequest.getRequester()
                            .getStudentId(),

                    "STUDENT",

                    "REQUEST_ACCEPTED",

                    savedRequest.getId()
            )
    );


    // =========================================
    // NOTIFY PICKUP SCHEDULE
    // =========================================

    notificationService.createNotification(
            new StudentNotificationData(
                    savedRequest.getRequester()
                            .getStudentId(),

                    "STUDENT",

                    "PICKUP_SCHEDULED",

                    pickup.getPickupId()
            )
    );


    return convertToResponse(
            savedRequest
    );
}


    // =========================================================
    // REJECT REQUEST
    // =========================================================

    @Override
    @Transactional
    public RequestResponse rejectRequest(Long id) {

        Request request =
                requestRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Request not found"
                                )
                        );


        Student seller =
                getLoggedInStudent();


        if (!request.getSeller()
                .getStudentId()
                .equals(seller.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the seller can reject this request"
            );
        }


        if (!"PENDING".equalsIgnoreCase(
                request.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending requests can be rejected"
            );
        }


        request.setStatus("REJECTED");


        Request savedRequest =
                requestRepository.save(request);


        notificationService.createNotification(
                new StudentNotificationData(
                        request.getRequester()
                                .getStudentId(),
                        "STUDENT",
                        "REQUEST_REJECTED",
                        savedRequest.getId()
                )
        );


        return convertToResponse(savedRequest);
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Override
    @Transactional
    public void deleteRequest(Long id) {

        Request request =
                requestRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Request not found"
                                )
                        );


        requestRepository.delete(request);
    }


    // =========================================================
// CONVERT
// =========================================================

private RequestResponse convertToResponse(Request request) {

    Product product = request.getProduct();

    Product offeredProduct = request.getOfferedProduct();

    Student seller = request.getSeller();

    Student requester = request.getRequester();


    // =========================================
    // GET PICKUP SCHEDULE
    // =========================================

    PickupSchedule pickup =
            pickupScheduleRepository
                    .findByRequest(request)
                    .orElse(null);


    // =========================================
    // PICKUP DETAILS
    // =========================================

    String pickupLocation = null;

    LocalDate pickupDate = null;

    LocalTime pickupTime = null;

    String pickupStatus = null;


    if (pickup != null) {

        pickupLocation =
                pickup.getLocation();

        pickupDate =
                pickup.getPickupDate();

        pickupTime =
                pickup.getPickupTime();

        pickupStatus =
                pickup.getStatus();
    }


    // =========================================
    // REQUESTED PRODUCT
    // =========================================

    Long productId =
            product != null
                    ? product.getId()
                    : null;

    String productTitle =
            product != null
                    ? product.getTitle()
                    : null;

 // =========================================
 // REQUESTED PRODUCT IMAGE
 // =========================================

 String productImage = null;

 if (product != null &&
         product.getImages() != null &&
         !product.getImages().isEmpty()) {

     // Try primary image first
     for (ProductImage image : product.getImages()) {

         if (image.isPrimary()) {

             productImage =
                     image.getImageUrl();

             break;
         }
     }

     // If primary image not found,
     // use first image
     if (productImage == null) {

         productImage =
                 product.getImages()
                         .get(0)
                         .getImageUrl();
     }
 }
    

    // =========================================
    // OFFERED PRODUCT
    // =========================================

    Long offeredProductId =
            offeredProduct != null
                    ? offeredProduct.getId()
                    : null;

    String offeredProductTitle =
            offeredProduct != null
                    ? offeredProduct.getTitle()
                    : null;

    String offeredProductImage = null;

    if (offeredProduct != null &&
            offeredProduct.getImages() != null &&
            !offeredProduct.getImages().isEmpty()) {

        offeredProductImage =
                offeredProduct.getImages()
                        .get(0)
                        .getImageUrl();
    }


    // =========================================
    // SELLER
    // =========================================

    Long sellerId =
            seller != null
                    ? seller.getStudentId()
                    : null;

    String sellerName =
            seller != null
                    ? seller.getFullName()
                    : null;


    // =========================================
    // REQUESTER
    // =========================================

    Long requesterId =
            requester != null
                    ? requester.getStudentId()
                    : null;

    String requesterName =
            requester != null
                    ? requester.getFullName()
                    : null;


    // =========================================
    // RESPONSE
    // =========================================

    return new RequestResponse(

            request.getId(),

            // Requested Product
            productId,
            productTitle,

            productImage,
            // Offered Product
            offeredProductId,
            offeredProductTitle,
            offeredProductImage,

            // Seller
            sellerId,
            sellerName,

            // Requester
            requesterId,
            requesterName,

            // Request Details
            request.getRequestType(),
            request.getStatus(),

            // Dates
            request.getCreatedAt(),
            request.getUpdatedAt(),

            // Pickup Details
            pickupLocation,
            pickupDate,
            pickupTime,
            pickupStatus
    );
}


    // =========================================================
    // LOGGED IN STUDENT
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


    if (email == null ||
            email.isBlank() ||
            "anonymousUser".equals(email)) {

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid authenticated user"
        );
    }


    return studentRepository
            .findByCollegeEmail(email)
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Student not found for email: "
                                    + email
                    )
            );
}
}