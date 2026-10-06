package com.sce.smartcampexchange.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sce.smartcampexchange.dto.TrustScoreResponse;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.entity.TrustScore;
import com.sce.smartcampexchange.repository.ComplaintRepository;
import com.sce.smartcampexchange.repository.PickupScheduleRepository;
import com.sce.smartcampexchange.repository.RequestRepository;
import com.sce.smartcampexchange.repository.ReviewRepository;
import com.sce.smartcampexchange.repository.StudentRepository;
import com.sce.smartcampexchange.repository.TrustScoreRepository;

/**
 * Calculates and stores a student's trust score.
 *
 * ============================================================
 * THE FORMULA
 * ============================================================
 *
 *   score = 50                     (neutral starting point)
 *         + ratingBonus            ( -25 .. +25 )
 *         + experienceBonus        (   0 .. +25 )
 *         - upheldComplaintPenalty (   0 .. -30 )
 *         - pendingComplaintPenalty(   0 ..  -9 )
 *         - deliveryIssuePenalty   (   0 .. -15 )
 *
 *   final = clamp(score, 0, 100), rounded to one decimal place
 *
 * ------------------------------------------------------------
 * 1. RATING BONUS
 * ------------------------------------------------------------
 * Driven by the 1-5 star reviews the student received as a seller.
 *
 * A plain average is unfair with very few reviews: a single 5-star
 * rating would otherwise be worth as much as forty of them. So a
 * Bayesian (shrunk) average is used instead, which pulls a small
 * sample towards the neutral value of 3 stars and lets it drift
 * towards the true average as evidence accumulates:
 *
 *   weighted = (PRIOR_WEIGHT * 3.0 + sumOfRatings)
 *              / (PRIOR_WEIGHT + numberOfRatings)
 *
 * With PRIOR_WEIGHT = 3, one 5-star review gives a weighted average
 * of 3.5 rather than 5.0, while ten 5-star reviews give 4.54.
 *
 * The weighted average is then mapped from the 1-5 range onto the
 * -25..+25 bonus range, with 3 stars sitting exactly at zero:
 *
 *   ratingBonus = (weighted - 3.0) / 2.0 * 25
 *
 * ------------------------------------------------------------
 * 2. EXPERIENCE BONUS
 * ------------------------------------------------------------
 * One point per completed transaction, counting both the deals where
 * the student sold or donated an item and the ones where they
 * received an item, capped at 25. This rewards an active, established
 * member without ever letting volume alone outweigh a bad rating.
 *
 * ------------------------------------------------------------
 * 3. COMPLAINT PENALTIES
 * ------------------------------------------------------------
 * A complaint only counts against a student when the administrator
 * actually upheld it, which in this system means resolving it with a
 * warning note attached. Each upheld complaint costs 10 points, up to
 * 30. A complaint resolved without a warning was decided in the
 * student's favour and costs nothing.
 *
 * A complaint that has been filed but not yet decided applies a
 * smaller provisional penalty of 3 points, up to 9. This disappears
 * as soon as the administrator resolves it, so an unproven accusation
 * can never permanently damage a student's standing.
 *
 * ------------------------------------------------------------
 * 4. DELIVERY ISSUE PENALTY
 * ------------------------------------------------------------
 * Five points for every pickup where the buyer reported that the item
 * never arrived, arrived damaged, was the wrong item, or the seller
 * did not turn up. Capped at 15.
 *
 * ============================================================
 * WHEN IT IS RECALCULATED
 * ============================================================
 * The stored row is a cached snapshot, refreshed by calling
 * recalculate() from the points where the underlying facts change:
 *
 *   - a buyer rates a seller               (PickupScheduleServiceImpl)
 *   - a transaction completes              (PickupScheduleServiceImpl)
 *   - a buyer reports a delivery issue     (PickupScheduleServiceImpl)
 *   - an admin resolves a complaint        (AdminService)
 *
 * Caching it this way keeps the browse listing fast, since that page
 * reads a score for every product card it renders.
 */
@Service
public class TrustScoreService {

    // ---- Formula constants ----

