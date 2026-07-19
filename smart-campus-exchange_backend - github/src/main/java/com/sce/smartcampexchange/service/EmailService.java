package com.sce.smartcampexchange.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {


private final JavaMailSender mailSender;

public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
}

public void sendOtpEmail(String toEmail, String otp) {

    SimpleMailMessage message = new SimpleMailMessage();

    message.setTo(toEmail);
    message.setSubject(
            "Smart Campus Exchange - Email Verification OTP");

    message.setText(
            "Dear Student,\n\n" +
            "Your OTP for Smart Campus Exchange registration is:\n\n" +
            otp +
            "\n\nThis OTP is valid for 5 minutes.\n\n" +
            "Do not share this OTP with anyone.\n\n" +
            "Regards,\nSmart Campus Exchange Team"
    );

    mailSender.send(message);
}


}
