/* Barra de navegación compartida entre los tres módulos. */
(function () {
  "use strict";

  var STEPS = [
    { file: "control-residentes.html", num: "1", label: "Ingreso de residentes" },
    { file: "ficha-medica.html", num: "2", label: "Ficha médica y cuidados" },
    { file: "control-horas.html", num: "3", label: "Trabajadores y liquidaciones" },
    { file: "control-financiero.html", num: "4", label: "Gastos" }
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
        '<a class="app-nav-brand" href="index.html"><span class="mark">&#127968;</span>Residencia de ancianos &middot; ELEAM</a>' +
        '<div class="app-nav-steps">' + stepsHtml + '</div>' +
      '</div>';

    document.body.insertBefore(nav, document.body.firstChild);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