    public static final double BASE_SCORE = 50.0;
    public static final double MIN_SCORE = 0.0;
    public static final double MAX_SCORE = 100.0;

    /** Rating treated as neutral — neither a bonus nor a penalty. */
    public static final double NEUTRAL_RATING = 3.0;

    /** How many neutral ratings a new seller is treated as having. */
    public static final double PRIOR_WEIGHT = 3.0;

    /** Bonus awarded at a perfect 5.0, and penalty applied at 1.0. */
    public static final double MAX_RATING_BONUS = 25.0;

    /** Points earned per completed transaction. */
    public static final double POINTS_PER_TRANSACTION = 1.0;
    public static final double MAX_EXPERIENCE_BONUS = 25.0;

    /** Penalty per complaint the admin upheld with a warning. */
    public static final double UPHELD_COMPLAINT_PENALTY = 10.0;
    public static final double MAX_UPHELD_COMPLAINT_PENALTY = 30.0;

    /** Provisional penalty per complaint still awaiting a decision. */
    public static final double PENDING_COMPLAINT_PENALTY = 3.0;
    public static final double MAX_PENDING_COMPLAINT_PENALTY = 9.0;

    /** Penalty per reported delivery failure. */
    public static final double DELIVERY_ISSUE_PENALTY = 5.0;
    public static final double MAX_DELIVERY_ISSUE_PENALTY = 15.0;

    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_RESOLVED = "RESOLVED";


    private final TrustScoreRepository trustScoreRepository;
    private final ReviewRepository reviewRepository;
    private final RequestRepository requestRepository;
    private final ComplaintRepository complaintRepository;
    private final PickupScheduleRepository pickupScheduleRepository;
    private final StudentRepository studentRepository;


    public TrustScoreService(
            TrustScoreRepository trustScoreRepository,
            ReviewRepository reviewRepository,
            RequestRepository requestRepository,
            ComplaintRepository complaintRepository,
            PickupScheduleRepository pickupScheduleRepository,
            StudentRepository studentRepository) {

        this.trustScoreRepository = trustScoreRepository;
        this.reviewRepository = reviewRepository;
        this.requestRepository = requestRepository;
        this.complaintRepository = complaintRepository;
        this.pickupScheduleRepository = pickupScheduleRepository;
        this.studentRepository = studentRepository;
    }


    // =========================================================
    // RECALCULATE AND STORE
    // =========================================================

    @Transactional
    public TrustScore recalculate(Student student) {

        if (student == null) {
            return null;
        }

        // ---- Gather the raw facts ----

        long totalRatings =
                reviewRepository.countByReviewee(student);

        Double rawAverage =
                reviewRepository.findAverageRatingByReviewee(student);

        long completedAsSeller =
                requestRepository.countBySellerAndStatus(
                        student, STATUS_COMPLETED);

        long completedAsBuyer =
                requestRepository.countByRequesterAndStatus(
                        student, STATUS_COMPLETED);

        long completedTransactions =
                completedAsSeller + completedAsBuyer;

        long upheldComplaints =
                complaintRepository
                        .countByAgainstStudentAndStatusAndWarningNoteIsNotNull(
                                student, STATUS_RESOLVED);

        long pendingComplaints =
                complaintRepository.countByAgainstStudentAndStatusNot(
                        student, STATUS_RESOLVED);

        long deliveryIssues =
                pickupScheduleRepository
                        .countDeliveryIssuesAgainstSeller(student);


        // ---- Apply the formula ----

        double ratingBonus =
                calculateRatingBonus(rawAverage, totalRatings);

        double experienceBonus =
                Math.min(
                        completedTransactions * POINTS_PER_TRANSACTION,
                        MAX_EXPERIENCE_BONUS
                );

        double upheldPenalty =
                Math.min(
                        upheldComplaints * UPHELD_COMPLAINT_PENALTY,
                        MAX_UPHELD_COMPLAINT_PENALTY
                );

        double pendingPenalty =
                Math.min(
                        pendingComplaints * PENDING_COMPLAINT_PENALTY,
                        MAX_PENDING_COMPLAINT_PENALTY
                );

        double issuePenalty =
                Math.min(
                        deliveryIssues * DELIVERY_ISSUE_PENALTY,
                        MAX_DELIVERY_ISSUE_PENALTY
                );

        double score = BASE_SCORE
                + ratingBonus
                + experienceBonus
                - upheldPenalty
                - pendingPenalty
                - issuePenalty;

        score = clamp(score);


        // ---- Store the snapshot ----

        TrustScore trustScore =
                trustScoreRepository.findByStudent(student)
                        .orElseGet(() -> {
                            TrustScore created = new TrustScore();
                            created.setStudent(student);
                            return created;
                        });

        trustScore.setScore(score);
        trustScore.setAverageRating(
                totalRatings > 0 ? round(rawAverage) : null);
        trustScore.setTotalRatings((int) totalRatings);
        trustScore.setCompletedTransactions((int) completedTransactions);
        trustScore.setUpheldComplaints((int) upheldComplaints);
        trustScore.setPendingComplaints((int) pendingComplaints);
        trustScore.setDeliveryIssues((int) deliveryIssues);

        return trustScoreRepository.save(trustScore);
    }


