package com.restaurante.reservasapp.services.impl;

import java.io.IOException;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.restaurante.reservasapp.services.CloudinaryService;



@Service 
public class CloudinaryServiceImpl implements CloudinaryService{


    private final Cloudinary cloudinary;

    public CloudinaryServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public String subirImagen(MultipartFile archivo) throws IOException {
        if (archivo == null || archivo.isEmpty()){
            throw new IllegalArgumentException("El archivo no puede estar vacío.");
        }

        Map<?, ?> resultado = cloudinary.uploader().upload(
            archivo.getBytes(),
            ObjectUtils.asMap(
                "folder", "reservas-app/platos",
                "resource_type", "image"

            ));
        
        Object url = resultado.get("secure_url");
        if (url == null) {
            throw new IOException("No se pudo obtener la URL de la imagen subida.");
        }
        return url.toString();
    }
    
}
