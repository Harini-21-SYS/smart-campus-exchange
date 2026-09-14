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

import com.sce.smartcampexchange.entity.PickupSchedule;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;

import com.sce.smartcampexchange.repository.PickupScheduleRepository;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.RequestRepository;
import com.sce.smartcampexchange.repository.StudentRepository;


@Service
public class PickupScheduleServiceImpl
        implements PickupScheduleService {

    private final PickupScheduleRepository pickupScheduleRepository;

    private final RequestRepository requestRepository;

    private final StudentRepository studentRepository;

    private final NotificationService notificationService;
    
    private final ProductRepository productRepository;
    
    private final ComplaintService complaintService;
    
   public PickupScheduleServiceImpl(
        PickupScheduleRepository pickupScheduleRepository,
        RequestRepository requestRepository,
        StudentRepository studentRepository,
        ProductRepository productRepository,
        NotificationService notificationService,
        ComplaintService complaintService
) {
    this.pickupScheduleRepository = pickupScheduleRepository;
    this.requestRepository = requestRepository;
    this.studentRepository = studentRepository;
    this.productRepository = productRepository;
    this.notificationService = notificationService;
    this.complaintService = complaintService;
}
    // =========================================================
    // CREATE PICKUP
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


        Student loggedInStudent =
                getLoggedInStudent();


        // Only seller can create pickup
        if (!existingRequest.getSeller()
                .getStudentId()
                .equals(
                        loggedInStudent.getStudentId())) {

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


        PickupSchedule pickup =
                new PickupSchedule();


        pickup.setRequest(existingRequest);

        pickup.setLocation(
                request.getLocation()
        );

        pickup.setPickupDate(
                request.getPickupDate()
        );

        pickup.setPickupTime(
                request.getPickupTime()
        );

        pickup.setStatus("SCHEDULED");


        PickupSchedule savedPickup =
                pickupScheduleRepository.save(pickup);

     // Notify buyer/requester
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
    public PickupScheduleResponse getPickupById(
            Long pickupId) {

        PickupSchedule pickup =
                pickupScheduleRepository
                        .findById(pickupId)
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
    public PickupScheduleResponse getPickupByRequestId(
            Long requestId) {

        Request request =
                requestRepository.findById(requestId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Request not found"
                                )
                        );


        PickupSchedule pickup =
                pickupScheduleRepository
                        .findByRequest(request)
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
    public List<PickupScheduleResponse>
            getAllPickups() {

        List<PickupSchedule> pickups =
                pickupScheduleRepository.findAll();


        List<PickupScheduleResponse> responses =
                new ArrayList<>();


        for (PickupSchedule pickup : pickups) {

            responses.add(
                    convertToResponse(pickup)
            );
        }


        return responses;
    }


    // =========================================================
    // MARK DELIVERED
    // =========================================================

@Override
@Transactional
public PickupScheduleResponse markAsHandedOver(
        Long pickupId) {

    // =========================================
    // GET PICKUP
    // =========================================

    PickupSchedule pickup =
            pickupScheduleRepository
                    .findById(pickupId)
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Pickup schedule not found"
                            )
                    );


    // =========================================
    // GET REQUEST
    // =========================================

    Request request =
            pickup.getRequest();


    // =========================================
    // LOGGED-IN STUDENT
    // =========================================

    Student loggedInStudent =
            getLoggedInStudent();


    // =========================================
    // ONLY SELLER CAN CONFIRM HANDOVER
    // =========================================

    if (!request.getSeller()
            .getStudentId()
            .equals(loggedInStudent.getStudentId())) {

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only the seller can confirm handover"
        );
    }


    // =========================================
    // ONLY SCHEDULED PICKUP
    // =========================================

    if (!"SCHEDULED".equalsIgnoreCase(
            pickup.getStatus())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only scheduled pickups can be marked as handed over"
        );
    }


    // =========================================
    // HANDOVER TIME
    // =========================================

    pickup.setDeliveredAt(
            LocalDateTime.now()
    );


    // =========================================
    // WAIT FOR BUYER CONFIRMATION
    // =========================================

    pickup.setStatus(
            "BUYER_CONFIRMATION_PENDING"
    );


    // =========================================
    // SAVE PICKUP
    // =========================================

    PickupSchedule savedPickup =
            pickupScheduleRepository.save(
                    pickup
            );


    // =========================================
    // NOTIFY BUYER
    // =========================================

    notificationService.createNotification(
            new StudentNotificationData(

                    request.getRequester()
                            .getStudentId(),

                    "STUDENT",

                    "BUYER_CONFIRMATION_REQUIRED",

                    savedPickup.getPickupId()
            )
    );


    return convertToResponse(
            savedPickup
    );
}


    // =========================================================
    // CANCEL
    // =========================================================
