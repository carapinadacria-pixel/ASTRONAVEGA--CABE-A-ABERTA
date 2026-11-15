import React, { useEffect, useRef, useState } from 'react';
import {
  User,
  Briefcase,
  Car,
  Rocket,
  Sliders,
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  HelpCircle,
} from 'lucide-react';
import { useGameStore } from '../store';
import { Language } from '../utils/i18n';

interface ControlItem {
  input: string;
  label: string;
  detail: string;
  accent?: 'cyan' | 'amber' | 'emerald';
}

interface TutorialCategory {
  id: string;
  stepNum: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  desktop: ControlItem[];
  mobile: ControlItem[];
  tip: string;
}

const TUTORIAL_CONTENT: Record<
  Language,
  {
    headerKicker: string;
    headerTitle: string;
    storyModeTag: string;
    explorationModeTag: string;
    stepOf: string;
    desktopHeading: string;
    desktopSub: string;
    mobileHeading: string;
    mobileSub: string;
    tipLabel: string;
    skipBtn: string;
    prevBtn: string;
    nextBtn: string;
    startMissionBtn: string;
    startExploreBtn: string;
    finishBtn: string;
    closeAria: string;
    categories: TutorialCategory[];
  }
> = {
  pt: {
    headerKicker: 'Manual Operacional GGPEN',
    headerTitle: 'Guia Completo de Botões e Controlos',
    storyModeTag: 'Antes da Missão 1',
    explorationModeTag: 'Antes da Exploração',
    stepOf: 'Etapa',
    desktopHeading: 'Computador (Teclado e Rato)',
    desktopSub: 'Atalhos diretos no teclado e controlo de câmara com o rato',
    mobileHeading: 'Telemóvel e Tablet (Toque)',
    mobileSub: 'Joystick analógico, botões de ação táteis e painel direcional',
    tipLabel: 'Nota de Operação',
    skipBtn: 'Saltar Tutorial',
    prevBtn: 'Anterior',
    nextBtn: 'Próximo',
    startMissionBtn: 'Começar Missão 1',
    startExploreBtn: 'Começar Exploração',
    finishBtn: 'Concluir Guia',
    closeAria: 'Fechar tutorial',
    categories: [
      {
        id: 'astronaut',
        stepNum: '01',
        shortTitle: 'Astronauta',
        title: '01. Movimento do Astronauta e Câmara',
        subtitle: 'Deslocação realista em solo, corrida, saltos por gravidade planetária e natação.',
        icon: User,
        desktop: [
          {
            input: 'W A S D / ↑ ↓ ← →',
            label: 'Andar e Nadar',
            detail:
              'Move o astronauta para a frente, trás e lados com passo natural. Dentro de lagos ou oceanos na Terra, as mesmas teclas controlam a natação.',
            accent: 'cyan',
          },
          {
            input: 'Shift',
            label: 'Correr (Sprint)',
            detail:
              'Mantém premido enquanto avanças para passar de caminhada (~3,9 m/s) para corrida rápida (~9,8 m/s).',
            accent: 'emerald',
          },
          {
            input: 'Espaço',
            label: 'Saltar / Subir na Água',
            detail:
              'Executa um salto ajustado à gravidade do planeta (na Lua saltas muito mais alto do que na Terra). Na água, faz o astronauta subir à superfície.',
            accent: 'cyan',
          },
          {
            input: 'Rato (Arrastar)',
            label: 'Rodar Câmara e Olhar',
            detail:
              'Arrasta no ecrã para rodar a câmara em volta do astronauta em 3.ª pessoa ou orientar o olhar em 1.ª pessoa.',
          },
          {
            input: 'Botão 📷 (Inf. Dir.)',
            label: 'Alternar Câmara (1.ª / 3.ª Pessoa)',
            detail:
              'Muda entre a vista exterior por trás do astronauta e a vista imersiva por dentro do capacete.',
          },
          {
            input: 'Botão Correr (Inf. Dir.)',
            label: 'Corrida Contínua por Clique',
            detail:
              'Ativa ou desativa o modo de corrida automática sem precisares de segurar continuamente na tecla Shift.',
            accent: 'emerald',
          },
        ],
        mobile: [
          {
            input: 'Joystick Esquerdo',
            label: 'Caminhar e Nadar 360°',
            detail:
              'Empurra ligeiramente para andar devagar com precisão ou até à borda do anel para marcha rápida. Também controla a direção a nadar.',
            accent: 'cyan',
          },
          {
            input: 'Botão ⚡ Correr',
            label: 'Ligar / Desligar Corrida',
            detail:
              'Toque único que mantém o astronauta em corrida contínua enquanto moves o joystick. Toca novamente para voltar a caminhar.',
            accent: 'emerald',
          },
          {
            input: 'Botão ↑ Saltar',
            label: 'Salto e Subida Aquática',
            detail:
              'Faz o astronauta saltar sobre obstáculos ou subir rapidamente à superfície quando estiveres a nadar no oceano ou lago.',
            accent: 'cyan',
          },
          {
            input: 'Deslizar Ecrã',
            label: 'Orientar Câmara Livre',
            detail:
              'Desliza o dedo na zona livre do ecrã para rodar o ângulo de visão em 360 graus à volta da personagem.',
          },
          {
            input: 'Botão 📷 (Dir.)',
            label: 'Mudar 1.ª / 3.ª Pessoa',
            detail:
              'Alterna rapidamente entre câmara exterior e vista interior do visor do capacete.',
          },
        ],
        tip: 'No computador, se usares o botão "Correr" no canto inferior direito, não precisas de manter Shift premido durante longas caminhadas.',
      },
      {
        id: 'interactions',
        stepNum: '02',
        shortTitle: 'Ações e Mochila',
        title: '02. Ações, Mochila e Sobrevivência',
        subtitle: 'Recolha de minérios, gestão de oxigénio, viseira solar, portas e interação de missão.',
        icon: Briefcase,
        desktop: [
          {
            input: 'B ou Botão ⚡',
            label: 'Recolher Recursos e Minérios',
            detail:
              'Extrai Ferro, Titânio, Quartzo, Lítio, Água Pura ou Núcleos de Plasma de rochas e depósitos próximos para a tua mochila.',
            accent: 'amber',
          },
          {
            input: 'I ou Botão 💼',
            label: 'Abrir Mochila de Sobrevivência',
            detail:
              'Gere o peso (kg) e espaços ocupados. Permite consumir Água Pura (+O₂/Hidratação), recarregar Oxigénio, reparar o fato e fabricar melhorias.',
            accent: 'amber',
          },
          {
            input: 'F ou Botão Topo Dir.',
            label: 'Ação de Missão (Fatos e Bandeira)',
            detail:
              'Na Terra, perto da mesa do Hangar, equipa os fatos espaciais. Na Lua, junto ao suporte assinalado, hasteia a Bandeira de Angola.',
            accent: 'emerald',
          },
          {
            input: 'E',
            label: 'Portão do Hangar / Câmara O₂',
            detail:
              'Na Terra, abre ou fecha o portão principal do Hangar. Noutros planetas, abre ou fecha a Câmara de Oxigénio do fato (mantenha aberta para não perder O₂!).',
            accent: 'cyan',
          },
          {
            input: 'V ou Botão 👁️/☀️',
            label: 'Alternar Viseira Solar 24K',
            detail:
              'Troca entre viseira ótica transparente e filtro dourado 24K para proteger a visão da radiação intensa perto do Sol.',
          },
          {
            input: 'C ou Botão 📚',
            label: 'Biblioteca Científica Digital',
            detail:
              'Quando estiveres perto dos supercomputadores do Hangar ou Laboratório, abre livros e fichas técnicas de física espacial.',
          },
        ],
        mobile: [
          {
            input: 'Botão 💼 (Esq.)',
            label: 'Mochila de Sobrevivência',
            detail:
              'Situado acima do joystick (mostra um número com o total de itens). Toca para hidratar, usar reservas de oxigénio e fabricar equipamento.',
            accent: 'amber',
          },
          {
            input: 'Botão Topo Direito',
            label: 'Ações Contextuais Inteligentes',
            detail:
              'Aparece automaticamente quando estás perto de algo: "Vestir Fato Espacial", "Prender Bandeira de Angola" ou "Abrir Biblioteca".',
            accent: 'emerald',
          },
          {
            input: 'Botão 👁️ (Dir.)',
            label: 'Viseira Transparente / Ouro 24K',
            detail:
              'Ativa ou desativa a viseira dourada antirradiação diretamente a partir do grupo de botões do lado direito.',
          },
          {
            input: 'Botão 🚪 / 💨 (Dir.)',
            label: 'Portão do Hangar ou Câmara O₂',
            detail:
              'Na Terra abre o portão do Hangar; em planetas sem ar controla a Câmara O₂. Se piscar a vermelho, toca logo para reabrir o oxigénio!',
            accent: 'cyan',
          },
        ],
        tip: 'Se fechares a Câmara de O₂ fora da Terra, o oxigénio cai rapidamente a cada 3 segundos. Reabre imediatamente com [E] ou no botão O₂.',
      },
      {
        id: 'vehicles',
        stepNum: '03',
        shortTitle: 'Carros',
        title: '03. Condução de Veículos Terrestres',
        subtitle: 'Acesso rápido entre o Hangar, o Laboratório e a Plataforma usando a frota da base.',
        icon: Car,
        desktop: [
          {
            input: 'R',
            label: 'Entrar ou Sair do Carro',
            detail:
              'Quando estiveres próximo de qualquer carro estacionado junto ao Hangar ou Laboratório, prime R para assumir o volante ou sair.',
            accent: 'emerald',
          },
          {
            input: 'W / ↑',
            label: 'Acelerar com Marchas Progressivas',
            detail:
              'Arrancada progressiva e realista até aos 200 km/h nos carros normais (SUV, Sedan, Conversível) e até aos 230 km/h nos supercarros.',
            accent: 'cyan',
          },
          {
            input: 'S / ↓',
            label: 'Travar e Marcha-Atrás (R)',
            detail:
              'Reduz rapidamente a velocidade e, com o veículo parado, engata a marcha-atrás para manobrar.',
          },
          {
            input: 'A D / ← →',
            label: 'Direção Esquerda / Direita',
            detail:
              'Vira as rodas dianteiras suavemente em curva conforme a velocidade do veículo.',
          },
          {
            input: 'Shift · Espaço',
            label: 'Modo Desportivo · Travão de Mão',
            detail:
              'Shift ativa o modo desportivo com maior binário no arranque (até 200 / 230 km/h); Espaço aciona o travão de emergência para paragem imediata.',
            accent: 'amber',
          },
          {
            input: 'Botão Cockpit (HUD)',
            label: 'Vista 1.ª / 3.ª Pessoa no Volante',
            detail:
              'No painel superior direito de condução podes alternar entre vista exterior e interior do cockpit, vendo velocidade (km/h) e mudança (G).',
          },
        ],
        mobile: [
          {
            input: 'Entrar / Sair [R]',
            label: 'Botão de Acesso ao Veículo',
            detail:
              'Aparece no topo direito quando te aproximas de um carro. Para sair a qualquer momento, toca em "Sair" no painel do velocímetro.',
            accent: 'emerald',
          },
          {
            input: 'Botões ↖ ▲ ↗',
            label: 'Acelerar e Curvar em Frente',
            detail:
              'Ao conduzir, o joystick vira um painel de 6 setas: ▲ acelera a direito; ↖ e ↗ aceleram virando logo para a esquerda ou direita.',
            accent: 'cyan',
          },
          {
            input: 'Botões ◀ ▼ ▶',
            label: 'Virar, Travar e Marcha-Atrás',
            detail:
              '◀ e ▶ ajustam a direção lateral; ▼ trava suavemente o carro e engata a marcha-atrás quando parado.',
          },
          {
            input: 'Painel Topo Direito',
            label: 'Velocímetro, Mudança (G) e Câmara',
            detail:
              'Mostra a velocidade atual em km/h, a mudança (N, R, 1..6) e inclui um botão direto para alternar entre câmara interior e exterior.',
          },
        ],
        tip: 'Os carros normais atingem os 200 km/h em 6 marchas progressivas, e o Supercarro Azul acelera até aos 230 km/h.',
      },
      {
        id: 'spacecraft',
        stepNum: '04',
        shortTitle: 'Foguete e Nave',
        title: '04. Foguete, Lançamento e Voo Espacial',
        subtitle: 'Abastecimento na plataforma, descolagem da Terra, desencapsulamento e navegação orbital.',
        icon: Rocket,
        desktop: [
          {
            input: 'Encher Tanque (Segurar)',
            label: 'Abastecer Foguete na Plataforma',
            detail:
              'No Modo Exploração, aproxima-te do foguete e mantém premido "Encher Tanque" até atingir pelo menos 85% (limiar de Órbita Segura). No Modo História já vem a 100%.',
            accent: 'amber',
          },
          {
            input: 'R ou Botão Embarcar',
            label: 'Embarcar e Iniciar Contagem (5s)',
            detail:
              'Com o fato vestido e combustível pronto, prime R ou toca no botão "Subir no Foguete / Entrar na Cápsula" para entrar (encostar não embarca).',
            accent: 'emerald',
          },
          {
            input: 'W A S D / ↑ ↓ ← →',
            label: 'Pilotar Nariz da Nave (Pitch / Yaw)',
            detail:
              'Orienta a cápsula espacial em direção a qualquer planeta, à Lua ou aos exoplanetas visíveis ao longe (W/↑ mergulha o nariz; S/↓ sobe).',
            accent: 'cyan',
          },
          {
            input: 'Espaço ou Shift',
            label: 'Impulso e Turbo Orbital',
            detail:
              'Acelera os propulsores da cápsula até 980 km/h (Espaço) ou 1450 km/h (Shift) para percorrer rapidamente distâncias interplanetárias.',
            accent: 'amber',
          },
          {
            input: 'Aproximação Planetária',
            label: 'Entrada Atmosférica e Aterragem',
            detail:
              'Aponta para o farol luminoso de um planeta e aproxima-te para aterrar automaticamente. Evita entrar demasiado perto do Sol para não sobreaquecer!',
          },
        ],
        mobile: [
          {
            input: 'Painel Abastecer (Topo)',
            label: 'Manter Premido para Abastecer',
            detail:
              'Junto ao foguete na Terra, mantém o dedo sobre "Encher Tanque" até passar a linha branca dos 85% e depois toca em "Embarcar no Foguete".',
            accent: 'amber',
          },
          {
            input: 'Joystick Esquerdo',
            label: 'Guiar Direção da Cápsula',
            detail:
              'No espaço, o joystick controla a inclinação (subir/descer) e o leme lateral para alinhares o trajeto com o planeta escolhido.',
            accent: 'cyan',
          },
          {
            input: 'Botão ↑ Impulso',
            label: 'Queima Contínua de Propulsores',
            detail:
              'Mantém premido o botão grande direito (Impulso) para aumentar a velocidade de cruzeiro rumo ao astro-alvo.',
            accent: 'amber',
          },
          {
            input: 'Botão ⚡ Turbo',
            label: 'Modo Turbo Interplanetário',
            detail:
              'Ativa ou desativa a potência máxima contínua para viagens rápidas entre a Terra, Júpiter, Saturno ou exoplanetas distantes.',
            accent: 'emerald',
          },
        ],
        tip: 'Na Missão 1 do Modo História, após o desencapsulamento em órbita, o piloto automático guia a nave diretamente até à Lua.',
      },
      {
        id: 'system',
        stepNum: '05',
        shortTitle: 'HUD e Sistema',
        title: '05. Indicadores Vitais, Recursos e Sistema',
        subtitle: 'Leitura dos painéis do ecrã, personalização do astronauta, áudio e reabertura deste guia.',
        icon: Sliders,
        desktop: [
          {
            input: 'Topo Esquerdo (HUD)',
            label: 'Planeta, Gravidade, Vida e O₂',
            detail:
              'Mostra em que astro estás, a gravidade local (m/s² e G), a integridade do fato (%) e o nível de Oxigénio / Hidratação.',
            accent: 'cyan',
          },
          {
            input: 'Canto Inferior Direito',
            label: 'Cartão Rápido de Recursos (Fe · Ti · Pl)',
            detail:
              'Apresenta em tempo real as unidades recolhidas de Ferro (Fe), Titânio (Ti) e Plasma (Pl) para construção e reparações.',
          },
          {
            input: 'Botão 👤 Astronauta',
            label: 'Personagem, Viseira e Cor do Fato',
            detail:
              'No topo direito, permite alternar entre Tenente Manuel e Ana Mequiese, trocar o estilo do fato (Branco EVA, Laranja Orion ou Carbono) e ajustar a viseira.',
          },
          {
            input: 'Botão ⚙️ Definições',
            label: 'Idioma, FPS, Música e Menu',
            detail:
              'Altera o idioma (PT / EN), o limite de FPS (20 a 60), a faixa musical (incluindo Beethoven Op. 68), o volume de música/efeitos ou volta ao menu inicial.',
            accent: 'amber',
          },
          {
            input: 'Botão ? Tutorial',
            label: 'Reabrir Este Guia a Qualquer Hora',
            detail:
              'Fica sempre disponível no canto superior direito ao lado de Astronauta e Definições para consultares qualquer atalho durante o jogo.',
            accent: 'emerald',
          },
        ],
        mobile: [
          {
            input: 'Topo Esquerdo & Direito',
            label: 'Telemetria Compacta sem Obstrução',
            detail:
              'No topo esquerdo vês Planeta e Gravidade; no topo direito, Vida e O₂ em cartões compactos desenhados para não taparem o joystick nem os botões táteis.',
            accent: 'cyan',
          },
          {
            input: 'Topo Direito 👤 · ⚙️ · ?',
            label: 'Astronauta, Definições e Tutorial',
            detail:
              'Três ícones rápidos no canto superior direito permitem personalizar o herói, ajustar som/FPS/idioma ou reabrir este tutorial passo a passo.',
            accent: 'emerald',
          },
          {
            input: '🔊 Ouvir Dica (Missão)',
            label: 'Repetir Instrução por Voz',
            detail:
              'Na barra superior de missão (Modo História), toca no ícone de altifalante para ouvir novamente a orientação da etapa atual.',
            accent: 'amber',
          },
        ],
        tip: 'Se quiseres mudar para Inglês ou aumentar para 60 FPS, abre o ícone de engrenagem (⚙️) no canto superior direito.',
      },
    ],
  },
  en: {
    headerKicker: 'GGPEN Operations Manual',
    headerTitle: 'Complete Buttons & Controls Guide',
    storyModeTag: 'Before Mission 1',
    explorationModeTag: 'Before Exploration',
    stepOf: 'Step',
    desktopHeading: 'Computer (Keyboard & Mouse)',
    desktopSub: 'Direct keyboard shortcuts and mouse camera control',
    mobileHeading: 'Mobile & Tablet (Touch)',
    mobileSub: 'Analog joystick, touch action buttons, and driving keypad',
    tipLabel: 'Operations Note',
    skipBtn: 'Skip Tutorial',
    prevBtn: 'Previous',
    nextBtn: 'Next',
    startMissionBtn: 'Start Mission 1',
    startExploreBtn: 'Start Exploration',
    finishBtn: 'Finish Guide',
    closeAria: 'Close tutorial',
    categories: [
      {
        id: 'astronaut',
        stepNum: '01',
        shortTitle: 'Astronaut',
        title: '01. Astronaut Movement & Camera',
        subtitle: 'Natural ground walking, sprinting, gravity-scaled jumping, and swimming.',
        icon: User,
        desktop: [
          {
            input: 'W A S D / ↑ ↓ ← →',
            label: 'Walk & Swim',
            detail:
              'Moves the astronaut forward, backward, and sideways with natural gait. Inside Earth lakes or oceans, the same keys steer swimming.',
            accent: 'cyan',
          },
          {
            input: 'Shift',
            label: 'Run (Sprint)',
            detail:
              'Hold while moving to shift from normal walk (~3.9 m/s) to high-speed sprint (~9.8 m/s).',
            accent: 'emerald',
          },
          {
            input: 'Space',
            label: 'Jump / Surface in Water',
            detail:
              'Performs a jump scaled to local gravity (you leap much higher on the Moon than Earth). In water, swims upward toward the surface.',
            accent: 'cyan',
          },
          {
            input: 'Mouse Drag',
            label: 'Orbit Camera & Look',
            detail:
              'Drag across the viewport to orbit around the astronaut in 3rd person or look around in 1st-person helmet view.',
          },
          {
            input: '📷 Button (Bottom-Right)',
            label: 'Switch Camera (1st / 3rd Person)',
            detail:
              'Toggles between external chase view and immersive inside-the-helmet perspective.',
          },
          {
            input: 'Run Button (Bottom-Right)',
            label: 'Toggle Continuous Run',
            detail:
              'Locks sprint mode on or off with a single click so you do not have to hold Shift.',
            accent: 'emerald',
          },
        ],
        mobile: [
          {
            input: 'Left Analog Stick',
            label: '360° Walk & Swim',
            detail:
              'Push slightly for slow precision steps or all the way to the rim for brisk walking. Also steers swimming in water.',
            accent: 'cyan',
          },
          {
            input: '⚡ Run Button',
            label: 'Toggle Sprint Mode',
            detail:
              'Single tap toggles continuous sprinting whenever you move the joystick. Tap again to return to walking pace.',
            accent: 'emerald',
          },
          {
            input: '↑ Jump Button',
            label: 'Jump & Swim Up',
            detail:
              'Jumps across terrain and craters or ascends rapidly toward the surface when submerged.',
            accent: 'cyan',
          },
          {
            input: 'Swipe Screen',
            label: 'Free Camera Rotation',
            detail:
              'Drag a finger across open screen space to rotate the camera angle 360 degrees around your astronaut.',
          },
          {
            input: '📷 Button (Right)',
            label: 'Toggle 1st / 3rd Person',
            detail:
              'Switches instantly between outside view and first-person visor perspective.',
          },
        ],
        tip: 'On desktop, toggling the Run button at the bottom right lets you sprint hands-free without holding Shift.',
      },
      {
        id: 'interactions',
        stepNum: '02',
        shortTitle: 'Actions & Bag',
        title: '02. Actions, Backpack & Survival',
        subtitle: 'Resource harvesting, oxygen management, solar visor, hangar door, and mission prompts.',
        icon: Briefcase,
        desktop: [
          {
            input: 'B or ⚡ Button',
            label: 'Collect Ores & Samples',
            detail:
              'Harvests Iron, Titanium, Quartz, Lithium, Pure Water, or Plasma Cores from nearby rock formations into your backpack.',
            accent: 'amber',
          },
          {
            input: 'I or 💼 Button',
            label: 'Open Survival Backpack',
            detail:
              'Tracks weight (kg) and slots. Drink Pure Water (+O₂/Hydration), refill Oxygen, repair your suit, and craft upgrades.',
            accent: 'amber',
          },
          {
            input: 'F or Top-Right Prompt',
            label: 'Mission Action (Suit & Flag)',
            detail:
              'At Earth Hangar table, equips your spacesuits. On the Moon, plants the Angola Flag at the marked stand.',
            accent: 'emerald',
          },
          {
            input: 'E',
            label: 'Hangar Gate / O₂ Chamber',
            detail:
              'On Earth, opens or closes the Hangar gate. Off-Earth, opens or closes your suit Oxygen Chamber (keep it open to breathe!).',
            accent: 'cyan',
          },
          {
            input: 'V or 👁️/☀️ Button',
            label: 'Toggle 24K Gold Solar Visor',
            detail:
              'Switches between clear optical glass and 24K gold thermal shielding against intense solar glare.',
          },
          {
            input: 'C or 📚 Button',
            label: 'Digital Science Library',
            detail:
              'When near Hangar or Lab computers, opens astrophysics and orbital mechanics reference books.',
          },
        ],
        mobile: [
          {
            input: '💼 Button (Left)',
            label: 'Survival Backpack',
            detail:
              'Located above the joystick with an item-count badge. Tap to hydrate, use oxygen canisters, and craft items.',
            accent: 'amber',
          },
          {
            input: 'Top-Right Prompt',
            label: 'Smart Context Actions',
            detail:
              'Appears automatically when near objectives: "Equip Spacesuit", "Plant Angola Flag", or "Open Library".',
            accent: 'emerald',
          },
          {
            input: '👁️ Button (Right)',
            label: 'Clear / 24K Gold Visor',
            detail:
              'Toggles the gold solar protection shield directly from the right-hand cluster.',
          },
          {
            input: '🚪 / 💨 Button (Right)',
            label: 'Hangar Door or O₂ Chamber',
            detail:
              'Controls the Hangar door on Earth or Oxygen Chamber on other worlds. If pulsing red, tap immediately to restore O₂!',
            accent: 'cyan',
          },
        ],
        tip: 'Closing your O₂ Chamber outside Earth drains oxygen every 3 seconds. Reopen it right away with [E] or the O₂ button.',
      },
      {
        id: 'vehicles',
        stepNum: '03',
        shortTitle: 'Vehicles',
        title: '03. Ground Vehicles & Driving',
        subtitle: 'Travel rapidly between the Hangar, Science Lab, and Launch Pad.',
        icon: Car,
        desktop: [
          {
            input: 'R',
            label: 'Enter or Exit Vehicle',
            detail:
              'Stand near any parked car around the Hangar or Lab and press R to hop into the driver seat or step out.',
            accent: 'emerald',
          },
          {
            input: 'W / ↑',
            label: 'Progressive Throttle (+100 km/h)',
            detail:
              'Realistic acceleration with an automatic 6-speed gearbox reaching 200 km/h in standard cars (SUV, Sedan, Convertible) and 230 km/h in supercars.',
            accent: 'cyan',
          },
          {
            input: 'S / ↓',
            label: 'Brake & Reverse Gear (R)',
            detail:
              'Applies strong braking force and shifts into reverse once the vehicle slows to a stop.',
          },
          {
            input: 'A D / ← →',
            label: 'Left / Right Steering',
            detail:
              'Smoothly turns the front wheels according to your current driving speed.',
          },
          {
            input: 'Shift · Space',
            label: 'Sport Mode · Handbrake',
            detail:
              'Shift engages Sport Mode for stronger launch torque up to 200 / 230 km/h; Space applies the emergency handbrake for rapid stops.',
            accent: 'amber',
          },
          {
            input: 'Cockpit HUD Button',
            label: '1st / 3rd Person Driving View',
            detail:
              'Top-right driving HUD shows km/h speedometer, active gear (G), and a button to toggle interior cockpit camera.',
          },
        ],
        mobile: [
          {
            input: 'Enter / Exit [R]',
            label: 'Vehicle Access Button',
            detail:
              'Appears top-right when near a car. Tap "Exit" on the speedometer card whenever you want to step out.',
            accent: 'emerald',
          },
          {
            input: '↖ ▲ ↗ Buttons',
            label: 'Accelerate Straight or Turning',
            detail:
              'While driving, the joystick converts into a 6-button driving pad: ▲ drives straight ahead; ↖ and ↗ accelerate while steering left/right.',
            accent: 'cyan',
          },
          {
            input: '◀ ▼ ▶ Buttons',
            label: 'Steer, Brake & Reverse',
            detail:
              '◀ and ▶ steer laterally; ▼ brakes and engages reverse gear when stationary.',
          },
          {
            input: 'Top-Right Gauge',
            label: 'Speedometer, Gear (G) & Camera',
            detail:
              'Displays live speed in km/h, current gear (N, R, 1..6), and a quick button to switch between exterior and cockpit view.',
          },
        ],
        tip: 'Standard cars progressively reach 200 km/h across 6 gears, while the Blue Supercar accelerates up to 230 km/h.',
      },
      {
        id: 'spacecraft',
        stepNum: '04',
        shortTitle: 'Rocket & Space',
        title: '04. Rocket Launch & Spaceflight',
        subtitle: 'Refueling on the pad, Earth liftoff, orbital staging, and interplanetary flight.',
        icon: Rocket,
        desktop: [
          {
            input: 'Hold Refuel',
            label: 'Fuel Rocket on Launch Pad',
            detail:
              'In Exploration Mode, stand by the rocket and hold "Hold to Refuel" until at least 85% (Safe Orbit threshold). Story Mode starts at 100%.',
            accent: 'amber',
          },
          {
            input: 'R or Board Button',
            label: 'Board & Start 5s Countdown',
            detail:
              'With your spacesuit on and fuel ready, press R or tap the "Board Rocket / Capsule" button to board (touching the hull alone will not board).',
            accent: 'emerald',
          },
          {
            input: 'W A S D / ↑ ↓ ← →',
            label: 'Steer Spacecraft Nose (Pitch / Yaw)',
            detail:
              'Aims your orbital capsule toward any planet, moon, or distant exoplanet (W/↑ pitches down; S/↓ pitches up).',
            accent: 'cyan',
          },
          {
            input: 'Space or Shift',
            label: 'Main Thrusters & Orbital Turbo',
            detail:
              'Fires engines up to 980 km/h (Space) or 1450 km/h (Shift) to cross interplanetary space rapidly.',
            accent: 'amber',
          },
          {
            input: 'Planetary Approach',
            label: 'Atmospheric Entry & Landing',
            detail:
              'Fly toward any glowing planet beacon to enter its atmosphere and land automatically. Stay clear of the Sun to prevent overheating!',
          },
        ],
        mobile: [
          {
            input: 'Refuel Panel (Top)',
            label: 'Press & Hold to Refuel',
            detail:
              'At the launch pad, hold "Hold to Refuel" past the 85% white marker, then tap "Board Rocket".',
            accent: 'amber',
          },
          {
            input: 'Left Analog Stick',
            label: 'Steer Spacecraft Trajectory',
            detail:
              'In space, the joystick controls pitch and yaw to line up your capsule with any target planet or star system.',
            accent: 'cyan',
          },
          {
            input: '↑ Thrust Button',
            label: 'Hold for Engine Burn',
            detail:
              'Hold the large right-side Thrust button to accelerate steadily toward your target world.',
            accent: 'amber',
          },
          {
            input: '⚡ Turbo Button',
            label: 'Continuous Max Cruise',
            detail:
              'Toggles continuous maximum thruster output for fast deep-space transit.',
            accent: 'emerald',
          },
        ],
        tip: 'In Story Mode Mission 1, once orbital staging completes, autopilot steers your capsule directly to the Moon.',
      },
      {
        id: 'system',
        stepNum: '05',
        shortTitle: 'HUD & System',
        title: '05. Vitals HUD, Resources & System',
        subtitle: 'Reading telemetry bars, astronaut customization, audio/FPS settings, and reopening this guide.',
        icon: Sliders,
        desktop: [
          {
            input: 'Top-Left HUD',
            label: 'World, Gravity, Suit & O₂',
            detail:
              'Displays current planet, surface gravity (m/s² and G), suit integrity (%), and Oxygen / Hydration reserves.',
            accent: 'cyan',
          },
          {
            input: 'Bottom-Right Card',
            label: 'Live Resource Tally (Fe · Ti · Pl)',
            detail:
              'Shows your collected Iron (Fe), Titanium (Ti), and Plasma (Pl) stockpiles in real time.',
          },
          {
            input: '👤 Astronaut Button',
            label: 'Hero, Visor & Suit Style',
            detail:
              'Top-right button lets you switch between Lt. Manuel and Ana Mequiese, choose White EVA / Orange Orion / Carbon suits, and change visor.',
          },
          {
            input: '⚙️ Settings Button',
            label: 'Language, FPS, Music & Menu',
            detail:
              'Changes language (PT / EN), FPS cap (20–60), music track (including Beethoven Op. 68), music/SFX sliders, or returns to main menu.',
            accent: 'amber',
          },
          {
            input: '? Tutorial Button',
            label: 'Reopen This Guide Anytime',
            detail:
              'Always stays pinned in the top-right bar next to Astronaut and Settings so you can check any button whenever needed.',
            accent: 'emerald',
          },
        ],
        mobile: [
          {
            input: 'Top-Left & Top-Right',
            label: 'Compact Telemetry Layout',
            detail:
              'Planet and gravity sit top-left; Suit Health and O₂ sit top-right so your thumbs always have clear access to controls below.',
            accent: 'cyan',
          },
          {
            input: 'Top-Right 👤 · ⚙️ · ?',
            label: 'Astronaut, Settings & Tutorial',
            detail:
              'Three quick buttons let you swap hero appearance, tune audio/FPS/language, or reopen this step-by-step guide anytime.',
            accent: 'emerald',
          },
          {
            input: '🔊 Voice Tip Button',
            label: 'Replay Mission Guidance',
            detail:
              'On the top Story Mission banner, tap the speaker icon anytime to hear the current objective guidance again.',
            accent: 'amber',
          },
        ],
        tip: 'Need to switch language or raise frame rate to 60 FPS? Open the Settings gear (⚙️) in the top-right corner.',
      },
    ],
  },
};

