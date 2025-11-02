# 🚀 Cloudflare Worker Deployment Guide

Este Worker actúa como proxy CORS para Yahoo Finance API, permitiendo que tu dashboard funcione perfectamente en GitHub Pages.

## ⚡ Por qué Cloudflare Workers?

- ✅ **100% GRATIS** (100,000 requests/día)
- ✅ **Súper rápido** (edge computing global)
- ✅ **Sin límites de Yahoo Finance**
- ✅ **5 minutos de setup**
- ✅ **Tu propio proxy confiable**

---

## 📋 Paso 1: Crear Cuenta en Cloudflare

1. Ve a: https://dash.cloudflare.com/sign-up
2. Regístrate con tu email (gratis)
3. Verifica tu email
4. Accede al dashboard

---

## 🔧 Paso 2: Crear el Worker

### Opción A: Dashboard Web (Más fácil)

1. **En el dashboard de Cloudflare:**
   - Click en **"Workers & Pages"** en el menú lateral
   - Click en **"Create Application"**
   - Click en **"Create Worker"**

2. **Nombra tu Worker:**
   - Nombre: `yahoo-finance-proxy` (o el que prefieras)
   - Click en **"Deploy"**

3. **Edita el código:**
   - Click en **"Edit Code"**
   - **Borra todo** el código existente
   - **Copia y pega** el contenido de `worker.js`
   - Click en **"Save and Deploy"**

4. **Copia tu URL:**
   - Verás algo como: `https://yahoo-finance-proxy.YOUR-USERNAME.workers.dev`
   - **Copia esta URL** (la necesitarás para el frontend)

### Opción B: CLI (Para usuarios avanzados)

```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Login a Cloudflare
wrangler login

# Crear proyecto
wrangler init yahoo-finance-proxy

# Copiar worker.js al proyecto
cp worker.js yahoo-finance-proxy/src/index.js

# Deploy
cd yahoo-finance-proxy
wrangler deploy
```

---

## ✅ Paso 3: Probar el Worker

Abre tu navegador y prueba:

```
https://yahoo-finance-proxy.YOUR-USERNAME.workers.dev/?url=https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL
```

Deberías ver datos de Apple (AAPL) en formato JSON.

---

## 🔗 Paso 4: Configurar el Frontend

Ahora necesitas actualizar tu dashboard para usar este Worker.

Abre el archivo: `src/api/yahooFinance.js`

Busca la línea que dice:
```javascript
const WORKER_URL = 'YOUR_WORKER_URL_HERE';
```

Reemplázala con tu URL:
```javascript
const WORKER_URL = 'https://yahoo-finance-proxy.YOUR-USERNAME.workers.dev';
```

---

## 📊 Monitorear Uso

1. Ve al dashboard de Cloudflare
2. Click en "Workers & Pages"
3. Click en tu worker
4. Ve a la pestaña **"Metrics"**

Aquí verás:
- Requests por día
- Errores
- Latencia

**Límite gratis:** 100,000 requests/día (más que suficiente!)

---

## 🔒 Seguridad (Opcional)

Para mayor seguridad, puedes restringir el origen:

```javascript
// En worker.js, reemplaza:
'Access-Control-Allow-Origin': '*'

// Por:
'Access-Control-Allow-Origin': 'https://YOUR-USERNAME.github.io'
```

---

## 🆘 Troubleshooting

### Error: "Worker not found"
- Verifica que el worker esté deployed
- Revisa la URL (debe terminar en `.workers.dev`)

### Error: "CORS policy"
- Asegúrate de copiar TODO el código del worker
- Verifica que los headers CORS estén presentes

### Error: "Rate limit exceeded"
- Estás usando >100K requests/día
- Considera implementar caché de 4h (ya incluido en el dashboard)

### Yahoo Finance devuelve 429 o bloquea
- Cloudflare Workers rotan IPs automáticamente
- Implementa delays entre requests en el frontend

---

## 💡 Mejoras Opcionales

### 1. Agregar Rate Limiting

```javascript
// Limitar requests por IP
const RATE_LIMIT = 100; // requests por minuto
```

### 2. Agregar Caché en Worker

```javascript
// Cache responses en Cloudflare edge
const cache = caches.default;
const cacheKey = new Request(targetUrl, request);
const cachedResponse = await cache.match(cacheKey);

if (cachedResponse) {
  return cachedResponse;
}
```

### 3. Logging Avanzado

```javascript
// En el dashboard de Cloudflare puedes ver logs en tiempo real
console.log('Request from:', request.headers.get('CF-Connecting-IP'));
```

---

## 📈 Costos

**Plan Free (suficiente para ti):**
- ✅ 100,000 requests/día
- ✅ Sin tarjeta de crédito requerida
- ✅ Para siempre gratis

**Si necesitas más:**
- Plan Paid: $5/mes por 10 millones de requests adicionales

---

## 🎯 Próximos Pasos

Una vez que tengas tu Worker URL:

1. ✅ Copia la URL del worker
2. ✅ Actualiza `src/api/yahooFinance.js`
3. ✅ Prueba localmente
4. ✅ Deploy a GitHub Pages
5. ✅ ¡Disfruta tu dashboard funcionando!

---

## 📞 Soporte

- Documentación Cloudflare Workers: https://developers.cloudflare.com/workers/
- Dashboard: https://dash.cloudflare.com/
- Community: https://community.cloudflare.com/

---

¡Listo! Tu proxy de Yahoo Finance está funcionando 🎉
