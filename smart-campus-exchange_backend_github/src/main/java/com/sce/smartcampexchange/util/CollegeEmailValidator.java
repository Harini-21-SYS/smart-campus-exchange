package com.sce.smartcampexchange.util;

import java.time.LocalDate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CollegeEmailValidator {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^(\\d{2})(ucs|pcs)\\d+@tcarts\\.in$");

    public static void validate(String email) {

        if (email == null || email.isBlank()) {
            throw new RuntimeException("College email is required");
        }

        email = email.toLowerCase().trim();
        if(email.equals("admin@tcarts.in")) {
        	return;
        }

        // Domain + Pattern Check
        Matcher matcher = EMAIL_PATTERN.matcher(email);

        if (!matcher.matches()) {
            throw new RuntimeException(
                    "Only valid TC Arts student emails are allowed");
        }

        // Extract Year
        int shortYear = Integer.parseInt(matcher.group(1));
        int admissionYear = 2000 + shortYear;

        // Extract Course Type
        String courseType = matcher.group(2);

        LocalDate expiryDate;

        if (courseType.equals("ucs")) {

            // UG = 3 Years
            expiryDate = LocalDate.of(
                    admissionYear + 3,
                    5,
                    10);

        } else {

            // PG = 2 Years
            expiryDate = LocalDate.of(
                    admissionYear + 2,
                    5,
                    10);
        }

        // Current Date Check
     // Current Date Check
        LocalDate currentDate = LocalDate.now();

        if (currentDate.isAfter(expiryDate)) {

            throw new RuntimeException(
                    "Student access expired. Only active TC Arts students can access this platform.");
        }
    }

    private CollegeEmailValidator() {
        // Utility Class
    }
}