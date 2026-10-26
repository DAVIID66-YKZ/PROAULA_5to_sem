package com.restaurante.reservasapp.controller;

import com.restaurante.reservasapp.Auth.DashboardAdminResponse;
import com.restaurante.reservasapp.Auth.ReservaParaDashboardAdminResponse;
import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.Entity.PlatoEntity;
import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.Entity.Rol;
import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.services.CloudinaryService;
import com.restaurante.reservasapp.services.DashboardAminService;
import com.restaurante.reservasapp.services.MesaService;
import com.restaurante.reservasapp.services.PlatoService;
import com.restaurante.reservasapp.services.ReservaService;
import com.restaurante.reservasapp.services.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping({ "/api/admin/dashboardAdmin", "/api/admin" })
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardAdminController {

    @Autowired
    private DashboardAminService dashboardService;

    @Autowired
    private MesaService mesaService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ReservaService reservaService;

    @Autowired
    private PlatoService platoService;

    @Autowired
    private CloudinaryService cloudinaryService;

    // ===== ENDPOINTS DE ESTADÍSTICAS =====

    @GetMapping("/estadisticas")
    public ResponseEntity<DashboardAdminResponse> obtenerEstadisticas() {
        DashboardAdminResponse stats = dashboardService.obtenerEstadisticasGenerales();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/reservas-recientes")
    public ResponseEntity<List<ReservaParaDashboardAdminResponse>> obtenerReservasRecientes(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanio) {

        List<ReservaParaDashboardAdminResponse> reservas = dashboardService.obtenerReservasRecientes(pagina, tamanio);
        return ResponseEntity.ok(reservas);
    }

    // ===== ENDPOINTS DE MESAS =====

    @GetMapping("/mesas")
    public ResponseEntity<List<MesaEntity>> obtenerTodasLasMesas() {
        List<MesaEntity> mesas = mesaService.listarMesas();
        return ResponseEntity.ok(mesas);
    }

    @GetMapping("/mesas/{id}")
    public ResponseEntity<MesaEntity> obtenerMesa(@PathVariable String id) {
        MesaEntity mesa = mesaService.obtenerMesa(id);
        if (mesa == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(mesa);
    }

    @PostMapping("/mesas")
    public ResponseEntity<MesaEntity> crearMesa(@RequestBody MesaEntity request) {
        MesaEntity mesaCreada = mesaService.guardarMesa(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(mesaCreada);
    }

    @PutMapping("/mesas/{id}")
    public ResponseEntity<MesaEntity> actualizarMesa(
            @PathVariable String id,
            @RequestBody MesaEntity request) {

        MesaEntity mesaActual = mesaService.obtenerMesa(id);
        if (mesaActual == null) {
            return ResponseEntity.notFound().build();
        }

        mesaActual.setNumero(request.getNumero());
        mesaActual.setCapacidad(request.getCapacidad());
        mesaActual.setDisponible(request.isDisponible());

        MesaEntity mesaActualizada = mesaService.guardarMesa(mesaActual);
        return ResponseEntity.ok(mesaActualizada);
    }

    @DeleteMapping("/mesas/{id}")
    public ResponseEntity<Void> eliminarMesa(@PathVariable String id) {
        MesaEntity mesa = mesaService.obtenerMesa(id);
        if (mesa == null) {
            return ResponseEntity.notFound().build();
        }

        mesaService.eliminarMesa(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mesas/disponibles")
    public ResponseEntity<List<MesaEntity>> obtenerMesasDisponibles() {
        List<MesaEntity> todasLasMesas = mesaService.listarMesas();
        List<MesaEntity> mesasDisponibles = todasLasMesas.stream()
                .filter(MesaEntity::isDisponible)
                .toList();
        return ResponseEntity.ok(mesasDisponibles);
    }

    // ===== ENDPOINTS DE USUARIOS (CRUD COMPLETO MEJORADO) =====

    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioEntity>> obtenerTodosLosUsuarios() {
        List<UsuarioEntity> usuarios = usuarioService.listarUsuarios();
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/usuarios/{id}")
    public ResponseEntity<UsuarioEntity> obtenerUsuarioPorId(@PathVariable String id) {
        UsuarioEntity usuario = usuarioService.obtenerUsuario(id);
        if (usuario == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/usuarios")
    public ResponseEntity<?> crearUsuarioPorAdmin(@RequestBody UsuarioEntity nuevoUsuario) {
        try {
            UsuarioEntity creado = usuarioService.crearUsuarioPorAdmin(nuevoUsuario);
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<?> actualizarUsuarioPorAdmin(
            @PathVariable String id,
            @RequestBody UsuarioEntity datos,
            Authentication auth) {
        try {
            UsuarioEntity actual = usuarioService.obtenerUsuario(id);
            if (actual == null) {
                return ResponseEntity.notFound().build();
            }

            // Evitar que el administrador se desactive a sí mismo o se retire el rol ADMIN
            if (auth != null && auth.getName().equalsIgnoreCase(actual.getCorreo())) {
                if (datos.getActivo() != null && !datos.getActivo()) {
                    return ResponseEntity.badRequest().body(Map.of("message", "No puedes desactivar tu propia cuenta en sesión."));
                }
                if (datos.getRol() != null && datos.getRol() != Rol.ADMIN) {
                    return ResponseEntity.badRequest().body(Map.of("message", "No puedes remover tu propio rol de administrador."));
                }
            }

            UsuarioEntity actualizado = usuarioService.actualizarUsuarioPorAdmin(id, datos);
            return ResponseEntity.ok(actualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/usuarios/{id}/estado")
    public ResponseEntity<?> cambiarEstadoUsuario(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            UsuarioEntity actual = usuarioService.obtenerUsuario(id);
            if (actual == null) {
                return ResponseEntity.notFound().build();
            }

            boolean nuevoEstado = true;
            if (body != null && body.containsKey("activo")) {
                Object val = body.get("activo");
                if (val instanceof Boolean) {
                    nuevoEstado = (Boolean) val;
                } else if (val != null) {
                    nuevoEstado = Boolean.parseBoolean(val.toString());
                }
            }

            if (!nuevoEstado && auth != null && auth.getName().equalsIgnoreCase(actual.getCorreo())) {
                return ResponseEntity.badRequest().body(Map.of("message", "No puedes desactivar tu propia cuenta en sesión."));
            }

            UsuarioEntity modificado = usuarioService.cambiarEstadoUsuario(id, nuevoEstado);
            return ResponseEntity.ok(Map.of(
                    "message", nuevoEstado ? "Cuenta activada correctamente." : "Cuenta desactivada correctamente (protegiendo reservas existentes).",
                    "id", id,
                    "activo", modificado.isActivo()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/usuarios/{id}/rol")
    public ResponseEntity<?> cambiarRolUsuario(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            UsuarioEntity actual = usuarioService.obtenerUsuario(id);
            if (actual == null) {
                return ResponseEntity.notFound().build();
            }

            String rolStr = body != null ? body.get("rol") : null;
            if (rolStr == null || rolStr.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El campo rol es obligatorio."));
            }

            Rol nuevoRol = Rol.valueOf(rolStr.trim().toUpperCase());

            if (auth != null && auth.getName().equalsIgnoreCase(actual.getCorreo()) && nuevoRol != Rol.ADMIN) {
                return ResponseEntity.badRequest().body(Map.of("message", "No puedes cambiar tu propio rol de administrador."));
            }

            UsuarioEntity modificado = usuarioService.cambiarRolUsuario(id, nuevoRol);
            return ResponseEntity.ok(Map.of(
                    "message", "Rol actualizado exitosamente a " + nuevoRol.name(),
                    "id", id,
                    "rol", modificado.getRol().name()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Rol no válido. Valores permitidos: ADMIN, CLIENTE."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Eliminación de usuario -> Desactivación suave (Soft-Delete)
     * No elimina el documento de MongoDB para evitar daños e inconsistencias con registros de reservas.
     */
    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable String id, Authentication auth) {
        UsuarioEntity usuario = usuarioService.obtenerUsuario(id);
        if (usuario == null) {
            return ResponseEntity.notFound().build();
        }

        if (auth != null && auth.getName().equalsIgnoreCase(usuario.getCorreo())) {
            return ResponseEntity.badRequest().body(Map.of("message", "No puedes desactivar tu propia cuenta de administrador."));
        }

        usuarioService.eliminarUsuario(id);
        return ResponseEntity.ok(Map.of(
                "message", "Cuenta desactivada correctamente. Los registros de reservas se mantienen íntegros.",
                "id", id,
                "activo", false
        ));
    }

    // ===== ENDPOINTS DE GESTIÓN DE RESERVAS =====

    @PatchMapping("/reservas/{id}/estado")
    public ResponseEntity<?> actualizarEstadoReserva(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> body) {
        String nuevoEstado = body.get("estado");
        ReservaEntity reserva = reservaService.obtenerReserva(id);
        if (reserva == null) {
            return ResponseEntity.notFound().build();
        }
        reserva.setEstado(nuevoEstado);
        reservaService.guardarReservaDirecta(reserva);
        return ResponseEntity.ok(reserva);
    }

    @DeleteMapping("/reservas/{id}")
    public ResponseEntity<Void> eliminarReserva(@PathVariable String id) {
        ReservaEntity reserva = reservaService.obtenerReserva(id);
        if (reserva == null) {
            return ResponseEntity.notFound().build();
        }
        reservaService.eliminarReserva(id);
        return ResponseEntity.noContent().build();
    }

    // ===== ENDPOINTS DE GESTIÓN DEL MENÚ =====
    @GetMapping("/menu")
    public ResponseEntity<List<PlatoEntity>> obtenerTodasLosPlatos() {
        List<PlatoEntity> platos = platoService.listarPlatos();
        return ResponseEntity.ok(platos);
    }

    @GetMapping("/menu/{id}")
    public ResponseEntity<PlatoEntity> obtenerPlato(@PathVariable String id) {
        PlatoEntity plato = platoService.obtenerPlato(id);
        if (plato == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(plato);
    }

    @PostMapping(value = "/menu", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PlatoEntity> crearPlato(
            @RequestParam("nombre") String nombre,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("categoria") String categoria,
            @RequestParam("precio") BigDecimal precio,
            @RequestParam("disponible") Boolean disponible,
            @RequestParam("imagenPlato") MultipartFile imagenPlato) throws IOException {

        if (imagenPlato == null || imagenPlato.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        validarImagen(imagenPlato);

        PlatoEntity plato = new PlatoEntity();
        plato.setNombre(nombre);
        plato.setDescripcion(descripcion);
        plato.setCategoria(categoria);
        plato.setPrecio(precio);
        plato.setDisponible(disponible);
        plato.setImgUrl(cloudinaryService.subirImagen(imagenPlato));

        PlatoEntity platoCreado = platoService.guardarPlato(plato);

        return ResponseEntity.status(HttpStatus.CREATED).body(platoCreado);
    }

    @PutMapping(value = "/menu/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PlatoEntity> actualizarPlato(
            @PathVariable String id,
            @RequestParam("nombre") String nombre,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("categoria") String categoria,
            @RequestParam("precio") BigDecimal precio,
            @RequestParam("disponible") Boolean disponible,
            @RequestParam(value = "imagenPlato", required = false) MultipartFile imagenPlato)
            throws IOException {

        PlatoEntity platoActual = platoService.obtenerPlato(id);

        if (platoActual == null) {
            return ResponseEntity.notFound().build();
        }

        if (precio == null || precio.compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().build();
        }

        platoActual.setNombre(nombre);
        platoActual.setDescripcion(descripcion);
        platoActual.setCategoria(categoria);
        platoActual.setPrecio(precio);
        platoActual.setDisponible(disponible);

        if (imagenPlato != null && !imagenPlato.isEmpty()) {
            validarImagen(imagenPlato);
            String nuevaUrl = cloudinaryService.subirImagen(imagenPlato);
            platoActual.setImgUrl(nuevaUrl);
        }

        PlatoEntity platoActualizado = platoService.guardarPlato(platoActual);

        return ResponseEntity.ok(platoActualizado);
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<Void> eliminarPlato(@PathVariable String id) {
        PlatoEntity plato = platoService.obtenerPlato(id);
        if (plato == null) {
            return ResponseEntity.notFound().build();
        }

        platoService.eliminarPlato(id);
        return ResponseEntity.noContent().build();
    }

    private void validarImagen(MultipartFile archivo) {
        Set<String> tiposPermitidos = Set.of(
                "image/jpeg",
                "image/png",
                "image/webp");

        if (archivo.getContentType() == null
                || !tiposPermitidos.contains(archivo.getContentType())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Solo se permiten imágenes JPG, PNG o WebP");
        }

        if (archivo.getSize() > 5 * 1024 * 1024) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "La imagen no puede superar los 5 MB");
        }
    }

}
