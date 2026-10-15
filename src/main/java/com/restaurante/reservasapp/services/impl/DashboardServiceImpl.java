package com.restaurante.reservasapp.services.impl;

import com.restaurante.reservasapp.Auth.DashboardAdminResponse;
import com.restaurante.reservasapp.Auth.ReservaParaDashboardAdminResponse;
import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.repository.MesaRepository;
import com.restaurante.reservasapp.repository.ReservaRepository;
import com.restaurante.reservasapp.services.DashboardAminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.restaurante.reservasapp.repository.UsuarioRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardAminService {

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private MesaRepository mesaRepository;

@Autowired
private UsuarioRepository usuarioRepository;
    @Override
    public DashboardAdminResponse obtenerEstadisticasGenerales() {
        List<ReservaEntity> todasLasReservas = reservaRepository.findAll();
        List<MesaEntity> todasLasMesas = mesaRepository.findAll();

        // Contar reservas por estado
        long reservasConfirmadas = todasLasReservas.stream()
            .filter(r -> "CONFIRMADA".equalsIgnoreCase(r.getEstado()) || 
                (r.getEstado() == null && "CONFIRMADA".equals(determinarEstado(r.getFecha(), r.getHora()))))
            .count();
        long reservasPendientes = todasLasReservas.stream()
            .filter(r -> "PENDIENTE".equalsIgnoreCase(r.getEstado()))
            .count();

        // Calcular ocupancia
        long mesasDisponibles = todasLasMesas.stream()
            .filter(MesaEntity::isDisponible)
            .count();

        int ocupancia = todasLasMesas.isEmpty() ? 0 :
            (int) Math.round((100.0 * (todasLasMesas.size() - mesasDisponibles)) / (double) todasLasMesas.size());

        // Total de huéspedes
        int totalHuespedes = todasLasReservas.stream()
            .mapToInt(ReservaEntity::getNumeroPersonas)
            .sum();

        return DashboardAdminResponse.builder()
            .ocupanciaTotal(ocupancia)
            .totalHuespedes(totalHuespedes)
            .listaEsperaCount((int) reservasPendientes)
            .totalReservas(todasLasReservas.size())
            .reservasConfirmadas(reservasConfirmadas)
            .reservasPendientes(reservasPendientes)
            .mesasActivas((int) mesasDisponibles)
            .mesasTotales(todasLasMesas.size())
            .build();
    }

    @Override
    public List<ReservaParaDashboardAdminResponse> obtenerReservasRecientes(int pagina, int tamanoPagina) {
        return reservaRepository.findAll().stream()
            .sorted((r1, r2) -> r2.getId().compareTo(r1.getId()))
            .skip((long) pagina * tamanoPagina)
            .limit(tamanoPagina)
            .map(this::mapearReservaADashboard)
            .collect(Collectors.toList());
    }

    @Override
    public long contarReservasPorEstado(String estado) {
        // Adaptado a tu estructura sin campo estado
        return reservaRepository.findAll().size();
    }
    private String determinarEstado(String fecha, String hora) {
    try {
        java.time.LocalDateTime fechaHoraReserva = java.time.LocalDateTime.parse(
            fecha + "T" + hora
        );
        return fechaHoraReserva.isBefore(java.time.LocalDateTime.now()) 
            ? "COMPLETADA" 
            : "CONFIRMADA";
    } catch (Exception e) {
        return "CONFIRMADA";
    }
}
private ReservaParaDashboardAdminResponse mapearReservaADashboard(ReservaEntity reserva) {
    
    // ── Nombre del usuario ──
    String nombreHuesped = "Cliente desconocido";
    try {
        if (reserva.getUsuarioId() != null) {
            nombreHuesped = usuarioRepository.findById(reserva.getUsuarioId())
                .map(u -> ((u.getNombre() != null ? u.getNombre() : "") +
                           " " +
                           (u.getApellido() != null ? u.getApellido() : "")).trim())
                .orElse("Cliente");
        }
    } catch (Exception e) {
        nombreHuesped = "Cliente";
    }

    // ── Número de mesa ──
    String numeroMesa = "Sin asignar";
    try {
        if (reserva.getMesaId() != null) {
            numeroMesa = mesaRepository.findById(reserva.getMesaId())
                .map(m -> "Mesa " + m.getNumero() +
                          " (" + (m.getSector() != null ? m.getSector().replace("Mesa-", "") : "") + ")")
                .orElse("Mesa no encontrada");
        }
    } catch (Exception e) {
        numeroMesa = "Mesa no encontrada";
    }

    // ── Iniciales ──
    String iniciales = "??";
    try {
        String[] partes = nombreHuesped.split(" ");
        iniciales = partes.length >= 2
            ? (partes[0].substring(0, 1) + partes[partes.length - 1].substring(0, 1)).toUpperCase()
            : nombreHuesped.substring(0, Math.min(2, nombreHuesped.length())).toUpperCase();
    } catch (Exception e) {
        iniciales = "CL";
    }

    // ── Fecha y hora ──
    String fechaHora = ((reserva.getFecha() != null ? reserva.getFecha() : "") +
                        " " +
                        (reserva.getHora() != null ? reserva.getHora() : "")).trim();

    // ── Experiencia ──
    String experiencia = reserva.getExperiencia() != null
        ? reserva.getExperiencia().replace("Mesa-", "")
        : "Regular";

    // ── Correo del usuario ──
    String correoHuesped = "Sin correo";
    try {
        if (reserva.getUsuarioId() != null) {
            correoHuesped = usuarioRepository.findById(reserva.getUsuarioId())
                .map(UsuarioEntity::getCorreo)
                .orElse("Sin correo");
        }
    } catch (Exception e) {
        correoHuesped = "Sin correo";
    }

    // ── Estado ──
    String estadoFinal = reserva.getEstado() != null && !reserva.getEstado().isBlank()
        ? reserva.getEstado()
        : determinarEstado(reserva.getFecha(), reserva.getHora());

    return ReservaParaDashboardAdminResponse.builder()
        .id(reserva.getId())
        .nombreHuesped(nombreHuesped)
        .iniciales(iniciales)
        .fechaHora(fechaHora)
        .fecha(reserva.getFecha())
        .hora(reserva.getHora())
        .cantidadPersonas(reserva.getNumeroPersonas())
        .numeroMesa(numeroMesa)
        .estado(estadoFinal)
        .tipoEvento(experiencia)
        .correoHuesped(correoHuesped)
        .build();
}

 
}