package com.restaurante.reservasapp.services.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.ArrayList;
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

    // 🔥 PREVENCIÓN DE CONDICIÓN DE CARRERA (Race Condition): Cerrojo justo con
    // fairness para atomizar
    // la evaluación de disponibilidad y asignación de mesas en peticiones
    // concurrentes.
    private final java.util.concurrent.locks.ReentrantLock reservaLock = new java.util.concurrent.locks.ReentrantLock(
            true);

    @Override
    @Transactional
    public ReservaEntity guardarReserva(ReservaEntity reserva) {
        reservaLock.lock();
        try {
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

            // 🔥 DESACOPLAMIENTO SECTOR / MESA: Prioriza 'experiencia' sobre 'mesaId' si
            // este último fue usado como sector
            String sectorBuscado = (reserva.getExperiencia() != null && !reserva.getExperiencia().isBlank())
                    ? reserva.getExperiencia().trim()
                    : (reserva.getMesaId() != null && !reserva.getMesaId().isBlank() ? reserva.getMesaId().trim()
                            : "Mesa-Estandar");

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

            // ── ASIGNAR ID real de mesa física, experiencia y estado inicial PENDIENTE ──
            reserva.setMesaId(mesaAsignada.getId());
            reserva.setExperiencia(sectorBuscado);
            reserva.setEstado("PENDIENTE");

            return reservaRepo.save(reserva);
        } finally {
            reservaLock.unlock();
        }
    }

    @Override
    public List<String> obtenerHorasCompletamenteOcupadas(String fecha, String sector, int invitados) {
        String[] todosLosTurnos = {
                "10:00", "11:00", "12:00", "13:00", "14:00",
                "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
        };

        String sectorConsultado = (sector != null && !sector.isBlank()) ? sector.trim() : "Mesa-Estandar";

        LocalDate hoy = LocalDate.now();
        LocalDate fechaConsultada = parsearFecha(fecha);
        boolean esPasado = (fechaConsultada != null && fechaConsultada.isBefore(hoy));
        boolean esHoy = (fechaConsultada != null && fechaConsultada.isEqual(hoy));

        if (esPasado) {
            return java.util.Arrays.asList(todosLosTurnos);
        }

        List<String> horasBloqueadas = new java.util.ArrayList<>();

        // 🔥 BEST-FIT en cálculo de disponibilidad horaria
        List<MesaEntity> mesasAptas = mesaRepo.findAll().stream()
                .filter(m -> m.getSector() != null && m.getSector().equalsIgnoreCase(sectorConsultado))
                .filter(m -> m.getCapacidad() >= invitados)
                .filter(MesaEntity::isDisponible)
                .sorted(Comparator.comparingInt(MesaEntity::getCapacidad))
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
    @Transactional
    public ReservaEntity reprogramarReserva(String id, ReservaEntity datosNuevos) {
        reservaLock.lock();
        try {
            ReservaEntity reservaExistente = reservaRepo.findById(id).orElse(null);
            if (reservaExistente == null) {
                throw new RuntimeException("La reserva no fue encontrada.");
            }

            String estadoActual = String.valueOf(reservaExistente.getEstado()).toUpperCase();
            if ("CANCELADA".equals(estadoActual)) {
                throw new RuntimeException("No se puede reprogramar una reserva que ya ha sido cancelada.");
            }

            LocalDate hoy = LocalDate.now();
            LocalDate fechaOriginal = parsearFecha(reservaExistente.getFecha());
            LocalTime horaOriginal = parsearHora(reservaExistente.getHora());
            if (fechaOriginal != null && (fechaOriginal.isBefore(hoy)
                    || (fechaOriginal.isEqual(hoy) && horaOriginal != null
                            && horaOriginal.isBefore(LocalTime.now())))) {
                throw new RuntimeException("No es posible reprogramar una reserva para una velada pasada.");
            }

            // Validar nueva fecha y hora
            LocalDate fechaNueva = parsearFecha(datosNuevos.getFecha());
            if (fechaNueva == null) {
                throw new RuntimeException("La fecha indicada no es válida.");
            }
            if (fechaNueva.isBefore(hoy)) {
                throw new RuntimeException("No se pueden seleccionar fechas pasadas.");
            }

            LocalTime horaNueva = parsearHora(datosNuevos.getHora());
            if (horaNueva == null) {
                throw new RuntimeException("La hora indicada no es válida.");
            }
            if (fechaNueva.isEqual(hoy) && horaNueva.isBefore(LocalTime.now())) {
                throw new RuntimeException("La hora seleccionada para el día de hoy ya ha pasado.");
            }

            int nuevosInvitados = datosNuevos.getNumeroPersonas() > 0 ? datosNuevos.getNumeroPersonas()
                    : reservaExistente.getNumeroPersonas();
            if (nuevosInvitados < 1 || nuevosInvitados > 12) {
                throw new RuntimeException("Nuestras mesas están dispuestas para grupos de 1 a 12 comensales.");
            }

            String sectorTemp = (datosNuevos.getExperiencia() != null && !datosNuevos.getExperiencia().isBlank())
                    ? datosNuevos.getExperiencia().trim()
                    : ((datosNuevos.getMesaId() != null && !datosNuevos.getMesaId().isBlank()
                            && datosNuevos.getMesaId().startsWith("Mesa-"))
                                    ? datosNuevos.getMesaId().trim()
                                    : reservaExistente.getExperiencia());

            final String sectorBuscado = (sectorTemp == null || sectorTemp.isBlank()) ? "Mesa-Estandar" : sectorTemp;

            // Validar que el usuario no tenga otra reserva en conflicto en esa fecha y
            // horario (excluyendo esta misma)
            LocalTime limiteInferior = horaNueva.minusHours(2).plusMinutes(1);
            LocalTime limiteSuperior = horaNueva.plusHours(2).minusMinutes(1);

            List<ReservaEntity> reservasUsuario = reservaRepo.findByUsuarioId(reservaExistente.getUsuarioId());
            boolean conflictoMismoDia = reservasUsuario.stream()
                    .filter(r -> r.getId() != null && !r.getId().equals(id))
                    .filter(this::esReservaActiva)
                    .filter(r -> r.getFecha() != null && r.getFecha().equals(datosNuevos.getFecha()))
                    .anyMatch(r -> {
                        LocalTime hExistente = parsearHora(r.getHora());
                        return hExistente != null && hExistente.isAfter(limiteInferior)
                                && hExistente.isBefore(limiteSuperior);
                    });

            if (conflictoMismoDia) {
                throw new RuntimeException(
                        "Ya tienes otra reserva activa para esa fecha en un horario cercano. Debe haber al menos 2 horas de diferencia.");
            }

            // Buscar mesas aptas en el sector con capacidad adecuada ordenadas por Best-Fit
            List<MesaEntity> mesasAptasDelSector = mesaRepo.findAll().stream()
                    .filter(m -> m.getSector() != null && m.getSector().equalsIgnoreCase(sectorBuscado))
                    .filter(m -> m.getCapacidad() >= nuevosInvitados)
                    .filter(MesaEntity::isDisponible)
                    .sorted(Comparator.comparingInt(MesaEntity::getCapacidad))
                    .collect(Collectors.toList());

            if (mesasAptasDelSector.isEmpty()) {
                throw new RuntimeException("No hay mesas en el sector " + sectorBuscado + " con capacidad para "
                        + nuevosInvitados + " personas.");
            }

            // Reservas del día consultado (excluyendo la reserva que se está reprogramando)
            List<ReservaEntity> reservasDelDia = reservaRepo.findAll().stream()
                    .filter(r -> r.getId() != null && !r.getId().equals(id))
                    .filter(r -> r.getFecha() != null && r.getFecha().equals(datosNuevos.getFecha()))
                    .filter(this::reservaBloqueaMesa)
                    .collect(Collectors.toList());

            MesaEntity mesaAsignada = null;
            for (MesaEntity mesa : mesasAptasDelSector) {
                boolean tieneConflicto = false;
                for (ReservaEntity resExistente : reservasDelDia) {
                    if (resExistente.getMesaId() != null && resExistente.getMesaId().equals(mesa.getId())) {
                        LocalTime horaExistente = parsearHora(resExistente.getHora());
                        if (horaExistente != null && horaExistente.isAfter(limiteInferior)
                                && horaExistente.isBefore(limiteSuperior)) {
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
                throw new RuntimeException("No hay mesas disponibles en el sector " + sectorBuscado
                        + " para la nueva fecha y hora. Por favor intenta otro turno.");
            }

            // Preservar platos preordenados, usuario, comentarios y asignar nuevos datos y
            // mesa
            reservaExistente.setFecha(datosNuevos.getFecha());
            reservaExistente.setHora(datosNuevos.getHora());
            reservaExistente.setNumeroPersonas(nuevosInvitados);
            reservaExistente.setExperiencia(sectorBuscado);
            reservaExistente.setMesaId(mesaAsignada.getId());

            return reservaRepo.save(reservaExistente);
        } finally {
            reservaLock.unlock();
        }
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

    @Override
    @Transactional
    public ReservaEntity actualizarPlatosReserva(String id, List<String> nuevosPlatos) {
        reservaLock.lock();
        try {
            ReservaEntity reserva = reservaRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + id));

            String estado = reserva.getEstado() != null ? reserva.getEstado().toUpperCase().trim() : "PENDIENTE";
            if ("CANCELADA".equals(estado) || "COMPLETADA".equals(estado)) {
                throw new RuntimeException(
                        "No se pueden modificar los platos de una reserva " + estado.toLowerCase() + ".");
            }

            LocalDate fecha = parsearFecha(reserva.getFecha());
            LocalTime hora = parsearHora(reserva.getHora());
            if (fecha == null || hora == null) {
                throw new RuntimeException(
                        "La reserva no cuenta con una fecha u hora válida para verificar los tiempos.");
            }

            LocalDateTime fechaHoraReserva = LocalDateTime.of(fecha, hora);
            LocalDateTime ahora = LocalDateTime.now();

            if (ahora.isAfter(fechaHoraReserva)) {
                throw new RuntimeException(
                        "No se pueden modificar los platos de una reserva cuya fecha u hora ya ha pasado.");
            }

            LocalDateTime limiteDosHoras = fechaHoraReserva.minusHours(2);
            if (ahora.isAfter(limiteDosHoras)) {
                throw new RuntimeException(
                        "Los platos sólo pueden modificarse con al menos 2 horas de anticipación a la velada reservada (la cocina inicia preparativos).");
            }

            List<String> listaFinalPlatos = new ArrayList<>();
            if (nuevosPlatos != null && !nuevosPlatos.isEmpty()) {
                Set<String> platosUnicos = new HashSet<>();
                for (String platoId : nuevosPlatos) {
                    if (platoId == null || platoId.isBlank() || !platosUnicos.add(platoId.trim())) {
                        throw new RuntimeException("La selección de platos contiene elementos duplicados o inválidos.");
                    }
                    PlatoEntity plato = platoRepo.findById(platoId.trim()).orElse(null);
                    if (plato == null || !plato.isDisponible()) {
                        throw new RuntimeException("El plato seleccionado ("
                                + (plato != null ? plato.getNombre() : platoId) + ") no se encuentra disponible.");
                    }
                    listaFinalPlatos.add(platoId.trim());
                }
            }

            reserva.setPlatos(listaFinalPlatos);
            return reservaRepo.save(reserva);
        } finally {
            reservaLock.unlock();
        }
    }

    @Override
    @Transactional
    public ReservaEntity confirmarReserva(String id) {
        reservaLock.lock();
        try {
            ReservaEntity reserva = reservaRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + id));

            String estado = reserva.getEstado() != null ? reserva.getEstado().toUpperCase().trim() : "PENDIENTE";
            if ("CONFIRMADA".equals(estado)) {
                return reserva;
            }
            if ("CANCELADA".equals(estado) || "COMPLETADA".equals(estado)) {
                throw new RuntimeException("No se puede confirmar una reserva que se encuentra " + estado.toLowerCase() + ".");
            }

            LocalDate fecha = parsearFecha(reserva.getFecha());
            LocalTime hora = parsearHora(reserva.getHora());
            if (fecha == null || hora == null) {
                throw new RuntimeException("La reserva no cuenta con una fecha u hora válida para confirmar.");
            }

            LocalDate hoy = LocalDate.now();
            if (fecha.isBefore(hoy) || (fecha.isEqual(hoy) && hora.isBefore(LocalTime.now()))) {
                throw new RuntimeException("No se puede confirmar una reserva cuya fecha u hora ya ha pasado.");
            }

            String sectorBuscado = (reserva.getExperiencia() != null && !reserva.getExperiencia().isBlank())
                    ? reserva.getExperiencia().trim()
                    : "Mesa-Estandar";

            List<MesaEntity> mesasAptasDelSector = mesaRepo.findAll().stream()
                    .filter(m -> m.getSector() != null && m.getSector().equalsIgnoreCase(sectorBuscado))
                    .filter(m -> m.getCapacidad() >= reserva.getNumeroPersonas())
                    .filter(MesaEntity::isDisponible)
                    .sorted(Comparator.comparingInt(MesaEntity::getCapacidad))
                    .collect(Collectors.toList());

            if (mesasAptasDelSector.isEmpty()) {
                throw new RuntimeException("No hay mesas en el sector " + sectorBuscado + " con capacidad suficiente.");
            }

            LocalTime limiteInferior = hora.minusHours(2).plusMinutes(1);
            LocalTime limiteSuperior = hora.plusHours(2).minusMinutes(1);

            List<ReservaEntity> reservasDelDia = reservaRepo.findAll().stream()
                    .filter(r -> r.getId() != null && !r.getId().equals(id))
                    .filter(r -> r.getFecha() != null && r.getFecha().equals(reserva.getFecha()))
                    .filter(this::reservaBloqueaMesa)
                    .collect(Collectors.toList());

            MesaEntity mesaAsignada = null;

            // Conservar mesa si sigue disponible
            if (reserva.getMesaId() != null && !reserva.getMesaId().isBlank()) {
                boolean mesaPreviaLibre = mesasAptasDelSector.stream().anyMatch(m -> m.getId().equals(reserva.getMesaId()))
                        && reservasDelDia.stream().noneMatch(r -> {
                            if (r.getMesaId() != null && r.getMesaId().equals(reserva.getMesaId())) {
                                LocalTime h = parsearHora(r.getHora());
                                return h != null && h.isAfter(limiteInferior) && h.isBefore(limiteSuperior);
                            }
                            return false;
                        });
                if (mesaPreviaLibre) {
                    mesaAsignada = mesaRepo.findById(reserva.getMesaId()).orElse(null);
                }
            }

            // Si la mesa previa está ocupada, buscar otra mesa disponible en el sector (Best-Fit)
            if (mesaAsignada == null) {
                for (MesaEntity mesa : mesasAptasDelSector) {
                    boolean tieneConflicto = false;
                    for (ReservaEntity rConf : reservasDelDia) {
                        if (rConf.getMesaId() != null && rConf.getMesaId().equals(mesa.getId())) {
                            LocalTime h = parsearHora(rConf.getHora());
                            if (h != null && h.isAfter(limiteInferior) && h.isBefore(limiteSuperior)) {
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
            }

            if (mesaAsignada == null) {
                throw new RuntimeException("Lo sentimos, no hay mesas disponibles en el sector " + sectorBuscado
                        + " para el turno de las " + reserva.getHora() + ". Por favor reprograma para otro horario.");
            }

            reserva.setMesaId(mesaAsignada.getId());
            reserva.setEstado("CONFIRMADA");
            return reservaRepo.save(reserva);
        } finally {
            reservaLock.unlock();
        }
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
            // PENDIENTE NO bloquea mesa física ni marca el horario como ocupado hasta confirmación
            if ("CANCELADA".equals(est) || "COMPLETADA".equals(est) || "EXPIRADA".equals(est) || "PENDIENTE".equals(est)) {
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

        return true;
    }

    /**
     * Evalúa si una reserva PENDIENTE ya superó su tiempo límite de confirmación:
     * 1. Si pasaron más de 2 horas desde su creación sin confirmarse.
     * 2. Si la reserva es para hoy y faltan menos de 30 minutos para la hora
     * reservada.
     */
    private boolean haExpiradoPendiente(ReservaEntity r) {
        if (r.getFechaCreacion() != null && !r.getFechaCreacion().isBlank()) {
            try {
                LocalDateTime creado = LocalDateTime.parse(r.getFechaCreacion().trim());
                if (LocalDateTime.now().isAfter(creado.plusHours(2))) {
                    return true;
                }
            } catch (Exception ignored) {
            }
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