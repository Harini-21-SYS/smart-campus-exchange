package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.entity.ProductImage;

import java.util.List;

public interface ProductImageService {

    ProductImage addImage(ProductImage productImage);

    List<ProductImage> getAllImages();

    ProductImage getImageById(Long id);

    void deleteImage(Long id);
}