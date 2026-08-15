package com.sce.smartcampexchange.util;

import java.time.LocalDate;
import java.time.Month;

public class YearCalculationUtil {

    private YearCalculationUtil() {
        // Utility class
    }

    public static String calculateStudyYear(String collegeEmail) {

        if (collegeEmail == null || collegeEmail.length() < 3) {
            return "Unknown";
        }

        // Example: 24ucs41@tcarts.in
        String yearPart = collegeEmail.substring(0, 2);

        int admissionYear;

        try {
            admissionYear = 2000 + Integer.parseInt(yearPart);
        } catch (NumberFormatException e) {
            return "Unknown";
        }

        // Find U or P from the email
        String localPart = collegeEmail
                .split("@")[0]
                .toLowerCase();

        char programType = localPart.charAt(2);

        int courseDuration;

        if (programType == 'u') {
            courseDuration = 3;
        } else if (programType == 'p') {
            courseDuration = 2;
        } else {
            return "Unknown";
        }

        /*
         * Academic year starts on May 10.
         *
         * Example:
         * 24ucs41@tcarts.in
         *
         * Admission Year = 2024
         * Program = UG
         * Duration = 3 years
         */

        LocalDate today = LocalDate.now();

        int academicYear;

        if (today.isBefore(
                LocalDate.of(
                        today.getYear(),
                        Month.MAY,
                        10))) {

            academicYear = today.getYear() - 1;

        } else {

            academicYear = today.getYear();
        }

        int studyYear =
                academicYear - admissionYear + 1;

        if (studyYear < 1) {
            return "Not Started";
        }

        if (studyYear > courseDuration) {
            return "Graduated";
        }

        return getOrdinalYear(studyYear);
    }

    private static String getOrdinalYear(int year) {

        switch (year) {

            case 1:
                return "1st Year";

            case 2:
                return "2nd Year";

            case 3:
                return "3rd Year";

            case 4:
                return "4th Year";

            default:
                return year + "th Year";
        }
    }
}