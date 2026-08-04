"use strict";

/* ---------- IA: seleção de modelo ---------- */
function loadModelUI() {
  const sel = $("#aiModel");
  if (!sel) return;
  const groups = {};
  for (const m of MODEL_OPTIONS) {
    const label = AI_PROVIDERS[m.provider].label;
    (groups[label] = groups[label] || []).push(m);
  }
  sel.innerHTML = Object.keys(groups)
    .map(
      (g) =>
        '<optgroup label="' + g + '">' +
        groups[g].map((m) => '<option value="' + m.id + '">' + m.label + " — " + m.desc + "</option>").join("") +
        "</optgroup>"
    )
    .join("");

  const saved = localStorage.getItem("eia_model");
  if (saved && MODEL_OPTIONS.some((m) => m.id === saved)) sel.value = saved;
  else sel.value = MODEL_OPTIONS[0].id;
  updateModelStatus();
}

function updateModelStatus() {
  const c = aiConfig();
  const status = $("#providerStatus");
  const msg = $("#providerMsg");
  if (status) {
    status.classList.add("is-ready");
    status.innerHTML = '<span class="dot"></span>IA conectada';
  }
  if (msg) {
    msg.textContent =
      "Ativo: " + c.label + " — modelo gratuito via OpenRouter. Se houver limite de uso, a IA tenta novamente automaticamente.";
  }
}

function initModel() {
  const sel = $("#aiModel");
  if (!sel) return;
  sel.addEventListener("change", () => {
    localStorage.setItem("eia_model", sel.value);
    updateModelStatus();
    const opt = MODEL_OPTIONS.find((m) => m.id === sel.value);
    if (opt) toast("Modelo selecionado: " + opt.label);
  });
}

/* ---------- Generate ---------- */
function readForm() {
  const get = (id) => $("#" + id).value.trim();
  return {
    titulo: get("fTitulo"),
    curso: get("fCurso"),
    area: get("fArea"),
    publico: get("fPublico"),
    problema: get("fProblema"),
    local: get("fLocal"),
    duracao: get("fDuracao"),
    equipe: get("fEquipe"),
    parcerias: get("fParcerias"),
    objetivos: get("fObjetivos").split("\n").map((s) => s.trim()).filter(Boolean),
    objetivoGeral: "",
    aluno: get("fAluno"),
    ra: get("fRA"),
    polo: get("fPolo")
  };
}

function setLoading(on) {
  const btn = $("#btnGenerate");
  if (!btn) return;
  btn.disabled = on;
  $(".btn-label", btn).hidden = on;
  $(".spinner", btn).hidden = !on;
  $("#genHint").textContent = on
    ? "A IA está trabalhando. Modelos gratuitos podem levar de 1 a 5 minutos — se um ficar ocupado, troco automaticamente para outro…"
    : "Os campos com * são essenciais para um bom resultado.";
}

async function handleGenerate(e) {
  e.preventDefault();
  const form = $("#extForm");
  if (!form.reportValidity()) return;

  const d = readForm();
  setLoading(true);
  let project = null;

  try {
    project = await generateProjectData(d);
  } catch (err) {
    if (err.name === "AbortError") {
      toast("Geração cancelada.", true);
      setLoading(false);
      return;
    }
    console.error(err);
    toast("Falha na IA: " + err.message + " — usando o modelo de exemplo.", true);
  }

  if (!project) project = fallbackGenerate(d);
  App.project = project;
  App.generatedTitle = project.isFallback ? (d.titulo || "Projeto de Extensão Acadêmica") : project.title;
  saveProjectToStorage(project, App.generatedTitle);
  saveProjectToHistory(project, App.generatedTitle);
  renderProject(project);
  renderHistory();
  setLoading(false);
  $("#resultado").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderProject(p) {
  $("#resultTitle").textContent = App.generatedTitle;
  $("#resultado").hidden = false;

  const tabs = { overview: "Visão geral", plan: "1 · Planejar", do: "2 · Executar", check: "3 · Verificar", act: "4 · Agir" };
  for (const key of Object.keys(tabs)) {
    const panel = $("#panel-" + key);
    panel.innerHTML = '<div class="rich"></div>';
    $(".rich", panel).innerHTML = mdToHtml(p.sections[key]);
  }

  if (p.isFallback) {
    toast("Projeto gerado no modo modelo pronto (sem IA).");
  } else {
    toast("Projeto gerado com IA com sucesso!" + (window.__aiModelUsed ? " Modelo: " + window.__aiModelUsed : ""));
  }

  switchTab("overview");
}

function initTabs() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
}

