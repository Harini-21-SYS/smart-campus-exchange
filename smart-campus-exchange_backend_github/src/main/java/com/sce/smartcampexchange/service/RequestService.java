package com.sce.smartcampexchange.service;

import java.util.List;

import com.sce.smartcampexchange.dto.RequestResponse;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.dto.AcceptRequestRequest;
public interface RequestService {

    RequestResponse addRequest(Request request);

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