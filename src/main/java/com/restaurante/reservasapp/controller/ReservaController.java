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
                return ResponseEntity.badRequest().body("Error: Datos de reserva incompletos (Usuario, Fecha u Hora).");
            }
            ReservaEntity nuevaReserva = reservaService.guardarReserva(reserva);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaReserva);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error interno: " + e.getMessage());
        }
    }

    // 🔥 NUEVO ENDPOINT: CARGA MASIVA DE RESERVAS DEL DATASET
    @PostMapping("/guardar-bulk")
    public ResponseEntity<String> guardarReservasBulk(@RequestBody List<ReservaEntity> reservas) {
        try {
            int creadas = 0;
            // Listamos las existentes una sola vez para optimizar el rendimiento del bucle
            List<ReservaEntity> existentes = reservaService.listarReservas();
            
            for (ReservaEntity r : reservas) {
                // Si el ID viene informado y no se encuentra ya registrado en Mongo
                if (r.getId() != null && existentes.stream().noneMatch(e -> e.getId().equals(r.getId()))) {
                    reservaService.guardarReservaDirecta(r); // Usa persistencia directa sin bloqueos de horario
                    creadas++;
                }
            }
            return ResponseEntity.ok("Se han migrado exitosamente " + creadas + " reservas a MongoDB Atlas.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error en la carga masiva: " + e.getMessage());
        }
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<ReservaEntity>> listarPorUsuario(@PathVariable String usuarioId) {
        List<ReservaEntity> reservas = reservaService.listarPorUsuario(usuarioId);
        return ResponseEntity.ok(reservas);
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
        List<String> horasColapsadas = reservaService.obtenerHorasCompletamenteOcupadas(fecha, mesaId, invitados);
        return ResponseEntity.ok(horasColapsadas);
    }

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
            ReservaEntity reserva = reservaService.obtenerReserva(id);
            if (reserva == null) {
                return ResponseEntity.notFound().build();
            }
            reserva.setComentario(comentarioLimpio);
            reservaService.guardarReservaDirecta(reserva); 
            return ResponseEntity.ok().body("Comentario indexado correctamente.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}