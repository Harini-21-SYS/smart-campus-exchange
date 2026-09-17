package com.sce.smartcampexchange.dto;

public class ResolveComplaintRequest {

    // Shown to the buyer — general note on how the complaint was resolved.
    private String note;

    // Whether the admin is also issuing a warning to the seller
    // (the student the complaint was raised against) as part of
    // resolving this complaint.
    private boolean warningRequired;

    // The warning text shown to the seller. Only used/persisted when
    // warningRequired is true.
    private String warningNote;

    // Admin enforcement actions, performed as part of resolving —
    // block the student the complaint was raised against, and/or
    // delete the product involved.
    private boolean blockStudent;

    private boolean deleteProduct;

    public ResolveComplaintRequest() {
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public boolean isWarningRequired() {
        return warningRequired;
    }

    public void setWarningRequired(boolean warningRequired) {
        this.warningRequired = warningRequired;
    }

    public String getWarningNote() {
        return warningNote;
    }

    public void setWarningNote(String warningNote) {
        this.warningNote = warningNote;
    }

    public boolean isBlockStudent() {
        return blockStudent;
    }

    public void setBlockStudent(boolean blockStudent) {
        this.blockStudent = blockStudent;
    }

    public boolean isDeleteProduct() {
        return deleteProduct;
    }

    public void setDeleteProduct(boolean deleteProduct) {
        this.deleteProduct = deleteProduct;
    }
}