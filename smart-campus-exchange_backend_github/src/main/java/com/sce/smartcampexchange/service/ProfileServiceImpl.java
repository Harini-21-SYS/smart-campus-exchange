package com.sce.smartcampexchange.service;

import org.springframework.stereotype.Service;

import com.sce.smartcampexchange.dto.ChangePasswordRequest;
import com.sce.smartcampexchange.dto.ProfileResponseDTO;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.StudentRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
@Service
public class ProfileServiceImpl
        implements ProfileService {

    private final StudentRepository studentRepository;
    private final BCryptPasswordEncoder passwordEncoder; 
    public ProfileServiceImpl(
            StudentRepository studentRepository,
            BCryptPasswordEncoder passwordEncoder) {

        this.studentRepository =
                studentRepository;
        this.passwordEncoder =
                passwordEncoder;
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

        dto.setYear(
                calculateCurrentYear(student.getCollegeEmail()));
        
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
        dto.setYear(
                calculateCurrentYear(student.getCollegeEmail()));
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
    
    private String calculateCurrentYear(String collegeEmail) {

        try {
            // Example: 24ucs41@tcarts.in
            String emailPrefix = collegeEmail.split("@")[0];

            // First 2 digits = admission year
            int admissionYear = 2000 +
                    Integer.parseInt(emailPrefix.substring(0, 2));

            // U = Undergraduate (3 years)
            // P = Postgraduate (2 years)
            char courseType =
                    Character.toUpperCase(emailPrefix.charAt(2));

            int courseDuration;

            if (courseType == 'U') {
                courseDuration = 3;
            } else if (courseType == 'P') {
                courseDuration = 2;
            } else {
                return "Unknown";
            }

            LocalDate today = LocalDate.now();

            // Academic year starts in May
            int currentAcademicYear =
                    today.getMonthValue() >= 5
                            ? today.getYear()
                            : today.getYear() - 1;

            // Admission period starts from May
            int academicYearDifference =
                    currentAcademicYear - admissionYear;

            int currentStudyYear =
                    academicYearDifference + 1;

            // Course completed
            if (currentStudyYear > courseDuration) {
                return "Completed";
            }

            return currentStudyYear + " Year";

        } catch (Exception e) {

            return "Unknown";
        }
        
        
    }
    
   
    @Override
    public String changePassword(
            String email,
            ChangePasswordRequest request) {

        Student student =
                studentRepository
                        .findByCollegeEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Student not found"));

        String currentPassword =
                request.getCurrentPassword();

        String newPassword =
                request.getNewPassword();

        String confirmPassword =
                request.getConfirmPassword();

        // Check current password
        if (!passwordEncoder.matches(
                currentPassword,
                student.getPassword())) {

            throw new RuntimeException(
                    "Current password is incorrect");
        }

        // Check new password and confirm password
        if (!newPassword.equals(
                confirmPassword)) {

            throw new RuntimeException(
                    "New passwords do not match");
        }

        // New password should be different
        // from current password
        if (passwordEncoder.matches(
                newPassword,
                student.getPassword())) {

            throw new RuntimeException(
                    "New password must be different from current password");
        }

        // Encrypt new password
        student.setPassword(
                passwordEncoder.encode(
                        newPassword));

        // Save updated password
        studentRepository.save(student);

        return "Password changed successfully";
    }
    
}