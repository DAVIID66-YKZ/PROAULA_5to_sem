package com.restaurante.reservasapp.services.impl;

import java.time.LocalTime;
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

        String sectorBuscado = reserva.getMesaId();
        int cantidadInvitados = reserva.getNumeroPersonas();

        // ── REGLA 1: Un usuario solo puede tener UNA reserva por sector ──
        List<ReservaEntity> reservasEnEsteSector = reservaRepo
            .findByUsuarioIdAndExperiencia(reserva.getUsuarioId(), sectorBuscado);

        if (!reservasEnEsteSector.isEmpty()) {
            throw new RuntimeException(
                "Ya tienes una reserva en el sector " + sectorBuscado +
                ". Solo se permite una reserva por sector.");
        }

        // ── REGLA 2: Un usuario máximo 3 reservas en total ──
        List<ReservaEntity> todasLasReservasDelUsuario = reservaRepo
            .findByUsuarioId(reserva.getUsuarioId());

       /* ── REGLA 2: Un usuario máximo 3 reservas en total ──
        if (todasLasReservasDelUsuario.size() >= 3) {
            throw new RuntimeException(
                "Has alcanzado el límite de 3 reservas. " +
                "Cancela una reserva existente para hacer una nueva.");
        }
        */
        // ── REGLA 2B: El mismo usuario no puede tener dos reservas en la misma fecha y hora ──
boolean mismaFechaHora = todasLasReservasDelUsuario.stream().anyMatch(r ->
    reserva.getFecha().equals(r.getFecha()) &&
    reserva.getHora().equals(r.getHora())
);

if (mismaFechaHora) {
    throw new RuntimeException(
        "Ya tienes una reserva el " + reserva.getFecha() + 
        " a las " + reserva.getHora() + 
        ". Elige otra fecha u hora.");
}

        // ── REGLA 3: Buscar mesas del sector que soporten la cantidad de personas ──
        List<MesaEntity> mesasAptasDelSector = mesaRepo.findAll().stream()
            .filter(m -> m.getSector() != null && m.getSector().equalsIgnoreCase(sectorBuscado))
            .filter(m -> m.getCapacidad() >= cantidadInvitados)
            .filter(MesaEntity::isDisponible)
            .collect(Collectors.toList());

        if (mesasAptasDelSector.isEmpty()) {
            throw new RuntimeException(
                "No hay mesas en el sector " + sectorBuscado +
                " con capacidad para " + cantidadInvitados + " personas.");
        }

        // ── REGLA 4: Buscar mesa libre en esa fecha con bloqueo de ±2 horas ──
        LocalTime horaSolicitada = LocalTime.parse(reserva.getHora());
        LocalTime limiteInferior = horaSolicitada.minusHours(2).plusMinutes(1);
        LocalTime limiteSuperior = horaSolicitada.plusHours(2).minusMinutes(1);

        List<ReservaEntity> reservasDelDia = reservaRepo.findAll().stream()
            .filter(r -> r.getFecha() != null && r.getFecha().equals(reserva.getFecha()))
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

        return reservaRepo.save(reserva);
    }

    @Override
    public List<String> obtenerHorasCompletamenteOcupadas(String fecha, String sector, int invitados) {
        List<String> horasBloqueadas = new java.util.ArrayList<>();

        List<MesaEntity> mesasAptas = mesaRepo.findAll().stream()
            .filter(m -> m.getSector() != null && m.getSector().equalsIgnoreCase(sector))
            .filter(m -> m.getCapacidad() >= invitados)
            .collect(Collectors.toList());

        if (mesasAptas.isEmpty()) {
            return java.util.Arrays.asList(
                "10:00","11:00","12:00","13:00","14:00",
                "15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00");
        }

        String[] todosLosTurnos = {
            "10:00","11:00","12:00","13:00","14:00",
            "15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"
        };

        List<ReservaEntity> reservasDelDia = reservaRepo.findAll().stream()
            .filter(r -> r.getFecha() != null && r.getFecha().equals(fecha))
            .collect(Collectors.toList());

        for (String turno : todosLosTurnos) {
            LocalTime horaEvaluar = LocalTime.parse(turno);
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
    public void eliminarReserva(String id) {
        reservaRepo.deleteById(id);
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
}