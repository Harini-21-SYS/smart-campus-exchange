package com.sce.smartcampexchange.controller;

import com.sce.smartcampexchange.dto.ProductRequest;
import com.sce.smartcampexchange.dto.ProductResponse;
import com.sce.smartcampexchange.service.ProductService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // =========================
<<<<<<< HEAD
    // Add Product
    // =========================
// =========================================================
// Upload Product Images
// =========================================================

@PostMapping("/{id}/images")
public ResponseEntity<ProductResponse> uploadProductImages(

        @PathVariable Long id,

        @RequestParam("images")
        MultipartFile[] images,

        @RequestParam("primaryImageIndex")
        int primaryImageIndex) {

    return ResponseEntity.ok(
            productService.uploadProductImages(
                    id,
                    images,
                    primaryImageIndex
            )
    );
}

    // =========================
    // Get All Products
    // =========================
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
=======
    // Add Product + Images
    // =========================
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ProductResponse> addProduct(

            @RequestPart("product")
            ProductRequest request,

            @RequestPart(value = "images", required = false)
            MultipartFile[] images,

            @RequestParam(value = "primaryImageIndex",
            	    required = false)
            Integer primaryImageIndex) {

        ProductResponse response =
                productService.addProduct(
                        request,
                        images,
                        primaryImageIndex
                );

        return new ResponseEntity<>(
                response,
                HttpStatus.CREATED
        );
    }
    
   
 // =========================================================
 // Get Other Students' Products
 // GET /api/products
 // =========================================================

 @GetMapping
 public ResponseEntity<List<ProductResponse>> getOtherProducts() {
>>>>>>> f8b079a (Product backend)

     return ResponseEntity.ok(
             productService.getOtherProducts()
     );
 }
   


//=========================================================
//Get My Products
//GET /api/products/my
//=========================================================

@GetMapping("/my")
public ResponseEntity<List<ProductResponse>> getMyProducts() {

  return ResponseEntity.ok(
          productService.getMyProducts()
  );
}

<<<<<<< HEAD
    // =========================
    // Get Product By ID
    // =========================
=======
>>>>>>> f8b079a (Product backend)
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById1(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                productService.getProductById(id)
        );
    }

<<<<<<< HEAD
    // =========================
    // Update Product
    // =========================
=======
    

    // =========================
    // Update Product
    // =========================
    
>>>>>>> f8b079a (Product backend)
    @PutMapping(
            value = "/{id}",
            consumes = "application/json"
    )
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductRequest request) {

        return ResponseEntity.ok(
                productService.updateProduct(id, request, null)
        );
    }

    // =========================
    // Delete Product
    // =========================
<<<<<<< HEAD
=======
    
>>>>>>> f8b079a (Product backend)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id) {

        productService.deleteProduct(id);

        return ResponseEntity.noContent().build();
    }
 
<<<<<<< HEAD


}
=======
 // =========================================================
 // Add More Product Images
 // =========================================================

 @PostMapping(
         value = "/{id}/images",
         consumes = "multipart/form-data"
 )
 public ResponseEntity<ProductResponse> uploadProductImages(

         @PathVariable Long id,

         @RequestParam("images")
         MultipartFile[] images,

         @RequestParam(value = "primaryImageIndex", required = false)
         Integer primaryImageIndex) {

     return ResponseEntity.ok(
             productService.uploadProductImages(
                     id,
                     images,
                     primaryImageIndex
             )
     );
 }
 @PutMapping("/{productId}/images/{imageId}/primary")
 public ResponseEntity<ProductResponse> setPrimaryImage(
         @PathVariable Long productId,
         @PathVariable Long imageId) {

     return ResponseEntity.ok(
             productService.setPrimaryImage(
                     productId,
                     imageId
             )
     );
 }
 
//=========================================================
//Delete Product Image
//DELETE /api/products/{productId}/images/{imageId}
//=========================================================

@DeleteMapping("/{productId}/images/{imageId}")
public ResponseEntity<Void> deleteProductImage(
      @PathVariable Long productId,
      @PathVariable Long imageId) {

  productService.deleteProductImage(
          productId,
          imageId
  );

  return ResponseEntity.noContent().build();
}

    }
>>>>>>> f8b079a (Product backend)
