package com.restaurante.reservasapp.services.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.Entity.PlatoEntity;
import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.repository.MesaRepository;
import com.restaurante.reservasapp.repository.PlatoRepository;
import com.restaurante.reservasapp.repository.ReservaRepository;
import com.restaurante.reservasapp.services.ReservaService;

@Service
public class ReservaServiceImpl implements ReservaService {

    @Autowired
    private ReservaRepository reservaRepo;

    @Autowired
    private MesaRepository mesaRepo;

    @Autowired
    private PlatoRepository platoRepo;

    @Override
    @Transactional
    public ReservaEntity guardarReserva(ReservaEntity reserva) {

        if (reserva.getPlatos() == null) {
            reserva.setPlatos(List.of());
        }

        Set<String> platosUnicos = new HashSet<>();
        for (String platoId : reserva.getPlatos()) {
            if (platoId == null || platoId.isBlank() || !platosUnicos.add(platoId)) {
                throw new RuntimeException("La selección de platos no es válida.");
            }

            PlatoEntity plato = platoRepo.findById(platoId).orElse(null);
            if (plato == null || !plato.isDisponible()) {
                throw new RuntimeException("Uno de los platos seleccionados ya no está disponible.");
            }
        }

        LocalDate hoy = LocalDate.now();
        LocalDate fechaNueva = parsearFecha(reserva.getFecha());

        if (fechaNueva != null) {
            if (fechaNueva.isBefore(hoy)) {
                throw new RuntimeException("No se pueden realizar reservas para fechas pasadas.");
            }
            if (fechaNueva.isEqual(hoy)) {
                LocalTime horaNueva = parsearHora(reserva.getHora());
                if (horaNueva != null && horaNueva.isBefore(LocalTime.now())) {
                    throw new RuntimeException("La hora seleccionada para el día de hoy ya ha pasado.");
                }
            }
        }

        // ── REGISTRO DE FECHA DE CREACIÓN ──
        if (reserva.getFechaCreacion() == null || reserva.getFechaCreacion().isBlank()) {
            reserva.setFechaCreacion(LocalDateTime.now().toString());
        }

        String sectorBuscado = reserva.getMesaId();
        int cantidadInvitados = reserva.getNumeroPersonas();

        List<ReservaEntity> todasLasReservasDelUsuario = reservaRepo
                .findByUsuarioId(reserva.getUsuarioId());

        // ── REGLA 1: Evitar reservas activas en conflicto de horario para la misma
        // fecha ──
        LocalTime horaSolicitada = LocalTime.parse(reserva.getHora());
        LocalTime limiteInferior = horaSolicitada.minusHours(2).plusMinutes(1);
        LocalTime limiteSuperior = horaSolicitada.plusHours(2).minusMinutes(1);

        boolean conflictoMismoDia = todasLasReservasDelUsuario.stream()
                .filter(this::esReservaActiva)
                .filter(r -> r.getFecha() != null && r.getFecha().equals(reserva.getFecha()))
                .anyMatch(r -> {
                    LocalTime hExistente = parsearHora(r.getHora());
                    return hExistente != null && hExistente.isAfter(limiteInferior)
                            && hExistente.isBefore(limiteSuperior);
                });

        if (conflictoMismoDia) {
            throw new RuntimeException(
                    "Ya tienes una reserva activa el " + reserva.getFecha() +
                            " en un horario cercano. Se requiere un intervalo mínimo de 2 horas entre tus reservas.");
        }

        // ── REGLA 2: Límite de máximo 3 reservas cuando sea después del día de hoy ──
        if (fechaNueva != null && fechaNueva.isAfter(hoy)) {
            long reservasDespuesDeHoy = todasLasReservasDelUsuario.stream()
                    .filter(this::esReservaDespuesDeHoy)
                    .count();

            if (reservasDespuesDeHoy >= 3) {
                throw new RuntimeException(
                        "Has alcanzado el límite de 3 reservas a futuro. " +
                                "Cancela una reserva existente para hacer una nueva.");
            }
        }

        // ── REGLA 3: Buscar mesas del sector que soporten la cantidad de personas
        // (Best-Fit) ──
        List<MesaEntity> mesasAptasDelSector = mesaRepo.findAll().stream()
                .filter(m -> m.getSector() != null && m.getSector().equalsIgnoreCase(sectorBuscado))
                .filter(m -> m.getCapacidad() >= cantidadInvitados)
                .filter(MesaEntity::isDisponible)
                .sorted(Comparator.comparingInt(MesaEntity::getCapacidad))
                .collect(Collectors.toList());

        if (mesasAptasDelSector.isEmpty()) {
            throw new RuntimeException(
                    "No hay mesas en el sector " + sectorBuscado +
                            " con capacidad para " + cantidadInvitados + " personas.");
        }

        // ── REGLA 4: Buscar mesa libre en esa fecha con bloqueo de ±2 horas ──
        List<ReservaEntity> reservasDelDia = reservaRepo.findAll().stream()
                .filter(r -> r.getFecha() != null && r.getFecha().equals(reserva.getFecha()))
                .filter(this::reservaBloqueaMesa)
                .collect(Collectors.toList());

        MesaEntity mesaAsignada = null;

        for (MesaEntity mesa : mesasAptasDelSector) {
            boolean tieneConflicto = false;

            for (ReservaEntity resExistente : reservasDelDia) {
                if (resExistente.getMesaId() != null &&
                        resExistente.getMesaId().equals(mesa.getId())) {
                    LocalTime horaExistente = LocalTime.parse(resExistente.getHora());
                    if (horaExistente.isAfter(limiteInferior) &&
                            horaExistente.isBefore(limiteSuperior)) {
                        tieneConflicto = true;
                        break;
                    }
                }
            }

            if (!tieneConflicto) {
                mesaAsignada = mesa;
                break;
            }
        }

        if (mesaAsignada == null) {
            throw new RuntimeException(
                    "No hay mesas disponibles en el sector " + sectorBuscado +
                            " para la fecha y hora seleccionada. Intenta otra hora.");
        }

        // ── ASIGNAR mesa y experiencia ──
        reserva.setMesaId(mesaAsignada.getId());
        reserva.setExperiencia(sectorBuscado);
        if (reserva.getEstado() == null || reserva.getEstado().isBlank()) {
            reserva.setEstado("PENDIENTE");
        }

        return reservaRepo.save(reserva);
    }

