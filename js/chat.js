"use strict";

const Chat = {
  file: null,
  fileText: "",
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
  div.innerHTML = html;
  w.appendChild(div);
  w.scrollTop = w.scrollHeight;
  return div;
}

function chatWelcome() {
  if (Chat.welcomeShown) return;
  Chat.welcomeShown = true;
  chatAdd("ai",
    '<div class="chat-avatar">IA</div>' +
    '<div class="chat-bubble">Olá! Sou o assistente do ExtensãoIA. Digite o tema do seu projeto de extensão de Engenharia de Produção, cole o texto de um edital ou envie um arquivo (PDF, DOCX ou TXT). Entrego o projeto completo estruturado no ciclo PDCA, com as referências obrigatórias do site.</div>');
}

function chatTyping(on) {
  const existing = $(".chat-typing");
  if (on) {
    if (existing) return;
    const div = document.createElement("div");
    div.className = "chat-msg chat-msg--ai chat-typing";
    div.innerHTML =
      '<div class="chat-avatar">IA</div>' +
      '<div class="chat-bubble"><span></span><span></span><span></span> Analisando o conteúdo e montando seu projeto…</div>';
    $("#chatWindow").appendChild(div);
    $("#chatWindow").scrollTop = $("#chatWindow").scrollHeight;
  } else if (existing) {
    existing.remove();
  }
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

let chatPdfLib = null;
async function chatExtractPdf(file) {
  if (!window.pdfjsLib) {
    if (!chatPdfLib) {
      chatPdfLib = loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    }
    await chatPdfLib;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const data = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    out += tc.items.map((it) => it.str).join(" ") + "\n";
  }
  return out;
}

let chatMammothLib = null;
async function chatExtractDocx(file) {
  if (!window.mammoth) {
    if (!chatMammothLib) {
      chatMammothLib = loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js");
    }
    await chatMammothLib;
  }
  const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value || "";
}

async function chatExtractFile(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (file.size > 8 * 1024 * 1024) throw new Error("Arquivo muito grande (máximo 8 MB).");
  if (ext === "txt" || ext === "md") return await file.text();
  if (ext === "pdf") return await chatExtractPdf(file);
  if (ext === "docx") return await chatExtractDocx(file);
  if (ext === "doc") throw new Error("Arquivo .doc (Word antigo) não é suportado. Salve como .docx ou .txt.");
  throw new Error("Formato não suportado. Use TXT, MD, PDF ou DOCX.");
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
    "O projeto pertence ao curso de ENGENHARIA DE PRODUÇÃO. Escolha a área temática mais adequada entre: I - Engenharia do Produto; II - Ergonomia e Segurança do Trabalho; III - Gerência de Produção; IV - Gestão Econômica; V - Transporte e Logística. Todo o conteúdo deve ser coerente com a área escolhida.",
    "",
    "CONTEÚDO:",
    content.slice(0, 12000)
  ].join("\n");
}