function getAccentClasses(accent?: ControlItem['accent']) {
  switch (accent) {
    case 'amber':
      return 'border-amber-500/45 text-amber-300 bg-amber-950/35';
    case 'emerald':
      return 'border-emerald-500/45 text-emerald-300 bg-emerald-950/35';
    case 'cyan':
    default:
      return 'border-cyan-500/45 text-cyan-300 bg-cyan-950/35';
  }
}

export function ControlsTutorialModal() {
  const isOpen = useGameStore((s) => s.isControlsTutorialOpen);
  const hasSeen = useGameStore((s) => s.hasSeenControlsTutorial);
  const closeControlsTutorial = useGameStore((s) => s.closeControlsTutorial);
  const gameMode = useGameStore((s) => s.gameMode);
  const language = useGameStore((s) => s.language);

  const [stepIndex, setStepIndex] = useState(0);
  const [mobilePlatformTab, setMobilePlatformTab] = useState<'mobile' | 'desktop'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobile' : 'desktop'
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const t = TUTORIAL_CONTENT[language];
  const categories = t.categories;
  const totalSteps = categories.length;
  const activeCategory = categories[stepIndex] || categories[0];
  const ActiveIcon = activeCategory.icon;
  const isLastStep = stepIndex === totalSteps - 1;

  // Reset to step 0 and auto-select best platform view whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
      setMobilePlatformTab(
        typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobile' : 'desktop'
      );
    }
  }, [isOpen]);

  // Scroll body back to top cleanly when switching category step
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [stepIndex, mobilePlatformTab]);

  // Keyboard navigation (Escape to close, Left/Right arrows between steps)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeControlsTutorial(true);
      } else if (e.key === 'ArrowRight') {
        setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setStepIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, totalSteps, closeControlsTutorial]);

  if (!isOpen) return null;

  const finalActionLabel = hasSeen
    ? t.finishBtn
    : gameMode === 'story'
    ? t.startMissionBtn
    : t.startExploreBtn;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-[#04070E]/88 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
      onClick={() => closeControlsTutorial(true)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92vh] bg-[#0B0E17] border border-slate-700/85 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 select-none"
      >
        {/* Header Bar */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0 bg-[#0B0E17]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#111827] border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono text-slate-400">
                <span className="text-cyan-400 font-semibold">{t.headerKicker}</span>
                <span aria-hidden="true">·</span>
                <span>{gameMode === 'story' ? t.storyModeTag : t.explorationModeTag}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-amber-300 font-semibold">
                  {t.stepOf} {activeCategory.stepNum}/{String(totalSteps).padStart(2, '0')}
                </span>
              </div>
              <h2
                id="tutorial-modal-title"
                className="text-base sm:text-xl font-bold tracking-tight text-white leading-snug mt-0.5"
              >
                {t.headerTitle}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => closeControlsTutorial(true)}
            className="min-w-[40px] min-h-[40px] rounded-xl bg-[#111827] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label={t.closeAria}
            title={t.closeAria}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Category Step Navigation Tabs */}
        <div className="px-4 py-2.5 sm:px-6 border-b border-slate-800 bg-[#0E1320] shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              const isActive = idx === stepIndex;
              const isCompleted = idx < stepIndex;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setStepIndex(idx)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isActive
                      ? 'bg-cyan-500/15 border-cyan-400/75 text-cyan-200'
                      : isCompleted
                      ? 'bg-[#111827] border-emerald-500/35 text-emerald-300 hover:bg-slate-800'
                      : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono tabular-nums text-[11px] opacity-80">{cat.stepNum}</span>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{cat.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Category Body */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4 bg-[#0B0E17]"
        >
          {/* Active Category Heading + Mobile Platform Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/90">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <ActiveIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-bold text-white leading-snug">
                  {activeCategory.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-0.5">
                  {activeCategory.subtitle}
                </p>
              </div>
            </div>

            {/* Segmented Platform Switch on Small/Medium Viewports (Both shown side-by-side on lg+) */}
            <div className="flex lg:hidden items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-xl self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setMobilePlatformTab('mobile')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mobilePlatformTab === 'mobile'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{language === 'pt' ? 'Telemóvel' : 'Mobile'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobilePlatformTab('desktop')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mobilePlatformTab === 'desktop'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{language === 'pt' ? 'Computador' : 'Desktop'}</span>
              </button>
            </div>
          </div>

          {/* Control Cards Grid: Side-by-side on Desktop (lg), Tabbed on Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Desktop Column */}
            <section
              className={`bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3 ${
                mobilePlatformTab === 'desktop' ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{t.desktopHeading}</h4>
                    <p className="text-[11px] text-slate-400">{t.desktopSub}</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-800/80">
                {activeCategory.desktop.map((item) => (
                  <div key={item.input + item.label} className="py-2.5 first:pt-1 last:pb-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {item.label}
                      </span>
                      <kbd
                        className={`font-mono tabular-nums text-[11px] font-bold px-2 py-0.5 rounded-md border ${getAccentClasses(
                          item.accent
                        )}`}
                      >
                        {item.input}
                      </kbd>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Mobile Column */}
            <section
              className={`bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3 ${
                mobilePlatformTab === 'mobile' ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{t.mobileHeading}</h4>
                    <p className="text-[11px] text-slate-400">{t.mobileSub}</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-800/80">
                {activeCategory.mobile.map((item) => (
                  <div key={item.input + item.label} className="py-2.5 first:pt-1 last:pb-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {item.label}
                      </span>
                      <span
                        className={`font-mono tabular-nums text-[11px] font-bold px-2 py-0.5 rounded-md border ${getAccentClasses(
                          item.accent
                        )}`}
                      >
                        {item.input}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Operational Note Callout (Clean subtle surface, no thick left bar) */}
          <div className="bg-[#111827] border border-amber-500/35 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="text-[11px] font-mono font-bold text-amber-300 shrink-0">
              {t.tipLabel}:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">{activeCategory.tip}</p>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-800 bg-[#0E1320] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => closeControlsTutorial(true)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-700/80 bg-[#111827] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {t.skipBtn}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={stepIndex === 0}
              className={`min-h-[42px] px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                stepIndex === 0
                  ? 'bg-[#0B0E17] border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-[#111827] border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.prevBtn}</span>
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={() => closeControlsTutorial(true)}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <Check className="w-4 h-4" />
                <span>{finalActionLabel}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <span>{t.nextBtn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
