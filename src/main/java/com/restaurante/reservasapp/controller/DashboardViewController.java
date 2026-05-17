package com.restaurante.reservasapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardViewController {
    
    // Mapeo para acceder al dashboard directamente
    @GetMapping("/dashboard")
    public String dashboard() {
        return "dashboard";  // Esto busca: src/main/resources/templates/dashboard.html
    }
    
    // Para que funcione desde la raíz
    @GetMapping("/admin/dashboard")
    public String adminDashboard() {
        return "dashboard";
    }
}