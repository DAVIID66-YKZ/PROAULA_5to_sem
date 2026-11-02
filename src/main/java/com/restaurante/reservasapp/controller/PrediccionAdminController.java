package com.restaurante.reservasapp.controller;

import com.restaurante.reservasapp.dto.prediccion.PrediccionDemandaRequest;
import com.restaurante.reservasapp.dto.prediccion.PrediccionDemandaResponse;
import com.restaurante.reservasapp.services.PrediccionMLService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDate;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/admin/prediccion")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
public class PrediccionAdminController {

    private final PrediccionMLService prediccionMLService;
    private final ScheduledExecutorService sseExecutor = Executors.newSingleThreadScheduledExecutor();

    @GetMapping
    public ResponseEntity<PrediccionDemandaResponse> obtenerPrediccion(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false, defaultValue = "COMPLETO") String turno) {

        if (fechaInicio == null || fechaInicio.isBlank()) {
            fechaInicio = LocalDate.now().toString();
        }
        if (fechaFin == null || fechaFin.isBlank()) {
            fechaFin = fechaInicio;
        }

        PrediccionDemandaRequest request = PrediccionDemandaRequest.builder()
                .fechaInicio(fechaInicio)
                .fechaFin(fechaFin)
                .turno(turno)
                .build();

        PrediccionDemandaResponse response = prediccionMLService.predecirDemanda(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<PrediccionDemandaResponse> calcularPrediccion(
            @RequestBody PrediccionDemandaRequest request) {
        PrediccionDemandaResponse response = prediccionMLService.predecirDemanda(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamPrediccion(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false, defaultValue = "COMPLETO") String turno) {

        final String fInicio = (fechaInicio == null || fechaInicio.isBlank()) ? LocalDate.now().toString() : fechaInicio;
        final String fFin = (fechaFin == null || fechaFin.isBlank()) ? fInicio : fechaFin;
        final String fTurno = turno;

        SseEmitter emitter = new SseEmitter(60_000L); // 1 minuto de timeout

        Runnable task = new Runnable() {
            @Override
            public void run() {
                try {
                    PrediccionDemandaRequest req = PrediccionDemandaRequest.builder()
                            .fechaInicio(fInicio)
                            .fechaFin(fFin)
                            .turno(fTurno)
                            .build();

                    PrediccionDemandaResponse data = prediccionMLService.predecirDemanda(req);
                    emitter.send(SseEmitter.event()
                            .name("prediccion-update")
                            .data(data, MediaType.APPLICATION_JSON));
                } catch (Exception e) {
                    emitter.completeWithError(e);
                }
            }
        };

        // Enviar datos inmediatamente y luego cada 10 segundos
        sseExecutor.schedule(task, 0, TimeUnit.MILLISECONDS);
        sseExecutor.schedule(task, 10, TimeUnit.SECONDS);

        emitter.onCompletion(() -> log.debug("SSE stream completado"));
        emitter.onTimeout(emitter::complete);
        emitter.onError(e -> log.debug("Error en SSE stream: {}", e.getMessage()));

        return emitter;
    }
}

