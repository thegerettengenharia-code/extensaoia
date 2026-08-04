"use strict";

function buildPrintableHTML(p) {
  const md = (m) => (window.mdToHtml ? mdToHtml(m) : "<pre>" + (m || "") + "</pre>");
  const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const meta = { title: esc(p.title), date: new Date().toLocaleDateString("pt-BR") };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>${meta.title}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; line-height: 1.55; margin: 0 auto; max-width: 820px; padding: 40px 48px; }
  .meta { font-family: Arial, sans-serif; font-size: 13px; color: #555; margin-bottom: 26px; }
  .meta h1 { font-size: 24px; color: #111; margin: 0 0 4px; }
  h1 { font-size: 20px; margin: 28px 0 10px; }
  h2 { font-size: 17px; margin: 22px 0 8px; }
  h3 { font-size: 15px; margin: 18px 0 6px; }
  p { margin: 8px 0; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  li { margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13.5px; font-family: Arial, sans-serif; }
  th, td { border: 1px solid #999; padding: 6px 9px; text-align: left; vertical-align: top; }
  th { background: #efefef; }
  blockquote { border-left: 3px solid #b8860b; margin: 12px 0; padding: 6px 14px; color: #444; background: #faf7ec; }
  strong { color: #000; }
  a { color: #1a3a8a; overflow-wrap: anywhere; word-break: break-word; }
  p, li, td, th { overflow-wrap: anywhere; }
  hr { border: none; border-top: 1px solid #ccc; margin: 22px 0; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="meta">
    <h1>${meta.title}</h1>
    <p>Projeto de Extensão Acadêmica · Estruturado pelo ciclo PDCA · Gerado por ExtensãoIA em ${meta.date}</p>
    <hr/>
  </div>
  ${md(p.sections.overview)}
  ${md(p.sections.plan)}
  ${md(p.sections.do)}
  ${md(p.sections.check)}
  ${md(p.sections.act)}
</body>
</html>`;
}

function exportDoc(p) {
  const html = buildPrintableHTML(p);
  const blob = new Blob(["\ufeff" + html], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename(p.title) + ".doc";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportMarkdown(p) {
  const md = [
    "# " + p.title,
    "",
    "_Projeto de Extensão Acadêmica · Ciclo PDCA · Gerado por ExtensãoIA em " +
      new Date().toLocaleDateString("pt-BR") + "_\n"
  ];
  for (const key of ["overview", "plan", "do", "check", "act"]) {
    md.push("", "", p.sections[key] || "");
  }
  const blob = new Blob([md.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename(p.title) + ".md";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportPrint(p) {
  const w = window.open("", "_blank", "width=900,height=720");
  if (!w) return false;
  w.document.write(buildPrintableHTML(p));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
  return true;
}

function safeFilename(s) {
  return (s || "projeto-extensao")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "projeto-extensao";
}
