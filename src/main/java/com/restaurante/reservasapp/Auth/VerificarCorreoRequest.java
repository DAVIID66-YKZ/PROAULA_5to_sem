package com.restaurante.reservasapp.Auth;

import lombok.Data;

@Data 
public class VerificarCorreoRequest {
    
    private String correo;
    private String codigo;
}
