package com.restaurante.reservasapp.services;

import java.util.List;
import com.restaurante.reservasapp.Entity.UsuarioEntity;

public interface UsuarioService {

    public UsuarioEntity guardarUsuario(UsuarioEntity usuario);

    public UsuarioEntity obtenerUsuario(String id);

    public void eliminarUsuario(String id);

    public List<UsuarioEntity> listarUsuarios();

    void cambiarPassword(String id, String passwordActual, String passwordNueva);
   
    public UsuarioEntity actualizarPerfil(String id, UsuarioEntity datosNuevos);
}