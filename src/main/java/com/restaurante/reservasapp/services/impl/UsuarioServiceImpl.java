package com.restaurante.reservasapp.services.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
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
        if (usuario.getContrasena() != null && !usuario.getContrasena().startsWith("$2a$")) {
            usuario.setContrasena(passwordEncoder.encode(usuario.getContrasena()));
        }
        if (usuario.getRol() == null) {
            usuario.setRol(Rol.CLIENTE);
        }
        if (usuario.getActivo() == null) {
            usuario.setActivo(true);
        }
        return repo.save(usuario);
    }

    @Override
    @Nullable
    public UsuarioEntity obtenerUsuario(@Nullable String id) {
        if (id == null || id.isBlank()) {
            return null;
        }
        return repo.findById(id).orElse(null);
    }

    /**
     * Eliminación suave (Soft Delete): Desactiva la cuenta del usuario en lugar de eliminarla
     * físicamente de la base de datos para no quebrar la integridad de reservas e historial.
     */
    @Override
    public void eliminarUsuario(@Nullable String id) {
        if (id != null && !id.isBlank()) {
            UsuarioEntity usuario = repo.findById(id).orElse(null);
            if (usuario != null) {
                usuario.setActivo(false);
                repo.save(usuario);
            }
        }
    }

    @Override
    public List<UsuarioEntity> listarUsuarios() {
        return repo.findAll();
    }

    @Override
    public UsuarioEntity actualizarPerfil(String id, UsuarioEntity datosNuevos) {
        UsuarioEntity usuarioExistente = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("El registro de usuario no existe en el sistema."));

        if (datosNuevos.getNombre() != null) usuarioExistente.setNombre(datosNuevos.getNombre());
        if (datosNuevos.getApellido() != null) usuarioExistente.setApellido(datosNuevos.getApellido());
        if (datosNuevos.getTelefono() != null) usuarioExistente.setTelefono(datosNuevos.getTelefono());
        if (datosNuevos.getDireccion() != null) usuarioExistente.setDireccion(datosNuevos.getDireccion());

        return repo.save(usuarioExistente);
    }

    @Override
    public void cambiarPassword(String id, String passwordActual, String passwordNueva) {
        UsuarioEntity usuario = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        if (!passwordEncoder.matches(passwordActual, usuario.getContrasena())) {
            throw new RuntimeException("La contraseña actual es incorrecta.");
        }

        if (passwordNueva == null || passwordNueva.length() < 8) {
            throw new RuntimeException("La nueva contraseña debe tener al menos 8 caracteres.");
        }

        usuario.setContrasena(passwordEncoder.encode(passwordNueva));
        repo.save(usuario);
    }

    @Override
    public UsuarioEntity crearUsuarioPorAdmin(UsuarioEntity nuevo) {
        if (nuevo.getCorreo() == null || nuevo.getCorreo().isBlank()) {
            throw new RuntimeException("El correo electrónico es obligatorio.");
        }

        String correoNormalizado = nuevo.getCorreo().trim().toLowerCase();
        if (repo.findByCorreo(correoNormalizado).isPresent()) {
            throw new RuntimeException("El correo ya se encuentra registrado por otro usuario.");
        }

        if (nuevo.getContrasena() == null || nuevo.getContrasena().length() < 8) {
            throw new RuntimeException("La contraseña debe tener mínimo 8 caracteres.");
        }

        nuevo.setCorreo(correoNormalizado);
        nuevo.setContrasena(passwordEncoder.encode(nuevo.getContrasena()));
        if (nuevo.getRol() == null) {
            nuevo.setRol(Rol.CLIENTE);
        }
        if (nuevo.getActivo() == null) {
            nuevo.setActivo(true);
        }

        return repo.save(nuevo);
    }

    @Override
    public UsuarioEntity actualizarUsuarioPorAdmin(String id, UsuarioEntity datos) {
        UsuarioEntity existente = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        if (datos.getNombre() != null) {
            existente.setNombre(datos.getNombre().trim());
        }
        if (datos.getApellido() != null) {
            existente.setApellido(datos.getApellido().trim());
        }
        if (datos.getTelefono() != null) {
            existente.setTelefono(datos.getTelefono().trim());
        }
        if (datos.getDireccion() != null) {
            existente.setDireccion(datos.getDireccion().trim());
        }
        if (datos.getCorreo() != null && !datos.getCorreo().isBlank()) {
            String nuevoCorreo = datos.getCorreo().trim().toLowerCase();
            if (!nuevoCorreo.equalsIgnoreCase(existente.getCorreo())) {
                if (repo.findByCorreo(nuevoCorreo).isPresent()) {
                    throw new RuntimeException("El correo ya se encuentra en uso por otro usuario.");
                }
                existente.setCorreo(nuevoCorreo);
            }
        }
        if (datos.getRol() != null) {
            existente.setRol(datos.getRol());
        }
        if (datos.getActivo() != null) {
            existente.setActivo(datos.getActivo());
        }
        if (datos.getContrasena() != null && !datos.getContrasena().isBlank()) {
            if (datos.getContrasena().length() < 8) {
                throw new RuntimeException("La nueva contraseña debe tener al menos 8 caracteres.");
            }
            existente.setContrasena(passwordEncoder.encode(datos.getContrasena()));
        }

        return repo.save(existente);
    }

    @Override
    public UsuarioEntity cambiarEstadoUsuario(String id, boolean activo) {
        UsuarioEntity usuario = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        usuario.setActivo(activo);
        return repo.save(usuario);
    }

    @Override
    public UsuarioEntity cambiarRolUsuario(String id, Rol rol) {
        UsuarioEntity usuario = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        usuario.setRol(rol);
        return repo.save(usuario);
    }
}
