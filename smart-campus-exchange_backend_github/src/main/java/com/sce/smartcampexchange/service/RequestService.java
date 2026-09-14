package com.sce.smartcampexchange.service;

import java.util.List;

import com.sce.smartcampexchange.dto.RequestResponse;
import com.sce.smartcampexchange.dto.CreateRequestRequest;
import com.sce.smartcampexchange.dto.AcceptRequestRequest;

public interface RequestService {

    // FIX: was addRequest(Request request) — took the raw JPA entity.
    // Now takes CreateRequestRequest (plain IDs), matching the pattern
    // ProductService already uses correctly with ProductRequest.
    RequestResponse addRequest(CreateRequestRequest request);

    List<RequestResponse> getAllRequests();

    List<RequestResponse> getMyRequests();

    List<RequestResponse> getIncomingRequests();

    RequestResponse getRequestById(Long id);

    RequestResponse acceptRequest(
            Long id,
            AcceptRequestRequest acceptRequestRequest
    );
    RequestResponse rejectRequest(Long id);

    void deleteRequest(Long id);
}