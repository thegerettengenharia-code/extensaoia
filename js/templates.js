"use strict";

const TEMPLATE_PDCA = "PDCA.docx";
const TEMPLATE_RELATORIO = "RELATORIO_FINAL.docx";

const PDCA_TOKENS = [
  "aluno", "ods_metas", "imersao", "ideacao", "prototipacao",
  "ideias_anotacoes", "cronograma", "mudancas", "acao_proposta", "referencias"
];

const RELATORIO_TOKENS = [
  "aluno", "ra", "polo", "ods_metas", "local", "durante_acao",
  "mudanca_estrategia", "resultado_acao", "conclusao", "depoimentos",
  "relato", "depoimento_instituicao", "referencias"
];

const SINGLE_LINE_TOKENS = new Set(["aluno", "ra", "polo"]);

let docxLibPromise = null;

function loadDocxLib() {
  if (window.docx) return Promise.resolve(window.docx);
  if (!docxLibPromise) {
    docxLibPromise = loadScript("https://cdn.jsdelivr.net/npm/docx@9.7.1/dist/index.iife.js").then(() => {
      if (!window.docx) throw new Error("A biblioteca DOCX não carregou.");
      return window.docx;
    });
  }
  return docxLibPromise;
}

async function fetchTemplate(name) {
  const res = await fetch("templates/" + name);
  if (!res.ok) throw new Error("Template " + name + " não encontrado no servidor.");
  return res.arrayBuffer();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function cleanText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\*\*/g, "")
    .split("\n")
    .map((s) => s.replace(/^\s*[-•]\s*/, "").trim())
    .filter(Boolean)
    .join("\n");
}

function defaultValueFor(token) {
  if (token === "referencias" && typeof PROJECT_REFERENCES !== "undefined") {
    return PROJECT_REFERENCES.join("\n");
  }
  return "(a preencher)";
}

function fieldParagraphs(docx, value) {
  const lines = cleanText(value).split("\n").filter(Boolean);
  return lines.map((line) =>
    new docx.Paragraph({ children: [new docx.TextRun({ text: line, size: 24 })] })
  );
}

function buildPatches(docx, fields, tokens) {
  const patches = {};
  for (const token of tokens) {
    const value = fields[token] || defaultValueFor(token);
    if (SINGLE_LINE_TOKENS.has(token)) {
      patches[token] = {
        type: docx.PatchType.PARAGRAPH,
        children: [new docx.TextRun({ text: cleanText(value) || "(a preencher)" })]
      };
    } else {
      patches[token] = {
        type: docx.PatchType.DOCUMENT,
        children: fieldParagraphs(docx, value)
      };
    }
  }
  return patches;
}

async function exportTemplateDoc(fileName, tokens, fields) {
  const docx = await loadDocxLib();
  const data = await fetchTemplate(fileName);
  const patches = buildPatches(docx, fields, tokens);
  const blob = await docx.patchDocument({
    outputType: "blob",
    data: data,
    patches: patches
  });
  downloadBlob(blob, fileName);
  return fileName;
}

async function exportTemplates(project) {
  const fields = (project && project.templateFields) || {};
  const done = [];
  done.push(await exportTemplateDoc(TEMPLATE_PDCA, PDCA_TOKENS, fields));
  done.push(await exportTemplateDoc(TEMPLATE_RELATORIO, RELATORIO_TOKENS, fields));
  return done;
}