@Override
@Transactional
public PickupScheduleResponse cancelPickup(
        Long pickupId) {

    PickupSchedule pickup =
            pickupScheduleRepository
                    .findById(pickupId)
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Pickup schedule not found"
                            )
                    );


    checkAccess(pickup);


    if (!"SCHEDULED".equalsIgnoreCase(
            pickup.getStatus())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only scheduled pickups can be cancelled"
        );
    }


    // Pickup -> CANCELLED
    pickup.setStatus("CANCELLED");


    // Request -> CANCELLED
    Request request =
            pickup.getRequest();

    request.setStatus("CANCELLED");

    requestRepository.save(request);


    // Product -> AVAILABLE again
    Product product =
            request.getProduct();

    product.setStatus("AVAILABLE");

    productRepository.save(product);


    PickupSchedule savedPickup =
            pickupScheduleRepository.save(pickup);


    return convertToResponse(savedPickup);
}


    // =========================================================
    // ACCESS CHECK
    // =========================================================

    private void checkAccess(
            PickupSchedule pickup) {

        Student loggedInStudent =
                getLoggedInStudent();


        Request request =
                pickup.getRequest();


        boolean isSeller =
                request.getSeller()
                        .getStudentId()
                        .equals(
                                loggedInStudent.getStudentId()
                        );


        boolean isRequester =
                request.getRequester()
                        .getStudentId()
                        .equals(
                                loggedInStudent.getStudentId()
                        );


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

    private PickupScheduleResponse
            convertToResponse(
                    PickupSchedule pickup) {

        Request request =
                pickup.getRequest();


        Product product =
                request.getProduct();


        Student seller =
                request.getSeller();


        Student requester =
                request.getRequester();


        Long productId =
                product != null
                        ? product.getId()
                        : null;


        String productTitle =
                product != null
                        ? product.getTitle()
                        : null;


        String productImage = null;

        if (product != null &&
                product.getImages() != null &&
                !product.getImages().isEmpty()) {

            // First try to find primary image
            for (ProductImage image : product.getImages()) {

                if (image.isPrimary()) {

                    productImage =
                            image.getImageUrl();

                    break;
                }
            }


            // If no primary image found,
            // use first image
            if (productImage == null) {

                productImage =
                        product.getImages()
                                .get(0)
                                .getImageUrl();
            }
        }

        Long sellerId =
                seller != null
                        ? seller.getStudentId()
                        : null;


        String sellerName =
                seller != null
                        ? seller.getFullName()
                        : null;


        String sellerDepartment =
                seller != null
                        ? seller.getDepartment()
                        : null;


        Long requesterId =
                requester != null
                        ? requester.getStudentId()
                        : null;


        String requesterName =
                requester != null
                        ? requester.getFullName()
                        : null;


        String requesterDepartment =
                requester != null
                        ? requester.getDepartment()
                        : null;


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
 // BUYER CONFIRMS PRODUCT RECEIVED
 // =========================================================

 @Override
 @Transactional
 public PickupScheduleResponse confirmProductReceived(
         Long pickupId) {

     // =========================================
     // GET PICKUP
     // =========================================

     PickupSchedule pickup =
             pickupScheduleRepository
                     .findById(pickupId)
                     .orElseThrow(() ->
                             new ResponseStatusException(
                                     HttpStatus.NOT_FOUND,
                                     "Pickup schedule not found"
                             )
                     );


     // =========================================
     // GET REQUEST
     // =========================================

     Request request =
             pickup.getRequest();


     // =========================================
     // LOGGED-IN STUDENT
     // =========================================

     Student loggedInStudent =
             getLoggedInStudent();


     // =========================================
     // ONLY BUYER CAN CONFIRM
     // =========================================

     if (!request.getRequester()
             .getStudentId()
             .equals(
                     loggedInStudent.getStudentId()
             )) {

         throw new ResponseStatusException(
                 HttpStatus.FORBIDDEN,
                 "Only the buyer can confirm product receipt"
         );
     }


     // =========================================
     // MUST BE WAITING FOR BUYER
     // =========================================

     if (!"BUYER_CONFIRMATION_PENDING"
             .equalsIgnoreCase(
                     pickup.getStatus()
             )) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Buyer confirmation is not pending"
         );
     }


     // =========================================
     // PICKUP = COMPLETED
     // =========================================

     pickup.setStatus("COMPLETED");


     // =========================================
     // REQUEST = COMPLETED
     // =========================================

     request.setStatus("COMPLETED");

     requestRepository.save(request);


     // =========================================
     // GET REQUEST TYPE
     // =========================================

     String requestType =
             request.getRequestType();


     // =========================================
     // REQUESTED PRODUCT
     // =========================================

     Product requestedProduct =
             request.getProduct();


     // =========================================
     // BUY PRODUCT
     // =========================================

     if ("BUY".equalsIgnoreCase(
             requestType)) {

         requestedProduct.setStatus(
                 "SOLD"
         );

         productRepository.save(
                 requestedProduct
         );
     }


     // =========================================
     // EXCHANGE PRODUCTS
     // =========================================

     else if ("EXCHANGE".equalsIgnoreCase(
             requestType)) {

         // Requested product
         requestedProduct.setStatus(
                 "EXCHANGED"
         );

         productRepository.save(
                 requestedProduct
         );


         // Offered product
         Product offeredProduct =
                 request.getOfferedProduct();


         if (offeredProduct != null) {

             offeredProduct.setStatus(
                     "EXCHANGED"
             );

             productRepository.save(
                     offeredProduct
             );
         }
     }


     // =========================================
     // DONATE PRODUCT
     // =========================================

     else if ("DONATE".equalsIgnoreCase(
             requestType)) {

         requestedProduct.setStatus(
                 "DONATED"
         );

         productRepository.save(
                 requestedProduct
         );
     }


     // =========================================
     // SAVE PICKUP
     // =========================================

     PickupSchedule savedPickup =
             pickupScheduleRepository.save(
                     pickup
             );


     // =========================================
     // OPTIONAL: NOTIFY SELLER
     // =========================================

     notificationService.createNotification(
             new StudentNotificationData(
                     request.getSeller()
                             .getStudentId(),

                     "STUDENT",

                     "TRANSACTION_COMPLETED",

                     request.getId()
             )
     );


     return convertToResponse(
             savedPickup
     );
 }
 
