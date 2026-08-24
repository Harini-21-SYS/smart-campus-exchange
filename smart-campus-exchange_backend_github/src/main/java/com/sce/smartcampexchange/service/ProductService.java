package com.sce.smartcampexchange.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.sce.smartcampexchange.dto.ProductImageResponse;
import com.sce.smartcampexchange.dto.ProductRequest;
import com.sce.smartcampexchange.dto.ProductResponse;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.ProductImageRepository;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.StudentRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    private final ProductImageRepository productImageRepository;

    private final StudentRepository studentRepository;

    // Upload folder
    private final Path uploadPath =
            Paths.get("uploads/products");

    public ProductService(
            ProductRepository productRepository,
            ProductImageRepository productImageRepository,
            StudentRepository studentRepository) {

        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.studentRepository = studentRepository;
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

        System.out.println("=================================");
        System.out.println("LOGGED-IN USER DEBUG");
        System.out.println("Authentication Name: " + email);
        System.out.println("Authentication: " + authentication);

        Student student =
                studentRepository
                        .findByCollegeEmail(email)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Logged-in student not found"));

        System.out.println(
                "Student ID: " + student.getStudentId());

        System.out.println(
                "Student Email: " + student.getCollegeEmail());

        System.out.println(
                "Student Name: " + student.getFullName());

        System.out.println("=================================");

        return student;
    }
    // =========================================================
    // Add Product
    // =========================================================

    public ProductResponse addProduct(
            ProductRequest request,
            MultipartFile[] images) {

        Student student = getLoggedInStudent();

        Product product = new Product();

        // Set logged-in student as owner
        product.setOwner(student);

        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setType(request.getType());
        product.setPrice(request.getPrice());
        product.setCondition(request.getCondition());

        // Product requires admin approval
        product.setStatus("PENDING");

        Product savedProduct =
                productRepository.save(product);

        List<ProductImageResponse> imageResponses =
                new ArrayList<>();

        // Save uploaded images
        if (images != null && images.length > 0) {

            boolean firstImage = true;

            for (MultipartFile file : images) {

                if (file == null || file.isEmpty()) {
                    continue;
                }

                String imageUrl =
                        saveImage(file);

                ProductImage image =
                        new ProductImage();

                image.setProduct(savedProduct);
                image.setImageUrl(imageUrl);
                image.setPrimary(firstImage);

                ProductImage savedImage =
                        productImageRepository.save(image);

                imageResponses.add(
                        new ProductImageResponse(
                                savedImage.getId(),
                                savedImage.getImageUrl(),
                                savedImage.isPrimary()
                        )
                );

                firstImage = false;
            }
        }

        return new ProductResponse(
                savedProduct.getId(),

                savedProduct.getOwner().getStudentId(),

                savedProduct.getOwner().getFullName(),

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

            // Create uploads/products directory
            Files.createDirectories(uploadPath);

            String originalFileName =
                    file.getOriginalFilename();

            String extension = "";

            if (originalFileName != null &&
                    originalFileName.contains(".")) {

                extension =
                        originalFileName.substring(
                                originalFileName.lastIndexOf("."));
            }

            // Generate unique filename
            String fileName =
                    UUID.randomUUID() + extension;

            Path filePath =
                    uploadPath.resolve(fileName);

            Files.copy(
                    file.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            // URL stored in product_images table
            return "/uploads/products/" + fileName;

        } catch (IOException e) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to save image",
                    e
            );
        }
    }
 // =========================================================
 // Upload Product Images
 // Rules:
 // Minimum 1 image
 // Maximum 4 images TOTAL
 // Exactly 1 primary image
 // =========================================================

 public ProductResponse uploadProductImages(
         Long id,
         MultipartFile[] images,
         int primaryImageIndex) {

     // -----------------------------------------------------
     // Get logged-in student
     // -----------------------------------------------------

     Student loggedInStudent =
             getLoggedInStudent();

     // -----------------------------------------------------
     // Find product
     // -----------------------------------------------------

     Product product =
             productRepository.findById(id)
                     .orElseThrow(() ->
                             new ResponseStatusException(
                                     HttpStatus.NOT_FOUND,
                                     "Product not found with id: " + id
                             ));

     // -----------------------------------------------------
     // Ownership check
     // -----------------------------------------------------

     if (!product.getOwner()
             .getStudentId()
             .equals(loggedInStudent.getStudentId())) {

         throw new ResponseStatusException(
                 HttpStatus.FORBIDDEN,
                 "You are not allowed to upload images for this product"
         );
     }

     // -----------------------------------------------------
     // Validate images
     // -----------------------------------------------------

     if (images == null || images.length == 0) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "At least 1 product image is required"
         );
     }

     if (images.length > 4) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Maximum 4 product images are allowed"
         );
     }

     if (primaryImageIndex < 0 ||
             primaryImageIndex >= images.length) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Invalid primary image selection"
         );
     }

     // -----------------------------------------------------
     // Validate selected primary image
     // -----------------------------------------------------

     if (images[primaryImageIndex] == null ||
             images[primaryImageIndex].isEmpty()) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Selected primary image is invalid"
         );
     }

     // -----------------------------------------------------
     // Count existing images
     // -----------------------------------------------------

     int existingImageCount = 0;

     if (product.getImages() != null) {

         existingImageCount =
                 product.getImages().size();
     }

     // -----------------------------------------------------
     // Count valid new images
     // -----------------------------------------------------

     int newImageCount = 0;

     for (MultipartFile file : images) {

         if (file != null && !file.isEmpty()) {

             newImageCount++;
         }
     }

     // -----------------------------------------------------
     // Validate at least one valid image
     // -----------------------------------------------------

     if (newImageCount == 0) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "At least 1 valid image must be uploaded"
         );
     }

     // -----------------------------------------------------
     // Maximum 4 images TOTAL
     // -----------------------------------------------------

     if (existingImageCount + newImageCount > 4) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "A product can have maximum 4 images. "
                 + "Existing images: "
                 + existingImageCount
                 + ", New images: "
                 + newImageCount
         );
     }

     // -----------------------------------------------------
     // Remove existing primary image
     // -----------------------------------------------------

     List<ProductImage> existingImages =
             productImageRepository.findByProduct(product);

     for (ProductImage existingImage : existingImages) {

         if (existingImage.isPrimary()) {

             existingImage.setPrimary(false);

             productImageRepository.save(existingImage);
         }
     }

     // -----------------------------------------------------
     // Save new images
     // -----------------------------------------------------

     for (int i = 0; i < images.length; i++) {

         MultipartFile file = images[i];

         if (file == null || file.isEmpty()) {
             continue;
         }

         // Save physical image
         String imageUrl = saveImage(file);

         // Create ProductImage entity
         ProductImage image = new ProductImage();

         image.setProduct(product);
         image.setImageUrl(imageUrl);

         // Frontend-selected primary image
         image.setPrimary(i == primaryImageIndex);

         productImageRepository.save(image);
     }

     // -----------------------------------------------------
     // Return updated product
     // -----------------------------------------------------

     return convertToProductResponse(product);
 }

    // =========================================================
    // Get All Products
    // =========================================================

    public List<ProductResponse> getAllProducts() {

        List<Product> products =
                productRepository.findAll();

        List<ProductResponse> responses =
                new ArrayList<>();

        for (Product product : products) {

            responses.add(
                    convertToProductResponse(product)
            );
        }

        return responses;
    }

    // =========================================================
    // Get Product By ID
    // =========================================================

    public ProductResponse getProductById(Long id) {

        Product product =
                productRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Product not found with id: "
                                                + id));

        return convertToProductResponse(product);
    }

    // =========================================================
    // Update Product
    // =========================================================

    public ProductResponse updateProduct(
            Long id,
            ProductRequest request,
            MultipartFile[] images) {

        Student loggedInStudent =
                getLoggedInStudent();

        Product product =
                productRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Product not found with id: "
                                                + id));

        // Ownership check
     // Ownership check

        System.out.println("=================================");
        System.out.println("PRODUCT OWNERSHIP DEBUG");

        System.out.println(
                "Product ID: " + product.getId());

        System.out.println(
                "Product Owner ID: "
                        + product.getOwner().getStudentId());

        System.out.println(
                "Product Owner Email: "
                        + product.getOwner().getCollegeEmail());

        System.out.println(
                "Logged-in Student ID: "
                        + loggedInStudent.getStudentId());

        System.out.println(
                "Logged-in Student Email: "
                        + loggedInStudent.getCollegeEmail());

        System.out.println("=================================");

        if (!product.getOwner()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to update this product");
        }

        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setType(request.getType());
        product.setPrice(request.getPrice());
        product.setCondition(request.getCondition());

        Product updatedProduct =
                productRepository.save(product);

        /*
         * If new images are supplied,
         * add them to the product.
         */
        if (images != null && images.length > 0) {

            for (MultipartFile file : images) {

                if (file == null || file.isEmpty()) {
                    continue;
                }

                String imageUrl =
                        saveImage(file);

                ProductImage image =
                        new ProductImage();

                image.setProduct(updatedProduct);
                image.setImageUrl(imageUrl);
                image.setPrimary(false);

                productImageRepository.save(image);
            }
        }

        return convertToProductResponse(
                updatedProduct
        );
    }

    // =========================================================
    // Delete Product
    // =========================================================

    public void deleteProduct(Long id) {

        Student loggedInStudent =
                getLoggedInStudent();

        Product product =
                productRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Product not found with id: "
                                                + id));

        // Ownership check
        if (!product.getOwner()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to delete this product");
        }

        productRepository.delete(product);
    }

    // =========================================================
    // Convert Product Entity → ProductResponse
    // =========================================================

    private ProductResponse convertToProductResponse(
            Product product) {

        List<ProductImageResponse> imageResponses =
                new ArrayList<>();

        if (product.getImages() != null) {

            for (ProductImage image :
                    product.getImages()) {

                imageResponses.add(
                        new ProductImageResponse(
                                image.getId(),
                                image.getImageUrl(),
                                image.isPrimary()
                        )
                );
            }
        }

        Long ownerId = null;

        String ownerName = null;

        if (product.getOwner() != null) {

            ownerId =
                    product.getOwner().getStudentId();

            ownerName =
                    product.getOwner().getFullName();
        }

        return new ProductResponse(
                product.getId(),
                ownerId,
                ownerName,
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
}