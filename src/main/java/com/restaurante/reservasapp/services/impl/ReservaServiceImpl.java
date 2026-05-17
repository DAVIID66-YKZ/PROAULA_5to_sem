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
    // 1. Usamos el campo mesaId (que viene del front con el nombre del sector) para buscar
    String sectorBuscado = reserva.getMesaId(); 

    List<MesaEntity> mesasDisponibles = mesaRepo.findAll().stream()
            .filter(m -> m.getSector() != null && m.getSector().equals(sectorBuscado))
            .filter(MesaEntity::isDisponible)
            .collect(Collectors.toList());

    if (mesasDisponibles.isEmpty()) {
        throw new RuntimeException("No hay mesas disponibles en " + sectorBuscado);
    }

    MesaEntity mesaAsignada = mesasDisponibles.get(0);
    mesaAsignada.setDisponible(false);
    mesaRepo.save(mesaAsignada);

    // 2. Seteamos el ID técnico de la mesa asignada
    reserva.setMesaId(mesaAsignada.getId()); 
    
    // 3. El campo 'experiencia' ya viene lleno desde el JSON del front, 
    // así que se guardará automáticamente en MongoDB.
    
    return reservaRepo.save(reserva);
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
        // Al eliminar una reserva, deberíamos liberar la mesa
        reservaRepo.findById(id).ifPresent(reserva -> {
            mesaRepo.findById(reserva.getMesaId()).ifPresent(mesa -> {
                mesa.setDisponible(true);
                mesaRepo.save(mesa);
            });
            reservaRepo.deleteById(id);
        });
    }

    @Override
    public List<ReservaEntity> listarReservas() {
        return reservaRepo.findAll();
    }
}