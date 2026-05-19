package com.restaurante.reservasapp.services.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.repository.MesaRepository;
import com.restaurante.reservasapp.repository.ReservaRepository;
import com.restaurante.reservasapp.services.ReservaService;

@Service
public class ReservaServiceImpl implements ReservaService {

    @Autowired
    private ReservaRepository reservaRepo;

    @Autowired
    private MesaRepository mesaRepo;

@Override
@Transactional
public ReservaEntity guardarReserva(ReservaEntity reserva) {

    String sectorBuscado = reserva.getMesaId(); // Ej: "Mesa-Estandar"

    // ── REGLA 1: Un usuario solo puede tener UNA reserva por sector ──
    List<ReservaEntity> reservasEnEsteSector = reservaRepo
        .findByUsuarioIdAndExperiencia(reserva.getUsuarioId(), sectorBuscado);

    if (!reservasEnEsteSector.isEmpty()) {
        throw new RuntimeException(
            "Ya tienes una reserva en el sector " + sectorBuscado + 
            ". Solo se permite una reserva por sector.");
    }

    // ── REGLA 2: Un usuario máximo 3 reservas en total (una por sector) ──
    List<ReservaEntity> todasLasReservasDelUsuario = reservaRepo
        .findByUsuarioId(reserva.getUsuarioId());

    if (todasLasReservasDelUsuario.size() >= 3) {
        throw new RuntimeException(
            "Has alcanzado el límite de 3 reservas. " +
            "Cancela una reserva existente para hacer una nueva.");
    }

    // ── REGLA 3: Buscar mesa disponible en el sector para esa fecha/hora ──
    List<MesaEntity> mesasDelSector = mesaRepo.findAll().stream()
        .filter(m -> m.getSector() != null && m.getSector().equals(sectorBuscado))
        .filter(MesaEntity::isDisponible)
        .collect(Collectors.toList());

    if (mesasDelSector.isEmpty()) {
        throw new RuntimeException(
            "No hay mesas configuradas en el sector: " + sectorBuscado);
    }

  // ── REGLA 4: De las mesas del sector, buscar una libre en esa fecha/hora ──
    List<ReservaEntity> todasLasReservas = reservaRepo.findAll();

    MesaEntity mesaAsignada = mesasDelSector.stream()
        .filter(mesa -> {
            boolean ocupada = todasLasReservas.stream().anyMatch(r ->
                mesa.getId().equals(r.getMesaId()) &&
                reserva.getFecha().equals(r.getFecha()) &&
                reserva.getHora().equals(r.getHora())
            );
            return !ocupada;
        })
        .findFirst()
        .orElseThrow(() -> new RuntimeException(
            "No hay mesas disponibles en el sector " + sectorBuscado +
            " para la fecha y hora seleccionada. Intenta otra hora."));
    // ── ASIGNAR: Guardar el ID real de la mesa y la experiencia ──
    reserva.setMesaId(mesaAsignada.getId());
    reserva.setExperiencia(sectorBuscado); // Guarda "Mesa-Estandar" / "Mesa-Ventana" / "Mesa-Alcoba"

    return reservaRepo.save(reserva);

    // NOTA: No tocamos mesa.setDisponible(false) — la disponibilidad
    // se controla dinámicamente por fecha/hora, no permanentemente.
    // Así la misma mesa puede usarse en diferentes noches.
}
@Override
    public List<ReservaEntity> listarPorUsuario(String usuarioId) {
        return reservaRepo.findByUsuarioId(usuarioId);
    }

    @Override
    public ReservaEntity obtenerReserva(String id) {
        return reservaRepo.findById(id).orElse(null);
    }

   @Override
@Transactional
public void eliminarReserva(String id) {
    reservaRepo.findById(id).ifPresent(reserva -> {
        // Ya NO tocamos mesa.setDisponible — la disponibilidad es manual del admin
        reservaRepo.deleteById(id);
    });
}

    @Override
    public List<ReservaEntity> listarReservas() {
        return reservaRepo.findAll();
    }
}