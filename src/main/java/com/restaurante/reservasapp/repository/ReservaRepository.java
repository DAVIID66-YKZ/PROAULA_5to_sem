package com.restaurante.reservasapp.repository;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.restaurante.reservasapp.Entity.ReservaEntity;

public interface ReservaRepository extends MongoRepository<ReservaEntity, String> {
    // Busca todas las reservas que pertenezcan a un usuario específico
    List<ReservaEntity> findByUsuarioId(String usuarioId);
}