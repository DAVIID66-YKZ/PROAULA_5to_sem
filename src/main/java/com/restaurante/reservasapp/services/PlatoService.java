package com.restaurante.reservasapp.services;

import java.util.List;

import com.restaurante.reservasapp.Entity.PlatoEntity;

public interface PlatoService {

    public PlatoEntity guardarPlato(PlatoEntity plato);

    public PlatoEntity obtenerPlato(String id);

    public void eliminarPlato(String id);

    public List<PlatoEntity> listarPlatos();


}
