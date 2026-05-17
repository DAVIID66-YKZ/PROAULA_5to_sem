package com.restaurante.reservasapp.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.services.UsuarioService;


import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("usuarios")
public class UsuarioController {

    private final UsuarioService usuario;

    public UsuarioController(UsuarioService usuario) {
        this.usuario = usuario;
    }
    @GetMapping("/listar")
    public List<UsuarioEntity> getMethodName() {
        return usuario.listarUsuarios();
    }
    @GetMapping("/bienvenida")
public String bienvenida() {
    return "Inicio de sesión exitoso. ¡Bienvenido al sistema!";
}
@GetMapping("/{id}")
public ResponseEntity<UsuarioEntity> obtenerPorId(@PathVariable String id) {
    UsuarioEntity user = usuario.obtenerUsuario(id); 
    if (user != null) {
        return ResponseEntity.ok(user);
    }
    return ResponseEntity.notFound().build();
}

@PutMapping("/actualizar/{id}")
public ResponseEntity<?> actualizarPerfil(
        @PathVariable String id, 
        @RequestBody UsuarioEntity datosActualizados) {
    try {
        UsuarioEntity usuarioModificado = usuario.actualizarPerfil(id, datosActualizados);
        return ResponseEntity.ok(usuarioModificado);
    } catch (RuntimeException e) {
        return ResponseEntity.badRequest().body("Error: " + e.getMessage());
    }
}

}
