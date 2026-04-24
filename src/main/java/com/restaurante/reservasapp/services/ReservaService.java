package com.restaurante.reservasapp.services;

import java.util.List;

import com.restaurante.reservasapp.Entity.ReservaEnity;

public interface ReservaService {

    public ReservaEnity guardarReserva(ReservaEnity reserva);

    public ReservaEnity obtenerReserva(String id);

    public void eliminarReserva(String id);

    public List<ReservaEnity> listarReservas();

}
