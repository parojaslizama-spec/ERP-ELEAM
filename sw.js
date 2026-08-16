/* Service worker — cachea la app para que funcione instalada y sin internet.
   Los datos (residentes, trabajadores, gastos, etc.) viven en localStorage, no aquí:
   este archivo solo cachea el código de la app (HTML/CSS/JS/íconos), no información de la residencia. */
"use strict";

// Sube este número cada vez que cambies algún archivo cacheado, para forzar la actualización.
var CACHE_NAME = "wall-app-v8";

var APP_SHELL = [
  "index.html",
  "control-residentes.html",
  "ficha-medica.html",
  "control-horas.html",
  "control-financiero.html",
  "estado-resultados.html",
  "manifest.json",
  "assets/theme.css",
  "assets/nav.js",
  "assets/auth.js",
  "assets/backup.js",
  "assets/pdf-export.js",
  "assets/icons/icon-72.png",
  "assets/icons/icon-96.png",
  "assets/icons/icon-128.png",
  "assets/icons/icon-144.png",
  "assets/icons/icon-152.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-384.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-512.png",
  "assets/icons/logo-mark.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Estrategia: cache-first para lo propio de la app (mismo origen), red directa para todo lo demás
// (fuentes de Google, etc.) — si no hay internet, esas fuentes simplemente no cargan y el navegador
// usa la tipografía del sistema.
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // Sin red y sin cache para esta ruta — si era una navegación de página, muestra el inicio.
        if (req.mode === "navigate") return caches.match("index.html");
      });
    })
  );
});
