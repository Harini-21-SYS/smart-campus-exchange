package com.sce.smartcampexchange.service;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.repository.StudentRepository;

import java.util.Collections;

@Service
public class CustomUserDetailsService
        implements UserDetailsService {

    private final StudentRepository studentRepository;

    public CustomUserDetailsService(
            StudentRepository studentRepository) {

        this.studentRepository =
                studentRepository;
    }

    @Override
    public UserDetails loadUserByUsername(
            String email)
            throws UsernameNotFoundException {

        Student student =
                studentRepository
                        .findByCollegeEmail(email)
                        .orElseThrow(() ->
                                new UsernameNotFoundException(
                                        "Student not found"));

        return new User(
                student.getCollegeEmail(),
                student.getPassword(),
                Collections.singletonList(
                        new SimpleGrantedAuthority(
                                student.getRole().name())));
    }
}