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
    // Buscamos mesas que coincidan en sector y disponibilidad
    List<MesaEntity> mesasDisponibles = mesaRepo.findAll().stream()
            .filter(m -> m.getSector() != null && m.getSector().equals(reserva.getMesaId()))
            .filter(MesaEntity::isDisponible)
            .collect(Collectors.toList());

    if (mesasDisponibles.isEmpty()) {
        throw new RuntimeException("No hay mesas disponibles en este sector actualmente.");
    }

    MesaEntity mesaAsignada = mesasDisponibles.get(0);
    mesaAsignada.setDisponible(false);
    mesaRepo.save(mesaAsignada);

    reserva.setMesaId(mesaAsignada.getId()); // Aquí guardamos el ID real que ves en image_6b933b.png
    return reservaRepo.save(reserva);
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