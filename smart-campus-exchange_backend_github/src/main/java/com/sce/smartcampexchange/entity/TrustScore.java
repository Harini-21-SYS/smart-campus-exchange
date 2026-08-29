package com.sce.smartcampexchange.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "trust_scores")
public class TrustScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One student has one trust score
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "student_id",
        nullable = false,
        unique = true
    )
    private Student student;

    // Trust score value
    @Column(nullable = false)
    private double score = 50.0;

    public TrustScore() {
    }

    public TrustScore(Student student, double score) {
        this.student = student;
        this.score = score;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }
}