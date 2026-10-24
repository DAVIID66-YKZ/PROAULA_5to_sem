package com.restaurante.reservasapp.services;

import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;



public interface CloudinaryService {
    String subirImagen(MultipartFile archivo) throws IOException;
}
