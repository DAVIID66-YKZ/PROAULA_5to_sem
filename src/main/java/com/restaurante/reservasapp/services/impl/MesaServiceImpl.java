package com.restaurante.reservasapp.services.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.repository.MesaRepository;
import com.restaurante.reservasapp.services.MesaService;

@Service
public class MesaServiceImpl implements MesaService {

    @Autowired
    private MesaRepository repo;

    @Override
    public MesaEntity guardarMesa(MesaEntity mesa) {
        return repo.save(mesa);

    }

    @Override
    public MesaEntity obtenerMesa(String id) {
        return repo.findById(id).orElse(null);
    }

    @Override
    public void eliminarMesa(String id) {
        repo.deleteById(id);
    }

    @Override
    public List<MesaEntity> listarMesas() {
        return repo.findAll();
    }

}
