package com.sce.smartcampexchange.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.sce.smartcampexchange.dto.ProductImageResponse;
import com.sce.smartcampexchange.dto.ProductRequest;
import com.sce.smartcampexchange.dto.ProductResponse;
import com.sce.smartcampexchange.entity.PickupSchedule;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;
import com.sce.smartcampexchange.entity.Request;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.entity.TrustScore;
import com.sce.smartcampexchange.repository.PickupScheduleRepository;
import com.sce.smartcampexchange.repository.ProductImageRepository;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.RequestRepository;
import com.sce.smartcampexchange.repository.StudentRepository;
import com.sce.smartcampexchange.repository.TrustScoreRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final StudentRepository studentRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final RequestRepository requestRepository;
    private final PickupScheduleRepository pickupScheduleRepository;

    // Upload folder
    private final Path uploadPath = Paths.get("uploads/products");

    public ProductService(
            ProductRepository productRepository,
            ProductImageRepository productImageRepository,
            StudentRepository studentRepository,
            TrustScoreRepository trustScoreRepository,
            RequestRepository requestRepository,
            PickupScheduleRepository pickupScheduleRepository) {

        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.studentRepository = studentRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.requestRepository = requestRepository;
        this.pickupScheduleRepository = pickupScheduleRepository;
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

        String email = authentication.getName();

        Student student =
                studentRepository
                        .findByCollegeEmail(email)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Logged-in student not found"));

        return student;
    }

    // =========================================================
    // Add Product
    // =========================================================
    @Transactional
    public ProductResponse addProduct(
            ProductRequest request,
            MultipartFile[] images,
            Integer primaryImageIndex) {

        Student student = getLoggedInStudent();

        // Basic validations
        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Product details are required"
            );
        }

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product title is required");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product description is required");
        }
        if (request.getCategory() == null || request.getCategory().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product category is required");
        }
        if (request.getType() == null || request.getType().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product type is required");
        }
        if (request.getCondition() == null || request.getCondition().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product condition is required");
        }
        if (request.getPrice() == null || request.getPrice().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid product price is required");
        }

        if (images == null || images.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least 1 product image is required");
        }
        if (images.length > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum 4 product images are allowed");
        }

        if (primaryImageIndex != null) {
            if (primaryImageIndex < 0 || primaryImageIndex >= images.length) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid primary image selection");
            }
            if (images[primaryImageIndex] == null || images[primaryImageIndex].isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected primary image is invalid");
            }
        }

        int validImageCount = 0;
        for (MultipartFile file : images) {
            if (file != null && !file.isEmpty()) validImageCount++;
        }
        if (validImageCount == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least 1 valid product image is required");
        }

        // Create product
        Product product = new Product();
        product.setOwner(student);
        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setType(request.getType());
        product.setPrice(request.getPrice());
        product.setCondition(request.getCondition());
        product.setStatus("PENDING");

        Product savedProduct = productRepository.save(product);

        // Save images
        List<ProductImageResponse> imageResponses = new ArrayList<>();

        for (int i = 0; i < images.length; i++) {
            MultipartFile file = images[i];
            if (file == null || file.isEmpty()) continue;

            String imageUrl = saveImage(file);

            ProductImage image = new ProductImage();
            image.setProduct(savedProduct);
            image.setImageUrl(imageUrl);

            boolean makePrimary;
            if (primaryImageIndex != null) {
                makePrimary = (i == primaryImageIndex);
            } else {
                // First successfully-saved image becomes primary — using
                // imageResponses.isEmpty() (rather than i == 0) correctly
                // handles the case where index 0 was null/empty and got
                // skipped, so the actual first real image still gets
                // marked primary instead of nothing being primary at all.
                makePrimary = imageResponses.isEmpty();
            }
            image.setPrimary(makePrimary);

            ProductImage savedImage = productImageRepository.save(image);

            imageResponses.add(new ProductImageResponse(
                    savedImage.getId(),
                    savedImage.getImageUrl(),
                    savedImage.isPrimary()
            ));
        }

        savedProduct.setStatus("AVAILABLE");
        savedProduct = productRepository.save(savedProduct);

        return new ProductResponse(
                savedProduct.getId(),
                savedProduct.getOwner().getStudentId(),
                savedProduct.getOwner().getFullName(),
                savedProduct.getOwner().getProfileImage(),
                trustScoreRepository.findByStudentStudentId(savedProduct.getOwner().getStudentId())
                        .map(TrustScore::getScore).orElse(50.0),
                savedProduct.getOwner().getDepartment(),
                savedProduct.getTitle(),
                savedProduct.getDescription(),
                savedProduct.getCategory(),
                savedProduct.getType(),
                savedProduct.getPrice(),
                savedProduct.getCondition(),
                savedProduct.getStatus(),
                savedProduct.getCreatedAt(),
                savedProduct.getUpdatedAt(),
                imageResponses
        );
    }

    // =========================================================
    // Save Image File
    // =========================================================
    private String saveImage(MultipartFile file) {
        try {
            Files.createDirectories(uploadPath);

            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String fileName = UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/products/" + fileName;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save image", e);
        }
    }

    // =========================================================
    // Add More Product Images
    // =========================================================
    @Transactional
    public ProductResponse uploadProductImages(
            Long id,
            MultipartFile[] images,
            Integer primaryImageIndex) {

        Student loggedInStudent = getLoggedInStudent();

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id));

        if (!product.getOwner().getStudentId().equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to upload images for this product");
        }

        if (images == null || images.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least 1 image is required");
        }
        if (images.length > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum 4 images can be uploaded at a time");
        }

        List<ProductImage> existingImages = productImageRepository.findByProduct(product);
        int existingImageCount = existingImages.size();

        int newImageCount = 0;
        for (MultipartFile file : images) {
            if (file != null && !file.isEmpty()) newImageCount++;
        }

        if (newImageCount == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least 1 valid image is required");
        }
        if (existingImageCount + newImageCount > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A product can have maximum 4 images. Existing images: "
                    + existingImageCount + ", New images: " + newImageCount);
        }

        if (primaryImageIndex != null) {
            if (primaryImageIndex < 0 || primaryImageIndex >= images.length) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid primary image selection");
            }
            MultipartFile selectedImage = images[primaryImageIndex];
            if (selectedImage == null || selectedImage.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected primary image is invalid");
            }

            // remove primary from existing
            for (ProductImage existingImage : existingImages) {
                if (existingImage.isPrimary()) {
                    existingImage.setPrimary(false);
                    productImageRepository.save(existingImage);
                }
            }
        }

        // Save new images
        for (int i = 0; i < images.length; i++) {
            MultipartFile file = images[i];
            if (file == null || file.isEmpty()) continue;

            String imageUrl = saveImage(file);
            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setImageUrl(imageUrl);

            if (primaryImageIndex != null) {
                image.setPrimary(i == primaryImageIndex);
            } else {
                image.setPrimary(false);
            }
            productImageRepository.save(image);
        }

        return convertToProductResponse(product);
    }

    // =========================================================
    // Get Other Students' Products (the general/browse marketplace)
    // =========================================================
    // FIX: findByOwnerNot(you) had no status filter, so every other
    // student's product showed up here regardless of state —
    // RESERVED, SOLD, EXCHANGED and DONATED items looked exactly as
    // purchasable as AVAILABLE ones. A buyer could then request
    // something already spoken for, only to have addRequest() reject
    // it with "This product is no longer available". Only AVAILABLE
    // products belong in the general listing; AVAILABLE is also the
    // sole status new listings land in once addProduct() finishes
    // (see the PENDING -> AVAILABLE flip at the end of that method).
    public List<ProductResponse> getOtherProducts() {
        Student loggedInStudent = getLoggedInStudent();
        List<Product> products =
                productRepository.findByOwnerNotAndStatus(
                        loggedInStudent, "AVAILABLE");
        List<ProductResponse> responses = new ArrayList<>();
        for (Product product : products) {
            responses.add(convertToProductResponse(product));
        }
        return responses;
    }

    // =========================================================
    // Get My Products
    // =========================================================
    // FIX: findByOwner(you) alone returns every product you're
    // currently the DB owner of — including anything you've bought,
    // received via exchange, or been donated, since ownership
    // transfers to the recipient once a transaction completes. That
    // made purchased/received items show up here as if you were
    // selling them too, duplicating what already correctly appears in
    // My Purchases. Excluding the terminal statuses keeps this to
    // what you're actually listing.
    private static final List<String> ACQUIRED_STATUSES =
            List.of("SOLD", "EXCHANGED", "DONATED");

    public List<ProductResponse> getMyProducts() {
        Student loggedInStudent = getLoggedInStudent();
        List<Product> products =
                productRepository.findByOwnerAndStatusNotIn(
                        loggedInStudent, ACQUIRED_STATUSES);
        List<ProductResponse> responses = new ArrayList<>();
        for (Product product : products) {
            responses.add(convertToProductResponse(product));
        }
        return responses;
    }

    // =========================================================
    // Get Product By ID
    // =========================================================
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id));
        return convertToProductResponse(product);
    }

    // =========================================================
    // Update Product
    // =========================================================
    @Transactional
    public ProductResponse updateProduct(
            Long id,
            ProductRequest request,
            MultipartFile[] images) {

        Student loggedInStudent = getLoggedInStudent();

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id));

        if (!product.getOwner().getStudentId().equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to update this product");
        }

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product details are required");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product title is required");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product description is required");
        }
        if (request.getCategory() == null || request.getCategory().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product category is required");
        }
        if (request.getType() == null || request.getType().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product type is required");
        }
        if (request.getCondition() == null || request.getCondition().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product condition is required");
        }
        if (request.getPrice() == null || request.getPrice().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid product price is required");
        }

        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setType(request.getType());
        product.setPrice(request.getPrice());
        product.setCondition(request.getCondition());

        Product updatedProduct = productRepository.save(product);

        if (images != null && images.length > 0) {
            List<ProductImage> existingImages = productImageRepository.findByProduct(product);
            int existingCount = existingImages.size();
            int newCount = 0;
            for (MultipartFile file : images) {
                if (file != null && !file.isEmpty()) newCount++;
            }
            if (existingCount + newCount > 4) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A product can have maximum 4 images");
            }
            for (MultipartFile file : images) {
                if (file == null || file.isEmpty()) continue;
                String imageUrl = saveImage(file);
                ProductImage image = new ProductImage();
                image.setProduct(updatedProduct);
                image.setImageUrl(imageUrl);
                image.setPrimary(false);
                productImageRepository.save(image);
            }
        }

        List<ProductImage> finalImages = productImageRepository.findByProduct(updatedProduct);
        if (finalImages.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A product must have at least 1 image");
        }
        boolean hasPrimary = false;
        for (ProductImage image : finalImages) {
            if (image.isPrimary()) {
                hasPrimary = true;
                break;
            }
        }
        if (!hasPrimary) {
            ProductImage firstImage = finalImages.get(0);
            firstImage.setPrimary(true);
            productImageRepository.save(firstImage);
        }

        return convertToProductResponse(updatedProduct);
    }

    // =========================================================
    // Delete Product
    //
    // FIX: was a bare productRepository.delete(product), which threw a
    // raw MySQL FK-constraint error ("Cannot delete or update a parent
    // row... CONSTRAINT FK9b7l56...") whenever a Request row still
    // referenced this product — either as the main requested product,
    // or as the offeredProduct in an exchange. Deleting a product now
    // cascades: for every affected request, its PickupSchedule (if any)
    // is removed first, then the request itself, then finally the
    // product. Order matters — child rows must go before their parents,
    // or the same FK error just resurfaces one level up.
    // =========================================================
    @Transactional
    public void deleteProduct(Long id) {
        Student loggedInStudent = getLoggedInStudent();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id));

        if (!product.getOwner().getStudentId().equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to delete this product");
        }

        // Collect every request that references this product, either as
        // the main requested product or as the offered (exchange) item.
        // A Set avoids double-handling a request that somehow matched
        // both (shouldn't normally happen, but safe either way).
        Set<Request> affectedRequests = new HashSet<>();
        affectedRequests.addAll(requestRepository.findByProduct(product));
        affectedRequests.addAll(requestRepository.findByOfferedProduct(product));

        for (Request request : affectedRequests) {
            pickupScheduleRepository.findByRequest(request)
                    .ifPresent(pickupScheduleRepository::delete);
        }

        requestRepository.deleteAll(affectedRequests);

        productRepository.delete(product);
    }

    // =========================================================
    // Convert Product Entity → ProductResponse
    // =========================================================
    private ProductResponse convertToProductResponse(Product product) {

        List<ProductImageResponse> imageResponses = new ArrayList<>();
        if (product.getImages() != null) {
            for (ProductImage image : product.getImages()) {
                imageResponses.add(new ProductImageResponse(image.getId(), image.getImageUrl(), image.isPrimary()));
            }
        }

        Long ownerId = null;
        String ownerName = null;
        String ownerProfileImage = null;
        String ownerDepartment = null;
        Double trustScore = null;

        if (product.getOwner() != null) {
            ownerId = product.getOwner().getStudentId();
            ownerName = product.getOwner().getFullName();
            ownerProfileImage = product.getOwner().getProfileImage();
            ownerDepartment = product.getOwner().getDepartment();
            trustScore = trustScoreRepository.findByStudentStudentId(ownerId).map(TrustScore::getScore).orElse(50.0);
        }

        return new ProductResponse(
                product.getId(),
                ownerId,
                ownerName,
                ownerProfileImage,
                trustScore,
                ownerDepartment,
                product.getTitle(),
                product.getDescription(),
                product.getCategory(),
                product.getType(),
                product.getPrice(),
                product.getCondition(),
                product.getStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt(),
                imageResponses
        );
    }

    // =========================================================
    // Set Primary Image
    // =========================================================
    @Transactional
    public ProductResponse setPrimaryImage(Long productId, Long imageId) {
        Student loggedInStudent = getLoggedInStudent();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + productId));

        if (!product.getOwner().getStudentId().equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to modify this product");
        }

        ProductImage selectedImage = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product image not found with id: " + imageId));

        if (!selectedImage.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image does not belong to this product");
        }

        List<ProductImage> images = productImageRepository.findByProduct(product);
        for (ProductImage image : images) {
            image.setPrimary(false);
        }

        selectedImage.setPrimary(true);
        productImageRepository.saveAll(images);

        return convertToProductResponse(product);
    }

    // =========================================================
    // Delete Product Image
    // =========================================================
    @Transactional
    public void deleteProductImage(Long productId, Long imageId) {
        Student loggedInStudent = getLoggedInStudent();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + productId));

        if (!product.getOwner().getStudentId().equals(loggedInStudent.getStudentId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to delete this image");
        }

        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product image not found with id: " + imageId));

        if (!image.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image does not belong to this product");
        }

        List<ProductImage> existingImages = productImageRepository.findByProduct(product);
        if (existingImages.size() <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A product must have at least 1 image");
        }

        if (image.isPrimary()) {
            ProductImage newPrimary = null;
            for (ProductImage other : existingImages) {
                if (!other.getId().equals(imageId)) {
                    newPrimary = other;
                    break;
                }
            }
            if (newPrimary != null) {
                newPrimary.setPrimary(true);
                productImageRepository.save(newPrimary);
            }
        }

        productImageRepository.delete(image);
    }
}