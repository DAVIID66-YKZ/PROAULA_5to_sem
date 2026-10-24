package com.restaurante.reservasapp.controller;

import org.springframework.web.bind.annotation.RequestMapping;

import com.restaurante.reservasapp.services.PlatoService;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequestMapping("/menu")
public class MenuController {

    private final PlatoService platoService;

    public MenuController(PlatoService platoService) {
        this.platoService = platoService;
    }

    @GetMapping({"", "/", "/listar"})
    public String mostrarMenu(Model model) {
        model.addAttribute("platos", platoService.listarPlatos());
        return "menu";
    }

    @GetMapping({ "/ver-menu", "/cliente/ver-menu" })
    public String verMenu(Model model) {
        model.addAttribute("platos", platoService.listarPlatos());
        return "cliente/ver-menu";
    }

}
