package com.restaurante.reservasapp.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.restaurante.reservasapp.Entity.VerificacionEntity;

public interface VerificacionRepository extends MongoRepository<VerificacionEntity, String> {


}
