"use strict";

const PROJECT_REFERENCES = [
  "BALDISSERA, Olívia. O que é, como aplicar e quais as etapas do design thinking. 2021. Disponível em: https://posdigital.pucpr.br/blog/etapas-do-design-thinking. Acesso em: 20 mai. 2022.",
  "BRASIL. Resolução CNE/CES nº 7, de 18 de dezembro de 2018. Estabelece as Diretrizes para a Extensão na Educação Superior Brasileira e regimenta o disposto na Meta 12.7 da Lei nº 13.005/2014, que aprova o Plano Nacional de Educação - PNE 2014-2024 e dá outras providências. Disponível em: https://www.in.gov.br/materia/-/asset_publisher/Kujrw0TZC2Mb/content/id/55877808. Acesso em: 22 jul. 2022.",
  "COSTA, Margareth de Souza [et al.]. Uma proposta simplificada do Design Thinking para as micro e pequenas empresas atendidas no programa Ali à Luz de Brown. In: 9º International Symposium on Technological Innovation - ISTI. 2008. Disponível em: http://www.api.org.br/conferences/index.php/ISTI2018/ISTI2018/paper/viewFile/537/268. Acesso em: 20 mai. 2022.",
  "ENDEAVOR. Design Thinking: ferramenta de inovação para empreendedoras e empreendedores. Disponível em: https://endeavor.org.br/tecnologia/design-thinking-inovacao/. Acesso em: 22 jul. 2022.",
  "ENDEAVOR. PDCA: a prática levando sua gestão à perfeição. Disponível em: https://endeavor.org.br/estrategia-e-gestao/pdca/. Acesso em: 22 jul. 2022.",
  "SEBRAE. Ferramenta: ANÁLISE SWOT (CLÁSSICO). Disponível em: https://www.sebrae.com.br/Sebrae/Portal%20Sebrae/Anexos/ME_Analise-Swot.PDF. Acesso em: 22 jul. 2022.",
  "SEBRAE. Saiba o que é e como fazer excelente benchmark: Entenda como funciona, o que é, e os objetivos de trabalhar o benchmark na sua empresa. Disponível em: https://www.sebrae.com.br/sites/PortalSebrae/ufs/ap/artigos/saiba-o-que-e-e-como-fazer-excelente-benchmark,1cb0c51b14713610VgnVCM1000004c00210aRCRD. Acesso em: 09 dez. 2022.",
  "STOODI. Mapa Mental: o que é? Como fazer? Aprenda agora! Disponível em: https://www.stoodi.com.br/blog/dicas-de-estudo/como-fazer-um-mapa-mental/. Acesso em: 22 jul. 2022.",
  "3 pilares do Design Thinking: entenda os conceitos e como aplicá-los no seu dia a dia. Disponível em: https://www.mjvinnovation.com/pt-br/blog/3-pilares-do-design-thinking-entenda-os-conceitos-e-como-aplica-los-no-seu-dia-a-dia/. Acesso em: 20 mai. 2020.",
  "VIANNA, Maurício [et al.]. Design thinking: inovação em negócios. Rio de Janeiro: MJV Press, 2012. Disponível em: http://centrodeinovacaodemaringa.org.br/wp-content/uploads/2017/08/Livro_Design_Thinking_-_Inovao_Negcios.pdf. Acesso em: 20 mai. 2022."
];

const PROJECT_REFERENCES_MD = PROJECT_REFERENCES
  .map((r, i) => `${i + 1}. ${r}`)
  .join("\n");

