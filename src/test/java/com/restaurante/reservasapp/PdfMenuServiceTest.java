package com.restaurante.reservasapp;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import com.restaurante.reservasapp.Entity.PlatoEntity;
import com.restaurante.reservasapp.services.PlatoService;
import com.restaurante.reservasapp.services.impl.PdfMenuServiceImpl;

public class PdfMenuServiceTest {

    private PlatoService platoService;
    private PdfMenuServiceImpl pdfMenuService;

    @BeforeEach
    void setUp() {
        platoService = mock(PlatoService.class);

        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");

        org.thymeleaf.spring6.SpringTemplateEngine templateEngine = new org.thymeleaf.spring6.SpringTemplateEngine();
        templateEngine.setTemplateResolver(resolver);

        pdfMenuService = new PdfMenuServiceImpl(platoService, templateEngine);
    }

    @Test
    void testGenerarPdfMenu() throws Exception {
        PlatoEntity p1 = new PlatoEntity("1", "Hamburguesa Clásica", "Carne artesanal con queso cheddar y papas rústicas",
                new BigDecimal("28000"), "PLATOS_FUERTES", "https://via.placeholder.com/150", true, true);

        PlatoEntity p2 = new PlatoEntity("2", "Pizza Napolitana", "Salsa pomodoro con albahaca y mozzarella fresca",
                new BigDecimal("32000"), "PLATOS_FUERTES", "", true, false);

        PlatoEntity p3 = new PlatoEntity("3", "Carpaccio de Res", "Finas láminas de res con parmesano y alcaparras",
                new BigDecimal("22000"), "ENTRADAS", "https://via.placeholder.com/150", true, true);

        PlatoEntity p4 = new PlatoEntity("4", "Bruschetta Italiana", "Pan tostado con tomate fresco y aceite de oliva",
                new BigDecimal("16000"), "ENTRADAS", "", true, false);

        PlatoEntity p5 = new PlatoEntity("5", "Cóctel Cítrico", "Ginebra con toques de pomelo y romero",
                new BigDecimal("25000"), "BEBIDAS", "https://via.placeholder.com/150", true, true);

        PlatoEntity p6 = new PlatoEntity("6", "Tiramisú Tradicional", "Café espresso, queso mascarpone y cacao puro",
                new BigDecimal("18000"), "POSTRES", "https://via.placeholder.com/150", true, true);

        when(platoService.listarPlatos()).thenReturn(List.of(p1, p2, p3, p4, p5, p6));

        byte[] pdf = pdfMenuService.generarPdfMenu();

        java.nio.file.Files.write(java.nio.file.Path.of("target/menu_preview.pdf"), pdf);

        assertNotNull(pdf, "El PDF generado no debe ser nulo");
        assertTrue(pdf.length > 500, "El PDF debe tener contenido binario válido. Tamaño: " + pdf.length);
    }
}
