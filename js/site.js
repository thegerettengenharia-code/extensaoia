"use strict";

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const App = {
  project: null,
  generatedTitle: ""
};

const PROJECT_STORAGE_KEY = "eia_project_v1";

function saveProjectToStorage(project, title) {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify({
      project: project,
      title: title || "",
      savedAt: Date.now()
    }));
  } catch (_) {}
}

function loadProjectFromStorage() {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.project ? data : null;
  } catch (_) {
    return null;
  }
}

function completeTemplateFields(fields, d) {
  const base = d && typeof fallbackGenerate === "function" ? fallbackGenerate(d).templateFields : {};
  const allTokens = []
    .concat(typeof PDCA_TOKENS !== "undefined" ? PDCA_TOKENS : [])
    .concat(typeof RELATORIO_TOKENS !== "undefined" ? RELATORIO_TOKENS : []);
  const out = {};
  for (const token of allTokens) {
    const v = fields && fields[token] != null ? String(fields[token]).trim() : "";
    const b = base && base[token] != null ? String(base[token]) : "";
    out[token] = v && v !== "(a preencher)" ? v : b && b !== "(a preencher)" ? b : v || b || "";
  }
  return out;
}

function toast(msg, isErr) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.toggle("err", !!isErr);
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 3200);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar biblioteca externa (verifique a internet)."));
    document.head.appendChild(s);
  });
}

async function generateProjectData(d) {
  let project = null;
  try {
    if (aiIsConfigured()) {
      const raw = await aiGenerate(buildUserPrompt(d));
      const parts = splitByTabs(raw);
      const title =
        (parts.overview.match(/^#\s+(.+)$/m)?.[1] || "").replace("Visão geral do projeto", "").trim() ||
        d.titulo ||
        "Projeto de Extensão Acadêmica";
      project = {
        title,
        sections: parts,
        templateFields: completeTemplateFields(parseTemplateBlock(parts.template), d),
        isFallback: false
      };
    }
  } catch (err) {
    if (err.name === "AbortError") throw err;
    console.error(err);
    return null;
  }
  if (!project) project = fallbackGenerate(d);
  return project;
}

function initTheme() {
  const saved = localStorage.getItem("eia_theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = saved || (prefersLight ? "light" : "dark");
  document.documentElement.dataset.theme = theme;
  const toggle = $("#themeToggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("eia_theme", next);
  });
}

function initNav() {
  const nav = $("#nav");
  if (!nav) return;
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = $("#navBurger");
  const mobile = $("#navMobile");
  if (!burger || !mobile) return;
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

function initSiteBase() {
  initTheme();
  initNav();
}
