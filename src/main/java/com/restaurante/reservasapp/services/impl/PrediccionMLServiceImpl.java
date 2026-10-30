package com.restaurante.reservasapp.services.impl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.dto.prediccion.PrediccionDemandaRequest;
import com.restaurante.reservasapp.dto.prediccion.PrediccionDemandaResponse;
import com.restaurante.reservasapp.dto.prediccion.PrediccionSlotDTO;
import com.restaurante.reservasapp.repository.MesaRepository;
import com.restaurante.reservasapp.repository.ReservaRepository;
import com.restaurante.reservasapp.services.PrediccionMLService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrediccionMLServiceImpl implements PrediccionMLService {

    private final ReservaRepository reservaRepository;
    private final MesaRepository mesaRepository;

    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate = new RestTemplateBuilder()
            .setConnectTimeout(Duration.ofSeconds(3))
            .setReadTimeout(Duration.ofSeconds(8))
            .build();

    @Override
    public PrediccionDemandaResponse predecirDemanda(PrediccionDemandaRequest request) {
        String fechaInicio = (request != null && request.getFechaInicio() != null && !request.getFechaInicio().isBlank())
                ? request.getFechaInicio().trim()
                : LocalDate.now().toString();

        String fechaFin = (request != null && request.getFechaFin() != null && !request.getFechaFin().isBlank())
                ? request.getFechaFin().trim()
                : fechaInicio;

        String turno = (request != null && request.getTurno() != null && !request.getTurno().isBlank())
                ? request.getTurno().trim().toUpperCase()
                : "COMPLETO";

        // 1. Capacidad física real desde MongoDB Atlas
        List<MesaEntity> todasLasMesas = mesaRepository.findAll();
        int totalMesas = todasLasMesas.size();
        int capacidadMaximaComensales = todasLasMesas.stream()
                .mapToInt(MesaEntity::getCapacidad)
                .sum();
        if (capacidadMaximaComensales <= 0) {
            capacidadMaximaComensales = Math.max(1, totalMesas * 4); // Fallback razonable
        }

        // 2. Consulta de reservas reales en MongoDB Atlas para el rango de fechas
        List<ReservaEntity> todasReservas = reservaRepository.findAll();
        List<ReservaEntity> reservasRango = todasReservas.stream()
                .filter(r -> r.getFecha() != null)
                .filter(r -> r.getFecha().compareTo(fechaInicio) >= 0 && r.getFecha().compareTo(fechaFin) <= 0)
                .filter(r -> r.getEstado() == null || !"CANCELADA".equalsIgnoreCase(r.getEstado()))
                .collect(Collectors.toList());

        // Mapear reservas reales por fecha y hora (ej: "2026-11-20_19" -> lista de reservas)
        Map<String, List<ReservaEntity>> reservasPorSlot = new HashMap<>();
        for (ReservaEntity r : reservasRango) {
            int horaInt = extraerHoraEntera(r.getHora());
            String key = r.getFecha() + "_" + horaInt;
            reservasPorSlot.computeIfAbsent(key, k -> new ArrayList<>()).add(r);
        }

        // 3. Llamar al microservicio de Python FastAPI
        FastApiRangoResponse fastApiResponse = consultarMicroservicioML(fechaInicio, fechaFin, turno);

        // 4. Integrar datos reales de MongoDB con predicciones ML
        List<PrediccionSlotDTO> series = new ArrayList<>();
        double totalComensalesEstimados = 0.0;
        int totalComensalesReales = 0;
        int totalReservasReales = 0;
        int mesasSugeridasPico = 0;

        if (fastApiResponse != null && fastApiResponse.getDetalles() != null && !fastApiResponse.getDetalles().isEmpty()) {
            for (FastApiSlotDetail d : fastApiResponse.getDetalles()) {
                String key = d.getFecha() + "_" + d.getFranjaHoraria();
                List<ReservaEntity> reservasSlot = reservasPorSlot.getOrDefault(key, Collections.emptyList());

                int comensalesRealesSlot = reservasSlot.stream().mapToInt(ReservaEntity::getNumeroPersonas).sum();
                int numReservasSlot = reservasSlot.size();

                double ocProy = Math.min(100.0, Math.round(((d.getComensalesEstimados() / (double) capacidadMaximaComensales) * 100.0) * 10.0) / 10.0);
                double ocReal = Math.min(100.0, Math.round(((comensalesRealesSlot / (double) capacidadMaximaComensales) * 100.0) * 10.0) / 10.0);

                String horaFmt = String.format("%02d:00", d.getFranjaHoraria());

                PrediccionSlotDTO slot = PrediccionSlotDTO.builder()
                        .fecha(d.getFecha())
                        .hora(horaFmt)
                        .franjaHoraria(d.getFranjaHoraria())
                        .comensalesEstimados(d.getComensalesEstimados())
                        .comensalesReales(comensalesRealesSlot)
                        .reservasRealesCount(numReservasSlot)
                        .mesasSugeridas(d.getMesasSugeridasPreparar())
                        .capacidadTotalMesas(totalMesas)
                        .capacidadTotalComensales(capacidadMaximaComensales)
                        .ocupacionProyectadaPorcentaje(ocProy)
                        .ocupacionRealPorcentaje(ocReal)
                        .build();

                series.add(slot);
                totalComensalesEstimados += d.getComensalesEstimados();
                totalComensalesReales += comensalesRealesSlot;
                totalReservasReales += numReservasSlot;
                if (d.getMesasSugeridasPreparar() > mesasSugeridasPico) {
                    mesasSugeridasPico = d.getMesasSugeridasPreparar();
                }
            }
        } else {
            // Fallback resiliente en caso de indisponibilidad temporal del microservicio
            log.warn("FastAPI no disponible, generando proyección estadística base con datos de MongoDB.");
            mesasSugeridasPico = generarFallbackSlots(fechaInicio, fechaFin, turno, reservasPorSlot, totalMesas, capacidadMaximaComensales, series);
            for (PrediccionSlotDTO s : series) {
                totalComensalesEstimados += s.getComensalesEstimados();
                totalComensalesReales += s.getComensalesReales();
                totalReservasReales += s.getReservasRealesCount();
            }
        }

        // 5. Cálculos globales y alertas
        int totalSlots = Math.max(1, series.size());
        double capacidadTotalAgregada = capacidadMaximaComensales * totalSlots;
        double ocupacionProyectadaGlobal = Math.min(100.0, Math.round(((totalComensalesEstimados / capacidadTotalAgregada) * 100.0) * 10.0) / 10.0);
        double ocupacionRealGlobal = Math.min(100.0, Math.round(((totalComensalesReales / capacidadTotalAgregada) * 100.0) * 10.0) / 10.0);

        String alerta;
        if (totalMesas > 0 && mesasSugeridasPico > totalMesas) {
            alerta = "ALERTA: Demanda proyectada (" + mesasSugeridasPico + " mesas) excede la capacidad del local (" + totalMesas + " mesas).";
        } else if (ocupacionProyectadaGlobal >= 75.0) {
            alerta = "ALTA OCUPACIÓN: Se proyecta más del 75% de ocupación. Sugerido preparar personal adicional.";
        } else {
            alerta = "CAPACIDAD ÓPTIMA: El restaurante cuenta con holgura suficiente para atender la demanda.";
        }

        return PrediccionDemandaResponse.builder()
                .fechaInicio(fechaInicio)
                .fechaFin(fechaFin)
                .turno(turno)
                .totalComensalesEstimados(Math.round(totalComensalesEstimados * 10.0) / 10.0)
                .totalComensalesReales(totalComensalesReales)
                .totalReservasReales(totalReservasReales)
                .mesasSugeridasPico(mesasSugeridasPico)
                .totalMesasRestaurante(totalMesas)
                .capacidadMaximaLocal(capacidadMaximaComensales)
                .ocupacionProyectadaGlobal(ocupacionProyectadaGlobal)
                .ocupacionRealGlobal(ocupacionRealGlobal)
                .alertaCapacidad(alerta)
                .series(series)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    private FastApiRangoResponse consultarMicroservicioML(String fechaInicio, String fechaFin, String turno) {
        try {
            String url = mlServiceUrl + "/predecir-rango";
            Map<String, String> payload = new HashMap<>();
            payload.put("fecha_inicio", fechaInicio);
            payload.put("fecha_fin", fechaFin);
            payload.put("turno", turno);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<FastApiRangoResponse> response = restTemplate.postForEntity(url, entity, FastApiRangoResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Fallo al contactar microservicio ML en {}: {}", mlServiceUrl, e.getMessage());
        }
        return null;
    }

    private int extraerHoraEntera(String horaStr) {
        if (horaStr == null || horaStr.isBlank()) return 12;
        try {
            String clean = horaStr.trim();
            if (clean.contains(":")) {
                clean = clean.split(":")[0];
            }
            return Integer.parseInt(clean);
        } catch (Exception e) {
            return 12;
        }
    }

    private int generarFallbackSlots(String fInicio, String fFin, String turno,
                                     Map<String, List<ReservaEntity>> reservasPorSlot,
                                     int totalMesas, int capacidadTotal, List<PrediccionSlotDTO> series) {
        List<Integer> franjas;
        if ("ALMUERZO".equalsIgnoreCase(turno)) {
            franjas = List.of(12, 13, 14, 15);
        } else if ("CENA".equalsIgnoreCase(turno)) {
            franjas = List.of(18, 19, 20, 21, 22);
        } else {
            franjas = List.of(11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22);
        }

        LocalDate d1 = LocalDate.parse(fInicio);
        LocalDate d2 = LocalDate.parse(fFin);
        int maxMesas = 0;

        for (LocalDate d = d1; !d.isAfter(d2); d = d.plusDays(1)) {
            String dStr = d.toString();
            boolean esFinde = d.getDayOfWeek().getValue() >= 5;
            for (int h : franjas) {
                String key = dStr + "_" + h;
                List<ReservaEntity> reservasSlot = reservasPorSlot.getOrDefault(key, Collections.emptyList());
                int comReales = reservasSlot.stream().mapToInt(ReservaEntity::getNumeroPersonas).sum();

                double base = esFinde ? 15.0 : 8.0;
                double estimado = Math.max(comReales, base + (h >= 19 ? 6.0 : 2.0));
                int mesas = (int) Math.ceil((estimado * 1.10) / 3.5);
                if (mesas > maxMesas) maxMesas = mesas;

                series.add(PrediccionSlotDTO.builder()
                        .fecha(dStr)
                        .hora(String.format("%02d:00", h))
                        .franjaHoraria(h)
                        .comensalesEstimados(estimado)
                        .comensalesReales(comReales)
                        .reservasRealesCount(reservasSlot.size())
                        .mesasSugeridas(mesas)
                        .capacidadTotalMesas(totalMesas)
                        .capacidadTotalComensales(capacidadTotal)
                        .ocupacionProyectadaPorcentaje(Math.min(100.0, (estimado / capacidadTotal) * 100))
                        .ocupacionRealPorcentaje(Math.min(100.0, (comReales / (double) capacidadTotal) * 100))
                        .build());
            }
        }
        return maxMesas;
    }

    // DTOs internos para mapear la respuesta de FastAPI
    @Data
    public static class FastApiRangoResponse {
        @JsonProperty("fecha_inicio")
        private String fechaInicio;
        @JsonProperty("fecha_fin")
        private String fechaFin;
        private String turno;
        @JsonProperty("total_comensales_estimados")
        private double totalComensalesEstimados;
        @JsonProperty("mesas_sugeridas_pico")
        private int mesasSugeridasPico;
        private List<FastApiSlotDetail> detalles;
    }

    @Data
    public static class FastApiSlotDetail {
        private String fecha;
        @JsonProperty("franja_horaria")
        private int franjaHoraria;
        @JsonProperty("comensales_estimados")
        private double comensalesEstimados;
        @JsonProperty("mesas_sugeridas_preparar")
        private int mesasSugeridasPreparar;
        @JsonProperty("es_fin_de_semana")
        private int esFinDeSemana;
    }
}

