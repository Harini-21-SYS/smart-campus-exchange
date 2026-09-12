package com.sce.smartcampexchange.dto;

public class AdminDashboardResponse {

    private long totalStudents;
    private long totalProducts;

    public AdminDashboardResponse() {
    }

    public AdminDashboardResponse(long totalStudents,
                                  long totalProducts) {
        this.totalStudents = totalStudents;
        this.totalProducts = totalProducts;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }
}