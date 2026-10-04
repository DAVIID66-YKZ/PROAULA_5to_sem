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

    @GetMapping({"/reserva", "/cliente/reserva"})
    public String reserva() {
        return "cliente/reserva";
    }

    @GetMapping("/legal/privacidad")
    public String privacidad() {
        return "legal/privacidad";
    }

    @GetMapping("/legal/terminosYCondiciones")
    public String terminosYCondiciones() {
        return "legal/terminosYCondiciones";
    }

    @GetMapping({"/menu", "/cliente/menu"})
    public String menu() {
        return "menu";
    }

    @GetMapping({"/dashboard", "/cliente/dashboard"})
    public String dashboard() {
        return "cliente/dashboard";
    }

    @GetMapping({"/mis-reservas", "/cliente/mis-reservas"})
    public String misReservas() {
        return "cliente/mis-reservas";
    }

    @GetMapping({"/calendario", "/cliente/calendario"})
    public String calendario() {
        return "cliente/calendario";
    }

    @GetMapping({"/perfil", "/cliente/perfil"})
    public String perfil() {
        return "cliente/perfil";
    }

    @GetMapping({"/ver-menu", "/cliente/ver-menu"})
    public String verMenu() {
        return "cliente/ver-menu";
    }

    // Vistas de Administrador
    @GetMapping({"/dashboardAdmin", "/admin/dashboardAdmin", "/admin/dashboard"})
    public String dashboardAdmin() {
        return "admin/dashboardAdmin";
    }
}