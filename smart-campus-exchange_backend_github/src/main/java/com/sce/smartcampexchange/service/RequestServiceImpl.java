package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.dto.RequestResponse;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.RequestRepository;
import com.sce.smartcampexchange.repository.StudentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RequestServiceImpl implements RequestService {

    private final RequestRepository requestRepository;

    private final ProductRepository productRepository;

    private final StudentRepository studentRepository;

    public RequestServiceImpl(
            RequestRepository requestRepository,
            ProductRepository productRepository,
            StudentRepository studentRepository) {

        this.requestRepository = requestRepository;
        this.productRepository = productRepository;
        this.studentRepository = studentRepository;
    }

    // =========================================================
    // Add Request
    // =========================================================

    @Override
    public RequestResponse addRequest(Request request) {

        // Get Product ID from request
        Long productId = request.getProduct().getId();

        Product existingProduct =
                productRepository.findById(productId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Product not found with id: "
                                                + productId));

        // Get logged-in student
        Student loggedInStudent =
                getLoggedInStudent();

        // Product owner
        Student existingOwner =
                existingProduct.getOwner();

        // Prevent owner from requesting their own product
        if (existingOwner.getStudentId()
                .equals(loggedInStudent.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot request your own product");
        }

        // Set managed entities
        request.setProduct(existingProduct);

        request.setOwner(existingOwner);

        request.setRequester(loggedInStudent);

        // Always start as PENDING
        request.setStatus("PENDING");

        Request savedRequest =
                requestRepository.save(request);

        return convertToRequestResponse(savedRequest);
    }

    // =========================================================
    // Get All Requests
    // =========================================================

    @Override
    public List<RequestResponse> getAllRequests() {

        List<Request> requests =
                requestRepository.findAll();

        List<RequestResponse> responses =
                new ArrayList<>();

        for (Request request : requests) {

            responses.add(
                    convertToRequestResponse(request)
            );
        }

        return responses;
    }

    // =========================================================
    // Get Request By ID
    // =========================================================

    @Override
    public RequestResponse getRequestById(Long id) {

        Request request =
                requestRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Request not found with id: "
                                                + id));

        return convertToRequestResponse(request);
    }

    // =========================================================
    // Update Request
    // =========================================================

    @Override
    public RequestResponse updateRequest(
            Long id,
            Request request) {

        Request existingRequest =
                requestRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Request not found with id: "
                                                + id));

        existingRequest.setReqType(
                request.getReqType()
        );

        existingRequest.setStatus(
                request.getStatus()
        );

        Request updatedRequest =
                requestRepository.save(existingRequest);

        return convertToRequestResponse(
                updatedRequest
        );
    }

    // =========================================================
    // Delete Request
    // =========================================================

    @Override
    public void deleteRequest(Long id) {

        Request existingRequest =
                requestRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Request not found with id: "
                                                + id));

        requestRepository.delete(existingRequest);
    }

    // =========================================================
    // Convert Request Entity → RequestResponse
    // =========================================================

    private RequestResponse convertToRequestResponse(
            Request request) {

        Long productId = null;
        String productTitle = null;

        Long ownerId = null;
        String ownerName = null;

        Long requesterId = null;
        String requesterName = null;

        // Product
        if (request.getProduct() != null) {

            productId =
                    request.getProduct().getId();

            productTitle =
                    request.getProduct().getTitle();
        }

        // Owner
        if (request.getOwner() != null) {

            ownerId =
                    request.getOwner().getStudentId();

            ownerName =
                    request.getOwner().getFullName();
        }

        // Requester
        if (request.getRequester() != null) {

            requesterId =
                    request.getRequester().getStudentId();

            requesterName =
                    request.getRequester().getFullName();
        }

        return new RequestResponse(

                request.getId(),

                productId,
                productTitle,

                ownerId,
                ownerName,

                requesterId,
                requesterName,

                request.getReqType(),
                request.getStatus(),

                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }

    // =========================================================
    // Get Logged-in Student
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
                                "Logged-in student not found"));
    }
}