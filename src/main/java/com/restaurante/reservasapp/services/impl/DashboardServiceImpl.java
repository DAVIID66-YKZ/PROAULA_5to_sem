package com.restaurante.reservasapp.services.impl;

import com.restaurante.reservasapp.Auth.DashboardAdminResponse;
import com.restaurante.reservasapp.Auth.ReservaParaDashboardAdminResponse;
import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.repository.MesaRepository;
import com.restaurante.reservasapp.repository.ReservaRepository;
import com.restaurante.reservasapp.repository.UsuarioRepository;
import com.restaurante.reservasapp.services.DashboardAminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardAminService {

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public String resolverEstado(ReservaEntity r) {
        if (r.getEstado() != null && !r.getEstado().isBlank()) {
            return r.getEstado().trim().toUpperCase();
        }
        if (r.getId() != null && r.getId().startsWith("RES")) {
            return determinarEstado(r.getFecha(), r.getHora());
        }
        return "PENDIENTE";
    }

    @Override
    public DashboardAdminResponse obtenerEstadisticasGenerales() {
        List<ReservaEntity> todasLasReservas = reservaRepository.findAll();
        List<MesaEntity> todasLasMesas = mesaRepository.findAll();

        // Contar reservas por estado resuelto
        long reservasConfirmadas = todasLasReservas.stream()
            .filter(r -> "CONFIRMADA".equalsIgnoreCase(resolverEstado(r)))
            .count();
        long reservasPendientes = todasLasReservas.stream()
            .filter(r -> "PENDIENTE".equalsIgnoreCase(resolverEstado(r)))
            .count();
        long reservasArrivadas = todasLasReservas.stream()
            .filter(r -> "LLEGADA".equalsIgnoreCase(resolverEstado(r)))
            .count();

        // Cálculo dinámico de ocupación:
        // Mesas ocupadas = mesas marcadas como no disponibles por admin
        // + mesas con reservas activas (CONFIRMADA, PENDIENTE, LLEGADA) para hoy o vigentes
        String fechaHoyStr = LocalDate.now().toString();
        Set<String> mesasOcupadasIds = new HashSet<>();

        for (MesaEntity m : todasLasMesas) {
            if (!m.isDisponible()) {
                mesasOcupadasIds.add(m.getId());
            }
        }

        for (ReservaEntity r : todasLasReservas) {
            String est = resolverEstado(r);
            if ("CONFIRMADA".equalsIgnoreCase(est) || "PENDIENTE".equalsIgnoreCase(est) || "LLEGADA".equalsIgnoreCase(est)) {
                if (r.getMesaId() != null && !r.getMesaId().isBlank()) {
                    boolean esHoy = fechaHoyStr.equals(r.getFecha());
                    boolean esVigente = r.getFecha() != null && r.getFecha().compareTo(fechaHoyStr) >= 0;
                    if (esHoy || esVigente) {
                        mesasOcupadasIds.add(r.getMesaId());
                    }
                }
            }
        }

        int totalMesas = todasLasMesas.size();
        int mesasOcupadas = Math.min(totalMesas, mesasOcupadasIds.size());
        int ocupancia = totalMesas > 0 ? (int) Math.round((100.0 * mesasOcupadas) / (double) totalMesas) : 0;
        int mesasActivas = Math.max(0, totalMesas - mesasOcupadas);

        // Total de huéspedes acumulados
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
            .reservasArrivadas(reservasArrivadas)
            .mesasActivas(mesasActivas)
            .mesasTotales(totalMesas)
            .build();
    }

    @Override
    public List<ReservaParaDashboardAdminResponse> obtenerReservasRecientes(int pagina, int tamanoPagina) {
        Comparator<ReservaEntity> comparadorRecientes = (r1, r2) -> {
            boolean r1IsRes = r1.getId() != null && r1.getId().startsWith("RES");
            boolean r2IsRes = r2.getId() != null && r2.getId().startsWith("RES");
            if (!r1IsRes && r2IsRes) return -1;
            if (r1IsRes && !r2IsRes) return 1;
            String id1 = r1.getId() != null ? r1.getId() : "";
            String id2 = r2.getId() != null ? r2.getId() : "";
            return id2.compareTo(id1);
        };

        return reservaRepository.findAll().stream()
            .sorted(comparadorRecientes)
            .skip((long) pagina * tamanoPagina)
            .limit(tamanoPagina)
            .map(this::mapearReservaADashboard)
            .collect(Collectors.toList());
    }

    @Override
    public long contarReservasPorEstado(String estado) {
        if (estado == null || estado.isBlank()) {
            return reservaRepository.count();
        }
        return reservaRepository.findAll().stream()
            .filter(r -> estado.equalsIgnoreCase(resolverEstado(r)))
            .count();
    }

    private String determinarEstado(String fecha, String hora) {
        try {
            LocalDateTime fechaHoraReserva = LocalDateTime.parse(fecha + "T" + hora);
            return fechaHoraReserva.isBefore(LocalDateTime.now()) 
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
        String iniciales = "CL";
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

        // ── Estado resuelto ──
        String estadoFinal = resolverEstado(reserva);

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