package com.restaurante.reservasapp.controller;

import com.restaurante.reservasapp.Auth.DashboardResponse;
import com.restaurante.reservasapp.Auth.ReservaParaDashboardResponse;
import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.services.DashboardService;
import com.restaurante.reservasapp.services.MesaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private MesaService mesaService;

    // ===== ENDPOINTS DE ESTADÍSTICAS =====

    @GetMapping("/estadisticas")
    public ResponseEntity<DashboardResponse> obtenerEstadisticas() {
        DashboardResponse stats = dashboardService.obtenerEstadisticasGenerales();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/reservas-recientes")
    public ResponseEntity<List<ReservaParaDashboardResponse>> obtenerReservasRecientes(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanio) {

        List<ReservaParaDashboardResponse> reservas =
            dashboardService.obtenerReservasRecientes(pagina, tamanio);
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
}