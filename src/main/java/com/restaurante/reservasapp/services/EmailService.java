package com.restaurante.reservasapp.services;

public interface EmailService {

    void enviarCodigoVerificacion(String destinatario, String codigoVerificacion);

    void enviarConfirmacionRegistro(String destinatario, String nombre);
}
