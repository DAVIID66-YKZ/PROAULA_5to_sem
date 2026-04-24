package com.restaurante.reservasapp.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.restaurante.reservasapp.Entity.UsuarioEntity;

public interface UsuarioRepository extends MongoRepository<UsuarioEntity, String> {
     Optional<UsuarioEntity> findByUsername(String username);

    Optional<UsuarioEntity> findByCorreo(String correo);
}
