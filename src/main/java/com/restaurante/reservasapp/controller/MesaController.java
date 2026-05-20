package com.restaurante.reservasapp.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.services.MesaService;

@RestController
@RequestMapping("mesas")
public class MesaController {

    private final MesaService mesaService;

    // Inyección correcta a través del constructor usando la interfaz
    public MesaController(MesaService mesaService) {
        this.mesaService = mesaService;
    }

    @GetMapping("/listar")
    public List<MesaEntity> listarMesas() {
        return mesaService.listarMesas();
    }

    @PostMapping("/guardar")
    public MesaEntity guardarMesa(@RequestBody MesaEntity mesa) {
        return mesaService.guardarMesa(mesa);
    }

    // 🔥 NUEVO ENDPOINT PARA CARGA MASIVA
    @PostMapping("/guardar-bulk")
    public ResponseEntity<String> guardarMesasBulk(@RequestBody List<MesaEntity> listaMesas) {
        try {
            mesaService.guardarMesasBulk(listaMesas);
            return ResponseEntity.ok("Se han registrado las " + listaMesas.size() + " mesas con éxito en MongoDB Atlas.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al procesar la carga masiva de mesas: " + e.getMessage());
        }
    }
}