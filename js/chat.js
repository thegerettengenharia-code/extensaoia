"use strict";

const Chat = {
  history: [],
  busy: false
};

function chatEscape(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chatAdd(role, html, extra) {
  const w = $("#chatWindow");
  const empty = $(".chat-empty", w);
  if (empty) empty.remove();
  const div = document.createElement("div");
  div.className = "chat-msg chat-msg--" + role + (extra ? " " + extra : "");
  div.innerHTML = '<div class="chat-bubble">' + html + "</div>";
  w.appendChild(div);
  w.scrollTop = w.scrollHeight;
  return div;
}

function chatTyping(on) {
  const existing = $(".chat-typing");
  if (on) {
    if (existing) return;
    const div = document.createElement("div");
    div.className = "chat-msg chat-msg--ai chat-typing";
    div.innerHTML = '<div class="chat-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span> Gerando seu projeto…</div>';
    $("#chatWindow").appendChild(div);
    $("#chatWindow").scrollTop = $("#chatWindow").scrollHeight;
  } else if (existing) {
    existing.remove();
  }
}

function chatToFormData(text) {
  const areas = ["Engenharia do Produto", "Ergonomia e Segurança do Trabalho", "Gerência de Produção", "Gestão Econômica", "Transporte e Logística"];
  const lower = text.toLowerCase();
  const area = areas.find((a) => lower.includes(a.toLowerCase())) || "Gerência de Produção";
  const firstLine = text.split("\n").map((s) => s.trim()).find((s) => s && s.length < 120) || "";
  return {
    titulo: firstLine,
    curso: "Não informado",
    area: area,
    publico: "A definir com a comunidade",
    problema: text.slice(0, 3000),
    local: "A definir",
    duracao: "2 semestres",
    equipe: "A definir",
    parcerias: "A definir",
    objetivos: [],
    objetivoGeral: "",
    aluno: "",
    ra: "",
    polo: ""
  };
}

function chatProjectFromRaw(raw, text) {
  const parts = splitByTabs(raw);
  const hasContent = Object.keys(parts).some(
    (k) => k !== "sugestoes" && String(parts[k] || "").trim()
  );
  if (!hasContent) return null;

  if (!String(parts.sugestoes || "").trim()) {
    try {
      parts.sugestoes = fallbackGenerate(chatToFormData(text)).sections.sugestoes;
    } catch (_) {}
  }

  const title =
    (parts.overview.match(/^#\s+(.+)$/m)?.[1] || "").replace("Visão geral do projeto", "").trim() ||
    "Projeto de Extensão Acadêmica";

  return {
    title: title,
    sections: parts,
    templateFields: completeTemplateFields(parseTemplateBlock(parts.template), chatToFormData(text)),
    isFallback: false
  };
}

function chatShowProject(project, isFallback) {
  App.project = project;
  App.generatedTitle = isFallback ? "Projeto de Extensão Acadêmica (modelo pronto)" : project.title;
  saveProjectToStorage(project, App.generatedTitle);
  renderProject(project);
}

async function chatSend() {
  if (Chat.busy) return;
  const text = $("#chatText").value.trim();
  if (!text) {
    toast("Digite uma mensagem.", true);
    return;
  }

  Chat.busy = true;
  const sendBtn = $("#chatSend");
  sendBtn.disabled = true;
  const spin = $(".spinner", sendBtn);
  if (spin) spin.hidden = false;

  chatAdd("user", chatEscape(text));
  chatTyping(true);

  try {
    let userContent = text;
    if (text.length < 60) {
      userContent +=
        "\n\n(As informações essenciais podem estar incompletas. Se faltarem tema, público-alvo ou problema, faça perguntas objetivas em vez de gerar o projeto.)";
    }
    Chat.history.push({ role: "user", content: userContent });

    const messages = [{ role: "system", content: SYSTEM_PROMPT }].concat(Chat.history);
    const raw = aiIsConfigured() ? await aiSend(messages) : "";
    Chat.history.push({ role: "assistant", content: raw });
    chatTyping(false);

    const project = raw ? chatProjectFromRaw(raw, text) : null;

    if (project) {
      chatShowProject(project, false);
      chatAdd("ai",
        "<strong>Projeto gerado:</strong> " + chatEscape(App.generatedTitle) +
        '<div class="chat-note">Projeto estruturado no ciclo PDCA, pronto no painel abaixo.' + (window.__aiModelUsed ? " Modelo usado: " + window.__aiModelUsed + "." : "") + "</div>" +
        '<div class="chat-project-actions">' +
        '<button type="button" data-action="downloads">Baixar documentos</button>' +
        '<button type="button" data-action="view">Ver projeto</button>' +
        "</div>");
    } else if (raw) {
      chatAdd("ai", '<div class="rich chat-reply">' + mdToHtml(raw) + "</div>", "chat-msg--info");
    } else {
      const p = fallbackGenerate(chatToFormData(text));
      chatShowProject(p, true);
      chatAdd("ai",
        "<strong>Modelo pronto gerado</strong> (sem IA no momento)." +
        '<div class="chat-note">Preencha o formulário ou tente novamente para um resultado mais rico.</div>' +
        '<div class="chat-project-actions">' +
        '<button type="button" data-action="downloads">Baixar documentos</button>' +
        '<button type="button" data-action="view">Ver projeto</button>' +
        "</div>");
    }
  } catch (err) {
    chatTyping(false);
    console.error(err);
    let p = null;
    try {
      p = fallbackGenerate(chatToFormData(text));
      chatShowProject(p, true);
      chatAdd("ai",
        "<strong>Não consegui gerar com IA:</strong> " + chatEscape(err.message) +
        '<div class="chat-note">Entreguei o modelo pronto para você não ficar sem resposta. Você pode baixar os documentos abaixo ou tentar novamente.</div>' +
        '<div class="chat-project-actions">' +
        '<button type="button" data-action="downloads">Baixar documentos</button>' +
        '<button type="button" data-action="view">Ver projeto</button>' +
        "</div>", "chat-msg--err");
    } catch (_) {
      chatAdd("ai", "Erro ao gerar o projeto: " + chatEscape(err.message) + " Tente novamente em instantes.", "chat-msg--err");
    }
  } finally {
    Chat.busy = false;
    sendBtn.disabled = false;
    const spin2 = $(".spinner", sendBtn);
    if (spin2) spin2.hidden = true;
    $("#chatText").value = "";
  }
}

function chatInit() {
  $("#chatSend").addEventListener("click", chatSend);

  $$("#chatSuggest .chat-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const ta = $("#chatText");
      ta.value = chip.dataset.idea || "";
      ta.focus();
    });
  });

  $("#chatText").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatSend();
    }
  });

  $("#chatWindow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || !App.project) return;
    if (btn.dataset.action === "view") {
      $("#resultado").scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (btn.dataset.action === "downloads") {
      const card = $("#downloadsCard");
      (card || $("#resultado")).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

document.addEventListener("DOMContentLoaded", chatInit);
