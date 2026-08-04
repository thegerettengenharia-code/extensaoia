"use strict";

const AI_PROVIDERS = {
  openrouter: { label: "OpenRouter", base: "https://openrouter.ai/api/v1", key: "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", maxTokens: 16000 }
};

const MODEL_OPTIONS = [
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", provider: "openrouter", label: "Nemotron 3 Ultra",   desc: "Mais detalhado (recomendado)" },
  { id: "google/gemma-4-31b-it:free",             provider: "openrouter", label: "Gemma 4 31B",        desc: "Equilibrado" },
  { id: "google/gemma-4-26b-a4b-it:free",          provider: "openrouter", label: "Gemma 4 26B",        desc: "Rápido e direto" },
  { id: "openai/gpt-oss-20b:free",                 provider: "openrouter", label: "GPT-OSS 20B",        desc: "Raciocínio (mais lento)" }
];

const SYSTEM_PROMPT = [
  "Você é um especialista em projetos de extensão universitária no Brasil e em metodologias de gestão da qualidade (ciclo PDCA de Deming/Shewhart).",
  "Sua tarefa: criar um projeto de extensão acadêmica COMPLETO, acadêmico, coerente e detalhado, estruturado rigorosamente no ciclo PDCA.",
  "",
  "FORMATO OBRIGATÓRIO DE SAÍDA — o texto DEVE conter exatamente estes 6 blocos separados por marcadores (sem texto fora deles):",
  "<!--TAB:overview-->\n# Visão geral do projeto\n[conteúdo: identificação, resumo executivo, justificativa, objetivo geral, objetivos específicos, metodologia geral, referências]",
  "<!--TAB:plan-->\n# 1. Planejar (Plan)\n[diagnóstico/justificativa, plano de ação, objetivos, metas, indicadores de desempenho (KPIs), cronograma]",
  "<!--TAB:do-->\n# 2. Executar (Do)\n[etapas de execução, metodologias, distribuição de responsabilidades, recursos e parcerias]",
  "<!--TAB:check-->\n# 3. Verificar (Check)\n[instrumentos de avaliação, comparativo planejado x realizado, periodicidade da verificação]",
  "<!--TAB:act-->\n# 4. Agir (Act)\n[análise de desvios, ações corretivas, padronização de boas práticas, continuidade/disseminação]",
  "<!--TAB:template-->\n# Campos para os documentos oficiais\n[campos no formato '- **campo:** valor', um por linha, conforme as REGRAS DO BLOCO TEMPLATE]",
  "",
  "REGRAS DO BLOCO TEMPLATE (último bloco <!--TAB:template-->):",
  "- Use EXATAMENTE os campos abaixo, um por linha, no formato '- **campo:** valor'. Não crie campos novos:",
  "  aluno, ra, polo, ods_metas, imersao, ideacao, prototipacao, ideias_anotacoes, cronograma, mudancas, acao_proposta, local, durante_acao, mudanca_estrategia, resultado_acao, conclusao, depoimentos, relato, depoimento_instituicao, referencias.",
  "- **aluno** e **ra**: nome e RA do(a) aluno(a) que executa a atividade (use os dados fornecidos; se faltarem, escreva '(a preencher)').",
  "- **polo**: polo/unidade da instituição de ensino.",
  "- **ods_metas**: metas dos ODS aderentes ao projeto, uma por linha (ex.: 'ODS 4 — Meta 4.4: ...').",
  "- **imersao**, **ideacao**, **prototipacao**, **ideias_anotacoes**: itens da fase correspondente, um por linha.",
  "- **cronograma**: atividades, um por linha, no formato 'Atividade — responsável — período'.",
  "- **mudancas** (PDCA) e **mudanca_estrategia** (relatório): se houve mudança de estratégia, descreva; senão, 'Não houve necessidade de mudança de estratégia.'",
  "- **acao_proposta**: a proposta/ação final do projeto.",
  "- **local**, **durante_acao**, **resultado_acao**, **conclusao**, **depoimentos**, **depoimento_instituicao**: textos objetivos e coerentes com o projeto.",
  "- **relato**: texto dissertativo em primeira pessoa, com pelo menos 15 linhas, sobre a experiência extensionista, em parágrafo contínuo (sem listas).",
  "- **referencias**: as referências obrigatórias deste prompt, uma por linha.",
  "",
  "REGRAS DE CONTEÚDO:",
  "- Use markdown (## para seções, tabelas, listas, negrito). Tabelas para cronograma e indicadores.",
  "- Escreva em português do Brasil, com linguagem acadêmica, porém objetiva.",
  "- Objetivos específicos devem ser mensuráveis (comece com verbos de ação).",
  "- Inclua indicadores com metas numéricas e prazos realistas.",
  "- Inclua na seção de referências SOMENTE as referências da lista 'REFERÊNCIAS OBRIGATÓRIAS' abaixo, na íntegra e sem alterações. Não invente, adicione ou substitua nenhuma referência.",
  "- Detalhe cada fase do PDCA: o texto deve ser rico e pronto para submeter a edital ou usar em aula.",
  "- Nunca invente dados falsos de diagnóstico; use os dados fornecidos pelo usuário e, quando faltarem, use premissas claras e marcadas como 'a validar'.",
  "",
  "REFERÊNCIAS OBRIGATÓRIAS (use SOMENTE estas, na íntegra):",
  (typeof PROJECT_REFERENCES !== "undefined"
    ? PROJECT_REFERENCES.map((r, i) => `${i + 1}. ${r}`).join("\n")
    : "")
].join("\n");

