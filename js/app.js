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
  const label = $(".btn-label", btn);
  if (label) label.hidden = on;
  const spin = $(".spinner", btn);
  if (spin) spin.hidden = !on;
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
  renderProject(project);
  setLoading(false);
  $("#resultado").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderProject(p) {
  $("#resultTitle").textContent = App.generatedTitle;
  $("#resultado").hidden = false;

  const doc = $("#resultDoc");
  const labels = {
    overview: "",
    plan: "1 · Planejar",
    do: "2 · Executar",
    check: "3 · Verificar",
    act: "4 · Agir"
  };
  const order = ["overview", "plan", "do", "check", "act"];

  doc.innerHTML = order
    .map((key) => {
      const md = (p.sections && p.sections[key]) || "";
      if (!md.trim()) return "";
      const label = labels[key];
      return (
        '<div class="pdca-card pdca-card--' + key + '">' +
        (label ? '<div class="pdca-phase">' + label + "</div>" : "") +
        '<div class="rich">' + mdToHtml(md) + "</div>" +
        "</div>"
      );
    })
    .join("");

  if (p.isFallback) {
    toast("Projeto gerado no modo modelo pronto (sem IA).");
  } else {
    toast("Projeto gerado com IA com sucesso!" + (window.__aiModelUsed ? " Modelo: " + window.__aiModelUsed : ""));
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

async function downloadProjectDocx(key) {
  const meta = TEMPLATE_META[key];
  if (!meta) return;
  const stored = loadProjectFromStorage();
  const p = App.project || (stored && stored.project) || null;
  if (!p || !p.templateFields) {
    toast("Gere um projeto primeiro.", true);
    return;
  }

  const btn = key === "pdca" ? $("#btnDocxP") : $("#btnDocxR");
  const spin = btn && $(".spinner", btn);
  if (btn) btn.disabled = true;
  if (spin) spin.hidden = false;

  try {
    const name = await exportTemplateDoc(meta.file, meta.tokens, p.templateFields);
    toast("Baixado: " + name);
  } catch (err) {
    console.error(err);
    toast("Erro ao gerar o DOCX: " + err.message, true);
  } finally {
    if (btn) btn.disabled = false;
    if (spin) spin.hidden = true;
  }
}

function initActions() {
  $("#extForm").addEventListener("submit", handleGenerate);
  $("#btnCopy").addEventListener("click", copyToClipboard);
  $("#btnMd").addEventListener("click", () => {
    if (App.project) exportMarkdown({ title: App.generatedTitle, sections: App.project.sections });
  });
  $("#btnDocxP").addEventListener("click", () => downloadProjectDocx("pdca"));
  $("#btnDocxR").addEventListener("click", () => downloadProjectDocx("relatorio"));
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
  initActions();
});
