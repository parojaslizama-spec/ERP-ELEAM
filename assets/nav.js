/* Barra de navegación compartida entre los módulos. */
(function () {
  "use strict";

  // Número de versión visible en toda la app — súbelo con cada tanda de cambios notables
  // (sobre todo de diseño/paleta) para poder referirse a "la versión X" al dar feedback.
  var APP_VERSION = "3.9";

  var STEPS = [
    { file: "control-residentes.html", num: "1", label: "Ingreso de residentes" },
    { file: "ficha-medica.html", num: "2", label: "Ficha médica y cuidados" },
    { file: "control-horas.html", num: "3", label: "Trabajadores y liquidaciones" },
    { file: "control-financiero.html", num: "4", label: "Gastos" },
    { file: "estado-resultados.html", num: "5", label: "Estado de resultados" },
    { file: "cumplimiento-eleam.html", num: "6", label: "Cumplimiento ELEAM" },
    { file: "proyeccion-abuelos.html", num: "7", label: "Proyección por residente" }
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

  // Recordatorio de vigencias del Decreto 20 (ELEAM): capacitación anual del personal (22 h) y reporte
  // trimestral a Senama son las dos obligaciones con un plazo real y recurrente — si alguna vence en los
  // próximos 30 días o ya venció, se avisa en toda la app (no solo al entrar a Cumplimiento ELEAM).
  var VIG_URGENTES = [
    { id: "capacitacion", label: "capacitación anual del personal (22 h)", periodoDias: 365 },
    { id: "reporteSenama", label: "reporte trimestral a Senama", periodoDias: 90 }
  ];
  var VIG_SNOOZE_KEY = "rha_snooze_cumplimiento_eleam";

  function vigenciaPostergada() {
    var raw;
    try { raw = localStorage.getItem(VIG_SNOOZE_KEY); } catch (e) { raw = null; }
    if (!raw) return false;
    var hasta = new Date(raw);
    return !isNaN(hasta.getTime()) && hasta.getTime() > Date.now();
  }

  function renderRecordatorioCumplimientoEleam() {
    if (vigenciaPostergada()) return;
    var vigencias;
    try { vigencias = JSON.parse(localStorage.getItem("rha_vigencias_eleam") || "{}"); } catch (e) { vigencias = {}; }

    var pendientes = [];
    VIG_URGENTES.forEach(function (def) {
      var fechaStr = vigencias[def.id];
      if (!fechaStr) return;
      var base = new Date(fechaStr + "T00:00:00");
      var vence = new Date(base.getTime() + def.periodoDias * 86400000);
      var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      var diasRestantes = Math.round((vence.getTime() - hoy.getTime()) / 86400000);
      if (diasRestantes <= 30) pendientes.push({ label: def.label, dias: diasRestantes });
    });
    if (!pendientes.length) return;

    var mensaje = pendientes.map(function (p) {
      return p.dias < 0
        ? p.label + " (vencida hace " + Math.abs(p.dias) + " día(s))"
        : p.label + " (vence en " + p.dias + " día(s))";
    }).join(" · ");

    var current = currentFile();
    var banner = document.createElement("div");
    banner.className = "app-backup-reminder";
    banner.innerHTML =
      '<span class="app-backup-reminder-msg">⚠ Cumplimiento ELEAM (Decreto 20): ' + mensaje + '.</span>' +
      '<span class="app-backup-reminder-actions">' +
        (current === "cumplimiento-eleam.html" ? "" : '<a class="app-backup-reminder-btn primary" href="cumplimiento-eleam.html" style="text-decoration:none; display:inline-block;">Ver Cumplimiento ELEAM</a>') +
        '<button type="button" class="app-backup-reminder-btn">Recordarme en 3 días</button>' +
      '</span>';

    var nav = document.querySelector(".app-nav");
    (nav ? nav.parentNode : document.body).insertBefore(banner, nav ? nav.nextSibling : document.body.firstChild);

    var snoozeBtn = banner.querySelector(".app-backup-reminder-btn:not(.primary)");
    snoozeBtn.addEventListener("click", function () {
      var hasta = new Date(Date.now() + 3 * 86400000);
      try { localStorage.setItem(VIG_SNOOZE_KEY, hasta.toISOString()); } catch (e) {}
      banner.remove();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
    document.addEventListener("DOMContentLoaded", renderRecordatorioRespaldo);
    document.addEventListener("DOMContentLoaded", renderRecordatorioCumplimientoEleam);
  } else {
    render();
    renderRecordatorioRespaldo();
    renderRecordatorioCumplimientoEleam();
  }

  // Registra el service worker para que la app se pueda instalar y funcione sin internet.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* sin soporte o sin https: no es grave, sigue funcionando como página normal */ });
    });
  }
})();
