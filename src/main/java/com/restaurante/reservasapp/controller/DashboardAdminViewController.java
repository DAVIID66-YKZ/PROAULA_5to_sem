package com.restaurante.reservasapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardAdminViewController {
    
    // Mapeo para acceder al dashboard directamente
    @GetMapping("/dashboardAdmin")
    public String dashboard() {
        return "dashboardAdmin";  // Esto busca: src/main/resources/templates/dashboardAdmin.html
    }
    
    // Para que funcione desde la raíz
    @GetMapping("/admin/dashboardAdmin")
    public String adminDashboard() {
        return "dashboardAdmin";
    }
}