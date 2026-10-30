package com.restaurante.reservasapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.restaurante.reservasapp.services.PlatoService;

@Controller
public class ViewController {

    private final PlatoService platoService;

    public ViewController(PlatoService platoService) {
        this.platoService = platoService;
    }

    // Maneja la página principal (localhost:8080/)
    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("platos", platoService.listarPlatos());
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
    public String index(Model model) {
        model.addAttribute("platos", platoService.listarPlatos());
        return "index";
    }

    @GetMapping({"/reserva", "/cliente/reserva"})
    public String reserva(Model model) {
        model.addAttribute("platos", platoService.listarPlatos());
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

    // Vistas de Administrador
    @GetMapping({"/admin/dashboard", "/dashboardAdmin", "/admin/dashboardAdmin"})
    public String adminDashboard() {
        return "admin/dashboard";
    }

    @GetMapping("/admin/mesas")
    public String adminMesas() {
        return "admin/mesas";
    }

    @GetMapping("/admin/reservas")
    public String adminReservas() {
        return "admin/reservas";
    }

    @GetMapping("/admin/usuarios")
    public String adminUsuarios() {
        return "admin/usuarios";
    }

    @GetMapping({"/admin/perfil", "/admin/PerfilAdmin"})
    public String adminPerfil() {
        return "admin/PerfilAdmin";
    }

    @GetMapping("/admin/menu")
    public String menuAdmin() {
        return "admin/menu";
    }

    @GetMapping({"/admin/prediccion", "/admin/predicciones"})
    public String adminPrediccion() {
        return "admin/prediccion";
    }
}
