package com.restaurante.reservasapp.Auth;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping(value = "login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Tu cuenta se encuentra desactivada. Comunícate con el administrador."));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Credenciales incorrectas"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Error al iniciar sesión"));
        }
    }

    @PostMapping(value = "register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Error en el registro"));
        }
    }

    @PostMapping(value = "register-bulk")
    public ResponseEntity<String> registerBulk(@RequestBody List<RegisterRequest> requests) {
        int creados = 0;
        for (RegisterRequest request : requests) {
            try {
                authService.registerBulk(request);
                creados++;
            } catch (Exception e) {
                System.out.println("Error con el usuario " + request.getId() + ": " + e.getMessage());
            }
        }
        return ResponseEntity.ok("Se han registrado " + creados + " usuarios en la base de datos de manera masiva.");
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verificarCorreo(@Valid @RequestBody VerificarCorreoRequest request){
        try {
            authService.verificarCorreo(request.getCorreo(),request.getCodigo());
            return ResponseEntity.ok(Map.of("message", "Correo verificado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> reenviarCorreo(@Valid @RequestBody ReenviarCodigoRequest request){
        try {
            authService.reenviarCodigo(request.getCorreo());
            return ResponseEntity.ok(Map.of("message", "Código reenviado exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
    
}
