package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.dto.ExchangeRequest;
import com.sce.smartcampexchange.entity.Exchange;

public interface ExchangeService {

    Exchange createExchange(
            ExchangeRequest request);

    Exchange getExchangeById(
            Long exchangeId);

    Exchange acceptExchange(
            Long exchangeId);

    Exchange rejectExchange(
            Long exchangeId);
}