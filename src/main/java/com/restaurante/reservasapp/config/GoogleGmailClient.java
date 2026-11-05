package com.restaurante.reservasapp.config;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import io.github.cdimascio.dotenv.Dotenv;

@Component
public class GoogleGmailClient {

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";

    private static final String GMAIL_URL = "https://www.googleapis.com/gmail/v1/users/me/messages/send";

    private final String gmailUsername;
    private final String clientId;
    private final String clientSecret;
    private final String refreshToken;

    private final RestClient restClient;

    public GoogleGmailClient() {

        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        this.gmailUsername = obtenerVariable(dotenv, "GMAIL_USERNAME");
        this.clientId = obtenerVariable(dotenv, "GMAIL_CLIENT_ID");
        this.clientSecret = obtenerVariable(dotenv, "GMAIL_CLIENT_SECRET");
        this.refreshToken = obtenerVariable(dotenv, "GMAIL_REFRESH_TOKEN");

        if (gmailUsername == null || gmailUsername.isBlank()
                || clientId == null || clientId.isBlank()
                || clientSecret == null || clientSecret.isBlank()
                || refreshToken == null || refreshToken.isBlank()) {

            throw new IllegalStateException(
                    "Las variables de entorno de Gmail no están configuradas correctamente.");
        }
        this.restClient = RestClient.create();
    }

    private String obtenerVariable(Dotenv dotenv, String nombre) {

        String valor = dotenv.get(nombre);

        if (valor == null || valor.isBlank()) {
            valor = System.getenv(nombre);
        }

        return valor;
    }

    public void enviarCorreoHtml(
            String destinatario,
            String asunto,
            String contenidoHtml) {

        try {

            String accessToken = obtenerAccessToken();

            String mensajeMime = construirMensajeMime(
                    destinatario,
                    asunto,
                    contenidoHtml);

            String mensajeCodificado = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(
                            mensajeMime.getBytes(StandardCharsets.UTF_8));

            restClient.post()
                    .uri(GMAIL_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + accessToken)
                    .body(Map.of("raw", mensajeCodificado))
                    .retrieve()
                    .toBodilessEntity();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Error al enviar correo mediante Gmail API", e);
        }
    }

    private String obtenerAccessToken() {

        MultiValueMap<String, String> datos = new LinkedMultiValueMap<>();

        datos.add("client_id", clientId);
        datos.add("client_secret", clientSecret);
        datos.add("refresh_token", refreshToken);
        datos.add("grant_type", "refresh_token");

        Map<?, ?> respuesta = restClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(datos)
                .retrieve()
                .body(Map.class);

        if (respuesta == null || respuesta.get("access_token") == null) {
            throw new IllegalStateException(
                    "Google no devolvió un access token");
        }

        return respuesta.get("access_token").toString();
    }

    private String construirMensajeMime(
            String destinatario,
            String asunto,
            String contenidoHtml) {

        if (destinatario == null || destinatario.isBlank()
                || destinatario.contains("\r")
                || destinatario.contains("\n")) {
            throw new IllegalArgumentException("Destinatario inválido");
        }

        if (asunto == null || asunto.contains("\r")
                || asunto.contains("\n")) {
            throw new IllegalArgumentException("Asunto inválido");
        }

        String asuntoCodificado = "=?UTF-8?B?"
                + Base64.getEncoder().encodeToString(
                        asunto.getBytes(StandardCharsets.UTF_8))
                + "?=";

        String htmlCodificado = Base64.getMimeEncoder(
                76,
                "\r\n".getBytes(StandardCharsets.US_ASCII))
                .encodeToString(
                        contenidoHtml.getBytes(StandardCharsets.UTF_8));

        return "From: " + gmailUsername + "\r\n"
                + "To: " + destinatario + "\r\n"
                + "Subject: " + asuntoCodificado + "\r\n"
                + "MIME-Version: 1.0\r\n"
                + "Content-Type: text/html; charset=UTF-8\r\n"
                + "Content-Transfer-Encoding: base64\r\n"
                + "\r\n"
                + htmlCodificado;
    }
}
