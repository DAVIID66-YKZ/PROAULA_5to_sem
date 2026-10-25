package com.restaurante.reservasapp.services;

import java.util.List;
import com.restaurante.reservasapp.Entity.Rol;
import com.restaurante.reservasapp.Entity.UsuarioEntity;

public interface UsuarioService {

    UsuarioEntity guardarUsuario(UsuarioEntity usuario);

    UsuarioEntity obtenerUsuario(String id);

    void eliminarUsuario(String id);

    List<UsuarioEntity> listarUsuarios();

    void cambiarPassword(String id, String passwordActual, String passwordNueva);
   
    UsuarioEntity actualizarPerfil(String id, UsuarioEntity datosNuevos);

    UsuarioEntity crearUsuarioPorAdmin(UsuarioEntity usuario);

    UsuarioEntity actualizarUsuarioPorAdmin(String id, UsuarioEntity datosNuevos);

    UsuarioEntity cambiarEstadoUsuario(String id, boolean activo);

    UsuarioEntity cambiarRolUsuario(String id, Rol rol);
}
