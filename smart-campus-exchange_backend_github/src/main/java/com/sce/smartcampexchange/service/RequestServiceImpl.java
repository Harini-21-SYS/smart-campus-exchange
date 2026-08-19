package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.RequestRepository;
import com.sce.smartcampexchange.repository.StudentRepository;

import org.springframework.stereotype.Service;

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

    @Override
    public Request addRequest(Request request) {

        // Get Product ID from request
        Long productId = request.getProduct().getId();

        Product existingProduct = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: " + productId));

        // Get Owner ID from request
        Long ownerId = request.getOwner().getStudentId();

        Student existingOwner = studentRepository.findById(ownerId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Owner student not found with id: " + ownerId));

        // Get Requester ID from request
        Long requesterId = request.getRequester().getStudentId();

        Student existingRequester = studentRepository.findById(requesterId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Requester student not found with id: " + requesterId));

        // Set managed entities
        request.setProduct(existingProduct);
        request.setOwner(existingOwner);
        request.setRequester(existingRequester);

        return requestRepository.save(request);
    }

    @Override
    public List<Request> getAllRequests() {

        return requestRepository.findAll();
    }

    @Override
    public Request getRequestById(Long id) {

        return requestRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Request not found with id: " + id));
    }

    @Override
    public Request updateRequest(Long id, Request request) {

        Request existingRequest = getRequestById(id);

        existingRequest.setReqType(request.getReqType());
        existingRequest.setStatus(request.getStatus());

        return requestRepository.save(existingRequest);
    }

    @Override
    public void deleteRequest(Long id) {

    	
        Request existingRequest = getRequestById(id);

        requestRepository.delete(existingRequest);
    }
}
