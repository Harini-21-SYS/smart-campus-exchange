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
import org.springframework.transaction.annotation.Transactional;
import com.sce.smartcampexchange.dto.ProductImageResponse;
import com.sce.smartcampexchange.dto.ProductRequest;
import com.sce.smartcampexchange.dto.ProductResponse;
import com.sce.smartcampexchange.entity.Product;
import com.sce.smartcampexchange.entity.ProductImage;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.ProductImageRepository;
import com.sce.smartcampexchange.repository.ProductRepository;
import com.sce.smartcampexchange.repository.StudentRepository;

import com.sce.smartcampexchange.entity.TrustScore;
import com.sce.smartcampexchange.repository.TrustScoreRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    private final ProductImageRepository productImageRepository;

    private final StudentRepository studentRepository;

<<<<<<< HEAD
    // Upload folder
    private final Path uploadPath =
            Paths.get("uploads/products");

=======
    private final TrustScoreRepository trustScoreRepository;
    
    // Upload folder
    private final Path uploadPath =
            Paths.get("uploads/products");
>>>>>>> f8b079a (Product backend)
    public ProductService(
            ProductRepository productRepository,
            ProductImageRepository productImageRepository,
            StudentRepository studentRepository,
            TrustScoreRepository trustScoreRepository) {

        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.studentRepository = studentRepository;
        this.trustScoreRepository = trustScoreRepository;
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
    @Transactional
 public ProductResponse addProduct(
        ProductRequest request,
        MultipartFile[] images,
        Integer primaryImageIndex) {

<<<<<<< HEAD
    public ProductResponse addProduct(
            ProductRequest request,
            MultipartFile[] images) {
=======
    Student student = getLoggedInStudent();
>>>>>>> f8b079a (Product backend)

    // =========================================================
    // Validate images
    // =========================================================

<<<<<<< HEAD
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
=======
    if (request == null) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Product details are required"
>>>>>>> f8b079a (Product backend)
        );
    }

    if (request.getTitle() == null ||
            request.getTitle().isBlank()) {

        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Product title is required"
        );
    }

    if (request.getDescription() == null ||
            request.getDescription().isBlank()) {

        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Product description is required"
        );
    }

    if (request.getCategory() == null ||
            request.getCategory().isBlank()) {

        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Product category is required"
        );
    }

    if (request.getType() == null ||
            request.getType().isBlank()) {

        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Product type is required"
        );
    }

    if (request.getCondition() == null ||
            request.getCondition().isBlank()) {

        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Product condition is required"
        );
    }

    if (request.getPrice() == null ||
            request.getPrice().signum() < 0) {

        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Valid product price is required"
        );
    }
    
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

 // =========================================================
 // Primary Image Validation
 // =========================================================

 if (primaryImageIndex != null) {

     if (primaryImageIndex < 0 ||
             primaryImageIndex >= images.length) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Invalid primary image selection"
         );
     }

     if (images[primaryImageIndex] == null ||
             images[primaryImageIndex].isEmpty()) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Selected primary image is invalid"
         );
     }
 }

    int validImageCount = 0;

    for (MultipartFile file : images) {

        if (file != null && !file.isEmpty()) {
            validImageCount++;
        }
    }

    if (validImageCount == 0) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "At least 1 valid product image is required"
        );
    }

   

    // =========================================================
<<<<<<< HEAD
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
=======
    // Create Product
