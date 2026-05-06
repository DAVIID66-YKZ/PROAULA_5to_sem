package com.restaurante.reservasapp.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.restaurante.reservasapp.Entity.ReservaEntity;

public interface ReservaRepository extends MongoRepository<ReservaEntity, String> {

}