    @Override
    public List<String> obtenerHorasCompletamenteOcupadas(String fecha, String sector, int invitados) {
        String[] todosLosTurnos = {
                "10:00", "11:00", "12:00", "13:00", "14:00",
                "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
        };

        LocalDate hoy = LocalDate.now();
        LocalDate fechaConsultada = parsearFecha(fecha);
        boolean esPasado = (fechaConsultada != null && fechaConsultada.isBefore(hoy));
        boolean esHoy = (fechaConsultada != null && fechaConsultada.isEqual(hoy));

        if (esPasado) {
            return java.util.Arrays.asList(todosLosTurnos);
        }

        List<String> horasBloqueadas = new java.util.ArrayList<>();

        List<MesaEntity> mesasAptas = mesaRepo.findAll().stream()
                .filter(m -> m.getSector() != null && m.getSector().equalsIgnoreCase(sector))
                .filter(m -> m.getCapacidad() >= invitados)
                .filter(MesaEntity::isDisponible)
                .collect(Collectors.toList());

        if (mesasAptas.isEmpty()) {
            return java.util.Arrays.asList(todosLosTurnos);
        }

        List<ReservaEntity> reservasDelDia = reservaRepo.findAll().stream()
                .filter(r -> r.getFecha() != null && r.getFecha().equals(fecha))
                .filter(this::reservaBloqueaMesa)
                .collect(Collectors.toList());

        LocalTime horaActual = LocalTime.now();

        for (String turno : todosLosTurnos) {
            LocalTime horaEvaluar = LocalTime.parse(turno);

            // Si es el mismo día y la hora ya ha transcurrido, bloquear el turno
            // inmediatamente
            if (esHoy && horaEvaluar.isBefore(horaActual)) {
                horasBloqueadas.add(turno);
                continue;
            }

            LocalTime limiteInferior = horaEvaluar.minusHours(2).plusMinutes(1);
            LocalTime limiteSuperior = horaEvaluar.plusHours(2).minusMinutes(1);

            boolean existeAlMenosUnaMesaLibre = false;

            for (MesaEntity mesa : mesasAptas) {
                boolean mesaOcupada = false;
                for (ReservaEntity res : reservasDelDia) {
                    if (res.getMesaId() != null && res.getMesaId().equals(mesa.getId())) {
                        LocalTime horaExistente = LocalTime.parse(res.getHora());
                        if (horaExistente.isAfter(limiteInferior) &&
                                horaExistente.isBefore(limiteSuperior)) {
                            mesaOcupada = true;
                            break;
                        }
                    }
                }
                if (!mesaOcupada) {
                    existeAlMenosUnaMesaLibre = true;
                    break;
                }
            }

            if (!existeAlMenosUnaMesaLibre) {
                horasBloqueadas.add(turno);
            }
        }

        return horasBloqueadas;
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
    public void cancelarReserva(String id) {
        if (id == null || id.isBlank())
            return;
        ReservaEntity reserva = reservaRepo.findById(id).orElse(null);
        if (reserva != null) {
            reserva.setEstado("CANCELADA");
            reservaRepo.save(reserva);
        }
    }

    @Override
    @Transactional
    public void eliminarReserva(String id) {
        // 🔥 CANCELACIÓN LÓGICA: En lugar de borrar de MongoDB, marcamos como CANCELADA
        // para liberar la mesa pero preservar la data histórica para Machine Learning y
        // auditoría.
        cancelarReserva(id);
    }

    @Override
    public List<ReservaEntity> listarReservas() {
        return reservaRepo.findAll();
    }

    @Override
    @Transactional
    public ReservaEntity guardarReservaDirecta(ReservaEntity reserva) {
        return reservaRepo.save(reserva);
    }

    private LocalDate parsearFecha(String fechaStr) {
        if (fechaStr == null || fechaStr.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(fechaStr.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private LocalTime parsearHora(String horaStr) {
        if (horaStr == null || horaStr.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(horaStr.trim());
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Determina si una reserva bloquea una mesa física en un horario determinado.
     * Gestiona también la expiración de reservas en estado PENDIENTE no confirmadas
     * (mesas fantasma).
     */
    private boolean reservaBloqueaMesa(ReservaEntity r) {
        if (r == null)
            return false;

        String estado = r.getEstado();
        if (estado != null) {
            String est = estado.trim().toUpperCase();
            if ("CANCELADA".equals(est) || "COMPLETADA".equals(est) || "EXPIRADA".equals(est)) {
                return false;
            }
        }

        LocalDate fecha = parsearFecha(r.getFecha());
        if (fecha == null)
            return false;

        LocalDate hoy = LocalDate.now();
        if (fecha.isBefore(hoy)) {
            return false;
        }

        if (fecha.isEqual(hoy)) {
            LocalTime hora = parsearHora(r.getHora());
            if (hora != null && hora.isBefore(LocalTime.now())) {
                return false;
            }
        }

        // 🔥 CONTROL DE MESAS FANTASMA PARA RESERVAS EN ESTADO PENDIENTE
        if (estado != null && "PENDIENTE".equalsIgnoreCase(estado.trim())) {
            if (haExpiradoPendiente(r)) {
                r.setEstado("CANCELADA");
                try {
                    reservaRepo.save(r);
                } catch (Exception ignored) {
                }
                return false;
            }
        }

        return true;
    }

    /**
     * Evalúa si una reserva PENDIENTE ya superó su tiempo límite de confirmación:
     * 1. Si pasaron más de 2 horas desde su creación sin confirmarse.
     * 2. Si la reserva es para hoy y faltan menos de 30 minutos para la hora reservada.
     */
    private boolean haExpiradoPendiente(ReservaEntity r) {
        if (r.getFechaCreacion() != null && !r.getFechaCreacion().isBlank()) {
            try {
                LocalDateTime creado = LocalDateTime.parse(r.getFechaCreacion().trim());
                if (LocalDateTime.now().isAfter(creado.plusHours(2))) {
                    return true;
                }
            } catch (Exception ignored) {}
        }

        LocalDate fecha = parsearFecha(r.getFecha());
        LocalTime hora = parsearHora(r.getHora());
        if (fecha != null && hora != null && fecha.isEqual(LocalDate.now())) {
            LocalTime limiteHoy = hora.minusMinutes(30);
            if (LocalTime.now().isAfter(limiteHoy)) {
                return true;
            }
        }

        return false;
    }

    private boolean esReservaActiva(ReservaEntity r) {
        return reservaBloqueaMesa(r);
    }

    private boolean esReservaDespuesDeHoy(ReservaEntity r) {
        if (!esReservaActiva(r)) {
            return false;
        }
        LocalDate fecha = parsearFecha(r.getFecha());
        return fecha != null && fecha.isAfter(LocalDate.now());
    }
}