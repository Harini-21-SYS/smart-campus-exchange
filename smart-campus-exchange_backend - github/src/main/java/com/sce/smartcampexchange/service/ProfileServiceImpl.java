package com.sce.smartcampexchange.service;

import org.springframework.stereotype.Service;

import com.sce.smartcampexchange.dto.ProfileResponseDTO;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.StudentRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.web.multipart.MultipartFile;
@Service
public class ProfileServiceImpl
        implements ProfileService {

    private final StudentRepository studentRepository;

    public ProfileServiceImpl(
            StudentRepository studentRepository) {

        this.studentRepository =
                studentRepository;
    }

    @Override
    public ProfileResponseDTO getProfile(
            String email) {

        Student student =
                studentRepository
                        .findByCollegeEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Student not found"));

        ProfileResponseDTO dto =
                new ProfileResponseDTO();

        dto.setStudentId(
                student.getStudentId());

        dto.setFullName(
                student.getFullName());

        dto.setCollegeEmail(
                student.getCollegeEmail());

        dto.setRegisterNumber(
                student.getRegisterNumber());

        dto.setDepartment(
                student.getDepartment());

        dto.setMobileNumber(
                student.getMobileNumber());

        dto.setProfileImage(
                student.getProfileImage());

        dto.setEmailVerified(
                student.isEmailVerified());

        return dto;
    }
    
    @Override
    public ProfileResponseDTO updateMobile(
            String email,
            String mobileNumber) {

        Student student =
                studentRepository
                        .findByCollegeEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Student not found"));

        student.setMobileNumber(mobileNumber);

        studentRepository.save(student);

        ProfileResponseDTO dto =
                new ProfileResponseDTO();

        dto.setStudentId(student.getStudentId());
        dto.setFullName(student.getFullName());
        dto.setCollegeEmail(student.getCollegeEmail());
        dto.setRegisterNumber(student.getRegisterNumber());
        dto.setDepartment(student.getDepartment());
        dto.setMobileNumber(student.getMobileNumber());
        dto.setProfileImage(student.getProfileImage());
        dto.setEmailVerified(student.isEmailVerified());

        return dto;
    }
    
    @Override
    public ProfileResponseDTO updateProfileImage(
            String email,
            MultipartFile file) {

        Student student =
                studentRepository
                        .findByCollegeEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Student not found"));

        try {

            String fileName =
                    System.currentTimeMillis()
                    + "_"
                    + file.getOriginalFilename();

            Path uploadPath =
                    Paths.get(
                            "uploads/profile-images");

            Files.createDirectories(uploadPath);

            Files.copy(
                    file.getInputStream(),
                    uploadPath.resolve(fileName));

            student.setProfileImage(fileName);

            studentRepository.save(student);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Image upload failed");
        }

        return getProfile(email);
    }
    
}