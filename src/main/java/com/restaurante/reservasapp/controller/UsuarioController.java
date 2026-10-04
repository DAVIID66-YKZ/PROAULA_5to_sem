package com.restaurante.reservasapp.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.services.UsuarioService;


import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.services.UsuarioService;

@RestController
@RequestMapping("usuarios")
public class UsuarioController {

    private final UsuarioService usuario;

    public UsuarioController(UsuarioService usuario) {
        this.usuario = usuario;
    }

    @GetMapping("/listar")
    public List<UsuarioEntity> listarUsuarios() {
        return usuario.listarUsuarios();
    }

    @GetMapping("/bienvenida")
    public String bienvenida() {
        return "Inicio de sesión exitoso. ¡Bienvenido al sistema!";
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable String id, Authentication auth) {
        if (!puedeAcceder(auth, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acceso denegado.");
        }
        UsuarioEntity user = usuario.obtenerUsuario(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<?> actualizarPerfil(
            @PathVariable String id,
            @RequestBody UsuarioEntity datosActualizados,
            Authentication auth) {
        if (!puedeAcceder(auth, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acceso denegado: no puedes modificar otros perfiles.");
        }
        try {
            UsuarioEntity usuarioModificado = usuario.actualizarPerfil(id, datosActualizados);
            return ResponseEntity.ok(usuarioModificado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/cambiar-password/{id}")
    public ResponseEntity<?> cambiarPassword(
            @PathVariable String id,
            @RequestBody Map<String, String> passwords,
            Authentication auth) {
        if (!puedeAcceder(auth, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acceso denegado: no puedes modificar contraseñas de otros usuarios.");
        }
        try {
            String passwordActual = passwords.get("passwordActual");
            String passwordNueva = passwords.get("passwordNueva");

            if (passwordActual == null || passwordNueva == null) {
                return ResponseEntity.badRequest().body("Faltan campos de contraseña.");
            }

            if (passwordNueva.length() < 8) {
                return ResponseEntity.badRequest().body("La nueva contraseña debe tener mínimo 8 caracteres.");
            }

            usuario.cambiarPassword(id, passwordActual, passwordNueva);
            return ResponseEntity.ok("Contraseña actualizada correctamente.");

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private boolean puedeAcceder(Authentication auth, String id) {
        if (auth == null) return false;
        boolean esAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (esAdmin) return true;

        UsuarioEntity user = usuario.obtenerUsuario(id);
        return user != null && user.getCorreo().equalsIgnoreCase(auth.getName());
    }
}