>>>>>>> f8b079a (Product backend)
    // =========================================================

    Product product = new Product();

    product.setOwner(student);
    product.setTitle(request.getTitle());
    product.setDescription(request.getDescription());
    product.setCategory(request.getCategory());
    product.setType(request.getType());
    product.setPrice(request.getPrice());
    product.setCondition(request.getCondition());

    // Product is NOT available yet
    product.setStatus("PENDING");

    Product savedProduct =
            productRepository.save(product);

 // =========================================================
 // Save Images
 // =========================================================

 List<ProductImageResponse> imageResponses =
         new ArrayList<>();

 for (int i = 0; i < images.length; i++) {

     MultipartFile file = images[i];

     if (file == null || file.isEmpty()) {
         continue;
     }

     String imageUrl = saveImage(file);

     ProductImage image =
             new ProductImage();

     image.setProduct(savedProduct);
     image.setImageUrl(imageUrl);

     // =====================================================
     // Primary image logic
     // =====================================================

     boolean makePrimary;

     if (primaryImageIndex != null) {

         // User selected primary image
         makePrimary =
                 (i == primaryImageIndex);

     } else {

         // User did not select primary
         // First image becomes primary
         makePrimary =
                 (i == 0);
     }

     image.setPrimary(makePrimary);

     ProductImage savedImage =
             productImageRepository.save(image);

     imageResponses.add(
             new ProductImageResponse(
                     savedImage.getId(),
                     savedImage.getImageUrl(),
                     savedImage.isPrimary()
             )
     );
 }
    // =========================================================
    // Product + images successfully uploaded
    // =========================================================

    savedProduct.setStatus("AVAILABLE");

    savedProduct =
            productRepository.save(savedProduct);

    // =========================================================
    // Response
    // =========================================================

    return new ProductResponse(
            savedProduct.getId(),
            savedProduct.getOwner().getStudentId(),
            savedProduct.getOwner().getFullName(),
            savedProduct.getOwner().getProfileImage(),
            trustScoreRepository
                    .findByStudentStudentId(
                            savedProduct.getOwner().getStudentId()
                    )
                    .map(TrustScore::getScore)
                    .orElse(50.0),
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
// Add More Product Images
//
// Rules:
// Existing images + new images <= 4
// At least 1 new image required
// If primaryImageIndex is provided,
// new image can become primary
// If primaryImageIndex is not provided,
// existing primary remains primary
// =========================================================

public ProductResponse uploadProductImages(
        Long id,
        MultipartFile[] images,
        Integer primaryImageIndex) {

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
    // Validate new images
    // -----------------------------------------------------

    if (images == null || images.length == 0) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "At least 1 image is required"
        );
    }

    // -----------------------------------------------------
    // Maximum number of NEW images
    // -----------------------------------------------------

    if (images.length > 4) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Maximum 4 images can be uploaded at a time"
        );
    }

    // -----------------------------------------------------
    // Count existing images
    // -----------------------------------------------------

    List<ProductImage> existingImages =
            productImageRepository.findByProduct(product);

    int existingImageCount =
            existingImages.size();

    // -----------------------------------------------------
    // Count valid new images
    // -----------------------------------------------------

    int newImageCount = 0;

    if (images != null) {
        for (MultipartFile file : images) {
            if (file != null && !file.isEmpty()) {
                newImageCount++;
            }
        }
    }

    if (existingImageCount + newImageCount > 4) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "A product can have maximum 4 images"
        );
    }
    
   

    // -----------------------------------------------------
    // At least 1 valid image
    // -----------------------------------------------------

    if (newImageCount == 0) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "At least 1 valid image is required"
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
    // Validate primaryImageIndex if provided
    // -----------------------------------------------------

    if (primaryImageIndex != null) {

        if (primaryImageIndex < 0 ||
                primaryImageIndex >= images.length) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid primary image selection"
            );
        }

        MultipartFile selectedImage =
                images[primaryImageIndex];

        if (selectedImage == null ||
                selectedImage.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected primary image is invalid"
            );
        }

        // -------------------------------------------------
        // Remove primary from existing images
        // -------------------------------------------------

        for (ProductImage existingImage : existingImages) {

            if (existingImage.isPrimary()) {

                existingImage.setPrimary(false);

                productImageRepository.save(existingImage);
            }
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
        String imageUrl =
                saveImage(file);

        // Create ProductImage
        ProductImage image =
                new ProductImage();

        image.setProduct(product);
        image.setImageUrl(imageUrl);

        // -------------------------------------------------
        // Primary logic
        // -------------------------------------------------

        if (primaryImageIndex != null) {

            // User selected a new primary image
            image.setPrimary(
                    i == primaryImageIndex
            );

        } else {

            // No new primary selected
            // Keep existing primary
            image.setPrimary(false);
        }

        productImageRepository.save(image);
    }

    // -----------------------------------------------------
    // Return updated product
    // -----------------------------------------------------

    return convertToProductResponse(product);
}

