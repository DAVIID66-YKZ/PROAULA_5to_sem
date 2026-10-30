package com.restaurante.reservasapp.services;

import com.restaurante.reservasapp.dto.prediccion.PrediccionDemandaRequest;
import com.restaurante.reservasapp.dto.prediccion.PrediccionDemandaResponse;

public interface PrediccionMLService {
    PrediccionDemandaResponse predecirDemanda(PrediccionDemandaRequest request);
}