    @Transactional
    public TrustScore recalculate(Long studentId) {

        if (studentId == null) {
            return null;
        }

        return studentRepository.findById(studentId)
                .map(this::recalculate)
                .orElse(null);
    }


    // =========================================================
    // RATING BONUS (Bayesian shrunk average)
    // =========================================================

    private double calculateRatingBonus(Double rawAverage, long count) {

        if (rawAverage == null || count <= 0) {
            // No reviews yet — neither rewarded nor punished.
            return 0.0;
        }

        double sumOfRatings = rawAverage * count;

        double weightedAverage =
                (PRIOR_WEIGHT * NEUTRAL_RATING + sumOfRatings)
                        / (PRIOR_WEIGHT + count);

        // Map 1..5 onto -MAX..+MAX with 3.0 sitting at zero.
        return ((weightedAverage - NEUTRAL_RATING) / 2.0)
                * MAX_RATING_BONUS;
    }


    // =========================================================
    // READ HELPERS
    // =========================================================

    /**
     * Current score for a student, falling back to the neutral base
     * score when no row exists yet. Safe to call on every product card.
     */
    @Transactional(readOnly = true)
    public double getScore(Long studentId) {

        if (studentId == null) {
            return BASE_SCORE;
        }

        return trustScoreRepository.findByStudentStudentId(studentId)
                .map(TrustScore::getScore)
                .orElse(BASE_SCORE);
    }


    /**
     * Full breakdown for the profile page. Recalculates on read so the
     * student always sees an up-to-date figure, even if an event hook
     * was missed.
     */
    @Transactional
    public TrustScoreResponse getBreakdown(Long studentId) {

        Student student = studentRepository.findById(studentId)
                .orElse(null);

        if (student == null) {
            return null;
        }

        TrustScore trustScore = recalculate(student);

        return new TrustScoreResponse(
                student.getStudentId(),
                student.getFullName(),
                round(trustScore.getScore()),
                describe(trustScore.getScore()),
                trustScore.getAverageRating(),
                trustScore.getTotalRatings(),
                trustScore.getCompletedTransactions(),
                trustScore.getUpheldComplaints(),
                trustScore.getPendingComplaints(),
                trustScore.getDeliveryIssues(),
                trustScore.getUpdatedAt()
        );
    }


    /**
     * Human readable band for the score, used as the profile label.
     */
    public static String describe(double score) {

        if (score >= 80) {
            return "Highly Trusted";
        }
        if (score >= 60) {
            return "Trusted Member";
        }
        if (score >= 40) {
            return "Building Trust";
        }
        if (score >= 20) {
            return "Low Trust";
        }
        return "Not Trusted";
    }


    // =========================================================
    // UTILITIES
    // =========================================================

    private static double clamp(double value) {
        return Math.max(MIN_SCORE, Math.min(MAX_SCORE, value));
    }

    private static double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}