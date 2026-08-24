package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.entity.Request;

import java.util.List;
import com.sce.smartcampexchange.dto.RequestResponse;

public interface RequestService {

	RequestResponse addRequest(Request request);

	List<RequestResponse> getAllRequests();

	RequestResponse getRequestById(Long id);

	RequestResponse updateRequest(Long id, Request request);

    void deleteRequest(Long id);
}