function aiConfig() {
  const id = localStorage.getItem("eia_model") || MODEL_OPTIONS[0].id;
  const opt = MODEL_OPTIONS.find((m) => m.id === id) || MODEL_OPTIONS[0];
  const p = AI_PROVIDERS[opt.provider];
  return {
    provider: opt.provider,
    base: p.base,
    model: opt.id,
    key: p.key,
    maxTokens: p.maxTokens,
    label: opt.label
  };
}

function aiIsConfigured() {
  return true;
}

async function aiSend(messages) {
  const c = aiConfig();
  if (!c.base || !c.model) throw new Error("Selecione o modelo de IA desejado.");

  const controller = new AbortController();
  window.__aiAbort = controller;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(c.base + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(c.key ? { Authorization: "Bearer " + c.key } : {})
      },
      body: JSON.stringify({
        model: c.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: c.maxTokens
      }),
      signal: controller.signal
    });

    if (res.status === 429 && attempt < 2) {
      await new Promise((r) => setTimeout(r, attempt === 0 ? 3000 : 6000));
      continue;
    }

    if (!res.ok) {
      let detail = "";
      try {
        const j = await res.json();
        detail = j.error?.message || j.message || "";
      } catch (_) {}
      throw new Error("Erro da API (" + res.status + "): " + detail);
    }

    const j = await res.json();
    const ch = j.choices?.[0];
    const text = ch?.message?.content || "";
    if (!text) {
      const reason = ch?.finish_reason;
      const msg = reason === "length"
        ? "A resposta excedeu o limite de tokens deste modelo e ficou incompleta. Tente novamente ou escolha outro modelo."
        : "A API não retornou conteúdo. Tente novamente em instantes.";
      throw new Error(msg);
    }
    return text;
  }
  throw new Error("Limite de uso do modelo gratuito atingido. Tente novamente em instantes ou escolha outro modelo.");
}

async function aiGenerate(userPrompt) {
  return aiSend([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt }
  ]);
}

function splitByTabs(md) {
  const out = { overview: "", plan: "", do: "", check: "", act: "", template: "" };
  const re = /<!--TAB:(overview|plan|do|check|act|template)-->/g;
  let last = null;
  let idx = 0;
  for (let m = re.exec(md); m; m = re.exec(md)) {
    if (last) out[last] += md.slice(idx, m.index);
    last = m[1];
    idx = m.index + m[0].length;
  }
  if (last) out[last] += md.slice(idx);
  return out;
}

