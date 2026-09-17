package com.sce.smartcampexchange.dto;

public class AdminDashboardResponse {

    private long totalStudents;
    private long totalProducts;
    private long totalRequests;
    private long totalComplaints;
    private long pendingComplaints;
    private long totalNotifications;

    public AdminDashboardResponse() {
    }

    public AdminDashboardResponse(long totalStudents,
                                  long totalProducts,
                                  long totalRequests,
                                  long totalComplaints,
                                  long pendingComplaints,
                                  long totalNotifications) {
        this.totalStudents = totalStudents;
        this.totalProducts = totalProducts;
        this.totalRequests = totalRequests;
        this.totalComplaints = totalComplaints;
        this.pendingComplaints = pendingComplaints;
        this.totalNotifications = totalNotifications;
    }

    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }

    public long getTotalProducts() { return totalProducts; }
    public void setTotalProducts(long totalProducts) { this.totalProducts = totalProducts; }

    public long getTotalRequests() { return totalRequests; }
    public void setTotalRequests(long totalRequests) { this.totalRequests = totalRequests; }

    public long getTotalComplaints() { return totalComplaints; }
    public void setTotalComplaints(long totalComplaints) { this.totalComplaints = totalComplaints; }

    public long getPendingComplaints() { return pendingComplaints; }
    public void setPendingComplaints(long pendingComplaints) { this.pendingComplaints = pendingComplaints; }

    public long getTotalNotifications() { return totalNotifications; }
    public void setTotalNotifications(long totalNotifications) { this.totalNotifications = totalNotifications; }
}