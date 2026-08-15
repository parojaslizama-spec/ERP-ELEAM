/* Barra de navegación compartida entre los módulos. */
(function () {
  "use strict";

  // Número de versión visible en toda la app — súbelo con cada tanda de cambios notables
  // (sobre todo de diseño/paleta) para poder referirse a "la versión X" al dar feedback.
  var APP_VERSION = "2.1";

  var STEPS = [
    { file: "control-residentes.html", num: "1", label: "Ingreso de residentes" },
    { file: "ficha-medica.html", num: "2", label: "Ficha médica y cuidados" },
    { file: "control-horas.html", num: "3", label: "Trabajadores y liquidaciones" },
    { file: "control-financiero.html", num: "4", label: "Gastos" },
    { file: "estado-resultados.html", num: "5", label: "Estado de resultados" }
  ];

  function currentFile() {
    var path = window.location.pathname.split("/").pop();
    return path === "" ? "index.html" : path;
  }

  function render() {
    var current = currentFile();
    var stepsHtml = STEPS.map(function (s, i) {
      var isActive = s.file === current;
      var arrow = i < STEPS.length - 1 ? '<span class="app-nav-arrow">&rarr;</span>' : "";
      return '<a class="app-nav-step' + (isActive ? " active" : "") + '" href="' + s.file + '">' +
        '<span class="num">' + s.num + '</span>' + s.label + '</a>' + arrow;
    }).join("");

    var nav = document.createElement("div");
    nav.className = "app-nav";
    nav.innerHTML =
      '<div class="app-nav-inner">' +
        '<a class="app-nav-brand" href="index.html"><img class="mark" src="assets/icons/logo-mark.png" alt="" onerror="this.style.display=\'none\'">Residencia Senior Omar Wall<span class="app-nav-version">v' + APP_VERSION + '</span></a>' +
        '<div class="app-nav-steps">' + stepsHtml + '</div>' +
      '</div>';

    document.body.insertBefore(nav, document.body.firstChild);
  }

  // Recordatorio de respaldo: los datos viven solo en este navegador — si nunca se ha exportado un
  // respaldo, o ya pasaron 7 días desde el último, se muestra un aviso (postergable por 3 días) para
  // que no se pierdan residentes/sueldos/gastos por perder el equipo o borrar el caché.
  var UMBRAL_DIAS_RESPALDO = 7;
  var SNOOZE_KEY = "rha_snooze_respaldo";

  function hayDatosReales() {
    function noVacio(key) {
      try {
        var arr = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(arr) && arr.length > 0;
      } catch (e) { return false; }
    }
    return noVacio("rha_trabajadores") || noVacio("rha_residentes");
  }

  function respaldoPostergado() {
    var raw;
    try { raw = localStorage.getItem(SNOOZE_KEY); } catch (e) { raw = null; }
    if (!raw) return false;
    var hasta = new Date(raw);
    return !isNaN(hasta.getTime()) && hasta.getTime() > Date.now();
  }

  function renderRecordatorioRespaldo() {
    if (!window.RhaBackup || typeof window.RhaBackup.diasDesdeUltimoRespaldo !== "function") return;
    if (!hayDatosReales() || respaldoPostergado()) return;
    var dias = window.RhaBackup.diasDesdeUltimoRespaldo();
    if (dias !== null && dias < UMBRAL_DIAS_RESPALDO) return;

    var mensaje = dias === null
      ? "Nunca has descargado un respaldo de tus datos."
      : "No has descargado un respaldo hace " + dias + " días.";

    var banner = document.createElement("div");
    banner.className = "app-backup-reminder";
    banner.innerHTML =
      '<span class="app-backup-reminder-msg">⚠ ' + mensaje + ' Los datos viven solo en este navegador — si se pierde el equipo o se borra el caché, se pierden residentes, sueldos y gastos completos.</span>' +
      '<span class="app-backup-reminder-actions">' +
        '<button type="button" class="app-backup-reminder-btn primary">Descargar respaldo ahora</button>' +
        '<button type="button" class="app-backup-reminder-btn">Recordarme en 3 días</button>' +
      '</span>';

    var nav = document.querySelector(".app-nav");
    (nav ? nav.parentNode : document.body).insertBefore(banner, nav ? nav.nextSibling : document.body.firstChild);

    var buttons = banner.querySelectorAll(".app-backup-reminder-btn");
    buttons[0].addEventListener("click", function () {
      window.RhaBackup.exportBackup();
      banner.remove();
    });
    buttons[1].addEventListener("click", function () {
      var hasta = new Date(Date.now() + 3 * 86400000);
      try { localStorage.setItem(SNOOZE_KEY, hasta.toISOString()); } catch (e) {}
      banner.remove();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
    document.addEventListener("DOMContentLoaded", renderRecordatorioRespaldo);
  } else {
    render();
    renderRecordatorioRespaldo();
  }

  // Registra el service worker para que la app se pueda instalar y funcione sin internet.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* sin soporte o sin https: no es grave, sigue funcionando como página normal */ });
    });
  }
})();
