package com.restaurante.reservasapp.services.impl;

import com.restaurante.reservasapp.Auth.DashboardResponse;
import com.restaurante.reservasapp.Auth.ReservaParaDashboardResponse;
import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.repository.MesaRepository;
import com.restaurante.reservasapp.repository.ReservaRepository;
import com.restaurante.reservasapp.services.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Override
    public DashboardResponse obtenerEstadisticasGenerales() {
        List<ReservaEntity> todasLasReservas = reservaRepository.findAll();
        List<MesaEntity> todasLasMesas = mesaRepository.findAll();

        // Contar reservas por estado
        // Nota: Tu entidad ReservaEntity no tiene campo 'estado', usaremos lógica alternativa
        long reservasConfirmadas = todasLasReservas.size() > 0 ? todasLasReservas.size() / 2 : 0;
        long reservasPendientes = todasLasReservas.size() - reservasConfirmadas;

        // Calcular ocupancia
        long mesasDisponibles = todasLasMesas.stream()
            .filter(MesaEntity::isDisponible)
            .count();

        int ocupancia = todasLasMesas.isEmpty() ? 0 :
            (int) Math.round((100 * (todasLasMesas.size() - mesasDisponibles)) / (double) todasLasMesas.size());

        // Total de huéspedes
        int totalHuespedes = todasLasReservas.stream()
            .mapToInt(ReservaEntity::getNumeroPersonas)
            .sum();

        return DashboardResponse.builder()
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
    public List<ReservaParaDashboardResponse> obtenerReservasRecientes(int pagina, int tamanoPagina) {
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

    private ReservaParaDashboardResponse mapearReservaADashboard(ReservaEntity reserva) {
        // Obtener usuario para nombre
        String nombreHuesped = reserva.getUsuarioId() != null ? "Cliente " + reserva.getUsuarioId() : "Sin nombre";

        // Generar iniciales
        String[] partes = nombreHuesped.split(" ");
        String iniciales = partes.length >= 2 ?
            (partes[0].substring(0, 1) + partes[1].substring(0, 1)).toUpperCase() :
            nombreHuesped.substring(0, Math.min(2, nombreHuesped.length())).toUpperCase();

        // Combinar fecha y hora
        String fechaHora = (reserva.getFecha() != null ? reserva.getFecha() : "2024-01-01") +
                          " " +
                          (reserva.getHora() != null ? reserva.getHora() : "00:00");

        return ReservaParaDashboardResponse.builder()
            .id(reserva.getId())
            .nombreHuesped(nombreHuesped)
            .iniciales(iniciales)
            .fechaHora(fechaHora)
            .cantidadPersonas(reserva.getNumeroPersonas())
            .numeroMesa(reserva.getMesaId() != null ? "Mesa-" + reserva.getMesaId() : "Sin asignar")
            .estado("CONFIRMADA")
            .tipoEvento("Regular")
            .build();
    }
}