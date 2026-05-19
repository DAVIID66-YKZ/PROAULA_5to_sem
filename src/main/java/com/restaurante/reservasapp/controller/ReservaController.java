package com.restaurante.reservasapp.controller;

import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.services.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    /**
     * Guarda una nueva reserva validando datos mínimos.
     */
    @PostMapping("/guardar")
    public ResponseEntity<?> guardarReserva(@RequestBody ReservaEntity reserva) {
        try {
            if (reserva.getUsuarioId() == null || reserva.getFecha() == null || reserva.getHora() == null) {
                return ResponseEntity.badRequest().body("Error: Datos de reserva incompletos (Usuario, Fecha u Hora).");
            }
            
            ReservaEntity nuevaReserva = reservaService.guardarReserva(reserva);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaReserva);
        } catch (RuntimeException e) {
            // Aquí capturamos errores de negocio (ej: mesa ocupada)
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error interno: " + e.getMessage());
        }
    }

    /**
     * 🔥 NUEVO: Obtiene las reservas de un usuario específico.
     * Este es el endpoint que llamará tu archivo mis-reservas.js
     */
@GetMapping("/usuario/{usuarioId}")
public ResponseEntity<List<ReservaEntity>> listarPorUsuario(@PathVariable String usuarioId) {
    List<ReservaEntity> reservas = reservaService.listarPorUsuario(usuarioId);
    return ResponseEntity.ok(reservas);
}

    /**
     * Lista todas las reservas del sistema (Uso administrativo).
     */
    @GetMapping("/listar")
    public List<ReservaEntity> listarTodas() {
        return reservaService.listarReservas();
    }
    @GetMapping("/ocupadas")
public ResponseEntity<List<ReservaEntity>> obtenerOcupadas(
        @RequestParam String fecha, 
        @RequestParam String mesaId) {
    // mesaId recibe el sector como "Mesa-Estandar", "Mesa-Ventana", etc.
    // Usamos un casteo de nuestra implementación para acceder al método dinámico
    List<ReservaEntity> ocupadas = ((com.restaurante.reservasapp.services.impl.ReservaServiceImpl) reservaService)
            .listarPorMesaYFecha(fecha, mesaId);
    return ResponseEntity.ok(ocupadas);
}
// Agrega o reemplaza este método en tu ReservaController.java
@DeleteMapping("/{id}")
public ResponseEntity<?> eliminarReserva(@PathVariable String id) {
    try {
        reservaService.eliminarReserva(id);
        return ResponseEntity.ok().body("Reserva eliminada correctamente.");
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error al eliminar la reserva: " + e.getMessage());
    }
}
}