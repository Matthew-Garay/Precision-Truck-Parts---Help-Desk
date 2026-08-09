# Solución de Problemas con PDFs - PrecisionTrucks HelpDesk

**Guía completa para resolver problemas de visualización de PDFs.**

---

## Tabla de Contenidos

1. [Problemas Comunes](#problemas-comunes)
2. [Soluciones Paso a Paso](#soluciones-paso-a-paso)
3. [Configuración de Servidor](#configuración-de-servidor)
4. [Configuración de Frontend](#configuración-de-frontend)
5. [Verificación de Archivos](#verificación-de-archivos)
6. [Regeneración de Portadas](#regeneración-de-portadas)
7. [Debugging](#debugging)

---

## Problemas Comunes

### 1. PDFs no cargan en el visor

**Síntomas**:
- Página en blanco al abrir manual
- Error 404 en consola
- Timeout al cargar

**Causas posibles**:
- Archivo PDF no existe
- Permisos incorrectos
- Ruta incorrecta en BD
- CORS bloqueado

### 2. Portadas no se generan

**Síntomas**:
- Imagen de portada no aparece
- Error al subir manual
- Portada en blanco

**Causas posibles**:
- Librería PDF no instalada
- Permisos de escritura insuficientes
- Espacio en disco bajo

### 3. Descarga de PDFs no funciona

**Síntomas**:
- Botón descargar no responde
- Error 500 al descargar
- Archivo corrupto descargado

**Causas posibles**:
- Ruta incorrecta
- Permisos de lectura insuficientes
- Archivo eliminado

### 4. Búsqueda en PDFs no funciona

**Síntomas**:
- Búsqueda no encuentra texto
- Búsqueda muy lenta
- Resultados incorrectos

**Causas posibles**:
- PDF sin texto (solo imágenes)
- Índice no generado
- Librería de búsqueda no configurada

---

## Soluciones Paso a Paso

### Solución 1: Verificar Estructura de Carpetas

```bash
# Verificar que existen las carpetas
ls -la storage/

# Debe mostrar:
# drwxr-xr-x Manuales
# drwxr-xr-x Portadas
# drwxr-xr-x Evidencias_Tickets
# drwxr-xr-x Fotos de Perfil
# drwxr-xr-x Insumos
```

**Si faltan carpetas, crearlas**:

```bash
mkdir -p storage/Manuales
mkdir -p storage/Portadas
mkdir -p storage/Evidencias_Tickets
mkdir -p storage/Fotos\ de\ Perfil
mkdir -p storage/Insumos
```

### Solución 2: Verificar Permisos

```bash
# Linux/Mac - Dar permisos correctos
chmod 755 storage/
chmod 755 storage/Manuales/
chmod 755 storage/Portadas/
chmod 644 storage/Manuales/*
chmod 644 storage/Portadas/*

# Verificar permisos
ls -la storage/Manuales/
```

**Salida esperada**:
```
-rw-r--r-- usuario grupo 12345 Aug 7 10:30 manual_1.pdf
-rw-r--r-- usuario grupo 54321 Aug 7 11:00 manual_2.pdf
```

### Solución 3: Verificar Rutas en Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p precision_helpdesk

# Ver rutas de manuales
SELECT id, nombre, ruta_archivo, ruta_portada FROM manuales;

# Ejemplo de salida esperada:
# id | nombre | ruta_archivo | ruta_portada
# 1 | Manual 1 | storage/Manuales/manual_1.pdf | storage/Portadas/manual_1_portada.jpg
```

**Si las rutas son incorrectas, actualizar**:

```sql
UPDATE manuales 
SET ruta_archivo = CONCAT('storage/Manuales/', SUBSTRING_INDEX(ruta_archivo, '/', -1))
WHERE ruta_archivo NOT LIKE 'storage/Manuales/%';
```

### Solución 4: Verificar Configuración de CORS

**En `src/Backend/Middlewares/security.js`**:

```javascript
const corsOptions = {
 origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
 credentials: true,
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
 allowedHeaders: ['Content-Type', 'Authorization'],
 exposedHeaders: ['Content-Disposition', 'Content-Length']
};

app.use(cors(corsOptions));
```

**En `.env`**:

```env
CORS_ORIGIN=http://localhost:5173
```

### Solución 5: Verificar Rutas de API

**En `src/Backend/Routes/manualesRoutes.js`**:

```javascript
// Ruta para obtener PDF
router.get('/:id/descargar', authMiddleware, async (req, res) => {
 try {
 const manual = await Manual.findById(req.params.id);
 
 if (!manual) {
 return res.status(404).json({ error: 'Manual no encontrado' });
 }

 // Verificar que el archivo existe
 const filePath = path.join(process.cwd(), manual.ruta_archivo);
 
 if (!fs.existsSync(filePath)) {
 return res.status(404).json({ error: 'Archivo no encontrado' });
 }

 // Enviar archivo
 res.download(filePath, `${manual.nombre}.pdf`);
 } catch (error) {
 res.status(500).json({ error: error.message });
 }
});

// Ruta para servir PDF (visualización)
router.get('/:id/ver', authMiddleware, async (req, res) => {
 try {
 const manual = await Manual.findById(req.params.id);
 
 if (!manual) {
 return res.status(404).json({ error: 'Manual no encontrado' });
 }

 const filePath = path.join(process.cwd(), manual.ruta_archivo);
 
 if (!fs.existsSync(filePath)) {
 return res.status(404).json({ error: 'Archivo no encontrado' });
 }

 // Enviar con headers correctos
 res.setHeader('Content-Type', 'application/pdf');
 res.setHeader('Content-Disposition', 'inline');
 res.sendFile(filePath);
 } catch (error) {
 res.status(500).json({ error: error.message });
 }
});
```

### Solución 6: Verificar Configuración de Frontend

**En `src/Frontend/services/manualesService.js`**:

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const manualesService = {
 // Obtener lista de manuales
 async getAll(filters = {}) {
 try {
 const response = await axios.get(`${API_URL}/manuales`, {
 params: filters,
 headers: {
 'Authorization': `Bearer ${localStorage.getItem('token')}`
 }
 });
 return response.data;
 } catch (error) {
 throw error.response?.data || error;
 }
 },

 // Obtener manual por ID
 async getById(id) {
 try {
 const response = await axios.get(`${API_URL}/manuales/${id}`, {
 headers: {
 'Authorization': `Bearer ${localStorage.getItem('token')}`
 }
 });
 return response.data;
 } catch (error) {
 throw error.response?.data || error;
 }
 },

 // Descargar PDF
 async descargar(id) {
 try {
 const response = await axios.get(`${API_URL}/manuales/${id}/descargar`, {
 headers: {
 'Authorization': `Bearer ${localStorage.getItem('token')}`
 },
 responseType: 'blob'
 });
 
 // Crear blob y descargar
 const url = window.URL.createObjectURL(new Blob([response.data]));
 const link = document.createElement('a');
 link.href = url;
 link.setAttribute('download', `manual_${id}.pdf`);
 document.body.appendChild(link);
 link.click();
 link.parentNode.removeChild(link);
 } catch (error) {
 throw error.response?.data || error;
 }
 },

 // Obtener URL para visualización
 getViewUrl(id) {
 return `${API_URL}/manuales/${id}/ver`;
 }
};
```

---

## Configuración de Servidor

### Instalación de Dependencias Necesarias

```bash
# Instalar librerías para manejo de PDFs
npm install pdf-parse pdfkit sharp

# Instalar librerías de seguridad
npm install helmet cors express-rate-limit
```

### Configuración de Multer (Subida de Archivos)

**En `src/Backend/Middlewares/uploadManuales.js`**:

```javascript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear carpeta si no existe
const uploadDir = 'storage/Manuales';
if (!fs.existsSync(uploadDir)) {
 fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar almacenamiento
const storage = multer.diskStorage({
 destination: (req, file, cb) => {
 cb(null, uploadDir);
 },
 filename: (req, file, cb) => {
 // Generar nombre único
 const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
 cb(null, 'manual-' + uniqueSuffix + path.extname(file.originalname));
 }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
 // Solo permitir PDFs
 if (file.mimetype === 'application/pdf') {
 cb(null, true);
 } else {
 cb(new Error('Solo se permiten archivos PDF'), false);
 }
};

// Configurar multer
const upload = multer({
 storage: storage,
 fileFilter: fileFilter,
 limits: {
 fileSize: 50 * 1024 * 1024 // 50 MB
 }
});

export default upload;
```

### Configuración de Generación de Portadas

**En `src/Backend/utils/generarPortada.js`**:

```javascript
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Genera portada de un PDF
 * @param {string} rutaPDF - Ruta del archivo PDF
 * @param {string} rutaPortada - Ruta donde guardar la portada
 * @returns {Promise<string>} Ruta de la portada generada
 */
export async function generarPortada(rutaPDF, rutaPortada) {
 try {
 // Verificar que el PDF existe
 if (!fs.existsSync(rutaPDF)) {
 throw new Error(`Archivo PDF no encontrado: ${rutaPDF}`);
 }

 // Crear carpeta de portadas si no existe
 const portadasDir = path.dirname(rutaPortada);
 if (!fs.existsSync(portadasDir)) {
 fs.mkdirSync(portadasDir, { recursive: true });
 }

 // Generar portada usando la primera página del PDF
 // Nota: Requiere ghostscript instalado en el sistema
 const { execSync } = await import('child_process');
 
 try {
 execSync(`gs -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=jpeg -dFirstPage=1 -dLastPage=1 -r150 -sOutputFile="${rutaPortada}" "${rutaPDF}"`);
 
 // Redimensionar portada
 await sharp(rutaPortada)
 .resize(300, 400, {
 fit: 'cover',
 position: 'center'
 })
 .toFile(rutaPortada);

 return rutaPortada;
 } catch (error) {
 // Si ghostscript no está disponible, crear portada genérica
 console.warn('Ghostscript no disponible, creando portada genérica');
 return await crearPortadaGenerica(rutaPortada);
 }
 } catch (error) {
 console.error('Error generando portada:', error);
 throw error;
 }
}

/**
 * Crea una portada genérica si no se puede extraer del PDF
 */
async function crearPortadaGenerica(rutaPortada) {
 const doc = new PDFDocument({
 size: [300, 400]
 });

 const stream = fs.createWriteStream(rutaPortada);
 doc.pipe(stream);

 // Fondo
 doc.rect(0, 0, 300, 400).fill('#1e40af');

 // Texto
 doc.fontSize(24)
 .fillColor('#ffffff')
 .text('Manual Técnico', 20, 150, { width: 260, align: 'center' });

 doc.fontSize(14)
 .text('PrecisionTrucks', 20, 250, { width: 260, align: 'center' });

 doc.end();

 return new Promise((resolve, reject) => {
 stream.on('finish', () => resolve(rutaPortada));
 stream.on('error', reject);
 });
}
```

---

## Configuración de Frontend

### Componente Visor de PDF

**En `src/Frontend/components/Manuales/PDFViewer.jsx`**:

```javascript
import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configurar worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Componente para visualizar PDFs
 * @param {string} url - URL del PDF
 * @param {string} titulo - Título del documento
 */
function PDFViewer({ url, titulo }) {
 const [numPages, setNumPages] = useState(null);
 const [pageNumber, setPageNumber] = useState(1);
 const [scale, setScale] = useState(1);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 function onDocumentLoadSuccess({ numPages }) {
 setNumPages(numPages);
 setLoading(false);
 }

 function onDocumentLoadError(error) {
 setError(error.message);
 setLoading(false);
 }

 const handlePrevPage = () => {
 setPageNumber(prev => Math.max(prev - 1, 1));
 };

 const handleNextPage = () => {
 setPageNumber(prev => Math.min(prev + 1, numPages));
 };

 const handleZoomIn = () => {
 setScale(prev => Math.min(prev + 0.2, 2));
 };

 const handleZoomOut = () => {
 setScale(prev => Math.max(prev - 0.2, 0.5));
 };

 const handleDownload = () => {
 const link = document.createElement('a');
 link.href = url;
 link.download = `${titulo}.pdf`;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 if (error) {
 return (
 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
 <p className="text-red-800">Error al cargar PDF: {error}</p>
 </div>
 );
 }

 return (
 <div className="flex flex-col h-full bg-gray-100">
 {/* Barra de herramientas */}
 <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
 <h2 className="text-lg font-semibold">{titulo}</h2>
 
 <div className="flex items-center gap-4">
 {/* Navegación */}
 <button
 onClick={handlePrevPage}
 disabled={pageNumber <= 1}
 className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
 >
 Anterior
 </button>
 
 <span className="text-sm font-medium">
 Página {pageNumber} de {numPages || '...'}
 </span>
 
 <button
 onClick={handleNextPage}
 disabled={pageNumber >= numPages}
 className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
 >
 Siguiente ->
 </button>

 {/* Zoom */}
 <button
 onClick={handleZoomOut}
 className="px-3 py-2 bg-gray-200 rounded"
 >
 −
 </button>
 
 <span className="text-sm font-medium w-12 text-center">
 {Math.round(scale * 100)}%
 </span>
 
 <button
 onClick={handleZoomIn}
 className="px-3 py-2 bg-gray-200 rounded"
 >
 +
 </button>

 {/* Descargar */}
 <button
 onClick={handleDownload}
 className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
 >
 Descargar
 </button>
 </div>
 </div>

 {/* Visor */}
 <div className="flex-1 overflow-auto flex justify-center items-start p-4">
 {loading && <p className="text-gray-600">Cargando PDF...</p>}
 
 {!loading && (
 <Document
 file={url}
 onLoadSuccess={onDocumentLoadSuccess}
 onLoadError={onDocumentLoadError}
 loading={<p>Cargando...</p>}
 >
 <Page
 pageNumber={pageNumber}
 scale={scale}
 renderTextLayer={true}
 renderAnnotationLayer={true}
 />
 </Document>
 )}
 </div>
 </div>
 );
}

export default PDFViewer;
```

---

## Verificación de Archivos

### Script de Verificación

**En `src/Backend/scripts/verificarPDFs.js`**:

```javascript
import fs from 'fs';
import path from 'path';
import { query } from '../Config/db.js';

/**
 * Verifica integridad de archivos PDF
 */
async function verificarPDFs() {
 console.log(' Verificando integridad de PDFs...\n');

 try {
 // Obtener manuales de BD
 const manuales = await query('SELECT id, nombre, ruta_archivo, ruta_portada FROM manuales');

 let errores = 0;
 let advertencias = 0;

 for (const manual of manuales) {
 console.log(`\n Manual: ${manual.nombre}`);
 console.log(` ID: ${manual.id}`);

 // Verificar PDF
 const rutaPDF = path.join(process.cwd(), manual.ruta_archivo);
 if (fs.existsSync(rutaPDF)) {
 const stats = fs.statSync(rutaPDF);
 console.log(` PDF existe (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
 } else {
 console.log(` PDF NO EXISTE: ${rutaPDF}`);
 errores++;
 }

 // Verificar portada
 const rutaPortada = path.join(process.cwd(), manual.ruta_portada);
 if (fs.existsSync(rutaPortada)) {
 const stats = fs.statSync(rutaPortada);
 console.log(` Portada existe (${(stats.size / 1024).toFixed(2)} KB)`);
 } else {
 console.log(` Portada NO EXISTE: ${rutaPortada}`);
 advertencias++;
 }

 // Verificar permisos
 try {
 fs.accessSync(rutaPDF, fs.constants.R_OK);
 console.log(` Permisos de lectura OK`);
 } catch {
 console.log(` Sin permisos de lectura`);
 errores++;
 }
 }

 console.log(`\n\n Resumen:`);
 console.log(` Total de manuales: ${manuales.length}`);
 console.log(` Errores: ${errores}`);
 console.log(` Advertencias: ${advertencias}`);

 if (errores === 0 && advertencias === 0) {
 console.log(`\n Todos los PDFs están OK`);
 }
 } catch (error) {
 console.error('Error:', error);
 }
}

verificarPDFs();
```

**Ejecutar verificación**:

```bash
node src/Backend/scripts/verificarPDFs.js
```

---

## Regeneración de Portadas

### Script de Regeneración

**En `src/Backend/scripts/generarPortadasExistentes.js`**:

```javascript
import fs from 'fs';
import path from 'path';
import { query } from '../Config/db.js';
import { generarPortada } from '../utils/generarPortada.js';

/**
 * Regenera portadas de todos los PDFs
 */
async function regenerarPortadas() {
 console.log(' Regenerando portadas de PDFs...\n');

 try {
 const manuales = await query('SELECT id, nombre, ruta_archivo, ruta_portada FROM manuales');

 let exitosas = 0;
 let fallidas = 0;

 for (const manual of manuales) {
 try {
 console.log(`Procesando: ${manual.nombre}...`);
 
 const rutaPDF = path.join(process.cwd(), manual.ruta_archivo);
 const rutaPortada = path.join(process.cwd(), manual.ruta_portada);

 if (!fs.existsSync(rutaPDF)) {
 console.log(` PDF no encontrado: ${rutaPDF}`);
 fallidas++;
 continue;
 }

 await generarPortada(rutaPDF, rutaPortada);
 console.log(` Portada generada`);
 exitosas++;
 } catch (error) {
 console.log(` Error: ${error.message}`);
 fallidas++;
 }
 }

 console.log(`\n Resumen:`);
 console.log(` Exitosas: ${exitosas}`);
 console.log(` Fallidas: ${fallidas}`);
 } catch (error) {
 console.error('Error:', error);
 }
}

regenerarPortadas();
```

**Ejecutar regeneración**:

```bash
node src/Backend/scripts/generarPortadasExistentes.js
```

---

## Debugging

### Habilitar Logs Detallados

**En `.env`**:

```env
DEBUG=true
LOG_LEVEL=debug
```

### Revisar Logs del Servidor

```bash
# Ver logs en tiempo real
tail -f logs/server.log

# Ver solo errores
grep ERROR logs/server.log

# Ver logs de PDFs
grep PDF logs/server.log
```

### Verificar en Consola del Navegador

1. Abrir DevTools: `F12`
2. Ir a pestaña **Console**
3. Buscar errores de red (Network tab)
4. Verificar headers de respuesta

### Verificar Solicitudes HTTP

```bash
# Usando curl
curl -H "Authorization: Bearer TOKEN" \
 http://localhost:3001/api/manuales/1/ver \
 -v

# Usando wget
wget --header="Authorization: Bearer TOKEN" \
 http://localhost:3001/api/manuales/1/ver \
 -O manual.pdf
```

---

## Checklist de Verificación

- [ ] Carpetas de almacenamiento existen
- [ ] Permisos correctos (755 para carpetas, 644 para archivos)
- [ ] Rutas en BD son correctas
- [ ] CORS configurado correctamente
- [ ] Dependencias instaladas (pdf-parse, pdfkit, sharp)
- [ ] Archivos PDF existen en storage/Manuales/
- [ ] Portadas existen en storage/Portadas/
- [ ] API responde correctamente
- [ ] Frontend puede descargar PDFs
- [ ] Visor de PDF funciona

---

**Última actualización**: Agosto 2024
**Versión**: 1.0.0