async function chatSend() {
  if (Chat.busy) return;
  const text = $("#chatText").value.trim();
  if (!text && !Chat.fileText) {
    toast("Digite uma mensagem ou anexe um arquivo.", true);
    return;
  }

  Chat.busy = true;
  const sendBtn = $("#chatSend");
  sendBtn.disabled = true;
  $(".spinner", sendBtn).hidden = false;

  const userContent = [
    text || "",
    Chat.fileText ? "ARQUIVO [" + (Chat.file ? Chat.file.name : "anexo") + "]:\n" + Chat.fileText : ""
  ].filter(Boolean).join("\n\n");

  chatAdd("user",
    '<div class="chat-bubble">' + chatEscape(text) +
    (Chat.fileText ? '<span class="chat-file-tag">anexo: ' + chatEscape(Chat.file.name) + "</span>" : "") +
    "</div>");

  chatTyping(true);

  try {
    let project = null;

    if (aiIsConfigured()) {
      const prompt = chatBuildPrompt(userContent);
      Chat.history.push({ role: "user", content: prompt });
      const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...Chat.history];
      const raw = await aiSend(messages);
      Chat.history.push({ role: "assistant", content: raw });

      const parts = splitByTabs(raw);
      if (Object.values(parts).some((s) => s.trim())) {
        const title =
          (parts.overview.match(/^#\s+(.+)$/m)?.[1] || "").replace("Visão geral do projeto", "").trim() ||
          "Projeto de Extensão Acadêmica";
        project = { title: title, sections: parts, templateFields: parseTemplateBlock(parts.template), isFallback: false };
      } else {
        chatTyping(false);
        chatAdd("ai",
          '<div class="chat-avatar">IA</div>' +
          '<div class="chat-bubble chat-bubble--err">A resposta não veio no formato esperado. Aqui está o texto bruto:</div>' +
          '<div class="chat-bubble chat-bubble--raw"><pre>' + chatEscape(raw.slice(0, 4000)) + "</pre></div>");
        return;
      }
    } else {
      project = fallbackGenerate(chatToFormData(userContent));
    }

    App.project = project;
    App.generatedTitle = project.isFallback ? "Projeto de Extensão Acadêmica (modelo pronto)" : project.title;
    renderProject(project);

    chatTyping(false);
    chatAdd("ai",
      '<div class="chat-avatar">IA</div>' +
      '<div class="chat-bubble chat-bubble--project">' +
      "<strong>Projeto gerado:</strong> " + chatEscape(App.generatedTitle) +
      (project.isFallback
        ? '<div class="chat-note">Modo modelo pronto. Preencha o formulário para resultados mais ricos.</div>'
        : '<div class="chat-note">Projeto estruturado no ciclo PDCA, pronto no painel abaixo.' + (window.__aiModelUsed ? " Modelo usado: " + window.__aiModelUsed + "." : "") + "</div>") +
      '<div class="chat-project-actions">' +
      '<button type="button" data-action="view">Ver no painel</button>' +
      '<button type="button" data-action="doc">Baixar DOCX</button>' +
      "</div>" +
      "</div>");

    if (Chat.fileText) {
      Chat.file = null;
      Chat.fileText = "";
      $("#chatFilebar").hidden = true;
    }
  } catch (err) {
    chatTyping(false);
    console.error(err);
    chatAdd("ai",
      '<div class="chat-avatar">IA</div>' +
      '<div class="chat-bubble chat-bubble--err">Erro ao gerar o projeto: ' + chatEscape(err.message) + ' Tente novamente em instantes ou escolha outro modelo no seletor.</div>');
  } finally {
    Chat.busy = false;
    sendBtn.disabled = false;
    $(".spinner", sendBtn).hidden = true;
    $("#chatText").value = "";
  }
}

function chatInit() {
  chatWelcome();

  $("#chatAttach").addEventListener("click", () => $("#chatFileInput").click());

  $("#chatFileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await chatExtractFile(file);
      if (!text.trim()) throw new Error("Nenhum texto foi extraído do arquivo.");
      Chat.file = file;
      Chat.fileText = text;
      const len = text.length;
      $("#chatFileName").textContent =
        file.name + " (" + (len >= 1000 ? Math.round(len / 1000) + "k" : len) + " caracteres)";
      $("#chatFilebar").hidden = false;
      toast("Arquivo carregado: " + file.name);
    } catch (err) {
      toast(err.message, true);
    }
    e.target.value = "";
  });

  $("#chatFileRemove").addEventListener("click", () => {
    Chat.file = null;
    Chat.fileText = "";
    $("#chatFilebar").hidden = true;
  });

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
    } else if (btn.dataset.action === "doc") {
      exportTemplates(App.project).then(
        (names) => toast("Baixados: " + names.join(" e ")),
        (err) => toast("Erro ao gerar os DOCX: " + err.message, true)
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", chatInit);
