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
        String sectorBuscado = reserva.getMesaId(); // Trae "Mesa-Ventana", "Mesa-Estandar", etc.
        int cantidadInvitados = reserva.getNumeroPersonas(); // ¡Ya corregido el null/0!

        // 1. FILTRO 1: Buscar mesas del sector que SOPORTEN la cantidad de personas
        // Asumimos que tu MesaEntity tiene un atributo llamado 'capacidad' (ej: 2, 4, 6, 8)
        List<MesaEntity> mesasAptasDelSector = mesaRepo.findAll().stream()
                .filter(m -> m.getSector() != null && m.getSector().equalsIgnoreCase(sectorBuscado))
                .filter(m -> m.getCapacidad() >= cantidadInvitados) // 🔥 VALIDACIÓN DE CAPACIDAD
                .collect(Collectors.toList());

        if (mesasAptasDelSector.isEmpty()) {
            throw new RuntimeException("Lo sentimos: No tenemos mesas en el sector " + sectorBuscado + 
                    " diseñadas para alojar a " + cantidadInvitados + " personas.");
        }

        // 2. Configurar la matemática de tiempo (+- 2 horas de bloqueo)
        LocalTime horaSolicitada = LocalTime.parse(reserva.getHora());
        LocalTime limiteInferior = horaSolicitada.minusHours(2).plusMinutes(1);
        LocalTime limiteSuperior = horaSolicitada.plusHours(2).minusMinutes(1);

        MesaEntity mesaAsignada = null;

        // 3. FILTRO 2: Buscar cuál de las mesas aptas está libre en esa fecha y rango horario
        for (MesaEntity mesa : mesasAptasDelSector) {
            
            // Consultar reservas previas de ESTA mesa específica en ESTA fecha
            List<ReservaEntity> reservasDeEstaMesa = reservaRepo.findAll().stream()
                    .filter(r -> r.getMesaId() != null && r.getMesaId().equals(mesa.getId()) 
                            && r.getFecha() != null && r.getFecha().equals(reserva.getFecha()))
                    .collect(Collectors.toList());

            boolean tieneConflictoDeHorario = false;

            for (ReservaEntity resExistente : reservasDeEstaMesa) {
                LocalTime horaExistente = LocalTime.parse(resExistente.getHora());

                // Validar solapamiento de la regla de 2 horas
                if (horaExistente.isAfter(limiteInferior) && horaExistente.isBefore(limiteSuperior)) {
                    tieneConflictoDeHorario = true;
                    break; // Mesa ocupada en este rango, saltamos a la siguiente mesa apta
                }
            }

            // Si la mesa tiene el tamaño correcto y está libre en el horario, la seleccionamos
            if (!tieneConflictoDeHorario) {
                mesaAsignada = mesa;
                break; 
            }
        }

        // 4. Si todas las mesas que cumplían con la capacidad están llenas en ese horario
        if (mesaAsignada == null) {
            throw new RuntimeException("Lo sentimos: Todas las mesas para " + cantidadInvitados + 
                    " personas en el sector " + sectorBuscado + " están ocupadas en este horario. Intente otra hora.");
        }

        // 5. Asignar el ID real de la mesa física encontrada y persistir la reserva
        reserva.setMesaId(mesaAsignada.getId()); 
        
        return reservaRepo.save(reserva);
    }

    // Método de soporte para el controlador y el JS de deshabilitar horas
    public List<ReservaEntity> listarPorMesaYFecha(String fecha, String sector) {
        return reservaRepo.findAll().stream()
                .filter(r -> r.getFecha() != null && r.getFecha().equals(fecha)
                        && r.getExperiencia() != null && r.getExperiencia().equalsIgnoreCase(sector))
                .collect(Collectors.toList());
    }
    // Agrega esto al final de tu archivo ReservaServiceImpl.java

@Override
@Transactional
public ReservaEntity guardarReservaDirecta(ReservaEntity reserva) {
    // Va directo al repositorio sin validar horas, sectores ni capacidades
    return reservaRepo.save(reserva);
}

    @Override public List<ReservaEntity> listarPorUsuario(String usuarioId) { return reservaRepo.findByUsuarioId(usuarioId); }
    @Override public ReservaEntity obtenerReserva(String id) { return reservaRepo.findById(id).orElse(null); }
    @Override public void eliminarReserva(String id) { reservaRepo.deleteById(id); }
    @Override public List<ReservaEntity> listarReservas() { return reservaRepo.findAll(); }
}