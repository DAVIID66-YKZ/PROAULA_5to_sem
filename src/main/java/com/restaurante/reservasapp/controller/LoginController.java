package com.restaurante.reservasapp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.Jwt.JwtService;
import com.restaurante.reservasapp.repository.UsuarioRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class LoginController {

    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private JwtService jwtService; // 🔥 AGREGAR ESTO

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Optional<UsuarioEntity> usuario = usuarioRepository.findByCorreo(request.getCorreo());

            if (usuario.isPresent()) {
                UsuarioEntity user = usuario.get();
                
                // 🔥 CAMBIAR ESTO: Usar JWT real en lugar de fake token
                String token = jwtService.getToken(user);
                
                Map<String, Object> response = new HashMap<>();
                response.put("token", token); // 🔥 Token REAL
                response.put("usuarioId", user.getId());
                response.put("nombre", user.getNombre());
                response.put("rol", user.getRol().name());
                
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.status(401).body(new ErrorResponse("Usuario no encontrado"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Error en el servidor: " + e.getMessage()));
        }
    }

    public static class LoginRequest {
        private String correo;
        private String contrasena;

        public LoginRequest() {}

        public String getCorreo() { return correo; }
        public void setCorreo(String correo) { this.correo = correo; }
        public String getContrasena() { return contrasena; }
        public void setContrasena(String contrasena) { this.contrasena = contrasena; }
    }

    public static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}