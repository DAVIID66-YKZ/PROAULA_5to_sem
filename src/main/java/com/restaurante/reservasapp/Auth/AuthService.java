package com.restaurante.reservasapp.Auth;

import org.springframework.security.authentication.AuthenticationManager;
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
                new UsernamePasswordAuthenticationToken(
                        request.getCorreo(),
                        request.getContrasena()
                )
        );

        // Se carga el usuario desde la BD para obtener su ID real
        UsuarioEntity user = userRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return AuthResponse.builder()
                .token(jwtService.getToken(user))
                .usuarioId(user.getId()) // 🔥 Se agrega el ID a la respuesta
                .build();
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByCorreo(request.getCorreo()).isPresent()) {
            throw new RuntimeException("El correo ya está registrado");
        }

        UsuarioEntity user = UsuarioEntity.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .correo(request.getCorreo())
                .contrasena(passwordEncoder.encode(request.getContrasena()))
                .direccion(request.getDireccion())
                .telefono(request.getTelefono())
                .rol(Rol.CLIENTE)
                .build();

        // Se guarda el usuario y se captura el objeto retornado con su ID
        UsuarioEntity savedUser = userRepository.save(user);

        return AuthResponse.builder()
                .token(jwtService.getToken(savedUser))
                .usuarioId(savedUser.getId()) // 🔥 Se agrega el ID recién generado
                .build();
    }
}