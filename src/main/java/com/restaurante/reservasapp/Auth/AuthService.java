package com.restaurante.reservasapp.Auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.restaurante.reservasapp.Entity.Rol;
import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.Jwt.JwtService;
import com.restaurante.reservasapp.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getContrasena()));

        UsuarioEntity user = userRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!user.isActivo()) {
            throw new DisabledException("Esta cuenta ha sido desactivada por el equipo de administración.");
        }

        return AuthResponse.builder()
                .token(jwtService.getToken(user))
                .usuarioId(user.getId())
                .nombre(user.getNombre())
                .rol(user.getRol().name())
                .build();
    }

    // Registro público normal desde tu página web (asigna CLIENTE por defecto)
    public AuthResponse register(RegisterRequest request) {
        if (request.getContrasena() == null || request.getContrasena().length() < 8) {
            throw new RuntimeException("La contraseña debe tener al menos 8 caracteres");
        }

        if (userRepository.findByCorreo(request.getCorreo()).isPresent()) {
            throw new RuntimeException("El correo ya está registrado");
        }

        UsuarioEntity user = UsuarioEntity.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .correo(request.getCorreo().trim().toLowerCase())
                .contrasena(passwordEncoder.encode(request.getContrasena()))
                .direccion(request.getDireccion())
                .telefono(request.getTelefono())
                .rol(Rol.CLIENTE)
                .activo(true)
                .build();

        UsuarioEntity savedUser = userRepository.save(user);

        return AuthResponse.builder()
                .token(jwtService.getToken(savedUser))
                .usuarioId(savedUser.getId())
                .nombre(savedUser.getNombre())
                .rol(savedUser.getRol().name())
                .build();
    }

    // Carga masiva
    public void registerBulk(RegisterRequest request) {
        if (userRepository.existsById(request.getId())
                || userRepository.findByCorreo(request.getCorreo()).isPresent()) {
            System.out.println("El usuario ya existe (ID o Correo): " + request.getCorreo());
            return;
        }

        UsuarioEntity user = UsuarioEntity.builder()
                .id(request.getId())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .correo(request.getCorreo().trim().toLowerCase())
                .contrasena(passwordEncoder.encode(request.getContrasena()))
                .direccion(request.getDireccion())
                .telefono(request.getTelefono())
                .rol(Rol.valueOf(request.getRol().toUpperCase()))
                .activo(true)
                .build();

        userRepository.save(user);
    }
}
