package com.restaurante.reservasapp.Auth;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping(value = "login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping(value = "register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // 🔥 ENDPOINT ACTUALIZADO PARA CARGA MASIVA
    @PostMapping(value = "register-bulk")
    public ResponseEntity<String> registerBulk(@RequestBody List<RegisterRequest> requests) {
        int creados = 0;
        for (RegisterRequest request : requests) {
            try {
                authService.registerBulk(request); // 👈 Usa el nuevo método
                creados++;
            } catch (Exception e) {
                System.out.println("Error con el usuario " + request.getId() + ": " + e.getMessage());
            }
        }
        return ResponseEntity.ok("Se han registrado " + creados + " usuarios en la base de datos de manera masiva.");
    }
}