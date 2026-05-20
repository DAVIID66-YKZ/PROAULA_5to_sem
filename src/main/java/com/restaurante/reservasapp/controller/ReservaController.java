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

    @PostMapping("/guardar")
    public ResponseEntity<?> guardarReserva(@RequestBody ReservaEntity reserva) {
        try {
            if (reserva.getUsuarioId() == null || reserva.getFecha() == null || reserva.getHora() == null) {
                return ResponseEntity.badRequest().body("Datos de reserva incompletos.");
            }
            ReservaEntity nuevaReserva = reservaService.guardarReserva(reserva);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaReserva);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error interno: " + e.getMessage());
        }
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<ReservaEntity>> listarPorUsuario(@PathVariable String usuarioId) {
        return ResponseEntity.ok(reservaService.listarPorUsuario(usuarioId));
    }

    @GetMapping("/listar")
    public List<ReservaEntity> listarTodas() {
        return reservaService.listarReservas();
    }

    @GetMapping("/ocupadas")
    public ResponseEntity<List<String>> obtenerOcupadas(
            @RequestParam String fecha,
            @RequestParam String mesaId,
            @RequestParam int invitados) {
        List<String> horas = reservaService.obtenerHorasCompletamenteOcupadas(fecha, mesaId, invitados);
        return ResponseEntity.ok(horas);
    }

    // ── UN SOLO endpoint DELETE ──
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarReserva(@PathVariable String id) {
        try {
            reservaService.eliminarReserva(id);
            return ResponseEntity.ok().body("Reserva eliminada correctamente.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al eliminar: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/comentario")
    public ResponseEntity<?> agregarComentario(@PathVariable String id, @RequestBody String comentario) {
        try {
            String comentarioLimpio = comentario.replace("\"", "").trim();
            ReservaEntity reserva = reservaService.obtenerReserva(id);
            if (reserva == null) return ResponseEntity.notFound().build();
            reserva.setComentario(comentarioLimpio);
            reservaService.guardarReservaDirecta(reserva);
            return ResponseEntity.ok().body("Comentario guardado.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}