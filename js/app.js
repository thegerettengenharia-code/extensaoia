"use strict";

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const App = {
  project: null,
  generatedTitle: ""
};

function initTheme() {
  const saved = localStorage.getItem("eia_theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = saved || (prefersLight ? "light" : "dark");
  document.documentElement.dataset.theme = theme;
  $("#themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("eia_theme", next);
  });
}

function initNav() {
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = $("#navBurger");
  const mobile = $("#navMobile");
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    mobile.hidden = open;
  });
  $$("a", mobile).forEach((a) =>
    a.addEventListener("click", () => {
      burger.setAttribute("aria-expanded", "false");
      mobile.hidden = true;
    })
  );
}

function initReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));
}

function initTypeRotate() {
  const words = ["planejado", "executado", "verificado", "aprimorado"];
  const el = $("#typeRotate");
  let wi = 0, ci = 0, deleting = false;
  const tick = () => {
    const word = words[wi];
    el.textContent = word.slice(0, ci);
    if (!deleting && ci < word.length) { ci++; setTimeout(tick, 70); return; }
    if (!deleting) { deleting = true; setTimeout(tick, 1500); return; }
    if (ci > 0) { ci--; setTimeout(tick, 32); return; }
    deleting = false;
    wi = (wi + 1) % words.length;
    setTimeout(tick, 250);
  };
  tick();
}

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
  const note = $("#providerNote");
  const msg = $("#providerMsg");
  if (status) {
    status.classList.add("is-ready");
    status.innerHTML = '<span class="dot"></span>IA conectada';
  }
  if (note) note.textContent = "O projeto será gerado pelo modelo gratuito selecionado abaixo.";
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
  btn.disabled = on;
  $(".btn-label", btn).hidden = on;
  $(".spinner", btn).hidden = !on;
  $("#genHint").textContent = on
    ? "A IA está trabalhando. A geração completa costuma levar de 1 a 4 minutos…"
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
    if (aiIsConfigured()) {
      const raw = await aiGenerate(buildUserPrompt(d));
      const parts = splitByTabs(raw);
      const title =
        (parts.overview.match(/^#\s+(.+)$/m)?.[1] || "").replace("Visão geral do projeto", "").trim() ||
        d.titulo ||
        "Projeto de Extensão Acadêmica";
      project = { title, sections: parts, templateFields: parseTemplateBlock(parts.template), isFallback: false };
    }
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
  renderProject(project);
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
    toast("Projeto gerado com IA com sucesso!");
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

function toast(msg, isErr) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("err", !!isErr);
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 3200);
}

function initActions() {
  $("#extForm").addEventListener("submit", handleGenerate);
  $("#btnCopy").addEventListener("click", copyToClipboard);
  $("#btnMd").addEventListener("click", () => {
    if (App.project) exportMarkdown({ title: App.generatedTitle, sections: App.project.sections });
  });
  $("#btnDocx").addEventListener("click", async () => {
    if (!App.project) return;
    try {
      const names = await exportTemplates(App.project);
      toast("Baixados: " + names.join(" e "));
    } catch (err) {
      console.error(err);
      toast("Erro ao gerar os DOCX: " + err.message, true);
    }
  });
  $("#btnPrint").addEventListener("click", () => {
    if (App.project) {
      const ok = exportPrint({ title: App.generatedTitle, sections: App.project.sections });
      if (!ok) toast("Bloqueio de pop-up detectado. Permita pop-ups para imprimir.", true);
    }
  });
  $("#year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNav();
  initReveal();
  initTypeRotate();
  loadModelUI();
  initModel();
  initTabs();
  initActions();
});
