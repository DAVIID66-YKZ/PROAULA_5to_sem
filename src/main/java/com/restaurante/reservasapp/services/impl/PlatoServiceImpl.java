package com.restaurante.reservasapp.services.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mongodb.lang.Nullable;
import com.restaurante.reservasapp.Entity.PlatoEntity;
import com.restaurante.reservasapp.repository.PlatoRepository;
import com.restaurante.reservasapp.services.PlatoService;

@Service 
public class PlatoServiceImpl implements PlatoService{

    @Autowired 
    private PlatoRepository repo;

    @Override
    public void eliminarPlato(@Nullable String id) {
        if (id != null) {
            repo.deleteById(id);
        }
    }

    @Override
    @SuppressWarnings("null")
    public PlatoEntity guardarPlato(PlatoEntity plato) {
        return repo.save(plato);
    }

    @Override
    public List<PlatoEntity> listarPlatos() {
        return repo.findAll();
    }

    @Override
    @Nullable
    public PlatoEntity obtenerPlato(@Nullable String id) {
        return repo.findById(id != null ? id : "").orElse(null);
    }


}
