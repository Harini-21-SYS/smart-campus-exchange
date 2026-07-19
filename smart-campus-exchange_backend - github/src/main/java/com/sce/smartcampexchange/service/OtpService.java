package com.sce.smartcampexchange.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.sce.smartcampexchange.entity.OtpVerification;
import com.sce.smartcampexchange.repository.OtpVerificationRepository;
import com.sce.smartcampexchange.util.OtpGenerator;

@Service
public class OtpService {


private final OtpVerificationRepository otpRepository;
private final EmailService emailService;

public OtpService(
        OtpVerificationRepository otpRepository,
        EmailService emailService) {

    this.otpRepository = otpRepository;
    this.emailService = emailService;
}

public void generateAndSendOtp(String email) {

    String otp = OtpGenerator.generateOtp();

    OtpVerification otpVerification =
            new OtpVerification();

    otpVerification.setEmail(email);
    otpVerification.setOtp(otp);
    otpVerification.setExpiryTime(
            LocalDateTime.now().plusMinutes(5));
    otpVerification.setVerified(false);

    otpRepository.save(otpVerification);

    emailService.sendOtpEmail(email, otp);
}

public boolean verifyOtp(
        String email,
        String enteredOtp) {

    Optional<OtpVerification> optionalOtp =
            otpRepository.findTopByEmailOrderByOtpIdDesc(email);

    if (optionalOtp.isEmpty()) {
        return false;
    }

    OtpVerification otpRecord =
            optionalOtp.get();

    if (otpRecord.isVerified()) {
        return false;
    }

    if (LocalDateTime.now()
            .isAfter(otpRecord.getExpiryTime())) {

        return false;
    }

    if (!otpRecord.getOtp()
            .equals(enteredOtp)) {

        return false;
    }

    otpRecord.setVerified(true);

    otpRepository.save(otpRecord);

    return true;
}


}
