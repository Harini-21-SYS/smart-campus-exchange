package com.sce.smartcampexchange.service;


import java.util.List;

import java.util.stream.Collectors;


import org.springframework.stereotype.Service;


import com.sce.smartcampexchange.dto.AdminDashboardResponse;
import com.sce.smartcampexchange.dto.AdminStudentResponse;
import com.sce.smartcampexchange.dto.AdminProductResponse;
import com.sce.smartcampexchange.dto.AdminProductImageResponse;


import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.entity.Product;


import com.sce.smartcampexchange.repository.StudentRepository;
import com.sce.smartcampexchange.repository.ProductRepository;



@Service
public class AdminService {



    private final StudentRepository studentRepository;

    private final ProductRepository productRepository;




    public AdminService(
            StudentRepository studentRepository,
            ProductRepository productRepository) {


        this.studentRepository = studentRepository;

        this.productRepository = productRepository;

    }





    // =================================
    // ADMIN DASHBOARD
    // =================================


    public AdminDashboardResponse getDashboardData() {


        long totalStudents =
                studentRepository.count();



        long totalProducts =
                productRepository.count();



        return new AdminDashboardResponse(

                totalStudents,

                totalProducts

        );

    }






    // =================================
    // VIEW ALL STUDENTS
    // =================================


    public List<AdminStudentResponse> getAllStudents() {


        List<Student> students =
                studentRepository.findAll();



        return students.stream()

                .map(student -> new AdminStudentResponse(


                        student.getStudentId(),

                        student.getFullName(),

                        student.getCollegeEmail(),

                        student.getRegisterNumber(),

                        student.getDepartment(),

                        student.getMobileNumber(),

                        student.getProfileImage(),

                        student.getRole().name(),

                        student.isAccountEnabled(),

                        student.isEmailVerified()

                ))

                .collect(Collectors.toList());

    }
    public List<AdminProductResponse> getAllProducts() {

        List<Product> products = productRepository.findAll();

        return products.stream()
                .map(product -> {

                    List<AdminProductImageResponse> images = product.getImages()
                            .stream()
                            .map(img -> new AdminProductImageResponse(
                                    img.getImageUrl(),
                                    img.isPrimary()
                            ))
                            .collect(Collectors.toList());

                    Student owner = product.getOwner();

                    return new AdminProductResponse(
                            product.getId(),
                            product.getTitle(),
                            product.getDescription(),
                            product.getCategory(),
                            product.getType(),
                            product.getPrice(),
                            product.getCondition(),
                            product.getStatus(),
                            owner.getCollegeEmail(),
                            owner.getStudentId(),
                            owner.getFullName(),
                            owner.getDepartment(),
                            owner.getProfileImage(),
                            images
                    );
                })
                .collect(Collectors.toList());
    }







    // =================================
    // VIEW ALL PRODUCTS
    // =================================


     // ==========================
 // BLOCK STUDENT
 // ==========================

 public String blockStudent(Long studentId) {


     Student student = studentRepository.findById(studentId)
             .orElseThrow(() ->
                     new RuntimeException("Student not found")
             );


     student.setAccountEnabled(false);


     studentRepository.save(student);


     return "Student blocked successfully";
 }




 // ==========================
 // UNBLOCK STUDENT
 // ==========================

 public String unblockStudent(Long studentId) {


     Student student = studentRepository.findById(studentId)
             .orElseThrow(() ->
                     new RuntimeException("Student not found")
             );


     student.setAccountEnabled(true);


     studentRepository.save(student);


     return "Student unblocked successfully";
 }
//==========================
//DELETE PRODUCT
//==========================

public String deleteProduct(Long productId) {


  if(!productRepository.existsById(productId)) {

      throw new RuntimeException(
              "Product not found"
      );
  }


  productRepository.deleteById(productId);


  return "Product deleted successfully";
}


}