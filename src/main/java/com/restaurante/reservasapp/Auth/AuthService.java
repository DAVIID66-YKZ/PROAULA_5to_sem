package com.restaurante.reservasapp.Auth;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.restaurante.reservasapp.Entity.Rol;
import com.restaurante.reservasapp.Entity.UsuarioEntity;
import com.restaurante.reservasapp.Entity.VerificacionEntity;
import com.restaurante.reservasapp.Jwt.JwtService;
import com.restaurante.reservasapp.repository.UsuarioRepository;
import com.restaurante.reservasapp.repository.VerificacionRepository;
import com.restaurante.reservasapp.services.EmailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final VerificacionRepository verificacionRepository;
    private final EmailService emailService;

    public AuthResponse login(LoginRequest request) {

        String correo = request.getCorreo().trim().toLowerCase();

        UsuarioEntity user = userRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!user.isActivo()) {
            throw new DisabledException("Esta cuenta ha sido desactivada por el equipo de administración.");
        }

        if (!user.isCorreoVerificado()) {
            throw new RuntimeException(
                    "El correo electrónico no ha sido verificado. Por favor, verifica tu correo antes de iniciar sesión.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(correo, request.getContrasena()));

        return AuthResponse.builder()
                .token(jwtService.getToken(user))
                .usuarioId(user.getId())
                .nombre(user.getNombre())
                .rol(user.getRol().name())
                .build();
    }

    // Registro público normal desde tu página web (asigna CLIENTE por defecto)
    public Map<String, Object> register(RegisterRequest request) {
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
                .correoVerificado(false)
                .build();

        UsuarioEntity savedUser = userRepository.save(user);
        crearYENviarCodigo(savedUser);

        return Map.of(
                "message", "Registro realizado. Hemos enviado un código de verificación a tu correo.",
                "correo", savedUser.getCorreo(),
                "usuarioId", savedUser.getId(),
                "requiereVerification", true);
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
                .correoVerificado(true)
                .build();

        userRepository.save(user);
    }

    // Verificación de correo electrónico
    private static final SecureRandom RANDOM = new SecureRandom();

    private static final int MAX_INTENTOS = 5;
    private static final int DURACION_CODIGO_MINUTOS = 5;

    /* GENERACIÓN DE CÓDIGO DE VERIFICACIÓN */
    private String generarCodigo() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    /* GUARDAR CÓDIGO DE VERIFICACIÓN Y ENVIAR CORREO */
    private void crearYENviarCodigo(UsuarioEntity usuario) {
        String codigo = generarCodigo();

        VerificacionEntity verificacion = VerificacionEntity.builder()
                .usuarioId(usuario.getId())
                .codigoHash(passwordEncoder.encode(codigo))
                .fechaCreacion(Instant.now())
                .fechaExpiracion(
                        Instant.now().plus(DURACION_CODIGO_MINUTOS,
                                ChronoUnit.MINUTES))
                .intentos(0)
                .build();

        verificacionRepository.save(verificacion);

        emailService.enviarCodigoVerificacion(usuario.getCorreo(), codigo);
    }

    /* VERIFICACIÓN DE CÓDIGO ENVIADO */
    public void verificarCorreo(String correo, String codigo) {
        String correoNormalizado = correo.trim().toLowerCase();

        UsuarioEntity usuario = userRepository.findByCorreo(correoNormalizado)
                .orElseThrow(() -> new RuntimeException("No existe un usuario con ese correo"));

        if (usuario.isCorreoVerificado()) {
            throw new RuntimeException("El correo ya ha sido verificado");
        }

        VerificacionEntity verificacion = verificacionRepository.findById(usuario.getId())
                .orElseThrow(
                        () -> new RuntimeException("No se ha generado un código de verificación para este usuario"));

        // Comprobar expiración del código
        if (Instant.now().isAfter(verificacion.getFechaExpiracion())) {
            verificacionRepository.deleteById(usuario.getId());
            throw new RuntimeException("El código de verificación ha expirado. Por favor, solicita uno nuevo.");
        }

        // Comprobar intentos
        if (verificacion.getIntentos() >= MAX_INTENTOS) {
            verificacionRepository.deleteById(usuario.getId());
            throw new RuntimeException(
                    "Se ha superado el número máximo de intentos. Por favor, solicita un nuevo código.");
        }

        // Validar código
        if (!passwordEncoder.matches(codigo, verificacion.getCodigoHash())) {

            verificacion.setIntentos(verificacion.getIntentos() + 1);

            verificacionRepository.save(verificacion);

            if (verificacion.getIntentos() >= MAX_INTENTOS) {
                verificacionRepository.deleteById(usuario.getId());

                throw new RuntimeException(
                        "Se ha superado el número máximo de intentos. Por favor, solicita un nuevo código.");

            } else {
                throw new RuntimeException("Código de verificación incorrecto. Intentos restantes: "
                        + (MAX_INTENTOS - verificacion.getIntentos()));
            }
        }
        // Correo verficado Correctamente
        usuario.setCorreoVerificado(true);
        userRepository.save(usuario);

        // Eliminar codigo utilizado
        verificacionRepository.deleteById(usuario.getId());

        // Enviar correo de confirmación
        emailService.enviarConfirmacionRegistro(
                usuario.getCorreo(),
                usuario.getNombre());
    }

    public void reenviarCodigo(String correo) {

        String correoNormalizado = correo.trim().toLowerCase();

        UsuarioEntity usuario = userRepository.findByCorreo(correoNormalizado)
                .orElseThrow(() -> new RuntimeException("No existe un usuario con ese correo."));

        if (usuario.isCorreoVerificado()) {
            throw new RuntimeException("Este correo ya se encuentra verificado.");
        }

        VerificacionEntity verificacion = verificacionRepository
                .findById(usuario.getId())
                .orElse(null);

        // Evitar que se soliciten códigos continuamente.
        if (verificacion != null) {

            Instant tiempoEspera = verificacion.getFechaCreacion()
                    .plus(60, ChronoUnit.SECONDS);

            if (Instant.now().isBefore(tiempoEspera)) {
                throw new RuntimeException(
                        "Debes esperar 60 segundos antes de solicitar otro código.");
            }
        }

        crearYENviarCodigo(usuario);
    }
}
