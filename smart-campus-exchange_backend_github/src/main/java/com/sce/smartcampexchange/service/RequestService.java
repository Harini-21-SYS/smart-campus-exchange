package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.entity.Request;

import java.util.List;

public interface RequestService {

    Request addRequest(Request request);

    List<Request> getAllRequests();

    Request getRequestById(Long id);

    Request updateRequest(Long id, Request request);

    void deleteRequest(Long id);
}