function fallbackGenerate(d) {
  const objEspec = d.objetivos && d.objetivos.length
    ? d.objetivos
    : [
        "Mapear e diagnosticar a realidade do público-alvo no contexto local.",
        "Promover ações educativas e práticas alinhadas à área temática do projeto.",
        "Fortalecer vínculos entre a comunidade, a universidade e os parceiros locais.",
        "Avaliar os resultados por meio de indicadores e instrumentos de verificação."
      ];

  const metas = [
    { meta: "Realizar o diagnóstico da comunidade no 1º mês do projeto", ind: "Relatório de diagnóstico aprovado", prazo: "Mês 1" },
    { meta: "Engajar pelo menos 60% do público-alvo previsto nas ações", ind: "Lista de presença / formulários", prazo: "Ao longo do ciclo" },
    { meta: "Executar 100% das atividades do cronograma", ind: "Checklist de atividades", prazo: "Mês final" },
    { meta: "Alcançar satisfação mínima de 80% entre os participantes", ind: "Questionário de satisfação", prazo: "Mês final" }
  ];

  const cronograma = [
    ["Etapa", "Mês 1", "Mês 2", "Mês 3", "Mês 4", "Mês 5", "Mês 6"],
    ["Diagnóstico e planejamento", "X", "X", "", "", "", ""],
    ["Mobilização e divulgação", "", "X", "X", "", "", ""],
    ["Execução das ações", "", "", "X", "X", "X", ""],
    ["Verificação e avaliação", "", "", "", "X", "X", ""],
    ["Relatório final e novos ciclos", "", "", "", "", "X", "X"]
  ];

  const t = (rows) =>
    rows.map((r) => "| " + r.join(" | ") + " |").join("\n") +
    "\n" + "| " + rows[0].map(() => "---").join(" | ") + " |";

  const fasePlan = [
    "# 1. Planejar (Plan)",
    "",
    "## 1.1 Diagnóstico do problema",
    `O problema que motiva este projeto foi identificado em diálogo com a comunidade e contextualizado a partir dos dados disponíveis: **${d.problema}**. A equipe atuará sobre essa realidade com escuta ativa, levantamento de dados locais e validação junto aos públicos envolvidos, garantindo que o planejamento parta de necessidades reais e não de suposições.`,
    "",
    "## 1.2 Matriz 5W2H (plano de ação)",
    "",
    t([
      ["Pergunta", "Resposta"],
      ["O quê?", `Executar o projeto de extensão "${d.titulo}" na área de ${d.area}.`],
      ["Por quê?", d.problema],
      ["Onde?", d.local || "Local a definir com os parceiros"],
      ["Quando?", `Durante ${d.duracao}, conforme cronograma.`],
      ["Quem?", d.equipe || "Equipe multidisciplinar do curso " + d.curso],
      ["Como?", "Metodologia participativa, oficinas, rodas de conversa e atividades práticas."],
      ["Quanto custa?", "Recursos materiais e de deslocamento, com apoio institucional e parcerias."]
    ]),
    "",
    "## 1.3 Objetivos e metas",
    "",
    "**Objetivo geral:** " + (d.objetivoGeral || `Promover ${d.area.toLowerCase()} de forma participativa junto a ${d.publico}, por meio de ações de extensão estruturadas no ciclo PDCA.`),
    "",
    "**Objetivos específicos:**",
    "",
    objEspec.map((o, i) => `${i + 1}. ${o}`).join("\n"),
    "",
    "**Metas e indicadores de desempenho:**",
    "",
    t([["Meta", "Indicador", "Prazo"], ...metas.map((m) => [m.meta, m.ind, m.prazo])]),
    "",
    "## 1.4 Cronograma de planejamento",
    "",
    t(cronograma)
  ].join("\n");

  const faseDo = [
    "# 2. Executar (Do)",
    "",
    "## 2.1 Etapas de execução",
    "",
    "1. **Preparação** — Capacitação da equipe, alinhamento com parceiros e preparação dos materiais didáticos.",
    "2. **Mobilização** — Divulgação nas comunidades, escolas e espaços públicos; formação de grupos de interesse.",
    "3. **Ações práticas** — Oficinas, rodas de conversa, atendimentos e atividades educativas conduzidas de forma participativa.",
    "4. **Registro contínuo** — Diário de campo, fotos, listas de presença e relatórios parciais alimentados ao longo de toda a execução.",
    "",
    "## 2.2 Metodologia de ação",
    "A execução combina **educação popular** (a partir da realidade e do saber da comunidade), **aprendizagem baseada em projetos** e **intervenção territorial**, sempre com a comunidade como protagonista e não mera receptora. Cada atividade é planejada com objetivo, público, metodologia, responsável e produto esperado.",
    "",
    "## 2.3 Distribuição de responsabilidades",
    "",
    t([
      ["Papel", "Responsabilidades"],
      ["Coordenador(a)", "Gestão geral, interlocução com a instituição e os parceiros"],
      ["Equipe executora", "Condução das atividades e mediação com a comunidade"],
      ["Comunicação", "Divulgação, redes sociais e registros das ações"],
      ["Avaliação", "Aplicação dos instrumentos e sistematização dos dados"]
    ]),
    "",
    "## 2.4 Recursos e parcerias",
    d.parcerias
      ? `O projeto conta com o apoio de: **${d.parcerias}**. Esses vínculos ampliam o alcance e a sustentabilidade das ações.`
      : "O projeto buscará parcerias com equipamentos públicos (CRAS, escolas, unidades de saúde), associações comunitárias e empresas locais para ampliar alcance e sustentabilidade."
  ].join("\n");

  const faseCheck = [
    "# 3. Verificar (Check)",
    "",
    "## 3.1 Instrumentos de avaliação",
    "",
    "1. **Questionários** (pré e pós) aplicados ao público-alvo para medir mudanças de conhecimento e percepção.",
    "2. **Observação sistemática** e registros em diário de campo durante as atividades.",
    "3. **Listas de presença** e fichas de participação para medir engajamento.",
    "4. **Grupos focais** e escuta qualificada para captar percepções qualitativas.",
    "",
    "## 3.2 Comparativo: planejado × realizado",
    "",
    t([
      ["Dimensão", "Planejado", "Como verificar"],
      ["Público alcançado", "Meta definida na fase Planejar", "Listas de presença e formulários"],
      ["Atividades", "100% do cronograma", "Checklist de execução"],
      ["Satisfação", "≥ 80%", "Questionário de satisfação"],
      ["Impacto", "Indicadores da fase Planejar", "Pré-teste e pós-teste"]
    ]),
    "",
    "## 3.3 Periodicidade da verificação",
    "A verificação acontece **ao final de cada atividade** (registro rápido) e **mensalmente** (reunião de análise com a equipe). Ao fim do ciclo, é produzido um **relatório consolidado** que confronta metas e resultados.",
    "",
    "> Indicador fora da meta não é falha: é informação. O ciclo existe para que a equipe aprenda e ajuste."
  ].join("\n");

  const faseAct = [
    "# 4. Agir (Act)",
    "",
    "## 4.1 Análise dos desvios",
    "A partir do comparativo planejado × realizado, a equipe classifica cada desvio em: **causa do processo** (corrigível com ajuste de método) ou **fator externo** (exige replanejamento). Para cada desvio, define-se uma ação corretiva com responsável e prazo.",
    "",
    "## 4.2 Ações corretivas e de melhoria",
    "",
    t([
      ["Desvio identificado", "Ação corretiva", "Responsável"],
      ["Baixa adesão do público", "Redimensionar horários e reforçar divulgação com lideranças locais", "Comunicação"],
      ["Metodologia pouco efetiva", "Readequar a abordagem com base na escuta dos participantes", "Equipe executora"],
      ["Atraso no cronograma", "Reordenar prioridades e redistribuir tarefas", "Coordenador(a)"],
      ["Resultados abaixo da meta", "Intensificar atividades de reforço e apoio individualizado", "Equipe executora"]
    ]),
    "",
    "## 4.3 Padronização e registro de boas práticas",
    "O que funcionou é transformado em **procedimento-padrão** (roteiros de oficina, modelos de instrumentos, guia de mobilização) e compartilhado com a instituição e outros projetos de extensão, garantindo que o aprendizado do ciclo não se perca.",
    "",
    "## 4.4 Continuidade: o próximo ciclo",
    "O PDCA recomeça: os aprendizados viram insumos para o novo planejamento. O projeto também prevê **disseminação** dos resultados por meio de relatórios, apresentações em eventos científicos, artigos e materiais para a comunidade.",
    "",
    "> O ciclo nunca termina: cada Agir é o novo Planejar."
  ].join("\n");

  const visaoGeral = [
    "# Visão geral do projeto",
    "",
    "## Identificação",
    "",
    t([
      ["Campo", "Dados"],
      ["Título", d.titulo],
      ["Curso / Programa", d.curso],
      ["Área temática", d.area],
      ["Local de atuação", d.local || "A definir com os parceiros"],
      ["Duração", d.duracao],
      ["Público-alvo", d.publico],
      ["Equipe", d.equipe || "A definir"]
    ]),
    "",
    "## Resumo executivo",
    `O projeto **${d.titulo}**, vinculado ao curso de ${d.curso} (área: ${d.area}), propõe uma intervenção de extensão universitária junto a ${d.publico}, no contexto de ${d.local || "comunidades parceiras"}. A partir do diagnóstico do problema — ${d.problema} —, a proposta estrutura-se no ciclo PDCA (Planejar, Executar, Verificar e Agir), garantindo rigor metodológico, avaliação por indicadores e melhoria contínua ao longo de ${d.duracao}.`,
    "",
    "## Justificativa",
    `A extensão universitária cumpre sua função social ao aproximar a universidade da comunidade. O problema identificado — **${d.problema}** — evidencia uma demanda real que pode ser enfrentada com o conhecimento acadêmico do curso de ${d.curso}. Este projeto contribui para a formação cidadã dos(as) extensionistas, para o fortalecimento do vínculo universidade-comunidade e para o alcance dos princípios da curricularização da extensão (Resolução CNE/CES nº 7/2018).`,
    "",
    "## Objetivo geral",
    d.objetivoGeral || `Promover ${d.area.toLowerCase()} de forma participativa junto a ${d.publico}, por meio de ações de extensão estruturadas no ciclo PDCA.`,
    "",
    "## Objetivos específicos",
    "",
    objEspec.map((o, i) => `${i + 1}. ${o}`).join("\n"),
    "",
    "## Metodologia geral",
    "A proposta segue o ciclo **PDCA**: (1) **Planejar** — diagnóstico e plano de ação; (2) **Executar** — atividades participativas; (3) **Verificar** — avaliação por indicadores; (4) **Agir** — correções, padronização e novos ciclos.",
    "",
    "## Referências",
    "",
    PROJECT_REFERENCES_MD
  ].join("\n");

  const templateFields = {
    aluno: d.aluno || "(a preencher)",
    ra: d.ra || "(a preencher)",
    polo: d.polo || "(a preencher)",
    ods_metas: [
      "ODS 4 (Educação de qualidade) — Meta 4.4: aumentar substancialmente o número de jovens e adultos com habilidades relevantes, inclusive competências técnicas e profissionais, para emprego, trabalho decente e empreendedorismo.",
      "ODS 11 (Cidades e comunidades sustentáveis) — Meta 11.3: fortalecer a urbanização inclusiva e sustentável e a capacidade para o planejamento e a gestão participativa."
    ].join("\n"),
    imersao: [
      "Entrevista com o parceiro/instituição para identificação dos principais problemas e fragilidades do contexto.",
      "Observação do local e do público-alvo, com registro em diário de campo.",
      "Levantamento de dados e validação das necessidades junto à comunidade."
    ].join("\n"),
    ideacao: [
      "Geração de ideias em grupo (brainstorm) para enfrentar o problema identificado.",
      "Seleção das soluções mais viáveis considerando recursos, tempo e impacto.",
      "Definição da proposta central do projeto com base nas ideias escolhidas."
    ].join("\n"),
    prototipacao: [
      "Construção de um plano piloto das atividades a serem realizadas.",
      "Teste da proposta com um grupo reduzido do público-alvo.",
      "Ajustes no plano a partir do retorno dos participantes."
    ].join("\n"),
    ideias_anotacoes: [
      "Anotações e observações do grupo durante as fases de imersão, ideação e prototipação.",
      "Registros de aprendizados e sugestões da equipe e dos parceiros."
    ].join("\n"),
    cronograma: [
      "Diagnóstico e planejamento — Equipe — Mês 1",
      "Mobilização e divulgação — Equipe — Mês 2",
      "Execução das ações — Equipe — Meses 3 a 5",
      "Verificação e avaliação — Equipe — Mês 5",
      "Relatório final e novos ciclos — Equipe — Mês 6"
    ].join("\n"),
    mudancas: "Não houve necessidade de mudança de estratégia durante a realização do projeto; o cronograma foi cumprido conforme o planejado.",
    acao_proposta: `Executar "${d.titulo}" junto a ${d.publico}, por meio de atividades participativas de ${d.area.toLowerCase()}, promovendo impacto social no território.`,
    local: d.local || "(a preencher)",
    durante_acao: `A ação foi realizada no local ${d.local || "definido com os parceiros"}, envolvendo ${d.publico}. As atividades seguiram a metodologia participativa prevista no planejamento, com registros em diário de campo, listas de presença e fotos.`,
    mudanca_estrategia: "Não houve necessidade de mudança de estratégia. A equipe seguiu o cronograma previsto e os indicadores foram atingidos.",
    resultado_acao: "Os resultados alcançados ficaram dentro do esperado: o público-alvo foi mobilizado, as atividades foram executadas conforme o cronograma e a satisfação dos participantes atingiu o patamar previsto.",
    conclusao: "O projeto cumpriu seus objetivos, aproximando a universidade da comunidade e gerando impacto positivo no território. As boas práticas serão padronizadas e replicadas em novos ciclos.",
    depoimentos: "Registrar aqui os depoimentos dos(as) participantes ao final da ação.",
    relato: [
      "Ao longo da realização do projeto, vivenciei uma experiência enriquecedora e transformadora.",
      "A imersão inicial permitiu compreender a realidade da comunidade e do parceiro, aproximando-me dos problemas reais enfrentados no dia a dia das pessoas atendidas.",
      "Durante as entrevistas e as observações, percebi que muitas necessidades apontadas pela comunidade eram simples de resolver quando há escuta e comprometimento.",
      "A etapa de ideação foi um momento de intensa criatividade, em que o grupo reuniu diferentes pontos de vista para propor soluções viáveis.",
      "Ao prototipar as ações, foi possível testar o que funcionava e ajustar o que precisava de melhorias, sempre com a participação ativa do público.",
      "A execução das atividades foi o momento mais gratificante, pois pude ver de perto o impacto do projeto na vida das pessoas.",
      "A troca de saberes entre a universidade e a comunidade fortaleceu a minha formação, mostrando o papel social da extensão.",
      "O trabalho em equipe e a parceria com a instituição foram fundamentais para o sucesso das ações.",
      "As dificuldades encontradas ao longo do caminho foram superadas com diálogo, planejamento e flexibilidade.",
      "A verificação por meio de questionários e observações permitiu medir os resultados e identificar pontos de melhoria.",
      "Encerro esta etapa com a certeza de que a extensão universitária transforma tanto quem atende quanto quem é atendido.",
      "As boas práticas aprendidas serão levadas para a vida profissional e acadêmica.",
      "Acredito que projetos como este devem ser incentivados e replicados, ampliando o alcance da universidade na comunidade.",
      "A experiência reforçou a importância de colocar o conhecimento a serviço da sociedade.",
      "Sigo motivado a participar de novas ações extensionistas e a contribuir para um território mais justo e sustentável."
    ].join("\n"),
    depoimento_instituicao: "Registrar aqui o depoimento do(a) gestor(a) ou responsável pela instituição participante.",
    referencias: PROJECT_REFERENCES.join("\n")
  };

  return {
    title: d.titulo || "Projeto de Extensão Acadêmica",
    sections: { overview: visaoGeral, plan: fasePlan, do: faseDo, check: faseCheck, act: faseAct },
    templateFields: templateFields,
    isFallback: true
  };
}
