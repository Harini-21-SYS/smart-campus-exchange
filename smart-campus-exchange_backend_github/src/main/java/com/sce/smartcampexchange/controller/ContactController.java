package com.sce.smartcampexchange.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.sce.smartcampexchange.dto.ContactMessageResponse;
import com.sce.smartcampexchange.dto.ContactRequest;
import com.sce.smartcampexchange.service.ContactService;

@RestController
@RequestMapping("/api")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    // ---------- Public ----------
    @PostMapping("/contact")
    public ResponseEntity<Map<String, Object>> submit(@RequestBody ContactRequest request) {
        try {
            contactService.submit(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Thanks for reaching out! We'll get back to you soon."));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of(
                    "success", false,
                    "message", e.getReason() == null ? "Request failed" : e.getReason()));
        }
    }

    // ---------- Admin (must be ADMIN-only in SecurityConfig) ----------
    @GetMapping("/admin/contact-messages")
    public List<ContactMessageResponse> getAll() {
        return contactService.getAll();
    }

    @PutMapping("/admin/contact-messages/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable Long id) {
        contactService.markRead(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Marked as read"));
    }

    @DeleteMapping("/admin/contact-messages/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        contactService.delete(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Message deleted"));
    }
}