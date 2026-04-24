package com.restaurante.reservasapp.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.restaurante.reservasapp.Entity.MesaEntity;


public interface MesaRepository extends MongoRepository<MesaEntity, String> {

}
