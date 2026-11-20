package com.restaurante.reservasapp.controller;

import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.repository.UsuarioRepository;
import com.restaurante.reservasapp.services.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;
    private final UsuarioRepository usuarioRepository;

    private UsuarioEntity obtenerUsuarioEnSesion(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        if (auth.getPrincipal() instanceof UsuarioEntity) {
            return (UsuarioEntity) auth.getPrincipal();
        }
        return usuarioRepository.findByCorreo(auth.getName()).orElse(null);
    }

    private boolean esAdmin(Authentication auth) {
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping("/guardar")
    public ResponseEntity<?> guardarReserva(@RequestBody ReservaEntity reserva, Authentication auth) {
        try {
            if (reserva.getFecha() == null || reserva.getHora() == null) {
                return ResponseEntity.badRequest().body("Datos de reserva incompletos.");
            }

            UsuarioEntity usuarioSesion = obtenerUsuarioEnSesion(auth);
            if (usuarioSesion == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Debes iniciar sesión para realizar una reserva.");
            }

            // 🔥 SEGURIDAD IDOR: Si no es administrador, forzar el ID del usuario en sesión
            if (!esAdmin(auth) || reserva.getUsuarioId() == null || reserva.getUsuarioId().isBlank()) {
                reserva.setUsuarioId(usuarioSesion.getId());
            }

            ReservaEntity nuevaReserva = reservaService.guardarReserva(reserva);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaReserva);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error interno: " + e.getMessage());
        }
    }

    // 🔥 ENDPOINT: CARGA MASIVA DE RESERVAS DEL DATASET (SOLO ADMINISTRADOR)
    @PostMapping("/guardar-bulk")
    public ResponseEntity<?> guardarReservasBulk(@RequestBody List<ReservaEntity> reservas, Authentication auth) {
        if (!esAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Acceso denegado: solo administradores pueden realizar carga masiva.");
        }
        try {
            int creadas = 0;
            List<ReservaEntity> existentes = reservaService.listarReservas();

            for (ReservaEntity r : reservas) {
                if (r.getId() != null && existentes.stream().noneMatch(e -> e.getId().equals(r.getId()))) {
                    reservaService.guardarReservaDirecta(r);
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
    public ResponseEntity<?> listarPorUsuario(@PathVariable String usuarioId, Authentication auth) {
        UsuarioEntity usuarioSesion = obtenerUsuarioEnSesion(auth);
        if (usuarioSesion == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sesión no válida.");
        }

        // 🔥 SEGURIDAD: Un cliente únicamente puede consultar sus propias reservas
        if (!esAdmin(auth) && !usuarioSesion.getId().equals(usuarioId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("No tienes permiso para consultar las reservas de otro usuario.");
        }

        List<ReservaEntity> reservas = reservaService.listarPorUsuario(usuarioId);
        return ResponseEntity.ok(reservas);
    }

    @GetMapping("/listar")
    public ResponseEntity<?> listarTodas(Authentication auth) {
        if (!esAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Acceso denegado: solo administradores pueden listar todas las reservas.");
        }
        return ResponseEntity.ok(reservaService.listarReservas());
    }

    @GetMapping("/ocupadas")
    public ResponseEntity<List<String>> obtenerOcupadas(
            @RequestParam String fecha,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String mesaId,
            @RequestParam int invitados) {
        String sectorConsultado = (sector != null && !sector.isBlank()) ? sector : mesaId;
        List<String> horas = reservaService.obtenerHorasCompletamenteOcupadas(fecha, sectorConsultado, invitados);
        return ResponseEntity.ok(horas);
    }

    // ── REPROGRAMACIÓN / EDICIÓN DE RESERVA ──

    @PutMapping("/{id}/reprogramar")
    public ResponseEntity<?> reprogramarReserva(
            @PathVariable String id,
            @RequestBody ReservaEntity datosNuevos,
            Authentication auth) {
        try {
            ReservaEntity reserva = reservaService.obtenerReserva(id);
            if (reserva == null) {
                return ResponseEntity.notFound().build();
            }

            UsuarioEntity usuarioSesion = obtenerUsuarioEnSesion(auth);
            if (usuarioSesion == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sesión no válida.");
            }

            // 🔥 SEGURIDAD: Solo el propietario o un administrador pueden reprogramar
            if (!esAdmin(auth) && !usuarioSesion.getId().equals(reserva.getUsuarioId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No tienes permiso para reprogramar esta reserva.");
            }

            ReservaEntity actualizada = reservaService.reprogramarReserva(id, datosNuevos);
            return ResponseEntity.ok(actualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al reprogramar: " + e.getMessage());
        }
    }

    // ── ACTUALIZACIÓN DE PLATOS (HASTA 2H ANTES DE LA RESERVA) ──

    @PutMapping("/{id}/platos")
    public ResponseEntity<?> actualizarPlatosReserva(
            @PathVariable String id,
            @RequestBody(required = false) Object requestBody,
            Authentication auth) {
        try {
            ReservaEntity reserva = reservaService.obtenerReserva(id);
            if (reserva == null) {
                return ResponseEntity.notFound().build();
            }

            UsuarioEntity usuarioSesion = obtenerUsuarioEnSesion(auth);
            if (usuarioSesion == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sesión no válida.");
            }

            // 🔥 SEGURIDAD: Solo el propietario o un administrador pueden actualizar platos
            if (!esAdmin(auth) && !usuarioSesion.getId().equals(reserva.getUsuarioId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No tienes permiso para modificar los platos de esta reserva.");
            }

            List<String> platos = new ArrayList<>();
            if (requestBody instanceof List<?>) {
                for (Object item : (List<?>) requestBody) {
                    if (item != null) {
                        platos.add(item.toString());
                    }
                }
            } else if (requestBody instanceof java.util.Map<?, ?>) {
                Object platosObj = ((java.util.Map<?, ?>) requestBody).get("platos");
                if (platosObj instanceof List<?>) {
                    for (Object item : (List<?>) platosObj) {
                        if (item != null) {
                            platos.add(item.toString());
                        }
                    }
                }
            }
            ReservaEntity actualizada = reservaService.actualizarPlatosReserva(id, platos);
            return ResponseEntity.ok(actualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al actualizar la selección de platos: " + e.getMessage());
        }
    }

    // ── CANCELACIÓN Y ELIMINACIÓN LÓGICA ──

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarReservaEndpoint(@PathVariable String id, Authentication auth) {
        try {
            ReservaEntity reserva = reservaService.obtenerReserva(id);
            if (reserva == null) {
                return ResponseEntity.notFound().build();
            }

            UsuarioEntity usuarioSesion = obtenerUsuarioEnSesion(auth);
            if (usuarioSesion == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sesión no válida.");
            }

            // 🔥 SEGURIDAD: Solo el propietario o un administrador pueden cancelar
            if (!esAdmin(auth) && !usuarioSesion.getId().equals(reserva.getUsuarioId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No tienes permiso para cancelar esta reserva.");
            }

            reservaService.cancelarReserva(id);
            return ResponseEntity.ok().body("Reserva cancelada correctamente.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al cancelar: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarReserva(@PathVariable String id, Authentication auth) {
        try {
            ReservaEntity reserva = reservaService.obtenerReserva(id);
            if (reserva == null) {
                return ResponseEntity.notFound().build();
            }

            UsuarioEntity usuarioSesion = obtenerUsuarioEnSesion(auth);
            if (usuarioSesion == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sesión no válida.");
            }

            // 🔥 SEGURIDAD: Solo el propietario o un administrador pueden eliminar/cancelar
            if (!esAdmin(auth) && !usuarioSesion.getId().equals(reserva.getUsuarioId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No tienes permiso para cancelar esta reserva.");
            }

            reservaService.eliminarReserva(id);
            return ResponseEntity.ok().body("Reserva cancelada correctamente.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al eliminar/cancelar: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/comentario")
    public ResponseEntity<?> agregarComentario(
            @PathVariable String id,
            @RequestBody String comentario,
            Authentication auth) {
        try {
            ReservaEntity reserva = reservaService.obtenerReserva(id);
            if (reserva == null) {
                return ResponseEntity.notFound().build();
            }

            UsuarioEntity usuarioSesion = obtenerUsuarioEnSesion(auth);
            if (usuarioSesion == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sesión no válida.");
            }

            // 🔥 SEGURIDAD: Solo el propietario o un administrador pueden comentar
            if (!esAdmin(auth) && !usuarioSesion.getId().equals(reserva.getUsuarioId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No tienes permiso para comentar en esta reserva.");
            }

            String comentarioLimpio = comentario.replace("\"", "").trim();
            reserva.setComentario(comentarioLimpio);
            reservaService.guardarReservaDirecta(reserva);
            return ResponseEntity.ok().body("Comentario guardado.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstadoReserva(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> body,
            Authentication auth) {
        try {
            ReservaEntity reserva = reservaService.obtenerReserva(id);
            if (reserva == null) {
                return ResponseEntity.notFound().build();
            }

            UsuarioEntity usuarioSesion = obtenerUsuarioEnSesion(auth);
            if (usuarioSesion == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sesión no válida.");
            }

            boolean admin = esAdmin(auth);
            boolean esPropietario = usuarioSesion.getId().equals(reserva.getUsuarioId());

            if (!admin && !esPropietario) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No tienes permiso para modificar el estado de esta reserva.");
            }

            String nuevoEstado = body != null ? body.get("estado") : null;
            if (nuevoEstado == null || nuevoEstado.isBlank()) {
                return ResponseEntity.badRequest().body("El estado es requerido.");
            }

            String nuevoEstadoUpper = nuevoEstado.trim().toUpperCase();

            // Si es un cliente común, únicamente puede confirmar o cancelar su propia reserva
            if (!admin && !"CONFIRMADA".equals(nuevoEstadoUpper) && !"CANCELADA".equals(nuevoEstadoUpper)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo un administrador puede asignar ese estado.");
            }

            if ("CONFIRMADA".equals(nuevoEstadoUpper)) {
                ReservaEntity confirmada = reservaService.confirmarReserva(id);
                return ResponseEntity.ok(confirmada);
            }

            if ("CANCELADA".equals(nuevoEstadoUpper)) {
                reservaService.cancelarReserva(id);
                reserva.setEstado("CANCELADA");
                return ResponseEntity.ok(reserva);
            }

            // Estados gestionados por el administrador (LLEGADA, COMPLETADA, etc.)
            reserva.setEstado(nuevoEstadoUpper);
            reservaService.guardarReservaDirecta(reserva);
            return ResponseEntity.ok(reserva);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al actualizar estado: " + e.getMessage());
        }
    }
}
