package com.restaurante.reservasapp.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.restaurante.reservasapp.Entity.ReservaEnity;

public interface ReservaRepository extends MongoRepository<ReservaEnity, String> {

}
