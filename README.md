<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🏹 Archery Tournament Manager

Sistema completo para gestionar torneos de tiro con arco con equipos, matches, ranking y playoffs.

## ✨ Características

- 🔐 **Autenticación Admin** - Password fijo: `AbsoluteArchery25`
- 👥 **Gestión de Equipos** - Registro de equipos con integrantes
- 📊 **Ranking en Tiempo Real** - Estadísticas completas (Avg, X+10s, Arrow Score)
- 🎯 **Scoresheets Digitales** - Registro de flechas por set con validaciones
- 📱 **Códigos QR** - Para que árbitros ingresen resultados desde móviles
- 🏆 **Sistema de Playoffs** - Bracket automático de cuartos, semis y final
- 💾 **Backup/Restore** - Exporta e importa datos del torneo en JSON
- 🌐 **Sin Base de Datos** - Todo se almacena en localStorage del navegador

## 🚀 Deploy en GitHub Pages (GRATIS)

### Paso 1: Subir a GitHub

```bash
cd /d/PROGRAMACION/archery-tournament-manager
git init
git add .
git commit -m "Initial commit - Archery Tournament Manager"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/archery-tournament-manager.git
git push -u origin main
```

### Paso 2: Configurar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Pages**
3. En **Source**, selecciona **GitHub Actions**
4. El workflow `.github/workflows/deploy.yml` se ejecutará automáticamente

### Paso 3: Acceder a tu app

Tu app estará disponible en:
```
https://TU-USUARIO.github.io/archery-tournament-manager/
```

**IMPORTANTE**: Si usas un repositorio con nombre diferente, edita `vite.config.ts`:
```typescript
base: '/nombre-de-tu-repo/'  // Cambia esto
```

## 🏃 Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## 📖 Uso

### Configuración Inicial (Admin)

1. Inicia sesión como admin (botón **🔒 Admin**)
2. Registra equipos con sus integrantes (**⚙️ Edit Teams**)
3. Crea el torneo seleccionando 7-10 equipos
4. El sistema genera automáticamente los matches

### Durante el Torneo

- **Admin**: Puede editar scoresheets, equipos, y gestionar todo
- **Público**: Solo visualiza ranking y resultados (sin login)
- **Árbitros**: Escanean QR y registran resultados desde móviles

### Backup de Seguridad

Antes de empezar el torneo:
1. Click en **💾 Backup** (solo admin)
2. Guarda el archivo JSON en un lugar seguro
3. Si algo sale mal, usa **📂 Restore** para recuperar todo

## 🛠️ Tecnologías

- React 19 + TypeScript
- Vite 6
- Tailwind CSS
- LocalStorage para persistencia
- QRCode.react para códigos QR

## 📝 Notas Importantes

- Los datos se guardan en localStorage del navegador
- Si borras el caché, pierdes los datos (usa Backup!)
- El password admin es `AbsoluteArchery25` (hardcoded)
- Funciona 100% offline después de cargar
- No hay límite de torneos por año

## 🤝 Soporte

Para bugs o mejoras, abre un Issue en GitHub.

---

**Desarrollado para Absolute Archery** 🎯
