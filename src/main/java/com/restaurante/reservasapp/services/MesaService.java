package com.restaurante.reservasapp.services;

import java.util.List;

import com.restaurante.reservasapp.Entity.MesaEntity;

public interface MesaService {

    public MesaEntity guardarMesa(MesaEntity mesa);

    public MesaEntity obtenerMesa(String id);

    public void eliminarMesa(String id);

    public List<MesaEntity> listarMesas();
}
