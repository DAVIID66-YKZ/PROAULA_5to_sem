package com.restaurante.reservasapp.services.impl;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLConnection;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.Base64;
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

    public static class PlatoItemPdf {
        private String id;
        private String nombre;
        private String descripcion;
        private String precioFormateado;
        private String categoria;
        private String imagenUrl;
        private boolean principal;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getNombre() {
            return nombre;
        }

        public void setNombre(String nombre) {
            this.nombre = nombre;
        }

        public String getDescripcion() {
            return descripcion;
        }

        public void setDescripcion(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getPrecioFormateado() {
            return precioFormateado;
        }

        public void setPrecioFormateado(String precioFormateado) {
            this.precioFormateado = precioFormateado;
        }

        public String getCategoria() {
            return categoria;
        }

        public void setCategoria(String categoria) {
            this.categoria = categoria;
        }

        public String getImagenUrl() {
            return imagenUrl;
        }

        public void setImagenUrl(String imagenUrl) {
            this.imagenUrl = imagenUrl;
        }

        public boolean isPrincipal() {
            return principal;
        }

        public void setPrincipal(boolean principal) {
            this.principal = principal;
        }
    }

    @Override
    public byte[] generarPdfMenu() {
        List<PlatoEntity> todosLosPlatos = platoService.listarPlatos()
                .stream()
                .filter(plato -> Boolean.TRUE.equals(plato.isDisponible()))
                .toList();

        DecimalFormatSymbols simbolos = new DecimalFormatSymbols(new Locale("es", "CO"));
        simbolos.setGroupingSeparator('.');
        DecimalFormat formatoPrecio = new DecimalFormat("$ #,##0", simbolos);

        List<PlatoItemPdf> entradas = new ArrayList<>();
        List<PlatoItemPdf> fuertes = new ArrayList<>();
        List<PlatoItemPdf> bebidas = new ArrayList<>();
        List<PlatoItemPdf> postres = new ArrayList<>();

        for (PlatoEntity entity : todosLosPlatos) {
            PlatoItemPdf item = new PlatoItemPdf();
            item.setId(entity.getId());
            item.setNombre(entity.getNombre());
            item.setDescripcion(entity.getDescripcion());
            item.setCategoria(normalizarCategoria(entity.getCategoria()));

            BigDecimal precio = entity.getPrecio() != null ? entity.getPrecio() : BigDecimal.ZERO;
            item.setPrecioFormateado(formatoPrecio.format(precio));

            String img = entity.getImgUrl();
            item.setImagenUrl(img);
            item.setPrincipal(entity.isDestacado() && img != null && !img.trim().isEmpty());

            switch (item.getCategoria()) {
                case "ENTRADAS" -> entradas.add(item);
                case "PLATOS_FUERTES" -> fuertes.add(item);
                case "BEBIDAS" -> bebidas.add(item);
                case "POSTRES" -> postres.add(item);
                default -> fuertes.add(item);
            }
        }

        // Asegurar platos principales con foto si no hay destacados manuales
        asegurarPlatosPrincipales(fuertes, 3);
        asegurarPlatosPrincipales(entradas, 3);
        asegurarPlatosPrincipales(bebidas, 2);
        asegurarPlatosPrincipales(postres, 1);

        // Pre-procesar imágenes a Base64 o URL optimizada
        optimizarImagenes(fuertes);
        optimizarImagenes(entradas);
        optimizarImagenes(bebidas);
        optimizarImagenes(postres);

        // Galería de fotos para Platos Fuertes (hasta 3 fotos)
        List<PlatoItemPdf> fuertesFotos = fuertes.stream()
                .filter(p -> p.getImagenUrl() != null && !p.getImagenUrl().isEmpty())
                .limit(3)
                .toList();

        // Galería de fotos para Entradas (hasta 3 fotos)
        List<PlatoItemPdf> entradasFotos = entradas.stream()
                .filter(p -> p.getImagenUrl() != null && !p.getImagenUrl().isEmpty())
                .limit(3)
                .toList();

        // Si ninguna entrada tenía imagen en base de datos, asignar una foto culinaria
        // para asegurar que salga entrada con foto
        if (entradasFotos.isEmpty() && !entradas.isEmpty()) {
            PlatoItemPdf primera = entradas.get(0);
            primera.setPrincipal(true);
            primera.setImagenUrl("https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80");
            optimizarImagenes(List.of(primera));
            entradasFotos = List.of(primera);
        }

        // Galería de fotos para Bebidas y Postres (hasta 3 fotos)
        List<PlatoItemPdf> bebidasPostresFotos = new ArrayList<>();
        bebidas.stream().filter(p -> p.getImagenUrl() != null && !p.getImagenUrl().isEmpty()).limit(2)
                .forEach(bebidasPostresFotos::add);
        postres.stream().filter(p -> p.getImagenUrl() != null && !p.getImagenUrl().isEmpty()).limit(1)
                .forEach(bebidasPostresFotos::add);
        if (bebidasPostresFotos.size() < 3) {
            postres.stream().filter(
                    p -> !bebidasPostresFotos.contains(p) && p.getImagenUrl() != null && !p.getImagenUrl().isEmpty())
                    .limit(3 - bebidasPostresFotos.size()).forEach(bebidasPostresFotos::add);
        }

        // Repartir en 3 columnas de texto para cada sección
        List<List<PlatoItemPdf>> fuertesCols = repartirEnColumnas(fuertes, 3);
        List<List<PlatoItemPdf>> entradasCols = repartirEnColumnas(entradas, 3);

        List<PlatoItemPdf> combinadosBebidasPostres = new ArrayList<>(bebidas);
        combinadosBebidasPostres.addAll(postres);
        List<List<PlatoItemPdf>> bebidasPostresCols = repartirEnColumnas(combinadosBebidasPostres, 3);

        Context context = new Context(Locale.forLanguageTag("es-CO"));
        context.setVariable("platos", todosLosPlatos);

        context.setVariable("fuertesCol1", fuertesCols.get(0));
        context.setVariable("fuertesCol2", fuertesCols.get(1));
        context.setVariable("fuertesCol3", fuertesCols.get(2));
        context.setVariable("fuertesFotos", fuertesFotos);

        context.setVariable("entradasCol1", entradasCols.get(0));
        context.setVariable("entradasCol2", entradasCols.get(1));
        context.setVariable("entradasCol3", entradasCols.get(2));
        context.setVariable("entradasFotos", entradasFotos);

        context.setVariable("bebidasPostresCol1", bebidasPostresCols.get(0));
        context.setVariable("bebidasPostresCol2", bebidasPostresCols.get(1));
        context.setVariable("bebidasPostresCol3", bebidasPostresCols.get(2));
        context.setVariable("bebidasPostresFotos", bebidasPostresFotos);

        String html = templateEngine.process("menu.pdf", context);

        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(output);
            return output.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            throw new IllegalStateException("Error al generar el PDF del menú", e);
        }
    }

    private String normalizarCategoria(String cat) {
        if (cat == null)
            return "PLATOS_FUERTES";
        String limpia = cat.trim().toUpperCase().replace(" ", "_");
        if (limpia.contains("ENTRADA"))
            return "ENTRADAS";
        if (limpia.contains("FUERTE") || limpia.contains("PRINCIPAL") || limpia.contains("ESPECIALIDAD"))
            return "PLATOS_FUERTES";
        if (limpia.contains("BEBIDA") || limpia.contains("COCTEL") || limpia.contains("TRAGO"))
            return "BEBIDAS";
        if (limpia.contains("POSTRE") || limpia.contains("DULCE"))
            return "POSTRES";
        return "PLATOS_FUERTES";
    }

    private void asegurarPlatosPrincipales(List<PlatoItemPdf> lista, int maxPrincipales) {
        long cuentaPrincipales = lista.stream().filter(PlatoItemPdf::isPrincipal).count();
        if (cuentaPrincipales == 0) {
            int asignados = 0;
            for (PlatoItemPdf p : lista) {
                if (p.getImagenUrl() != null && !p.getImagenUrl().trim().isEmpty()) {
                    p.setPrincipal(true);
                    asignados++;
                    if (asignados >= maxPrincipales)
                        break;
                }
            }
        }
    }

    private void optimizarImagenes(List<PlatoItemPdf> lista) {
        for (PlatoItemPdf p : lista) {
            if (p.isPrincipal() && p.getImagenUrl() != null && !p.getImagenUrl().trim().isEmpty()) {
                String convertida = convertirImagenSegura(p.getImagenUrl());
                if (convertida != null) {
                    p.setImagenUrl(convertida);
                } else {
                    p.setPrincipal(false);
                }
            }
        }
    }

    private String convertirImagenSegura(String urlOriginal) {
        try {
            String urlFinal = urlOriginal.trim();
            if (urlFinal.contains("cloudinary.com") && urlFinal.contains("/upload/")) {
                urlFinal = urlFinal.replace("/upload/", "/upload/c_fill,w_400,h_260,q_80,f_jpg/");
            }

            URI uri = new URI(urlFinal);
            URLConnection conn = uri.toURL().openConnection();
            conn.setConnectTimeout(2500);
            conn.setReadTimeout(3500);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

            try (InputStream is = conn.getInputStream()) {
                byte[] bytes = is.readAllBytes();
                if (bytes.length > 0) {
                    return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(bytes);
                }
            }
        } catch (Exception ignored) {
            return urlOriginal;
        }
        return urlOriginal;
    }

    private List<List<PlatoItemPdf>> repartirEnColumnas(List<PlatoItemPdf> items, int numCols) {
        List<List<PlatoItemPdf>> columnas = new ArrayList<>();
        for (int i = 0; i < numCols; i++) {
            columnas.add(new ArrayList<>());
        }
        if (items == null || items.isEmpty()) {
            return columnas;
        }
        for (int i = 0; i < items.size(); i++) {
            columnas.get(i % numCols).add(items.get(i));
        }
        return columnas;
    }
}
