package com.restaurante.reservasapp.controller;

import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.services.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservas")
@RequiredArgsConstructor // Genera el constructor para inyectar el servicio
public class ReservaController {

    private final ReservaService reservaService;

    @PostMapping("/guardar")
    public ResponseEntity<?> guardarReserva(@RequestBody ReservaEntity reserva) {
        try {
            // Verificamos que lleguen los datos mínimos
            if (reserva.getUsuarioId() == null || reserva.getFecha() == null) {
                return ResponseEntity.badRequest().body("Datos de reserva incompletos.");
            }
            
            ReservaEntity nuevaReserva = reservaService.guardarReserva(reserva);
            return ResponseEntity.ok(nuevaReserva);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al guardar: " + e.getMessage());
        }
    }

    @GetMapping("/listar")
    public List<ReservaEntity> listarTodas() {
        return reservaService.listarReservas();
    }
}