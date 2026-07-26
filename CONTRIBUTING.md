# Guía de Contribución

Gracias por tu interés en contribuir a PrecisionTrucks HelpDesk.

---

## Configuración del entorno

```bash
git clone <url-del-repo>
cd PrecisionTrucks_HelpDesk
npm install
cp .env.example .env
# Editar .env con tus valores locales
mysql -u root -p < docs/database.sql
npm run dev:all
```

---

## Flujo de trabajo con Git

```
main          ← rama estable, solo merges desde develop
develop       ← integración continua
feature/xxx   ← nuevas funcionalidades
fix/xxx       ← correcciones de bugs
```

1. Crea tu rama desde `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/nombre-descriptivo
   ```

2. Haz commits pequeños y descriptivos:
   ```
   feat: agregar filtro por sucursal en historial de tickets
   fix: corregir descuento de stock al rechazar solicitud
   docs: actualizar diagrama de arquitectura
   ```

3. Abre un Pull Request hacia `develop` con:
   - Descripción del cambio
   - Capturas de pantalla si hay cambios visuales
   - Referencia al issue relacionado (si aplica)

---

## Convenciones de código

- **Backend**: ES Modules (`import/export`), async/await, sin callbacks
- **Frontend**: componentes funcionales React, hooks propios en `Components/hooks/`
- **Nombres de archivos**: PascalCase para componentes React, camelCase para el resto
- **Queries SQL**: siempre parametrizadas, nunca interpolación de strings
- **Validación**: usar los schemas Zod en `Middlewares/validate.js` para nuevos endpoints

---

## Agregar un nuevo módulo

1. `Models/NuevoModelo.js` — queries parametrizadas
2. `Controllers/nuevoController.js` — lógica de negocio
3. `Routes/nuevoRoutes.js` — definición de endpoints
4. Montar en `server.js`: `app.use('/api/nuevo', nuevoRoutes)`
5. Agregar schemas de validación en `Middlewares/validate.js`

---

## Reportar un bug

Abre un issue con:
- Descripción del comportamiento esperado vs. el actual
- Pasos para reproducirlo
- Versión de Node.js y navegador
- Capturas de pantalla o logs relevantes
