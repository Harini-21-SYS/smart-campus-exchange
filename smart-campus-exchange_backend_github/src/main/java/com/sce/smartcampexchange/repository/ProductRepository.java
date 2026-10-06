package com.sce.smartcampexchange.repository;

import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.Student;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    List<Product> findByOwner(Student owner);

    List<Product> findByOwnerNot(Student owner);

    List<Product> findByStatus(String status);

    List<Product> findByOwnerAndStatus(
            Student owner,
            String status
    );

    // Needed by ProductService.getMyProducts(). Since Product.owner
    // now transfers to whoever buys/receives an item (see
    // PickupScheduleServiceImpl.confirmProductReceived), a plain
    // findByOwner(you) also returns everything you've ever acquired —
    // not just what you're actively listing. Excluding the terminal
    // statuses keeps "My Products" to things you're actually offering;
    // AVAILABLE and RESERVED listings both still show, since ownership
    // hasn't moved yet at that point.
    List<Product> findByOwnerAndStatusNotIn(
            Student owner,
            List<String> excludedStatuses
    );

    // Needed by ProductService.getOtherProducts() — the general/browse
    // marketplace listing. findByOwnerNot(you) alone had no status
    // filter at all, so RESERVED (already accepted, awaiting pickup),
    // SOLD, EXCHANGED and DONATED items from other students all showed
    // up as if still purchasable, which meant a buyer could send a
    // request that addRequest() would then reject as unavailable.
    // AVAILABLE is the only state a product should be shown in here.
    List<Product> findByOwnerNotAndStatus(
            Student owner,
            String status
    );
}