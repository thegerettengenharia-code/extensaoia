"use strict";

function escAttr(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escHtml(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pageTemplateKey() {
  return document.body.dataset.tpl || "";
}

function renderHubCards() {
  const grid = $("#tplGrid");
  if (!grid) return;
  const stored = loadProjectFromStorage();
  const hasProject = !!(stored && stored.project && stored.project.templateFields);

  grid.innerHTML = Object.keys(TEMPLATE_META).map((key) => {
    const meta = TEMPLATE_META[key];
    return (
      '<article class="tpl-card">' +
      '<div class="tpl-card-head">' +
      "<h2>" + escHtml(meta.title) + "</h2>" +
      '<span class="badge badge--dot is-ready"><span class="dot"></span>DOCX</span>' +
      "</div>" +
      "<p class=\"tpl-card-desc\">" + escHtml(meta.description) + "</p>" +
      '<ul class="tpl-fields">' +
      meta.tokens.map((t) => "<li>" + escHtml(meta.fields[t] || t) + "</li>").join("") +
      "</ul>" +
      '<div class="tpl-card-actions">' +
      '<a class="btn btn--primary btn--sm" href="' + escAttr(meta.key) + '.html">Preencher e baixar</a>' +
      "</div>" +
      "</article>"
    );
  }).join("");

  const status = $("#tplStatus");
  if (status) {
    status.textContent = hasProject
      ? "Projeto detectado — os templates virão preenchidos."
      : "Nenhum projeto gerado ainda. Gere um primeiro ou preencha manualmente.";
    status.classList.toggle("is-ok", hasProject);
  }
}

function buildTemplateForm() {
  const key = pageTemplateKey();
  const meta = TEMPLATE_META[key];
  if (!meta) return;

  document.title = meta.title + " — ExtensãoIA";
  $("#tplTitle").textContent = meta.title;
  const tag = $("#tplTagline");
  if (tag) tag.textContent = meta.tagline;
  const desc = $("#tplDesc");
  if (desc) desc.textContent = meta.description;

  const stored = loadProjectFromStorage();
  const fields = (stored && stored.project && stored.project.templateFields) || {};

  const fallback = (token) => {
    if (token === "referencias") return defaultValueFor(token) || "";
    if (SINGLE_LINE_TOKENS.has(token)) return "(a preencher)";
    return "";
  };

  const form = $("#tplFieldsForm");
  if (!form) return;
  form.innerHTML = meta.tokens
    .map((token) => {
      const single = SINGLE_LINE_TOKENS.has(token);
      const value = (fields[token] || "").trim() || fallback(token);
      const label = meta.fields[token] || token;
      const id = "tplfield_" + token;
      const cls = single ? "field" : "field field--full";
      return (
        '<div class="' + cls + '">' +
        '<label for="' + id + '">' + escHtml(label) + "</label>" +
        (single
          ? '<input id="' + id + '" type="text" value="' + escAttr(value) + '" />'
          : '<textarea id="' + id + '" rows="4">' + escHtml(value) + "</textarea>") +
        "</div>"
      );
    })
    .join("");

  const status = $("#tplStatus");
  if (status) {
    const hasData = meta.tokens.some((t) => (fields[t] || "").trim());
    status.textContent = hasData
      ? "Preenchido com o último projeto gerado. Edite se quiser e baixe."
      : "Campos prontos para edição. Preencha manualmente ou gere um projeto.";
    status.classList.toggle("is-ok", hasData);
  }
}

async function handleTplDownload(e) {
  const key = pageTemplateKey();
  const meta = TEMPLATE_META[key];
  if (!meta) return;

  const fields = {};
  for (const token of meta.tokens) {
    const el = $("#tplfield_" + token);
    fields[token] = el ? el.value.trim() : "";
  }

  const btns = $$("[data-tpl-download]");
  const disable = (on) => {
    btns.forEach((b) => {
      b.disabled = on;
      const sp = $(".spinner", b);
      if (sp) sp.hidden = !on;
    });
  };

  disable(true);
  try {
    const fileName = await exportTemplateDoc(meta.file, meta.tokens, fields);
    toast("Baixado: " + fileName);
  } catch (err) {
    console.error(err);
    toast("Erro ao gerar o DOCX: " + err.message, true);
  } finally {
    disable(false);
  }
}

function initTemplatePage() {
  initSiteBase();
  const key = pageTemplateKey();
  if (key) buildTemplateForm();
  else renderHubCards();

  $$("[data-tpl-download]").forEach((btn) =>
    btn.addEventListener("click", handleTplDownload)
  );

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", initTemplatePage);
