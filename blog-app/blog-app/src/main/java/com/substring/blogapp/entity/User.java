package com.substring.blogapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private  String name;
    //username
    @Column(unique = true)
    private String email;
    private String password;
    @Enumerated(EnumType.STRING)
    private  Role role=Role.ROLE_GUEST;

    private  Boolean enabled=Boolean.TRUE;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL,fetch = FetchType.LAZY)
    private List<Article> articles = new ArrayList<>();

}
