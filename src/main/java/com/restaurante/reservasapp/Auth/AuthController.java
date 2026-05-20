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


    @PostMapping(value = "register-admin")
public ResponseEntity<AuthResponse> registerAdmin(@RequestBody RegisterRequest request)
{
    return ResponseEntity.ok(authService.registerAdmin(request));
}
@PostMapping(value = "register-bulk")
public ResponseEntity<String> registerBulk(@RequestBody List<RegisterRequest> requests) {
    int creados = 0;
    for (RegisterRequest request : requests) {
        try {
            authService.register(request);
            creados++;
        } catch (Exception e) {
            // Por si algún correo ya existe, que no detenga el proceso completo
            System.out.println("Error con el usuario: " + request.getCorreo());
        }
    }
    return ResponseEntity.ok("Se han registrado " + creados + " usuarios en la base de datos.");
}