function switchTab(name) {
  $$(".tab").forEach((t) => {
    const active = t.dataset.tab === name;
    t.classList.toggle("tab--active", active);
    t.setAttribute("aria-selected", String(active));
  });
  for (const key of ["overview", "plan", "do", "check", "act"]) {
    $("#panel-" + key).hidden = key !== name;
  }
}

function copyToClipboard() {
  if (!App.project) return;
  const md = "# " + App.generatedTitle + "\n\n" +
    ["overview", "plan", "do", "check", "act"].map((k) => App.project.sections[k]).join("\n\n");
  navigator.clipboard.writeText(md).then(
    () => toast("Conteúdo copiado para a área de transferência."),
    () => toast("Não foi possível copiar automaticamente.", true)
  );
}

function escHtmlAttr(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderHistory() {
  const listEl = $("#historyList");
  if (!listEl) return;
  const list = loadHistory();
  if (!list.length) {
    listEl.innerHTML =
      '<p class="history-empty">Nenhum projeto criado ainda. Gere o primeiro projeto com a IA acima e ele aparecerá aqui.</p>';
    return;
  }
  listEl.innerHTML = list
    .map((it) => {
      const date = new Date(it.savedAt).toLocaleDateString("pt-BR");
      return (
        '<article class="history-card" data-id="' + escHtmlAttr(it.id) + '">' +
        '<div class="history-card-body">' +
        "<h3>" + escHtmlAttr(it.title) + "</h3>" +
        '<p class="history-date">Criado em ' + date + " · " +
        (it.project && it.project.isFallback ? "modelo pronto" : "gerado com IA") + "</p>" +
        "</div>" +
        '<div class="history-card-actions">' +
        '<button class="btn btn--ghost btn--sm" type="button" data-hist="open">Abrir no painel</button>' +
        '<a class="btn btn--ghost btn--sm" href="templates.html">Templates</a>' +
        '<button class="btn btn--ghost btn--sm btn--danger" type="button" data-hist="del">Excluir</button>' +
        "</div>" +
        "</article>"
      );
    })
    .join("");
}

function initHistory() {
  const listEl = $("#historyList");
  if (!listEl) return;
  renderHistory();
  listEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-id]");
    if (!card) return;
    const item = loadHistory().find((it) => it.id === card.dataset.id);
    if (!item || !item.project) return;
    if (e.target.closest('[data-hist="open"]')) {
      App.project = item.project;
      App.generatedTitle = item.title || App.project.title || "Projeto de Extensão Acadêmica";
      saveProjectToStorage(App.project, App.generatedTitle);
      renderProject(item.project);
      $("#resultado").scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (e.target.closest('[data-hist="del"]')) {
      removeHistoryItem(card.dataset.id);
      renderHistory();
      toast("Projeto removido do histórico.");
    }
  });
}

function initActions() {
  $("#extForm").addEventListener("submit", handleGenerate);
  $("#btnCopy").addEventListener("click", copyToClipboard);
  $("#btnMd").addEventListener("click", () => {
    if (App.project) exportMarkdown({ title: App.generatedTitle, sections: App.project.sections });
  });
  $("#btnDocxP").addEventListener("click", () => openTemplate("pdca"));
  $("#btnDocxR").addEventListener("click", () => openTemplate("relatorio"));
  $("#btnPrint").addEventListener("click", () => {
    if (App.project) {
      const ok = exportPrint({ title: App.generatedTitle, sections: App.project.sections });
      if (!ok) toast("Bloqueio de pop-up detectado. Permita pop-ups para imprimir.", true);
    }
  });
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  initSiteBase();
  loadModelUI();
  initModel();
  initTabs();
  initActions();
  initHistory();
});
