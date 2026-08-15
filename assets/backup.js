/* Respaldo y restauración completa de los datos guardados en este navegador. */
(function () {
  "use strict";

  var RESPALDO_KEY = "rha_ultimo_respaldo";

  function marcarRespaldoHecho() {
    try { localStorage.setItem(RESPALDO_KEY, new Date().toISOString()); } catch (e) {}
  }

  // Devuelve los días desde el último respaldo (exportado o restaurado), o null si nunca se ha hecho uno.
  function diasDesdeUltimoRespaldo() {
    var raw;
    try { raw = localStorage.getItem(RESPALDO_KEY); } catch (e) { raw = null; }
    if (!raw) return null;
    var fecha = new Date(raw);
    if (isNaN(fecha.getTime())) return null;
    return Math.floor((Date.now() - fecha.getTime()) / 86400000);
  }

  function exportBackup() {
    var datos = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      datos[k] = localStorage.getItem(k);
    }
    var payload = { app: "ERP Residencia Senior Omar Wall", generadoEn: new Date().toISOString(), datos: datos };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var fecha = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "respaldo-wall-" + fecha + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    marcarRespaldoHecho();
  }

  function importBackup(file, callback) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(reader.result);
        var datos = payload && payload.datos ? payload.datos : payload;
        if (!datos || typeof datos !== "object") throw new Error("El archivo no tiene el formato esperado.");
        Object.keys(datos).forEach(function (k) { localStorage.setItem(k, datos[k]); });
        marcarRespaldoHecho();
        callback(null);
      } catch (e) {
        callback(e);
      }
    };
    reader.onerror = function () { callback(reader.error || new Error("No se pudo leer el archivo.")); };
    reader.readAsText(file);
  }

  window.RhaBackup = { exportBackup: exportBackup, importBackup: importBackup, diasDesdeUltimoRespaldo: diasDesdeUltimoRespaldo };
})();
