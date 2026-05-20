package com.restaurante.reservasapp.Auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String id; // <-- Clave para recibir USR0001, USR0002, etc.
    private String nombre;
    private String apellido;
    private String direccion;
    private String rol; // O el tipo 'Rol' si es un enum
    private String telefono;
    private String contrasena;
    private String correo;
}