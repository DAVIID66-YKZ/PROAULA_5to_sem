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
// Reemplaza este método en tu ReservaController.java
@GetMapping("/ocupadas")
public ResponseEntity<List<String>> obtenerOcupadas(
        @RequestParam String fecha, 
        @RequestParam String mesaId,
        @RequestParam int invitados) {
    
    List<String> horasColapsadas = reservaService.obtenerHorasCompletamenteOcupadas(fecha, mesaId, invitados);
    return ResponseEntity.ok(horasColapsadas);
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
@PatchMapping("/{id}/comentario")
public ResponseEntity<?> agregarComentario(@PathVariable String id, @RequestBody String comentario) {
    try {
        String comentarioLimpio = comentario.replace("\"", "").trim();
        
        // 1. Buscamos el documento original
        ReservaEntity reserva = reservaService.obtenerReserva(id);
        if (reserva == null) {
            return ResponseEntity.notFound().build();
        }
        
        // 2. Inyectamos el nuevo comentario
        reserva.setComentario(comentarioLimpio);
        
        // 3. Persistencia limpia a través de la interfaz corregida
        reservaService.guardarReservaDirecta(reserva); 
        
        return ResponseEntity.ok().body("Comentario indexado correctamente.");
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
    }
}
}