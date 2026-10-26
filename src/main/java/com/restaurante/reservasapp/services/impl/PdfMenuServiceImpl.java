package com.restaurante.reservasapp.services.impl;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import com.lowagie.text.DocumentException;
import com.restaurante.reservasapp.Entity.PlatoEntity;
import com.restaurante.reservasapp.services.PdfMenuService;
import com.restaurante.reservasapp.services.PlatoService;

@Service 
public class PdfMenuServiceImpl implements PdfMenuService {

    private final PlatoService platoService;
    private final TemplateEngine templateEngine;

    public PdfMenuServiceImpl(PlatoService platoService, TemplateEngine templateEngine) {
        this.platoService = platoService;
        this.templateEngine = templateEngine;
    }

    @Override
    public byte[] generarPdfMenu() {


        List<PlatoEntity> platos = platoService.listarPlatos()
        .stream()
        .filter(plato -> Boolean.TRUE.equals(plato.isDisponible()))
        .toList();

        Context context = new Context(Locale.forLanguageTag("es-CO"));
        context.setVariable("platos", platos);

        String html = templateEngine.process("menu.pdf", context);

        try (ByteArrayOutputStream output = new ByteArrayOutputStream()){
            ITextRenderer renderer = new ITextRenderer();

            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(output);

            return output.toByteArray();
            
        }catch (DocumentException | java.io.IOException e) {
            throw new IllegalStateException("Error al generar el PDF del menú", e);
        }
    }
}
