"use strict";

const Chat = {
  history: [],
  busy: false,
  welcomeShown: false
};

function chatEscape(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chatAdd(role, html) {
  const w = $("#chatWindow");
  const div = document.createElement("div");
  div.className = "chat-msg chat-msg--" + role;
  div.innerHTML = '<div class="chat-bubble">' + html + "</div>";
  w.appendChild(div);
  w.scrollTop = w.scrollHeight;
  return div;
}

function chatWelcome() {
  if (Chat.welcomeShown) return;
  Chat.welcomeShown = true;
  chatAdd("ai",
    "Olá! Descreva o tema do seu projeto de extensão do <strong>Programa de Contexto à Comunidade</strong> (Engenharia de Produção) ou cole o texto de um edital. A IA entrega o projeto completo no ciclo PDCA, com as referências obrigatórias.");
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

function chatBuildPrompt(content) {
  return [
    "Analise o conteúdo abaixo e gere o projeto de extensão acadêmica COMPLETO seguindo EXATAMENTE o formato de 6 blocos com os marcadores <!--TAB:overview-->, <!--TAB:plan-->, <!--TAB:do-->, <!--TAB:check-->, <!--TAB:act--> e <!--TAB:template-->.",
    "Siga TODAS as regras do prompt de sistema: ciclo PDCA (Planejar, Executar, Verificar, Agir) e somente as referências bibliográficas obrigatórias.",
    "O projeto faz parte do PROGRAMA DE CONTEXTO À COMUNIDADE do curso de ENGENHARIA DE PRODUÇÃO: ações de transferência de conhecimento e orientações técnicas para demandas reais da comunidade (prefeituras, associações de bairros, escolas municipais e estaduais, instituições religiosas, ONGs).",
    "Escolha a área temática mais adequada entre: I - Engenharia do Produto; II - Ergonomia e Segurança do Trabalho; III - Gerência de Produção; IV - Gestão Econômica; V - Transporte e Logística. Todo o conteúdo deve ser coerente com a área escolhida.",
    "",
    "CONTEÚDO:",
    content.slice(0, 12000)
  ].join("\n");
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
    let project = null;

    if (aiIsConfigured()) {
      const prompt = chatBuildPrompt(text);
      Chat.history.push({ role: "user", content: prompt });
      const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...Chat.history];
      const raw = await aiSend(messages);
      Chat.history.push({ role: "assistant", content: raw });

      const parts = splitByTabs(raw);
      if (Object.values(parts).some((s) => s.trim())) {
        const title =
          (parts.overview.match(/^#\s+(.+)$/m)?.[1] || "").replace("Visão geral do projeto", "").trim() ||
          "Projeto de Extensão Acadêmica";
        project = {
          title: title,
          sections: parts,
          templateFields: completeTemplateFields(parseTemplateBlock(parts.template), chatToFormData(text)),
          isFallback: false
        };
      } else {
        chatTyping(false);
        chatAdd("ai", '<span class="chat-msg--err-text">A resposta não veio no formato esperado. Tente novamente em instantes.</span>');
        return;
      }
    } else {
      project = fallbackGenerate(chatToFormData(text));
    }

    App.project = project;
    App.generatedTitle = project.isFallback ? "Projeto de Extensão Acadêmica (modelo pronto)" : project.title;
    saveProjectToStorage(project, App.generatedTitle);
    renderProject(project);

    chatTyping(false);
    chatAdd("ai",
      "<strong>Projeto gerado:</strong> " + chatEscape(App.generatedTitle) +
      (project.isFallback
        ? '<div class="chat-note">Modo modelo pronto. Preencha o formulário para resultados mais ricos.</div>'
        : '<div class="chat-note">Projeto estruturado no ciclo PDCA, pronto no painel abaixo.' + (window.__aiModelUsed ? " Modelo usado: " + window.__aiModelUsed + "." : "") + "</div>") +
      '<div class="chat-project-actions">' +
      '<button type="button" data-action="view">Ver projeto</button>' +
      "</div>");
  } catch (err) {
    chatTyping(false);
    console.error(err);
    chatAdd("ai", '<span class="chat-msg--err-text">Erro ao gerar o projeto: ' + chatEscape(err.message) + " Tente novamente em instantes.</span>");
  } finally {
    Chat.busy = false;
    sendBtn.disabled = false;
    const spin2 = $(".spinner", sendBtn);
    if (spin2) spin2.hidden = true;
    $("#chatText").value = "";
  }
}

function chatInit() {
  chatWelcome();

  $("#chatSend").addEventListener("click", chatSend);

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
    }
  });
}

document.addEventListener("DOMContentLoaded", chatInit);
