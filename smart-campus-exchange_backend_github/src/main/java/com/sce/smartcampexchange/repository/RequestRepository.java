package com.sce.smartcampexchange.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;

public interface RequestRepository
        extends JpaRepository<Request, Long> {

    // My Requests
    List<Request> findByRequesterOrderByCreatedAtDesc(
            Student requester
    );

    // Incoming Requests
    List<Request> findBySellerOrderByCreatedAtDesc(
            Student seller
    );

    // Get all requests for a product
    List<Request> findByProduct(
            Product product
    );

    // FIX: needed for cascading product deletion — a product can also
    // be referenced as the OFFERED item in an exchange request, not
    // just as the main requested product. Without also cleaning these
    // up, deleting a product that was ever offered in an exchange would
    // hit the same FK constraint error.
    List<Request> findByOfferedProduct(
            Product offeredProduct
    );

    // Check completed BUY or DONATE transaction
    boolean existsByRequesterAndRequestTypeAndStatus(
            Student requester,
            String requestType,
            String status
    );

    // One-time ownership backfill (AdminService.backfillProductOwnership):
    // every COMPLETED request, oldest first, so replaying them in order
    // always lands on the correct final owner for a product that's
    // changed hands more than once.
    List<Request> findByStatusOrderByUpdatedAtAsc(
            String status
    );

    // =========================================================
    // TRUST SCORE SUPPORT
    //
    // Experience bonus in TrustScoreService counts completed
    // transactions on both sides of a deal — as the seller and as the
    // buyer/requester — since either role reflects real activity on
    // the platform.
    // =========================================================

    long countBySellerAndStatus(
            Student seller,
            String status
    );

    long countByRequesterAndStatus(
            Student requester,
            String status
    );
}