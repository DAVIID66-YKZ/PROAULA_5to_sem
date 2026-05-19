package com.restaurante.reservasapp.services;

import java.util.List;

import com.restaurante.reservasapp.Entity.ReservaEntity;

public interface ReservaService {
    public ReservaEntity guardarReserva(ReservaEntity reserva);
    public ReservaEntity obtenerReserva(String id);
    public void eliminarReserva(String id);
    public List<ReservaEntity> listarReservas();
    // Nuevo método:
    public List<ReservaEntity> listarPorUsuario(String usuarioId);
    public ReservaEntity guardarReservaDirecta(ReservaEntity reserva);
}