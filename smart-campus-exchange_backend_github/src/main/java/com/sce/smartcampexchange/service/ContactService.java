package com.sce.smartcampexchange.service;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sce.smartcampexchange.dto.ContactMessageResponse;
import com.sce.smartcampexchange.dto.ContactRequest;
import com.sce.smartcampexchange.entity.ContactMessage;
import com.sce.smartcampexchange.repository.ContactMessageRepository;

@Service
public class ContactService {

    private static final Pattern EMAIL =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final ContactMessageRepository repository;

    public ContactService(ContactMessageRepository repository) {
        this.repository = repository;
    }

    // Public: anyone can submit the contact form
    public void submit(ContactRequest request) {
        if (request == null) {
            throw bad("Message details are required");
        }

        String name = clean(request.getName());
        String email = clean(request.getEmail());
        String subject = clean(request.getSubject());
        String message = clean(request.getMessage());

        if (name.isEmpty()) throw bad("Name is required");
        if (name.length() > 100) throw bad("Name is too long");

        if (email.isEmpty()) throw bad("Email is required");
        if (!EMAIL.matcher(email).matches() || email.length() > 150) {
            throw bad("Enter a valid email address");
        }

        if (subject.isEmpty()) throw bad("Subject is required");
        if (subject.length() > 150) throw bad("Subject is too long");

        if (message.length() < 10) throw bad("Message must be at least 10 characters");
        if (message.length() > 2000) throw bad("Message must be under 2000 characters");

        ContactMessage entity = new ContactMessage();
        entity.setName(name);
        entity.setEmail(email);
        entity.setSubject(subject);
        entity.setMessage(message);
        entity.setStatus("UNREAD");
        repository.save(entity);
    }

    // Admin
    public List<ContactMessageResponse> getAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markRead(Long id) {
        ContactMessage m = find(id);
        m.setStatus("READ");
        repository.save(m);
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(find(id));
    }

    private ContactMessage find(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Contact message not found with id: " + id));
    }

    private ContactMessageResponse toResponse(ContactMessage m) {
        return new ContactMessageResponse(m.getId(), m.getName(), m.getEmail(),
                m.getSubject(), m.getMessage(), m.getStatus(), m.getCreatedAt());
    }

    private static String clean(String s) {
        return s == null ? "" : s.trim();
    }

    private static ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}