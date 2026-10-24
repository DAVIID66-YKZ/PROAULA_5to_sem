package com.restaurante.reservasapp.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.restaurante.reservasapp.Entity.PlatoEntity;

public interface PlatoRepository extends MongoRepository<PlatoEntity, String>  {

}
