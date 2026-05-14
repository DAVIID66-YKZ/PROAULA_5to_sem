package com.restaurante.reservasapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    // Maneja la página principal (localhost:8080/)
    @GetMapping("/")
    public String home() {
        return "index"; 
    }

    // Maneja el login (localhost:8080/login)
    @GetMapping("/login")
    public String login() {
        return "login";
    }

    // Maneja el registro (localhost:8080/register)
    @GetMapping("/register")
    public String register() {
        return "register";
    }
    
    // Maneja el index si tienes una ruta específica para él
    @GetMapping("/index")
    public String index() {
        return "index";
    }
        @GetMapping("/reserva")
    public String reserva() {
        return "reserva";
    }
}