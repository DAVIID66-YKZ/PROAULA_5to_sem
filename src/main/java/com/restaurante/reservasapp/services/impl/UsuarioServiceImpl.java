package com.restaurante.reservasapp.services.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.restaurante.reservasapp.Entity.Rol;
import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.repository.UsuarioRepository;
import com.restaurante.reservasapp.services.UsuarioService;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository repo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UsuarioEntity guardarUsuario(UsuarioEntity usuario) {
        usuario.setContrasena(passwordEncoder.encode(usuario.getContrasena()));
        usuario.setRol(Rol.CLIENTE);
        return repo.save(usuario);
    }

    @Override
    public UsuarioEntity obtenerUsuario(String id) {
        return repo.findById(id).orElse(null);
    }

    @Override
    public void eliminarUsuario(String id) {
        repo.deleteById(id);
    }

    @Override
    public List<UsuarioEntity> listarUsuarios() {
        return repo.findAll();
    }

    
    @Override
    public UsuarioEntity actualizarPerfil(String id, UsuarioEntity datosNuevos) {
        // Buscamos el documento original en la colección
        UsuarioEntity usuarioExistente = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("El registro de usuario no existe en el sistema."));

        // Sobrescribimos solo los metadatos permitidos del formulario
        usuarioExistente.setNombre(datosNuevos.getNombre());
        usuarioExistente.setApellido(datosNuevos.getApellido());
        usuarioExistente.setTelefono(datosNuevos.getTelefono());
        usuarioExistente.setDireccion(datosNuevos.getDireccion());

        // Guardamos los cambios manteniendo la misma ID, rol y credenciales
        return repo.save(usuarioExistente);
    }
}