//=========================================================
//BUYER REPORTS PRODUCT NOT RECEIVED
//=========================================================

@Override
@Transactional
public PickupScheduleResponse reportProductNotReceived(
      Long pickupId) {

  // =========================================
  // GET PICKUP
  // =========================================

  PickupSchedule pickup =
          pickupScheduleRepository
                  .findById(pickupId)
                  .orElseThrow(() ->
                          new ResponseStatusException(
                                  HttpStatus.NOT_FOUND,
                                  "Pickup schedule not found"
                          )
                  );


  Request request =
          pickup.getRequest();


  // =========================================
  // LOGGED-IN STUDENT
  // =========================================

  Student loggedInStudent =
          getLoggedInStudent();


  // =========================================
  // ONLY BUYER
  // =========================================

  if (!request.getRequester()
          .getStudentId()
          .equals(
                  loggedInStudent.getStudentId()
          )) {

      throw new ResponseStatusException(
              HttpStatus.FORBIDDEN,
              "Only the buyer can report a delivery issue"
      );
  }


  // =========================================
  // MUST BE WAITING FOR CONFIRMATION
  // =========================================

  if (!"BUYER_CONFIRMATION_PENDING"
          .equalsIgnoreCase(
                  pickup.getStatus()
          )) {

      throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST,
              "Buyer confirmation is not pending"
      );
  }


  // =========================================
  // PICKUP = DELIVERY ISSUE
  // =========================================

  pickup.setStatus(
          "DELIVERY_ISSUE"
  );


  PickupSchedule savedPickup =
          pickupScheduleRepository.save(
                  pickup
          );


  // =========================================
  // NOTIFY SELLER
  // =========================================

  notificationService.createNotification(
          new StudentNotificationData(
                  request.getSeller()
                          .getStudentId(),

                  "STUDENT",

                  "DELIVERY_ISSUE_REPORTED",

                  request.getId()
          )
  );


  /*
   * ADMIN NOTIFICATION
   *
   * We will connect this with your Complaint
   * and Admin Notification system in the
   * Complaint Management module.
   */


  return convertToResponse(
          savedPickup
  );
}
@Override
@Transactional
public PickupScheduleResponse reportDeliveryIssue(
        Long pickupId,
        DeliveryIssueRequest deliveryIssueRequest) {

    // =========================================
    // VALIDATE REQUEST
    // =========================================

    if (deliveryIssueRequest == null ||
            deliveryIssueRequest.getIssueReason() == null ||
            deliveryIssueRequest.getIssueReason().isBlank()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Delivery issue reason is required"
        );
    }


    // =========================================
    // GET PICKUP
    // =========================================

    PickupSchedule pickup =
            pickupScheduleRepository
                    .findById(pickupId)
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Pickup schedule not found"
                            )
                    );


    Request request =
            pickup.getRequest();


    // =========================================
    // GET LOGGED-IN STUDENT
    // =========================================

    Student loggedInStudent =
            getLoggedInStudent();


    // =========================================
    // ONLY BUYER CAN REPORT
    // =========================================

    if (!request.getRequester()
            .getStudentId()
            .equals(
                    loggedInStudent.getStudentId()
            )) {

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only the buyer can report a delivery issue"
        );
    }


    // =========================================
    // VALID STATUS
    // =========================================

    if (!"BUYER_CONFIRMATION_PENDING"
            .equalsIgnoreCase(
                    pickup.getStatus())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Delivery issue can only be reported after handover"
        );
    }


    // =========================================
    // VALIDATE ISSUE REASON
    // =========================================

    String reason =
            deliveryIssueRequest
                    .getIssueReason()
                    .toUpperCase();


    List<String> validReasons =
            List.of(

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


    // =========================================
    // PICKUP = DELIVERY ISSUE
    // =========================================

    pickup.setStatus(
            "DELIVERY_ISSUE"
    );


    pickup.setDeliveryIssueReason(
            reason
    );


    pickup.setDeliveryIssueDescription(
            deliveryIssueRequest
                    .getDescription()
    );


    PickupSchedule savedPickup =
            pickupScheduleRepository
                    .save(pickup);


 // =========================================
 // CREATE COMPLAINT AUTOMATICALLY
 // =========================================

 // =========================================
 // CREATE COMPLAINT AUTOMATICALLY
 // =========================================
 // =========================================
 // CREATE COMPLAINT AUTOMATICALLY
 // =========================================
 // =========================================
 // CREATE COMPLAINT AUTOMATICALLY
 // =========================================

 CreateComplaintRequest complaintRequest =
         new CreateComplaintRequest();


 // Related transaction request
 complaintRequest.setRequestId(
         request.getId()
 );


 // =========================================
 // MAP DELIVERY ISSUE TO COMPLAINT TYPE
 // =========================================

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


 // Complaint type
 complaintRequest.setComplaintType(
         complaintType
 );


 // =========================================
 // DESCRIPTION
 // =========================================

 String description =
         deliveryIssueRequest.getDescription();

 if (description == null ||
         description.isBlank()) {

     description =
             "Buyer reported delivery issue: "
                     + reason;
 }

 complaintRequest.setDescription(
         description
 );


 // =========================================
 // CREATE COMPLAINT
 // =========================================

 complaintService.createComplaint(
         complaintRequest
 );  
    // =========================================
    // NOTIFY SELLER
    // =========================================

    notificationService.createNotification(
            new StudentNotificationData(

                    request.getSeller()
                            .getStudentId(),

                    "STUDENT",

                    "DELIVERY_ISSUE_REPORTED",

                    request.getId()
            )
    );


    // =========================================
    // BUYER NOTIFICATION
    // =========================================

    notificationService.createNotification(
            new StudentNotificationData(

                    request.getRequester()
                            .getStudentId(),

                    "STUDENT",

                    "DELIVERY_ISSUE_REPORTED",

                    request.getId()
            )
    );


    return convertToResponse(
            savedPickup
    );
}
}