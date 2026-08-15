/*
 * Generador de reportes PDF compartido — Residencia Senior Omar Wall (ELEAM)
 * Usa jsPDF (cargado por CDN en cada página) para construir un documento
 * con la misma identidad visual en los tres módulos, y lo guarda con
 * el selector de archivos del navegador (o lo descarga si no está disponible).
 */
window.ReportPDF = (function () {
  "use strict";

  var COL_INK = [58, 43, 28];
  var COL_SOFT = [107, 88, 66];
  var COL_ACCENT = [138, 106, 53];
  var COL_ACCENT_DARK = [107, 79, 36];
  var COL_GOLD = [199, 154, 63];
  var COL_BORDER = [226, 208, 168];
  var COL_BG_SOFT = [240, 227, 193];
  var COL_WHITE = [255, 255, 255];
  var COL_GOOD = [79, 122, 74];
  var COL_CRITICAL = [164, 69, 47];

  function money(n) {
    n = Math.round(Number(n) || 0);
    return "$ " + n.toLocaleString("es-CL");
  }

  function ensureLib() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("No se pudo cargar la librería de PDF (jsPDF). Revisa tu conexión a internet e inténtalo de nuevo.");
    }
  }

  function buildDoc(opts) {
    ensureLib();
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "letter" });
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();
    var margin = 48;
    var y = margin;

    function checkPageBreak(minSpace) {
      if (y > pageH - minSpace) {
        drawFooter();
        doc.addPage();
        y = margin;
      }
    }

    function drawHeader() {
      doc.setFillColor(COL_ACCENT[0], COL_ACCENT[1], COL_ACCENT[2]);
      doc.rect(0, 0, pageW, 68, "F");
      doc.setFillColor(COL_GOLD[0], COL_GOLD[1], COL_GOLD[2]);
      doc.rect(0, 66, pageW, 2.5, "F");

      doc.setTextColor(COL_WHITE[0], COL_WHITE[1], COL_WHITE[2]);
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.text((opts.empresa && opts.empresa.nombre) || "Residencia Senior Omar Wall", margin, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      var rutLine = (opts.empresa && opts.empresa.rut) ? "RUT: " + opts.empresa.rut : "";
      doc.text(rutLine, margin, 46);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(opts.titulo || "Reporte", pageW - margin, 28, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(opts.subtitulo || "", pageW - margin, 42, { align: "right" });
      doc.setFontSize(8.5);
      doc.text("Generado el " + new Date().toLocaleDateString("es-CL"), pageW - margin, 56, { align: "right" });
    }

    function drawFooter() {
      if (!opts.notaPie) return;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.8);
      doc.setTextColor(COL_SOFT[0], COL_SOFT[1], COL_SOFT[2]);
      doc.text(opts.notaPie, margin, pageH - 26, { maxWidth: pageW - margin * 2 });
    }

    drawHeader();
    y = 68 + 26;
    doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);

    (opts.secciones || []).forEach(function (sec) {
      checkPageBreak(110);
      doc.setFont("times", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(COL_ACCENT_DARK[0], COL_ACCENT_DARK[1], COL_ACCENT_DARK[2]);
      doc.text(sec.titulo, margin, y);
      y += 6;
      doc.setDrawColor(COL_BORDER[0], COL_BORDER[1], COL_BORDER[2]);
      doc.setLineWidth(0.75);
      doc.line(margin, y, pageW - margin, y);
      y += 15;
      doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);

      if (sec.sub) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(COL_SOFT[0], COL_SOFT[1], COL_SOFT[2]);
        doc.text(sec.sub, margin, y);
        y += 14;
        doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);
      }

      (sec.filas || []).forEach(function (f, idx) {
        checkPageBreak(60);
        if (idx % 2 === 1) {
          doc.setFillColor(COL_BG_SOFT[0], COL_BG_SOFT[1], COL_BG_SOFT[2]);
          doc.rect(margin - 4, y - 10, pageW - margin * 2 + 8, 15.5, "F");
        }
        doc.setFont("helvetica", f.bold ? "bold" : "normal");
        doc.setFontSize(9.3);
        doc.text(String(f.label), margin, y);
        doc.text(String(f.valor), pageW - margin, y, { align: "right" });
        if (f.nota) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.6);
          doc.setTextColor(COL_SOFT[0], COL_SOFT[1], COL_SOFT[2]);
          doc.text(String(f.nota), margin, y + 9.5);
          doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);
          y += 9;
        }
        y += 15.5;
      });

      if (sec.total) {
        checkPageBreak(60);
        var totalCol = sec.total.color === "good" ? COL_GOOD : sec.total.color === "critical" ? COL_CRITICAL : COL_GOLD;
        y += 2;
        doc.setDrawColor(totalCol[0], totalCol[1], totalCol[2]);
        doc.setLineWidth(1.1);
        doc.line(margin, y, pageW - margin, y);
        y += 15;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(totalCol[0], totalCol[1], totalCol[2]);
        doc.text(sec.total.label, margin, y);
        doc.text(sec.total.valor, pageW - margin, y, { align: "right" });
        y += 24;
        doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);
      } else {
        y += 10;
      }
    });

    if (opts.resumenFinal) {
      checkPageBreak(90);
      var boxH = 46;
      doc.setFillColor(COL_ACCENT_DARK[0], COL_ACCENT_DARK[1], COL_ACCENT_DARK[2]);
      doc.roundedRect(margin, y, pageW - margin * 2, boxH, 6, 6, "F");
      doc.setTextColor(COL_WHITE[0], COL_WHITE[1], COL_WHITE[2]);
      doc.setFont("times", "normal");
      doc.setFontSize(11.5);
      doc.text(opts.resumenFinal.label, margin + 16, y + boxH / 2 - 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(246, 224, 178);
      doc.text(String(opts.resumenFinal.valor), pageW - margin - 16, y + boxH / 2 + 4, { align: "right" });
      y += boxH + 26;
      doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);
    }

    if (opts.firmas && opts.firmas.length) {
      checkPageBreak(90);
      y += 30;
      var colW = (pageW - margin * 2) / opts.firmas.length;
      opts.firmas.forEach(function (f, i) {
        var cx0 = margin + colW * i + 10;
        var cx1 = margin + colW * (i + 1) - 10;
        doc.setDrawColor(COL_INK[0], COL_INK[1], COL_INK[2]);
        doc.setLineWidth(0.7);
        doc.line(cx0, y, cx1, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(COL_SOFT[0], COL_SOFT[1], COL_SOFT[2]);
        doc.text(f.label, (cx0 + cx1) / 2, y + 13, { align: "center" });
        doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);
      });
    }

    drawFooter();

    return doc;
  }

  function slugify(s) {
    return String(s || "reporte")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  }

  async function guardarPDF(doc, nombreSugerido) {
    var blob = doc.output("blob");
    if (window.showSaveFilePicker) {
      try {
        var handle = await window.showSaveFilePicker({
          id: "residencia-ancianos-reportes",
          suggestedName: nombreSugerido,
          startIn: "documents",
          types: [{ description: "Documento PDF", accept: { "application/pdf": [".pdf"] } }]
        });
        var writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return { ok: true, metodo: "guardado", mensaje: "Guardado ✓ — elige siempre la carpeta Documentos › Residencia ancianos › Reportes; el navegador la recordará la próxima vez." };
      } catch (e) {
        if (e && e.name === "AbortError") {
          return { ok: false, metodo: "cancelado", mensaje: "Guardado cancelado." };
        }
        // Si falla el selector de archivos, cae a la descarga estándar.
      }
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = nombreSugerido;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    return { ok: true, metodo: "descarga", mensaje: "Descargado ✓ — muévelo a Documentos › Residencia ancianos › Reportes (tu navegador no soporta guardado directo; Chrome o Edge sí lo permiten)." };
  }

  // Documento de texto corrido (contratos) — títulos de cláusula + párrafos justificados con salto de
  // línea automático, distinto de buildDoc (que es para reportes tabulares de secciones/filas).
  function buildContractDoc(opts) {
    ensureLib();
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "letter" });
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();
    var margin = 56;
    var y = margin;

    function checkBreak(minSpace) {
      if (y > pageH - minSpace) { doc.addPage(); y = margin; }
    }

    doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    (doc.splitTextToSize(opts.titulo || "", pageW - margin * 2)).forEach(function (line) {
      doc.text(line, pageW / 2, y, { align: "center" }); y += 19;
    });
    if (opts.subtitulo) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      (doc.splitTextToSize(opts.subtitulo, pageW - margin * 2)).forEach(function (line) {
        doc.text(line, pageW / 2, y, { align: "center" }); y += 15;
      });
    }
    y += 8;
    if (opts.disclaimer) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(8.3);
      doc.setTextColor(COL_SOFT[0], COL_SOFT[1], COL_SOFT[2]);
      (doc.splitTextToSize(opts.disclaimer, pageW - margin * 2)).forEach(function (line) {
        checkBreak(50); doc.text(line, margin, y); y += 11;
      });
      y += 10;
      doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);
    }

    (opts.clauses || []).forEach(function (c) {
      checkBreak(90);
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
      doc.setTextColor(COL_ACCENT_DARK[0], COL_ACCENT_DARK[1], COL_ACCENT_DARK[2]);
      (doc.splitTextToSize(c.title, pageW - margin * 2)).forEach(function (line) {
        checkBreak(60); doc.text(line, margin, y); y += 14;
      });
      doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      (doc.splitTextToSize(c.body || "", pageW - margin * 2)).forEach(function (line) {
        checkBreak(40); doc.text(line, margin, y); y += 12.5;
      });
      y += 5;
      if (c.note) {
        doc.setFont("helvetica", "italic"); doc.setFontSize(8);
        doc.setTextColor(COL_SOFT[0], COL_SOFT[1], COL_SOFT[2]);
        (doc.splitTextToSize(c.note, pageW - margin * 2)).forEach(function (line) {
          checkBreak(30); doc.text(line, margin, y); y += 10.2;
        });
        doc.setTextColor(COL_INK[0], COL_INK[1], COL_INK[2]);
        y += 8;
      }
    });

    if (opts.closing) {
      checkBreak(60);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      (doc.splitTextToSize(opts.closing, pageW - margin * 2)).forEach(function (line) {
        checkBreak(40); doc.text(line, margin, y); y += 12.5;
      });
      y += 10;
    }

    if (opts.firmas && opts.firmas.length) {
      checkBreak(110);
      y += 34;
      var colW = (pageW - margin * 2) / opts.firmas.length;
      opts.firmas.forEach(function (f, i) {
        checkBreak(70);
        var cx0 = margin + colW * i + 10, cx1 = margin + colW * (i + 1) - 10;
        doc.setDrawColor(COL_INK[0], COL_INK[1], COL_INK[2]); doc.setLineWidth(0.7);
        doc.line(cx0, y, cx1, y);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text(f.label, (cx0 + cx1) / 2, y + 13, { align: "center" });
        if (f.sub) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(8.3);
          doc.text(f.sub, (cx0 + cx1) / 2, y + 25, { align: "center" });
        }
      });
    }

    return doc;
  }

  return { money: money, buildDoc: buildDoc, buildContractDoc: buildContractDoc, guardarPDF: guardarPDF, slugify: slugify };
})();
