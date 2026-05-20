package com.restaurante.reservasapp.services.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import com.restaurante.reservasapp.Entity.MesaEntity;
import com.restaurante.reservasapp.repository.MesaRepository;
import com.restaurante.reservasapp.services.MesaService;

@Service
public class MesaServiceImpl implements MesaService {

    @Autowired
    private MesaRepository repo;

    @Override
    @SuppressWarnings("null")
    public MesaEntity guardarMesa(MesaEntity mesa) {
        return repo.save(mesa);
    }

    @Override
    @Nullable
    public MesaEntity obtenerMesa(@Nullable String id) {
        return repo.findById(id != null ? id : "").orElse(null);
    }

    @Override
    public void eliminarMesa(@Nullable String id) {
        if (id != null) {
            repo.deleteById(id);
        }
    }

    @Override
    public List<MesaEntity> listarMesas() {
        return repo.findAll();
    }

    // 🔥 NUEVA IMPLEMENTACIÓN DE CARGA MASIVA
    @Override
    public void guardarMesasBulk(List<MesaEntity> listaMesas) {
        for (MesaEntity m : listaMesas) {
            // Evita duplicar el registro si re-envías la petición por error
            if (!repo.existsById(m.getId())) {
                repo.save(m);
            }
        }
    }
}