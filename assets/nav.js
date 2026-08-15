/* Barra de navegación compartida entre los módulos. */
(function () {
  "use strict";

  // Número de versión visible en toda la app — súbelo con cada tanda de cambios notables
  // (sobre todo de diseño/paleta) para poder referirse a "la versión X" al dar feedback.
  var APP_VERSION = "1.0";

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
        '<a class="app-nav-brand" href="index.html"><span class="mark">&#127968;</span>Residencia de ancianos &middot; ELEAM<span class="app-nav-version">v' + APP_VERSION + '</span></a>' +
        '<div class="app-nav-steps">' + stepsHtml + '</div>' +
      '</div>';

    document.body.insertBefore(nav, document.body.firstChild);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

  // Registra el service worker para que la app se pueda instalar y funcione sin internet.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* sin soporte o sin https: no es grave, sigue funcionando como página normal */ });
    });
  }
})();
