package com.restaurante.reservasapp.services.impl;

import org.springframework.stereotype.Service;

import com.restaurante.reservasapp.config.GoogleGmailClient;
import com.restaurante.reservasapp.services.EmailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final GoogleGmailClient gmailClient;

    @Override
    public void enviarCodigoVerificacion(String destinatario, String codigoVerificacion) {
        String contenido = """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                </head>
                <body style="
                    margin: 0;
                    padding: 30px;
                    background-color: #0d0d0d;
                    font-family: Arial, sans-serif;
                    color: #ffffff;
                ">

                    <div style="
                        max-width: 500px;
                        margin: auto;
                        padding: 35px;
                        background-color: #171717;
                        border: 1px solid #b89228;
                        border-radius: 12px;
                        text-align: center;
                    ">

                        <h1 style="
                            color: #d4af37;
                            letter-spacing: 4px;
                            margin-bottom: 10px;
                        ">
                            GESTREST
                        </h1>

                        <h2 style="color: #ffffff;">
                            Verificación de correo
                        </h2>

                        <p style="
                            color: #cccccc;
                            font-size: 15px;
                            line-height: 1.6;
                        ">
                            Gracias por registrarte en GESTREST.
                            Para completar tu registro, utiliza el
                            siguiente código de verificación:
                        </p>

                        <div style="
                            margin: 30px 0;
                            padding: 20px;
                            background-color: #222222;
                            border: 1px solid #d4af37;
                            border-radius: 8px;
                        ">
                            <span style="
                                color: #d4af37;
                                font-size: 32px;
                                font-weight: bold;
                                letter-spacing: 8px;
                            ">
                                %s
                            </span>
                        </div>

                        <p style="
                            color: #cccccc;
                            font-size: 14px;
                        ">
                            Este código tiene una validez de 5 minutos.
                        </p>

                        <p style="
                            color: #888888;
                            font-size: 12px;
                            margin-top: 30px;
                        ">
                            Si no solicitaste este registro,
                            puedes ignorar este mensaje.
                        </p>

                    </div>

                </body>
                </html>
                """.formatted(codigoVerificacion);

        try {
            gmailClient.enviarCorreoHtml(
                    destinatario,
                    "Verifica tu correo electronico - GESTREST",
                    contenido);
        } catch (Exception e) {
            throw new RuntimeException(
                    "No fue posible enviar el correo de verificación", e);
        }
    }

    @Override
    public void enviarConfirmacionRegistro(String destinatario, String nombre) {

        String contenido = """
                <html>
                <body style="margin:0; padding:30px; background-color:#0d0d0d;
                             font-family:Arial,sans-serif; color:#ffffff;">

                    <div style="max-width:550px; margin:auto; padding:35px;
                                background-color:#121212; border:1px solid #d4af37;
                                border-radius:12px; text-align:center;">

                        <h1 style="color:#d4af37;">GESTREST</h1>

                        <h2>¡Cuenta verificada exitosamente!</h2>

                        <p>Hola <strong>%s</strong>,</p>

                        <p>
                            Te confirmamos que tu dirección de correo electrónico
                            ha sido verificada correctamente.
                        </p>

                        <p>
                            Tu cuenta GESTREST ya está lista para utilizarse.
                            Ahora puedes iniciar sesión y disfrutar de nuestros servicios.
                        </p>

                        <div style="margin-top:30px; padding:15px;
                                    background-color:#1b1b1b; border-radius:8px;">
                            <span style="color:#d4af37; font-weight:bold;">
                                Verificación completada
                            </span>
                        </div>

                        <p style="margin-top:30px; color:#999; font-size:12px;">
                            Gracias por registrarte en GESTREST.
                        </p>

                    </div>
                </body>
                </html>
                """.formatted(escaparHtml(nombre));

        try {
            gmailClient.enviarCorreoHtml(
                    destinatario,
                    "¡Tu cuenta GESTREST ha sido verificada!",
                    contenido);
        } catch (Exception e) {
            throw new RuntimeException(
                    "No se pudo enviar el correo de confirmación.", e);
        }
    }

    private String escaparHtml(String texto) {
        if (texto == null) {
            return "";
        }

        return texto
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

}
