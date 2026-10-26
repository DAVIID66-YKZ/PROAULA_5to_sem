package com.restaurante.reservasapp.controller;

import org.springframework.web.bind.annotation.RequestMapping;

import com.restaurante.reservasapp.services.PdfMenuService;
import com.restaurante.reservasapp.services.PlatoService;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@Controller
@RequestMapping("/menu")
public class MenuController {

    private final PlatoService platoService;
    private final PdfMenuService pdfMenuService;

    public MenuController(PlatoService platoService, PdfMenuService pdfMenuService) {
        this.platoService = platoService;
        this.pdfMenuService = pdfMenuService;
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

    @GetMapping("/api/listar")
    @org.springframework.web.bind.annotation.ResponseBody
    public org.springframework.http.ResponseEntity<java.util.List<com.restaurante.reservasapp.Entity.PlatoEntity>> listarPlatosApi() {
        return org.springframework.http.ResponseEntity.ok(platoService.listarPlatos());
    }

    @GetMapping("/menu.pdf")
    public ResponseEntity<byte[]> descargaPdf() {
        byte[] pdfBytes = pdfMenuService.generarPdfMenu();

        return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=menu.pdf")
        .contentType(MediaType.APPLICATION_PDF)
        .body(pdfBytes);
    }
    

}
