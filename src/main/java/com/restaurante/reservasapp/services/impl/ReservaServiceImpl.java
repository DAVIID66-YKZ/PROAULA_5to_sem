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

    // Duración estándar estimada del servicio por velada (2 horas = 120 minutos)
    private static final int DURACION_RESERVA_MINUTOS = 120;

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

            // ── REGLA 1: Evitar reservas activas en conflicto de horario para el mismo usuario ──
            LocalDateTime inicioSolicitado = obtenerInicio(reserva.getFecha(), reserva.getHora());
            if (inicioSolicitado == null) {
                throw new RuntimeException("La fecha u hora de la reserva no es válida.");
            }

            boolean conflictoUsuario = todasLasReservasDelUsuario.stream()
                    .filter(this::esReservaActiva)
                    .anyMatch(r -> {
                        LocalDateTime inicioExistente = obtenerInicio(r.getFecha(), r.getHora());
                        return colisionanHorarios(inicioSolicitado, inicioExistente);
                    });

            if (conflictoUsuario) {
                throw new RuntimeException(
                        "Ya tienes una reserva activa o apartada el " + reserva.getFecha() +
                                " en un horario que se solapa con esta velada. Se requiere un intervalo de 2 horas entre reservas.");
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

            // ── REGLA 4: Buscar mesa libre con evaluación exacta de colisión de intervalos ──
            List<ReservaEntity> reservasCandidatas = obtenerReservasCandidatas(fechaNueva);

            MesaEntity mesaAsignada = null;

            for (MesaEntity mesa : mesasAptasDelSector) {
                boolean mesaOcupada = reservasCandidatas.stream()
                        .filter(r -> mesa.getId().equals(r.getMesaId()))
                        .anyMatch(r -> {
                            LocalDateTime inicioExistente = obtenerInicio(r.getFecha(), r.getHora());
                            return colisionanHorarios(inicioSolicitado, inicioExistente);
                        });

                if (!mesaOcupada) {
                    mesaAsignada = mesa;
                    break;
                }
            }

            if (mesaAsignada == null) {
                throw new RuntimeException(
                        "No hay mesas disponibles en el sector " + sectorBuscado +
                                " para la fecha y hora seleccionada (" + reserva.getHora() + "). Intenta otra hora.");
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

        List<ReservaEntity> reservasCandidatas = obtenerReservasCandidatas(fechaConsultada);

        LocalTime horaActual = LocalTime.now();

        for (String turno : todosLosTurnos) {
            LocalTime horaEvaluar = parsearHora(turno);
            if (horaEvaluar == null) continue;

            // Si es el mismo día y la hora ya ha transcurrido, bloquear el turno inmediatamente
            if (esHoy && horaEvaluar.isBefore(horaActual)) {
                horasBloqueadas.add(turno);
                continue;
            }

            LocalDateTime inicioTurno = LocalDateTime.of(fechaConsultada, horaEvaluar);

            boolean existeAlMenosUnaMesaLibre = false;

            for (MesaEntity mesa : mesasAptas) {
                boolean mesaOcupada = reservasCandidatas.stream()
                        .filter(r -> mesa.getId().equals(r.getMesaId()))
                        .anyMatch(r -> {
                            LocalDateTime inicioExistente = obtenerInicio(r.getFecha(), r.getHora());
                            return colisionanHorarios(inicioTurno, inicioExistente);
                        });

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
            if ("EXPIRADA".equals(estadoActual)) {
                throw new RuntimeException("No se puede reprogramar una reserva que ha expirado.");
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

            LocalDateTime nuevoInicio = obtenerInicio(datosNuevos.getFecha(), datosNuevos.getHora());
            if (nuevoInicio == null) {
                throw new RuntimeException("La nueva fecha u hora indicada no es válida.");
            }

            // Validar que el usuario no tenga otra reserva en conflicto en esa fecha y horario (excluyendo esta misma)
            List<ReservaEntity> reservasUsuario = reservaRepo.findByUsuarioId(reservaExistente.getUsuarioId());
            boolean conflictoUsuario = reservasUsuario.stream()
                    .filter(r -> r.getId() != null && !r.getId().equals(id))
                    .filter(this::esReservaActiva)
                    .anyMatch(r -> {
                        LocalDateTime inicioExistente = obtenerInicio(r.getFecha(), r.getHora());
                        return colisionanHorarios(nuevoInicio, inicioExistente);
                    });

            if (conflictoUsuario) {
                throw new RuntimeException(
                        "Ya tienes otra reserva activa en un horario cercano. Debe haber al menos 2 horas de diferencia.");
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

            // Reservas candidatas (excluyendo la reserva que se está reprogramando)
            List<ReservaEntity> reservasCandidatas = obtenerReservasCandidatas(fechaNueva).stream()
                    .filter(r -> r.getId() != null && !r.getId().equals(id))
                    .collect(Collectors.toList());

            MesaEntity mesaAsignada = null;
            for (MesaEntity mesa : mesasAptasDelSector) {
                boolean mesaOcupada = reservasCandidatas.stream()
                        .filter(r -> mesa.getId().equals(r.getMesaId()))
                        .anyMatch(r -> {
                            LocalDateTime inicioExistente = obtenerInicio(r.getFecha(), r.getHora());
                            return colisionanHorarios(nuevoInicio, inicioExistente);
                        });

                if (!mesaOcupada) {
                    mesaAsignada = mesa;
                    break;
                }
            }

            if (mesaAsignada == null) {
                throw new RuntimeException("No hay mesas disponibles en el sector " + sectorBuscado
                        + " para la nueva fecha y hora (" + datosNuevos.getHora() + "). Por favor intenta otro turno.");
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
            if ("CANCELADA".equals(estado) || "COMPLETADA".equals(estado) || "EXPIRADA".equals(estado)) {
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
            if ("EXPIRADA".equals(estado) || haExpiradoPendiente(reserva)) {
                reserva.setEstado("EXPIRADA");
                reservaRepo.save(reserva);
                throw new RuntimeException("El tiempo límite de apartado (2 horas) para esta reserva ha expirado. Por favor, crea una nueva reserva.");
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

            LocalDateTime inicioReserva = obtenerInicio(reserva.getFecha(), reserva.getHora());
            if (inicioReserva == null) {
                throw new RuntimeException("La reserva no cuenta con una fecha u hora válida para confirmar.");
            }

            List<ReservaEntity> reservasCandidatas = obtenerReservasCandidatas(fecha).stream()
                    .filter(r -> r.getId() != null && !r.getId().equals(id))
                    .collect(Collectors.toList());

            MesaEntity mesaAsignada = null;

            // Conservar mesa si sigue disponible
            if (reserva.getMesaId() != null && !reserva.getMesaId().isBlank()) {
                boolean mesaPreviaLibre = mesasAptasDelSector.stream().anyMatch(m -> m.getId().equals(reserva.getMesaId()))
                        && reservasCandidatas.stream().noneMatch(r -> {
                            if (r.getMesaId() != null && r.getMesaId().equals(reserva.getMesaId())) {
                                LocalDateTime inicioExistente = obtenerInicio(r.getFecha(), r.getHora());
                                return colisionanHorarios(inicioReserva, inicioExistente);
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
                    boolean mesaOcupada = reservasCandidatas.stream()
                            .filter(r -> mesa.getId().equals(r.getMesaId()))
                            .anyMatch(r -> {
                                LocalDateTime inicioExistente = obtenerInicio(r.getFecha(), r.getHora());
                                return colisionanHorarios(inicioReserva, inicioExistente);
                            });

                    if (!mesaOcupada) {
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

    private LocalDateTime obtenerInicio(String fechaStr, String horaStr) {
        LocalDate fecha = parsearFecha(fechaStr);
        LocalTime hora = parsearHora(horaStr);
        if (fecha == null || hora == null) {
            return null;
        }
        return LocalDateTime.of(fecha, hora);
    }

    /**
     * Evalúa si dos reservas colisionan en tiempo utilizando intersección real de intervalos:
     * [inicio1, inicio1 + DURACION) y [inicio2, inicio2 + DURACION).
     * Regla matemática: inicio1 < fin2 && inicio2 < fin1.
     * Resuelve de forma robusta cualquier horario y cruce de medianoche sin generar falsos bloqueos.
     */
    private boolean colisionanHorarios(LocalDateTime inicio1, LocalDateTime inicio2) {
        if (inicio1 == null || inicio2 == null) {
            return false;
        }
        LocalDateTime fin1 = inicio1.plusMinutes(DURACION_RESERVA_MINUTOS);
        LocalDateTime fin2 = inicio2.plusMinutes(DURACION_RESERVA_MINUTOS);

        return inicio1.isBefore(fin2) && inicio2.isBefore(fin1);
    }

    /**
     * Obtiene las reservas activas que potencialmente pueden solaparse con el día consultado
     * (incluye ayer para reservas nocturnas que pasen medianoche y mañana para veladas tardías de hoy).
     */
    private List<ReservaEntity> obtenerReservasCandidatas(LocalDate fecha) {
        if (fecha == null) return List.of();
        String strAyer = fecha.minusDays(1).toString();
        String strHoy = fecha.toString();
        String strManana = fecha.plusDays(1).toString();

        return reservaRepo.findAll().stream()
                .filter(this::reservaBloqueaMesa)
                .filter(r -> r.getFecha() != null &&
                        (r.getFecha().equals(strHoy) || r.getFecha().equals(strAyer) || r.getFecha().equals(strManana)))
                .collect(Collectors.toList());
    }

    /**
     * Determina si una reserva bloquea una mesa física en un horario determinado.
     * Gestiona también el apartado temporal y la expiración automática de reservas en estado PENDIENTE.
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
            // Control de apartado temporal para reservas PENDIENTE
            if ("PENDIENTE".equals(est)) {
                if (haExpiradoPendiente(r)) {
                    r.setEstado("EXPIRADA");
                    try {
                        reservaRepo.save(r);
                    } catch (Exception ignored) {
                    }
                    return false;
                }
                // Si la reserva sigue dentro de su ventana de gracia (no ha expirado),
                // retiene y bloquea la mesa física para garantizar el apartado sin sobreventas (Double Booking).
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
     * 2. Si la reserva es para una fecha pasada, o si es para hoy y faltan menos de 30 minutos
     *    para la hora reservada.
     */
    private boolean haExpiradoPendiente(ReservaEntity r) {
        if (r == null) {
            return false;
        }

        // 1. Expiración por tiempo transcurrido desde la creación (2 horas de apartado temporal)
        if (r.getFechaCreacion() != null && !r.getFechaCreacion().isBlank()) {
            try {
                LocalDateTime creado = LocalDateTime.parse(r.getFechaCreacion().trim());
                if (LocalDateTime.now().isAfter(creado.plusHours(2))) {
                    return true;
                }
            } catch (Exception ignored) {
            }
        }

        // 2. Expiración por cercanía a la fecha y hora de la velada
        LocalDate fecha = parsearFecha(r.getFecha());
        LocalTime hora = parsearHora(r.getHora());
        LocalDate hoy = LocalDate.now();

        if (fecha != null) {
            if (fecha.isBefore(hoy)) {
                return true;
            }
            if (fecha.isEqual(hoy) && hora != null) {
                LocalTime limiteHoy = hora.minusMinutes(30);
                if (LocalTime.now().isAfter(limiteHoy)) {
                    return true;
                }
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