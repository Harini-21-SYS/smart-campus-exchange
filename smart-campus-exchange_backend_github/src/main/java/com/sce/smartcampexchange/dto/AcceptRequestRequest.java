package com.sce.smartcampexchange.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class AcceptRequestRequest {

    private String location;

    private LocalDate pickupDate;

    private LocalTime pickupTime;


    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDate getPickupDate() {
        return pickupDate;
    }

    public void setPickupDate(LocalDate pickupDate) {
        this.pickupDate = pickupDate;
    }

    public LocalTime getPickupTime() {
        return pickupTime;
    }

    public void setPickupTime(LocalTime pickupTime) {
        this.pickupTime = pickupTime;
    }
}