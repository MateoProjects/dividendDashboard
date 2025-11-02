# 🚀 Setup Guide - Yahoo Finance + Cloudflare Worker

Este dashboard usa **Yahoo Finance** para datos de dividendos, a través de tu propio **Cloudflare Worker** gratuito que actúa como proxy CORS.

---

## 🎯 Arquitectura

```
GitHub Pages (Frontend)
    ↓
Cloudflare Worker (Tu proxy CORS gratuito)
    ↓
Yahoo Finance API (Datos reales de stocks)
```

**Ventajas:**
- ✅ **100% Gratis** (100K requests/día en Cloudflare)
- ✅ **Yahoo Finance completo** (dividendos, históricos, precios)
- ✅ **Sin límites de API**
- ✅ **Caché inteligente de 4h** (solo 6 requests/día)
- ✅ **Setup en 10 minutos**

---

## 📋 Paso 1: Deploy del Cloudflare Worker (5 min)

### Opción A: Dashboard Web (Recomendado)

1. **Crea cuenta gratuita en Cloudflare:**
   - Ve a: https://dash.cloudflare.com/sign-up
   - Regístrate con tu email
   - Verifica tu email

2. **Crea el Worker:**
   - En el dashboard, click **"Workers & Pages"**
   - Click **"Create Application"** → **"Create Worker"**
   - Nombre: `yahoo-finance-proxy`
   - Click **"Deploy"**

3. **Edita el código:**
   - Click **"Edit Code"**
   - **Borra todo** el código existente
   - Copia y pega el contenido de: `cloudflare-worker/worker.js`
   - Click **"Save and Deploy"**

4. **Copia tu URL:**
   - Verás algo como: `https://yahoo-finance-proxy.YOUR-USERNAME.workers.dev`
   - **Guarda esta URL** (la necesitarás en el siguiente paso)

### Opción B: CLI (Avanzado)

```bash
npm install -g wrangler
wrangler login
wrangler init yahoo-finance-proxy
# Copiar worker.js al proyecto
wrangler deploy
```

**Más detalles:** Ver `cloudflare-worker/DEPLOY.md`

---

## 🔧 Paso 2: Configurar el Frontend (2 min)

1. **Abre el archivo:** `src/api/yahooFinance.js`

2. **Encuentra la línea 8:**
   ```javascript
   const WORKER_URL = 'YOUR_WORKER_URL_HERE';
   ```

3. **Reemplaza con tu URL:**
   ```javascript
   const WORKER_URL = 'https://yahoo-finance-proxy.YOUR-USERNAME.workers.dev';
   ```

4. **Guarda el archivo**

---

## ✅ Paso 3: Probar Localmente (1 min)

1. Abre `index.html` en tu navegador
2. Abre la consola del navegador (F12)
3. Deberías ver:
   ```
   🔄 Fetching 50 stocks from Yahoo Finance...
   ✅ Successfully fetched 50 stocks
   💾 Data cached successfully
   ```

Si ves errores, verifica:
- ✅ Worker URL correcta
- ✅ Worker deployed correctamente
- ✅ Sin typos en la URL

---

## 🌐 Paso 4: Deploy a GitHub Pages (2 min)

```bash
git add .
git commit -m "Setup Yahoo Finance with Cloudflare Worker proxy

- Add Cloudflare Worker for CORS proxy
- Implement 4-hour smart caching
- Add countdown timer for next update
- Remove API key prompt (not needed)

Fixes CORS issues permanently with own worker"

git push origin main
```

Espera 1-2 minutos y visita:
```
https://YOUR-USERNAME.github.io/dividendDashboard
```

---

## 📊 Sistema de Caché Inteligente

### Cómo Funciona

1. **Primera carga**: Fetch desde Yahoo Finance → Guarda en cache (4h)
2. **Próximas 4 horas**: Lee desde cache (0 requests)
3. **Después de 4h**: Auto-refresh → Nuevo cache

### Uso Diario de Requests

- **Con cache de 4h**: 6 requests/día (para 50 stocks)
- **Límite Cloudflare**: 100,000 requests/día
- **Margen**: 16,666x más de lo necesario! 🎉

### Controles

- ⏱️ **Timer**: Muestra tiempo hasta próximo update
- 🔄 **Force Refresh**: Actualiza manualmente antes de que expire
- 🗑️ **Clear Cache**: Limpia cache y reinicia

---

## 🔍 Monitorear tu Worker

1. Ve al dashboard de Cloudflare
2. Click en "Workers & Pages"
3. Click en tu worker
4. Pestaña "Metrics":
   - Requests por día
   - Latencia
   - Errores

---

## 🆘 Troubleshooting

### Error: "Cloudflare Worker not configured"
**Solución:** Verifica que `WORKER_URL` en `yahooFinance.js` tenga tu URL correcta.

### Error: "Worker request failed! status: 403"
**Solución:**
1. Verifica que el worker esté deployed
2. Intenta acceder directamente a: `YOUR_WORKER_URL?url=https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL`
3. Deberías ver datos JSON de Apple

### Error: "Invalid response format"
**Solución:** Asegúrate de copiar TODO el código de `worker.js`, especialmente los headers CORS.

### Dashboard funciona local pero no en GitHub Pages
**Solución:**
1. Verifica que pusheaste los cambios (`git push`)
2. Espera 2-3 minutos para el deploy
3. Limpia cache del navegador (Ctrl+Shift+R)

### Yahoo Finance devuelve datos vacíos
**Solución:** Algunos tickers pueden no estar disponibles. Verifica la consola para ver qué stocks fallaron.

---

## 💡 Próximos Pasos Opcionales

### 1. Restringir Origen (Seguridad)

En `worker.js`, reemplaza:
```javascript
'Access-Control-Allow-Origin': '*'
```

Por:
```javascript
'Access-Control-Allow-Origin': 'https://YOUR-USERNAME.github.io'
```

### 2. Agregar Rate Limiting

```javascript
// En worker.js
const RATE_LIMIT = 100; // max requests por minuto
```

### 3. Custom Domain

Puedes usar tu propio dominio en Cloudflare Workers (requiere plan paid).

---

## 📞 Soporte

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **Yahoo Finance API**: Sin documentación oficial, pero funciona!
- **Issues**: Abre un issue en tu repo de GitHub

---

## 🎉 ¡Listo!

Tu Dividend Dashboard ahora funciona con:
- ✅ Yahoo Finance (datos completos de dividendos)
- ✅ Tu propio proxy Cloudflare (gratis, rápido, confiable)
- ✅ Caché inteligente de 4h
- ✅ Timer de próxima actualización
- ✅ Funcionando en GitHub Pages

**Disfruta tu dashboard!** 📈💰