//=========================================================
//Get Other Students' Products
//=========================================================

public List<ProductResponse> getOtherProducts() {

 Student loggedInStudent = getLoggedInStudent();

 List<Product> products =
         productRepository.findByOwnerNot(loggedInStudent);

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
// Get My Products
// =========================================================

public List<ProductResponse> getMyProducts() {

    Student loggedInStudent = getLoggedInStudent();

    List<Product> products =
            productRepository.findByOwner(loggedInStudent);

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

<<<<<<< HEAD
    public ProductResponse updateProduct(
            Long id,
            ProductRequest request,
            MultipartFile[] images) {
=======
  @Transactional
public ProductResponse updateProduct(
        Long id,
        ProductRequest request,
        MultipartFile[] images) {
>>>>>>> f8b079a (Product backend)

    Student loggedInStudent =
            getLoggedInStudent();

    Product product =
            productRepository.findById(id)
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Product not found with id: " + id
                            ));

<<<<<<< HEAD
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
=======
    // =========================================================
    // Ownership check
    // =========================================================
>>>>>>> f8b079a (Product backend)

    if (!product.getOwner()
            .getStudentId()
            .equals(loggedInStudent.getStudentId())) {

<<<<<<< HEAD
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
=======
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You are not allowed to update this product"
>>>>>>> f8b079a (Product backend)
        );
    }

    // =========================================================
    // Validate product details
    // =========================================================

    if (request == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Product details are required"
        );
    }

    if (request.getTitle() == null ||
            request.getTitle().isBlank()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Product title is required"
        );
    }

    if (request.getDescription() == null ||
            request.getDescription().isBlank()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Product description is required"
        );
    }

    if (request.getCategory() == null ||
            request.getCategory().isBlank()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Product category is required"
        );
    }

    if (request.getType() == null ||
            request.getType().isBlank()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Product type is required"
        );
    }

    if (request.getCondition() == null ||
            request.getCondition().isBlank()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Product condition is required"
        );
    }

    if (request.getPrice() == null ||
            request.getPrice().signum() < 0) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Valid product price is required"
        );
    }

    // =========================================================
    // Update product details
    // =========================================================

    product.setTitle(request.getTitle());
    product.setDescription(request.getDescription());
    product.setCategory(request.getCategory());
    product.setType(request.getType());
    product.setPrice(request.getPrice());
    product.setCondition(request.getCondition());

    Product updatedProduct =
            productRepository.save(product);

    // =========================================================
    // Add new images
    // =========================================================

    if (images != null && images.length > 0) {

        List<ProductImage> existingImages =
                productImageRepository
                        .findByProduct(product);

        int existingCount =
                existingImages.size();

        int newCount = 0;

        for (MultipartFile file : images) {

            if (file != null &&
                    !file.isEmpty()) {

                newCount++;
            }
        }

        if (existingCount + newCount > 4) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A product can have maximum 4 images"
            );
        }

        for (MultipartFile file : images) {

            if (file == null ||
                    file.isEmpty()) {
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

    // =========================================================
    // Make sure at least one image exists
    // =========================================================

    List<ProductImage> finalImages =
            productImageRepository
                    .findByProduct(updatedProduct);

    if (finalImages.isEmpty()) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "A product must have at least 1 image"
        );
    }

    // =========================================================
    // Make sure one image is primary
    // =========================================================

    boolean hasPrimary = false;

    for (ProductImage image : finalImages) {

        if (image.isPrimary()) {
            hasPrimary = true;
            break;
        }
    }

    if (!hasPrimary) {

        ProductImage firstImage =
                finalImages.get(0);

        firstImage.setPrimary(true);

        productImageRepository.save(firstImage);
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

        String ownerProfileImage = null;

        Double trustScore = null;

        if (product.getOwner() != null) {

            ownerId =
                    product.getOwner().getStudentId();

            ownerName =
                    product.getOwner().getFullName();

            ownerProfileImage =
                    product.getOwner().getProfileImage();

            trustScore =
                    trustScoreRepository
                            .findByStudentStudentId(ownerId)
                            .map(TrustScore::getScore)
                            .orElse(50.0);
        }

        return new ProductResponse(
                product.getId(),
                ownerId,
                ownerName,
                ownerProfileImage,
                trustScore,
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
    @Transactional
    public ProductResponse setPrimaryImage(
            Long productId,
            Long imageId) {

        Student loggedInStudent =
                getLoggedInStudent();

        Product product =
                productRepository.findById(productId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Product not found with id: "
                                                + productId
                                ));

        // =========================================
        // Ownership check
        // =========================================

        if (!product.getOwner()
                .getStudentId()
                .equals(loggedInStudent.getStudentId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to modify this product"
            );
        }

        // =========================================
        // Find image
        // =========================================

        ProductImage selectedImage =
                productImageRepository.findById(imageId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Product image not found with id: "
                                                + imageId
                                ));

        // =========================================
        // Make sure image belongs to product
        // =========================================

        if (!selectedImage.getProduct()
                .getId()
                .equals(productId)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Image does not belong to this product"
            );
        }

        // =========================================
        // Remove primary from all images
        // =========================================

        List<ProductImage> images =
                productImageRepository
                        .findByProduct(product);

        for (ProductImage image : images) {

            image.setPrimary(false);
        }

        // =========================================
        // Set selected image as primary
        // =========================================

        selectedImage.setPrimary(true);

        productImageRepository.saveAll(images);

        // =========================================
        // Return updated product
        // =========================================

        return convertToProductResponse(product);
    }
 // =========================================================
 // Delete Product Image
 // =========================================================

 @Transactional
 public void deleteProductImage(
         Long productId,
         Long imageId) {

     Student loggedInStudent =
             getLoggedInStudent();

     Product product =
             productRepository.findById(productId)
                     .orElseThrow(() ->
                             new ResponseStatusException(
                                     HttpStatus.NOT_FOUND,
                                     "Product not found with id: "
                                             + productId
                             ));

     // Ownership check
     if (!product.getOwner()
             .getStudentId()
             .equals(loggedInStudent.getStudentId())) {

         throw new ResponseStatusException(
                 HttpStatus.FORBIDDEN,
                 "You are not allowed to delete this image"
         );
     }
     
     

     // Find image
     ProductImage image =
             productImageRepository.findById(imageId)
                     .orElseThrow(() ->
                             new ResponseStatusException(
                                     HttpStatus.NOT_FOUND,
                                     "Product image not found with id: "
                                             + imageId
                             ));

     // Make sure image belongs to this product
     if (!image.getProduct()
             .getId()
             .equals(productId)) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "Image does not belong to this product"
         );
     }

     // Prevent product from having zero images
     List<ProductImage> existingImages =
             productImageRepository.findByProduct(product);

     if (existingImages.size() <= 1) {

         throw new ResponseStatusException(
                 HttpStatus.BAD_REQUEST,
                 "A product must have at least 1 image"
         );
     }

     // If deleting primary image,
     // assign another image as primary.
     if (image.isPrimary()) {

         ProductImage newPrimary = null;

         for (ProductImage other :
                 existingImages) {

             if (!other.getId()
                     .equals(imageId)) {

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