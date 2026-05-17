package com.restaurante.reservasapp.services.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import com.restaurante.reservasapp.Entity.ReservaEntity;
import com.restaurante.reservasapp.repository.ReservaRepository;
import com.restaurante.reservasapp.services.ReservaService;

@Service
public class ReservaServiceImpl implements ReservaService {

    @Autowired
    private ReservaRepository repo;

    @Override
    @SuppressWarnings("null")
    public ReservaEntity guardarReserva(ReservaEntity reserva) {
        return repo.save(reserva);
    }

    @Override
    @Nullable
    public ReservaEntity obtenerReserva(@Nullable String id) {
        return repo.findById(id != null ? id : "").orElse(null);
    }

    @Override
    public void eliminarReserva(@Nullable String id) {
        if (id != null) {
            repo.deleteById(id);
        }
    }

    @Override
    public List<ReservaEntity> listarReservas() {
        return repo.findAll();
    }

}