function parseTemplateBlock(md) {
  const out = {};
  if (!md) return out;
  let current = null;
  for (const raw of String(md).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^[-*]\s*\*\*([a-z_]+):?\*\*:?\s*(.*)$/.exec(line);
    if (m) {
      current = m[1];
      out[current] = m[2].trim();
      continue;
    }
    const sub = /^\s*[-*]\s+(.*)$/.exec(raw);
    const piece = sub ? sub[1].trim() : line;
    if (!piece || !current || !(current in out)) continue;
    out[current] += (out[current] ? "\n" : "") + piece;
  }
  return out;
}

function mdToHtml(md) {
  if (!md) return "";
  let lines = md.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let listType = null;
  let inTable = false;
  const inline = (s) =>
    s
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/<a\b[^>]*>.*?<\/a>|https?:\/\/[^\s<>"']+/g, (m) =>
        m.startsWith("<a ") ? m : '<a href="' + m + '" target="_blank" rel="noopener">' + m + "</a>"
      );

  const closeList = () => { if (listType) { html += `</${listType}>`; listType = null; } };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      closeList(); inTable = false;
      const lvl = h[1].length;
      html += `<h${lvl}>${inline(h[2])}</h${lvl}>`;
      continue;
    }
    if (/^\s*\|/.test(line)) {
      closeList();
      const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (!inTable) {
        inTable = true;
        html += '<div class="table-wrap"><table><thead><tr>' + cells.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>";
      } else if (cells.every((c) => /^:?-{2,}:?$/.test(c))) {
        continue;
      } else {
        html += "<tr>" + cells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>";
      }
      continue;
    }
    if (inTable && !/^\s*\|/.test(line)) { inTable = false; html += "</tbody></table></div>"; }

    if (/^\s*-\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const t = ordered ? "ol" : "ul";
      if (listType !== t) { closeList(); html += `<${t}>`; listType = t; }
      html += `<li>${inline(line.replace(/^\s*(-|\d+\.)\s+/, ""))}</li>`;
      continue;
    }
    closeList();

    if (/^>\s?/.test(line)) {
      html += `<blockquote><p>${inline(line.replace(/^>\s?/, ""))}</p></blockquote>`;
      continue;
    }
    if (/^(---+|\*\*\*)$/.test(line.trim())) {
      html += "<hr/>";
      continue;
    }
    if (/^\s*$/.test(line)) continue;

    html += `<p>${inline(line)}</p>`;
  }
  closeList();
  if (inTable) html += "</tbody></table></div>";
  return html;
}

function buildUserPrompt(d) {
  const lines = [
    "Dados do projeto (use os dados fornecidos; complete com criatividade e coerência acadêmica):",
    "",
    "- Título: " + (d.titulo || "(sugira um título criativo e profissional)"),
    "- Curso/Programa: " + d.curso,
    "- Área temática: " + d.area,
    "- Público-alvo: " + d.publico,
    "- Problema/Justificativa: " + d.problema,
    "- Local/Instituição: " + (d.local || "(a definir)"),
    "- Duração: " + d.duracao,
    "- Equipe: " + (d.equipe || "(a definir)"),
    "- Parcerias/Recursos: " + (d.parcerias || "(a definir)"),
    "- Objetivos específicos fornecidos: " + (d.objetivos.length ? d.objetivos.join("; ") : "(nenhum — crie você)")
  ];
  if (d.objetivoGeral) lines.push("- Objetivo geral fornecido: " + d.objetivoGeral);
  lines.push("- Aluno(a) para os documentos oficiais: " + (d.aluno || "(a preencher)"));
  lines.push("- RA do aluno(a): " + (d.ra || "(a preencher)"));
  lines.push("- Polo / Unidade: " + (d.polo || "(a preencher)"));
  lines.push("", "Agora gere o projeto completo seguindo EXATAMENTE o formato de 6 blocos com os marcadores <!--TAB:...-->.");
  return lines.join("\n");
}
