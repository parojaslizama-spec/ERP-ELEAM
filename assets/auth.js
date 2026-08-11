/* Bloqueo simple por clave de acceso, compartido por todos los módulos.
   No es seguridad de nivel empresarial (la clave vive en este archivo, visible
   para quien inspeccione el código) — solo evita que alguien abra la app por
   error o sin permiso desde el mismo dispositivo. Se pide una vez por sesión
   de navegador (se limpia al cerrar todas las pestañas). */
(function () {
  "use strict";
  var PASSCODE = "5256";
  var SESSION_KEY = "rha_auth_ok";

  if (sessionStorage.getItem(SESSION_KEY) === "1") return;

  // Oculta el contenido de inmediato para que no se alcance a ver antes de pedir la clave.
  document.documentElement.style.visibility = "hidden";

  function buildOverlay() {
    var overlay = document.createElement("div");
    overlay.id = "rha-auth-overlay";
    overlay.innerHTML =
      '<style>' +
      '#rha-auth-overlay{visibility:visible;position:fixed;inset:0;z-index:999999;background:#f8f4ec;display:flex;align-items:center;justify-content:center;font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;}' +
      '#rha-auth-box{background:#fffdf8;border:1px solid #e4dcc7;border-radius:14px;box-shadow:0 8px 24px -12px rgba(61,58,51,.35);padding:32px 28px;width:280px;text-align:center;}' +
      '#rha-auth-box .mark{font-size:30px;margin-bottom:6px;}' +
      '#rha-auth-box h1{font-family:"Lora","Iowan Old Style",Georgia,serif;font-size:17px;font-weight:600;color:#3d3a33;margin:0 0 4px;}' +
      '#rha-auth-box p{font-size:12.5px;color:#6f6858;margin:0 0 16px;}' +
      '#rha-auth-input{width:100%;box-sizing:border-box;font-size:20px;letter-spacing:.3em;text-align:center;padding:10px 8px;border:1px solid #e4dcc7;border-radius:8px;font-family:ui-monospace,"SF Mono",Consolas,monospace;}' +
      '#rha-auth-input:focus{outline:none;border-color:#5f7c68;}' +
      '#rha-auth-btn{margin-top:12px;width:100%;padding:10px;border:none;border-radius:8px;background:#5f7c68;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer;}' +
      '#rha-auth-btn:hover{background:#4d6656;}' +
      '#rha-auth-err{color:#ad5c4c;font-size:12px;margin-top:10px;min-height:14px;}' +
      '#rha-auth-box.shake{animation:rha-shake .3s;}' +
      '@keyframes rha-shake{25%{transform:translateX(-6px);}75%{transform:translateX(6px);}}' +
      '</style>' +
      '<div id="rha-auth-box">' +
        '<div class="mark">&#127968;</div>' +
        '<h1>Residencia de ancianos &middot; ELEAM</h1>' +
        '<p>Ingresa la clave de acceso</p>' +
        '<input id="rha-auth-input" type="password" inputmode="numeric" maxlength="8" autocomplete="off">' +
        '<button id="rha-auth-btn" type="button">Entrar</button>' +
        '<div id="rha-auth-err"></div>' +
      '</div>';

    var input = overlay.querySelector("#rha-auth-input");
    var box = overlay.querySelector("#rha-auth-box");
    var err = overlay.querySelector("#rha-auth-err");

    function tryUnlock() {
      if (input.value === PASSCODE) {
        sessionStorage.setItem(SESSION_KEY, "1");
        document.documentElement.style.visibility = "";
        overlay.remove();
      } else {
        err.textContent = "Clave incorrecta.";
        box.className = "shake";
        input.value = "";
        setTimeout(function () { box.className = ""; }, 300);
        input.focus();
      }
    }

    overlay.querySelector("#rha-auth-btn").addEventListener("click", tryUnlock);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") tryUnlock(); });

    document.body.appendChild(overlay);
    setTimeout(function () { input.focus(); }, 50);
  }

  if (document.body) {
    buildOverlay();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildOverlay);
  } else {
    buildOverlay();
  }
})();
