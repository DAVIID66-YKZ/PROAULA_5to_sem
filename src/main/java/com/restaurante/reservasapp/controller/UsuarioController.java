package com.restaurante.reservasapp.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.services.UsuarioService;


import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;

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

}
