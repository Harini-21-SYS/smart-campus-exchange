package com.sce.smartcampexchange.util;

import java.time.LocalDate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class StudentEmailValidator {

    private static final String COLLEGE_DOMAIN = "tcarts.in";

    public static boolean isValidStudentEmail(String email) {

        if (email == null || email.isBlank()) {
            return false;
        }

        // Split email
        String[] parts = email.toLowerCase().split("@");

        if (parts.length != 2) {
            return false;
        }

        String username = parts[0];
        String domain = parts[1];

        // Check domain
        if (!COLLEGE_DOMAIN.equals(domain)) {
            return false;
        }

        /*
         * Examples:
         * 24ucs41
         * 24pcs41
         */

        Pattern pattern = Pattern.compile("^(\\d{2})([up]).*$");
        Matcher matcher = pattern.matcher(username);

        if (!matcher.matches()) {
            return false;
        }

        int admissionYear = 2000 + Integer.parseInt(matcher.group(1));

        char courseType = matcher.group(2).charAt(0);

        int passoutYear;

        if (courseType == 'u') {
            passoutYear = admissionYear + 3;
        } else if (courseType == 'p') {
            passoutYear = admissionYear + 2;
        } else {
            return false;
        }

        // Expiry date = May 10
        LocalDate expiryDate = LocalDate.of(passoutYear, 5, 10);

        return !LocalDate.now().isAfter(expiryDate);
    }
}