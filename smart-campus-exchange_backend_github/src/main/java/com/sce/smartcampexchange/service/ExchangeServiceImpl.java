package com.sce.smartcampexchange.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sce.smartcampexchange.dto.ExchangeRequest;
import com.sce.smartcampexchange.entity.Exchange;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.ExchangeRepository;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.RequestRepository;
import com.sce.smartcampexchange.repository.StudentRepository;

@Service
public class ExchangeServiceImpl
        implements ExchangeService {

    private final ExchangeRepository exchangeRepository;
    private final RequestRepository requestRepository;
    private final ProductRepository productRepository;
    private final StudentRepository studentRepository;
    private final NotificationService notificationService;


    public ExchangeServiceImpl(
            ExchangeRepository exchangeRepository,
            RequestRepository requestRepository,
            ProductRepository productRepository,
            StudentRepository studentRepository,
            NotificationService notificationService) {

        this.exchangeRepository = exchangeRepository;
        this.requestRepository = requestRepository;
        this.productRepository = productRepository;
        this.studentRepository = studentRepository;
        this.notificationService = notificationService;
    }


    // =========================================================
    // Logged-in Student
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
                    "User is not authenticated");
        }


        String email =
                authentication.getName();


        return studentRepository
                .findByCollegeEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Student not found"));
    }


    // =========================================================
    // Create Exchange
    // =========================================================

    @Override
    @Transactional
    public Exchange createExchange(
            ExchangeRequest exchangeRequest) {

        Student requester =
                getLoggedInStudent();


        // -----------------------------------------------------
        // Exchange eligibility
        // -----------------------------------------------------

        boolean completedBuy =
                requestRepository
                        .existsByRequesterAndRequestTypeAndStatus(
                                requester,
                                "BUY",
                                "COMPLETED");


        boolean completedDonate =
                requestRepository
                        .existsByRequesterAndRequestTypeAndStatus(
                                requester,
                                "DONATE",
                                "COMPLETED");


        if (!completedBuy &&
                !completedDonate) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Exchange is allowed only after completing "
                    + "a BUY or DONATE transaction on this website");
        }


        // -----------------------------------------------------
        // Validate target product
        // -----------------------------------------------------

        Product requestedProduct =
                productRepository
                        .findById(
                                exchangeRequest.getProductId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Requested product not found"));


        // Product must be available
        if (!"AVAILABLE".equalsIgnoreCase(
                requestedProduct.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested product is not available");
        }


        // -----------------------------------------------------
        // Cannot exchange with own product
        // -----------------------------------------------------

        if (requestedProduct
                .getOwner()
                .getStudentId()
                .equals(requester.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot exchange with your own product");
        }


        // -----------------------------------------------------
        // Offered product
        // -----------------------------------------------------

        Product offeredProduct =
                productRepository
                        .findById(
                                exchangeRequest
                                        .getOfferedProductId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Offered product not found"));


        // -----------------------------------------------------
        // Offered product must belong to requester
        // -----------------------------------------------------

        if (!offeredProduct
                .getOwner()
                .getStudentId()
                .equals(
                        requester.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can offer only your own product");
        }


        // -----------------------------------------------------
        // Offered product must be available
        // -----------------------------------------------------

        if (!"AVAILABLE".equalsIgnoreCase(
                offeredProduct.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Your offered product is not available");
        }


        // =====================================================
        // Create request_table row
        // =====================================================

        Request request =
                new Request();

        request.setProduct(
                requestedProduct);

        request.setOfferedProduct(
                offeredProduct
        );
        
        request.setSeller(
                requestedProduct.getOwner());

        request.setRequester(
                requester);

        request.setRequestType(
                "EXCHANGE");

        request.setStatus(
                "PENDING");


        Request savedRequest =
                requestRepository.save(request);


        // =====================================================
        // Create exch_table row
        // =====================================================

        Exchange exchange =
                new Exchange();

        exchange.setRequest(
                savedRequest);

        exchange.setOfferedProduct(
                offeredProduct);

        exchange.setStatus(
                "PENDING");


        Exchange savedExchange =
                exchangeRepository.save(exchange);


        // =====================================================
        // Notify seller
        // =====================================================

        Student seller =
                requestedProduct.getOwner();


        StudentNotificationData notification =
                new StudentNotificationData(

                        seller.getStudentId(),

                        "STUDENT",

                        "EXCHANGE_REQUEST_RECEIVED",

                        savedExchange.getExchangeId()
                );


        notificationService
                .createNotification(notification);


        return savedExchange;
    }


    // =========================================================
    // Get Exchange
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public Exchange getExchangeById(
            Long exchangeId) {

        return exchangeRepository
                .findById(exchangeId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Exchange not found"));
    }


    // =========================================================
    // Accept Exchange
    // =========================================================

    @Override
    @Transactional
    public Exchange acceptExchange(
            Long exchangeId) {

        Exchange exchange =
                exchangeRepository
                        .findById(exchangeId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Exchange not found"));


        Request request =
                exchange.getRequest();


        Student loggedInStudent =
                getLoggedInStudent();


        // Only seller can accept
        if (!request.getSeller()
                .getStudentId()
                .equals(
                        loggedInStudent.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the seller can accept this exchange");
        }


        if (!"PENDING".equalsIgnoreCase(
                exchange.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending exchanges can be accepted");
        }


        Product requestedProduct =
                request.getProduct();

        Product offeredProduct =
                exchange.getOfferedProduct();


        // Both products must still be available
        if (!"AVAILABLE".equalsIgnoreCase(
                requestedProduct.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested product is no longer available");
        }


        if (!"AVAILABLE".equalsIgnoreCase(
                offeredProduct.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Offered product is no longer available");
        }


        // =====================================================
        // Exchange accepted
        // =====================================================

        exchange.setStatus("ACCEPTED");

        request.setStatus("ACCEPTED");


        // Both products become exchanged
        requestedProduct.setStatus("EXCHANGED");
        offeredProduct.setStatus("EXCHANGED");


        productRepository.save(requestedProduct);
        productRepository.save(offeredProduct);

        requestRepository.save(request);

        Exchange savedExchange =
                exchangeRepository.save(exchange);


        // =====================================================
        // Notify requester
        // =====================================================

        Student requester =
                request.getRequester();


        notificationService.createNotification(
                new StudentNotificationData(

                        requester.getStudentId(),

                        "STUDENT",

                        "EXCHANGE_REQUEST_ACCEPTED",

                        savedExchange.getExchangeId()
                )
        );


        return savedExchange;
    }


    // =========================================================
    // Reject Exchange
    // =========================================================

    @Override
    @Transactional
    public Exchange rejectExchange(
            Long exchangeId) {

        Exchange exchange =
                exchangeRepository
                        .findById(exchangeId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Exchange not found"));


        Request request =
                exchange.getRequest();


        Student loggedInStudent =
                getLoggedInStudent();


        if (!request.getSeller()
                .getStudentId()
                .equals(
                        loggedInStudent.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the seller can reject this exchange");
        }


        if (!"PENDING".equalsIgnoreCase(
                exchange.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending exchanges can be rejected");
        }


        exchange.setStatus("REJECTED");

        request.setStatus("REJECTED");


        requestRepository.save(request);

        Exchange savedExchange =
                exchangeRepository.save(exchange);


        notificationService.createNotification(
                new StudentNotificationData(

                        request.getRequester()
                                .getStudentId(),

                        "STUDENT",

                        "EXCHANGE_REQUEST_REJECTED",

                        savedExchange.getExchangeId()
                )
        );


        return savedExchange;
    }
}