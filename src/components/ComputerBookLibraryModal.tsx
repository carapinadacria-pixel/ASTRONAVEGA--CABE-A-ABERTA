import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Cpu,
  FileText,
  ChevronRight,
  ChevronLeft,
  X,
  Download,
  Sparkles,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useGameStore } from '../store';
import { UI_TEXT } from '../utils/i18n';

interface PDFViewportLike {
  width: number;
  height: number;
}

interface PDFRenderTaskLike {
  promise: Promise<void>;
  cancel: () => void;
}

interface PDFPageProxyLike {
  getViewport: (params: { scale: number }) => PDFViewportLike;
  render: (params: {
    canvas: HTMLCanvasElement;
    viewport: PDFViewportLike;
    transform?: number[];
  }) => PDFRenderTaskLike;
}

interface PDFDocumentProxyLike {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxyLike>;
  cleanup?: () => Promise<void>;
}

interface PDFLoadingTaskLike {
  promise: Promise<PDFDocumentProxyLike>;
  destroy?: () => Promise<void>;
}

interface PDFJsModuleLike {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { url: string }) => PDFLoadingTaskLike;
}

let cachedPdfJsPromise: Promise<PDFJsModuleLike> | null = null;
function loadPdfJs(): Promise<PDFJsModuleLike> {
  const win = window as unknown as { __pdfjsLib?: PDFJsModuleLike; __pdfjsError?: unknown };
  if (win.__pdfjsLib) {
    return Promise.resolve(win.__pdfjsLib);
  }
  if (!cachedPdfJsPromise) {
    cachedPdfJsPromise = new Promise<PDFJsModuleLike>((resolve, reject) => {
      const cleanup = () => {
        window.removeEventListener('pdfjs-ready', onReady);
        window.removeEventListener('pdfjs-error', onError);
      };
      const onReady = () => {
        if (win.__pdfjsLib) {
          cleanup();
          resolve(win.__pdfjsLib);
        }
      };
      const onError = () => {
        cleanup();
        cachedPdfJsPromise = null;
        reject(win.__pdfjsError || new Error('Falha ao carregar motor PDF.js'));
      };
      window.addEventListener('pdfjs-ready', onReady);
      window.addEventListener('pdfjs-error', onError);

      const base = window.location.origin;
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import('${base}/pdfjs/pdf.min.mjs')
          .then((mod) => {
            mod.GlobalWorkerOptions.workerSrc = '${base}/pdfjs/pdf.worker.min.mjs';
            window.__pdfjsLib = mod;
            window.dispatchEvent(new Event('pdfjs-ready'));
          })
          .catch((err) => {
            window.__pdfjsError = err;
            window.dispatchEvent(new Event('pdfjs-error'));
          });
      `;
      document.head.appendChild(script);
    });
  }
  return cachedPdfJsPromise;
}

export interface ScientificBookChapter {
  number: string;
  title: string;
  page: number;
  summary: string;
  keyTopics: string[];
}

export interface ScientificBook {
  id: string;
  title: string;
  subtitle: string;
  authors: string;
  institution: string;
  pages: number;
  language: string;
  accentColor: string;
  badgeText: string;
  pdfUrl: string;
  overview: string;
  chapters: ScientificBookChapter[];
}

export const SCIENTIFIC_BOOKS: ScientificBook[] = [
  {
    id: 'paisagens-cosmicas',
    title: 'Paisagens Cósmicas: Da Terra ao Big Bang',
    subtitle: 'Uma Viagem Visual e Científica pelas Escalas do Universo',
    authors: 'Elysandra Figueredo Cypriano & Augusto Damineli',
    institution: 'Instituto de Astronomia, Geofísica e Ciências Atmosféricas (IAG / USP)',
    pages: 44,
    language: 'Português',
    accentColor: 'from-cyan-500 to-blue-600',
    badgeText: 'COSMOLOGIA & ASTROFÍSICA',
    pdfUrl: '/assets/aistudio/Cypriano_damineli_paisagens_cosmicas_baixa_caeea7af.pdf',
    overview:
      'Obra ilustrada que guia o leitor desde a órbita da Terra e a Lua até às fronteiras do Universo observável e a radiação cósmica de fundo do Big Bang, explorando planetas, estrelas, nebulosas, enxames globulares e galáxias em todas as faixas do espectro eletromagnético.',
    chapters: [
      {
        number: 'Secção 1',
        title: 'Como Ler uma Imagem Astronómica & A Luz Invisível',
        page: 5,
        summary:
          'Explica como os telescópios modernos captam radiação desde ondas de rádio e infravermelho até raios ultravioleta, raios X e raios gama, traduzindo comprimentos de onda invisíveis em cores falsas para revelar fenómenos físicos extremos no cosmos.',
        keyTopics: ['Espectro Eletromagnético', 'Cores Falsas em Astronomia', 'Telescópios Espaciais e Terrestres'],
      },
      {
        number: 'Secção 2',
        title: 'Sistema Solar: Terra, Lua, Sol e Planetas Vizinhos',
        page: 8,
        summary:
          'Apresenta a Terra vista do espaço, a estrutura vulcânica e de impacto da Lua, a atmosfera magnética turbulenta do Sol e as características físicas dos planetas rochosos (Mercúrio, Vénus, Marte), gigantes gasosos (Júpiter, Saturno, Úrano, Neptuno), cometas e asteroides.',
        keyTopics: ['Terra e Lua', 'Atividade Solar e Ejeções Coronais', 'Marte, Júpiter e Anéis de Saturno'],
      },
      {
        number: 'Secção 3',
        title: 'Via Láctea: Berçários Estelares, Nebulosas e Remanescentes',
        page: 18,
        summary:
          'Explora o nascimento e morte das estrelas na nossa galáxia: regiões de formação estelar como a Nebulosa de Órion e Carina (Eta Carinae), enxames estelares abertos e globulares, nebulosas planetárias e restos de supernovas.',
        keyTopics: ['Nebulosa de Órion e Eta Carinae', 'Enxames Globulares', 'Supernovas e Estrelas de Neutrões'],
      },
      {
        number: 'Secção 4',
        title: 'Reino das Galáxias, Lentes Gravitacionais e o Big Bang',
        page: 28,
        summary:
          'Viaja além da Via Láctea rumo ao Grupo Local (Andrómeda, Nuvens de Magalhães), colisões galácticas, enxames de galáxias que atuam como lentes gravitacionais de Einstein, campos profundos do Hubble e o eco térmico do Big Bang.',
        keyTopics: ['Galáxias Espirais e Elípticas', 'Lentes Gravitacionais', 'Campo Ultra-Profundo e Big Bang'],
      },
    ],
  },
  {
    id: 'maciel-astronomia-astrofisica',
    title: 'Astronomia e Astrofísica',
    subtitle: 'Curso Completo do Departamento de Astronomia IAG/USP',
    authors: 'Walter Junqueira Maciel (Editor) & Corpo Docente IAG/USP',
    institution: 'Departamento de Astronomia — IAG / Universidade de São Paulo',
    pages: 319,
    language: 'Português',
    accentColor: 'from-emerald-500 to-teal-600',
    badgeText: 'TRATADO ACADÉMICO (17 CAPÍTULOS)',
    pdfUrl: '/assets/aistudio/Maciel_astronomia_astrofisica-c_3af6ee6a.pdf',
    overview:
      'Compêndio universitário abrangente de Astronomia e Astrofísica composto por 17 capítulos fundamentais, cobrindo desde astronomia de posição, mecânica celeste e astrofísica estelar até matéria interestelar, galáxias ativas, cosmologia relativística, astrobiologia e exoplanetas.',
    chapters: [
      {
        number: 'Capítulos 1–3',
        title: 'Visão Geral da Astronomia, Posição nos Céus e Sistema Solar',
        page: 9,
        summary:
          'Introduz as escalas espaciais e temporais do Universo, sistemas de coordenadas astronómicas (horizontal, equatorial e galáctico), movimentos da Terra, precessão, estações do ano e a física comparada dos corpos do Sistema Solar.',
        keyTopics: ['Coordenadas Celestes', 'Movimentos Orbitais e Estações', 'Física Planetária do Sistema Solar'],
      },
      {
        number: 'Capítulos 4–7',
        title: 'Instrumentação, Conceitos de Astrofísica, o Sol e as Estrelas',
        page: 69,
        summary:
          'Detalha a física da radiação eletromagnética, corpo negro, magnitudes aparentes e absolutas, classificação espectral de Harvard (O B A F G K M), diagrama de Hertzsprung-Russell (H-R), estrutura interna solar e propriedades fundamentais das estrelas.',
        keyTopics: ['Telescópios e Detetores', 'Diagrama H-R e Espectros', 'Física Solar e Estelar'],
      },
      {
        number: 'Capítulos 8–10',
        title: 'Evolução Estelar, Objetos Compactos e Meio Interestelar',
        page: 141,
        summary:
          'Analisa a nucleossíntese estelar, saída da sequência principal, formação de anãs brancas, estrelas de neutrões (pulsares) e buracos negros, bem como a física do gás e poeira interestelar, regiões H II e nuvens moleculares.',
        keyTopics: ['Fusão Nuclear e Supernovas', 'Anãs Brancas, Pulsares e Buracos Negros', 'Nuvens Moleculares e Regiões H II'],
      },
      {
        number: 'Capítulos 11–14',
        title: 'A Galáxia (Via Láctea), Galáxias Normais, Ativas e Cosmologia',
        page: 201,
        summary:
          'Estuda a estrutura cinemática e rotação da Via Láctea, matéria escura, classificação morfológica de Hubble, núcleos ativos de galáxias (quasares e blazares), expansão de Hubble-Lemaître e o modelo cosmológico padrão do Big Bang.',
        keyTopics: ['Rotação Galáctica e Matéria Escura', 'Quasares e Buracos Negros Supermassivos', 'Expansão Cósmica e Relatividade'],
      },
      {
        number: 'Capítulos 15–17',
        title: 'Formação de Estruturas, Vida no Universo e Exoplanetas',
        page: 271,
        summary:
          'Aborda a formação das primeiras estrelas e galáxias, os fundamentos da Astrobiologia e habitabilidade planetária, e os métodos modernos de deteção de planetas extrassolares (trânsitos fotométricos e velocidade radial).',
        keyTopics: ['Astrobiologia e Zonas Habitáveis', 'Deteção de Exoplanetas (Trânsito e Doppler)', 'Sistemas Planetários Extrassolares'],
      },
    ],
  },
  {
    id: 'nasa-discovery-program',
    title: "NASA's Discovery Program",
    subtitle: 'Competitive Planetary Exploration in the 21st Century',
    authors: 'David W. Brown (NASA SP-2026-4239)',
    institution: 'NASA History Division • Office of Communications (Washington, DC)',
    pages: 299,
    language: 'Inglês (NASA Official History)',
    accentColor: 'from-amber-500 to-orange-600',
    badgeText: 'MISSÕES PLANETÁRIAS NASA',
    pdfUrl: '/assets/aistudio/nasas-discovery-program-21st-c-e-book_2beb9521.pdf',
    overview:
      'História oficial detalhada da NASA sobre as missões de exploração planetária do Programa Discovery no século XXI: desde impactos em cometas (Deep Impact) e colheita de vento solar (Genesis) até às órbitas de Mercúrio (MESSENGER), Vesta e Ceres (Dawn), busca por exoplanetas (Kepler) e sismologia marciana (InSight).',
    chapters: [
      {
        number: 'Chapters 1–3',
        title: 'Genesis, CONTOUR & MESSENGER: Vento Solar e Órbita de Mercúrio',
        page: 15,
        summary:
          'Documenta a missão Genesis de retorno de amostras do vento solar a partir do ponto de Lagrange L1, as lições de engenharia do CONTOUR e a épica jornada de sobrevoos gravitacionais da sonda MESSENGER para entrar em órbita de Mercúrio.',
        keyTopics: ['Retorno de Amostras Genesis', 'Engenharia Térmica em Mercúrio', 'Sonda MESSENGER'],
      },
      {
        number: 'Chapters 4–6',
        title: 'Deep Impact & Dawn: Cometa Tempel 1 e os Protoplanetas Vesta e Ceres',
        page: 75,
        summary:
          'Narra a missão Deep Impact — que lançou um impactor de cobre contra o núcleo do cometa Tempel 1 — e a missão Dawn, impulsionada por propulsão iónica solar para orbitar dois mundos distintos na cintura de asteroides: Vesta e o planeta-anão Ceres.',
        keyTopics: ['Impactor Cinético Deep Impact', 'Propulsão Iónica da Sonda Dawn', 'Geologia de Vesta e Criovulcanismo em Ceres'],
      },
      {
        number: 'Chapters 7–9',
        title: 'Kepler & GRAIL: A Revolução dos Exoplanetas e o Interior da Lua',
        page: 145,
        summary:
          'Descreve como o telescópio espacial Kepler transformou a astronomia ao descobrir milhares de exoplanetas pelo método de trânsito, e como as sondas gémeas GRAIL mapearam com precisão inédita o campo gravitacional e a crosta interna da Lua.',
        keyTopics: ['Fotometria de Precisão do Kepler', 'Mundos Rochosos e Zonas Habitáveis', 'Mapeamento Gravitacional Lunar GRAIL'],
      },
      {
        number: 'Chapters 10–15',
        title: 'InSight, Lucy & Psyche: Sismologia em Marte e o Futuro do Sistema Solar',
        page: 205,
        summary:
          'Apresenta o lander InSight e a deteção direta de sismos marcianos (marsquakes) e estrutura do núcleo de Marte, além da seleção das missões Lucy (asteroides Troianos de Júpiter) e Psyche (asteroide metálico).',
        keyTopics: ['Sismómetro SEIS em Marte (InSight)', 'Estrutura Interna de Marte', 'Missões Lucy e Psyche'],
      },
    ],
  },
];

export function ComputerProximityPrompt() {
  const language = useGameStore((s) => s.language);
  const t = UI_TEXT[language];
  const isNearComputer = useGameStore((s) => s.isNearComputer);
  const nearComputerTitle = useGameStore((s) => s.nearComputerTitle);
  const isComputerLibraryOpen = useGameStore((s) => s.isComputerLibraryOpen);
  const setComputerLibraryOpen = useGameStore((s) => s.setComputerLibraryOpen);
  const drivingCarId = useGameStore((s) => s.drivingCarId);

  if (!isNearComputer || isComputerLibraryOpen || drivingCarId) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
      <button
        onClick={() => setComputerLibraryOpen(true)}
        className="flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-slate-950/92 hover:bg-slate-900 border-2 border-cyan-400/70 text-white shadow-[0_0_28px_rgba(6,182,212,0.45)] backdrop-blur-xl transition-all active:scale-95 cursor-pointer group"
      >
        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 group-hover:scale-110 transition-transform">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
            {nearComputerTitle || t.researchTerminalDefault}
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
            {t.openSciLibrary}
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/30 border border-cyan-300/50 text-[10px] font-mono text-cyan-200">
              {t.clickOrKeyC}
            </span>
          </span>
        </div>
      </button>
    </div>
  );
}

function PdfCanvasBookReader({
  pdfUrl,
  page,
  zoom,
  onPageChange,
  onTotalPagesLoaded,
}: {
  pdfUrl: string;
  page: number;
  zoom: number;
  onPageChange: (p: number) => void;
  onTotalPagesLoaded: (total: number) => void;
}) {
  const language = useGameStore((s) => s.language);
  const t = UI_TEXT[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxyLike | null>(null);
  const renderTaskRef = useRef<PDFRenderTaskLike | null>(null);

  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [docPages, setDocPages] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(720);
  const [retryToken, setRetryToken] = useState<number>(0);

  // Track available reader width for crisp responsive scaling on desktop & mobile
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 100) setContainerWidth(w);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load PDF document when pdfUrl changes
  useEffect(() => {
    let cancelled = false;
    let activeLoadingTask: PDFLoadingTaskLike | null = null;
    setIsLoadingDoc(true);
    setErrorMsg(null);
    if (pdfDocRef.current) {
      pdfDocRef.current.cleanup?.().catch(() => {});
      pdfDocRef.current = null;
    }

    loadPdfJs()
      .then((pdfjsLib) => {
        if (cancelled) return null;
        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        activeLoadingTask = loadingTask;
        return loadingTask.promise;
      })
      .then((doc) => {
        if (!doc) return;
        if (cancelled) {
          doc.cleanup?.().catch(() => {});
          return;
        }
        pdfDocRef.current = doc;
        setDocPages(doc.numPages);
        onTotalPagesLoaded(doc.numPages);
        if (page > doc.numPages) {
          onPageChange(1);
        }
        setIsLoadingDoc(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Erro ao carregar PDF:', err);
        setErrorMsg(UI_TEXT[useGameStore.getState().language].pdfError);
        setIsLoadingDoc(false);
      });

    return () => {
      cancelled = true;
      activeLoadingTask?.destroy?.().catch(() => {});
    };
  }, [pdfUrl, retryToken]);

  // Render active page onto canvas
  useEffect(() => {
    const doc = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || isLoadingDoc) return;

    let cancelled = false;
    const safePage = Math.max(1, Math.min(page, doc.numPages));

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    setIsRenderingPage(true);

    doc
      .getPage(safePage)
      .then((pdfPage) => {
        if (cancelled) return;
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const targetWidth = Math.max(260, containerWidth - 32);
        const fitScale = targetWidth / baseViewport.width;
        const scale = Math.max(0.55, Math.min(3.0, fitScale * zoom));
        const viewport = pdfPage.getViewport({ scale });
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;
        const task = pdfPage.render({
          canvas,
          viewport,
          transform,
        });
        renderTaskRef.current = task;

        return task.promise;
      })
      .then(() => {
        if (!cancelled) {
          setIsRenderingPage(false);
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
          }
        }
      })
      .catch((err) => {
        if (cancelled || err?.name === 'RenderingCancelledException') return;
        console.error('Erro ao renderizar página do PDF:', err);
        setIsRenderingPage(false);
      });

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfUrl, page, zoom, containerWidth, isLoadingDoc, docPages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full overflow-auto bg-slate-900/95 p-3 sm:p-5 flex flex-col items-center relative"
    >
      {(isLoadingDoc || isRenderingPage) && (
        <div className="sticky top-2 z-20 mb-2 px-3 py-1.5 rounded-full bg-slate-950/90 border border-cyan-400/50 text-cyan-300 text-xs font-mono flex items-center gap-2 shadow-lg">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{isLoadingDoc ? t.openingBook : `${t.renderingPage} ${page}...`}</span>
        </div>
      )}

      {errorMsg ? (
        <div className="my-auto flex flex-col items-center gap-3 p-6 rounded-2xl bg-red-950/40 border border-red-400/40 text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-bold text-red-200">{errorMsg}</p>
          <button
            onClick={() => setRetryToken((tok) => tok + 1)}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
          >
            {t.retryBtn}
          </button>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-white/10 bg-white max-w-full"
        />
      )}
    </div>
  );
}

export function ComputerBookLibraryModal() {
  const language = useGameStore((s) => s.language);
  const t = UI_TEXT[language];
  const isOpen = useGameStore((s) => s.isComputerLibraryOpen);
  const isNearComputer = useGameStore((s) => s.isNearComputer);
  const setOpen = useGameStore((s) => s.setComputerLibraryOpen);
  const selectedBookId = useGameStore((s) => s.selectedBookId);
  const setSelectedBookId = useGameStore((s) => s.setSelectedBookId);
  const nearComputerTitle = useGameStore((s) => s.nearComputerTitle);

  const [viewTab, setViewTab] = useState<'pdf' | 'chapters'>('pdf');
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);

  // Automatically close the library if the astronaut walks away from the computer/supercomputer
  useEffect(() => {
    if (isOpen && !isNearComputer) {
      setOpen(false);
    }
  }, [isOpen, isNearComputer, setOpen]);

  useEffect(() => {
    setPageInput(String(pdfPage));
  }, [pdfPage]);

  if (!isOpen || !isNearComputer) return null;

  const activeBook = SCIENTIFIC_BOOKS.find((b) => b.id === selectedBookId) || null;
  const maxPages = activeBook ? Math.max(totalPages, activeBook.pages) : totalPages;

  const handleSelectBook = (bookId: string) => {
    const book = SCIENTIFIC_BOOKS.find((b) => b.id === bookId);
    setSelectedBookId(bookId);
    setPdfPage(1);
    setTotalPages(book?.pages || 1);
    setZoom(1);
    setActiveChapterIdx(0);
    setViewTab('pdf');
  };

  const handleJumpToChapterPdf = (page: number, idx: number) => {
    setActiveChapterIdx(idx);
    setPdfPage(Math.max(1, Math.min(maxPages, page)));
    setViewTab('pdf');
  };

  const commitPageInput = () => {
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed)) {
      setPdfPage(Math.max(1, Math.min(maxPages, parsed)));
    } else {
      setPageInput(String(pdfPage));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-md pointer-events-auto animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl h-[92vh] sm:h-[88vh] bg-slate-950/95 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-white"
      >
        {/* Top Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-slate-900 via-slate-900/95 to-cyan-950/60 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shrink-0">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold truncate">
                  {nearComputerTitle || t.libraryBannerTitle}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <Sparkles className="w-3 h-3" /> {t.booksAvailableBadge}
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-extrabold tracking-tight text-white truncate">
                {activeBook ? activeBook.title : t.selectBookPrompt}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeBook && (
              <button
                onClick={() => setSelectedBookId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-xs font-semibold text-cyan-300 transition-all cursor-pointer active:scale-95"
              >
                {t.switchBook}
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-red-500/20 hover:border-red-400/50 border border-white/10 text-slate-300 hover:text-red-300 transition-all cursor-pointer"
              title={t.closeLibrary}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row">
          {/* Left Sidebar: Book Selection List (Always visible on Desktop, or Full Scrollable View when no book is selected on Mobile) */}
          <div
            className={`${
              activeBook ? 'hidden lg:flex lg:w-80 xl:w-96 lg:min-h-0 lg:shrink-0' : 'flex flex-1 min-h-0 w-full'
            } flex-col border-r border-white/10 bg-slate-900/50 overflow-y-auto overscroll-contain p-4 sm:p-5 gap-3.5 pb-10`}
          >
            <div className="flex items-center justify-between mb-1 shrink-0">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                {t.sciBookCatalog}
              </span>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                {t.tapToOpenBook}
              </span>
            </div>

            {SCIENTIFIC_BOOKS.map((book, idx) => {
              const isSelected = activeBook?.id === book.id;
              return (
                <button
                  key={book.id}
                  onClick={() => handleSelectBook(book.id)}
                  className={`w-full shrink-0 text-left p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-slate-800/95 to-cyan-950/70 border-cyan-400 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/50'
                      : 'bg-slate-900/80 hover:bg-slate-800/85 border-white/10 hover:border-cyan-400/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r ${book.accentColor} text-white shadow-sm`}
                    >
                      {t.bookWord} {idx + 1} • {book.badgeText}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {book.pages} {t.pagesShort}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors leading-snug mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mb-2">
                    {book.subtitle}
                  </p>
                  <p className="text-[11px] font-mono text-cyan-300/90 mb-2">
                    {book.authors}
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {book.overview}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-cyan-400">
                    <span>{t.selectAndReadBook}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Reader Area: Shown when a book is selected */}
          {activeBook ? (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-950">
              {/* Reader Sub-Header: Mode Switcher (PDF Original vs Chapter Summary) + Page Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewTab('pdf')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewTab === 'pdf'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t.integratedPdfTab}
                  </button>
                  <button
                    onClick={() => setViewTab('chapters')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewTab === 'chapters'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {t.chaptersSummaryTab} ({activeBook.chapters.length})
                  </button>
                </div>

                {/* Quick Chapter / Page Navigation, Zoom & Direct PDF Link */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {viewTab === 'pdf' && (
                    <>
                      <div className="flex items-center gap-1 bg-slate-800/90 border border-white/10 rounded-xl px-2 py-1">
                        <button
                          onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                          disabled={pdfPage <= 1}
                          className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white cursor-pointer"
                          title="Página Anterior"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={maxPages}
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          onBlur={commitPageInput}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitPageInput();
                          }}
                          className="w-11 text-center bg-slate-950/90 border border-white/15 rounded-md py-0.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                        <span className="text-[11px] font-mono text-slate-400 pr-1">/ {totalPages}</span>
                        <button
                          onClick={() => setPdfPage((p) => Math.min(totalPages, p + 1))}
                          disabled={pdfPage >= totalPages}
                          className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white cursor-pointer"
                          title="Próxima Página"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-800/90 border border-white/10 rounded-xl px-1.5 py-1">
                        <button
                          onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
                          className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
                          title="Diminuir Zoom"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-mono font-bold text-slate-200 px-1">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
                          className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
                          title="Aumentar Zoom"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}

                  <a
                    href={activeBook.pdfUrl}
                    download
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-[11px] font-mono font-semibold text-cyan-300 flex items-center gap-1 transition-all"
                    title={t.downloadPdf}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.downloadPdf}</span>
                  </a>
                </div>
              </div>

              {/* Quick Chapter Jump Bar */}
              <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/50 border-b border-white/5 overflow-x-auto shrink-0">
                <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-cyan-400" /> {t.jumpTo}
                </span>
                {activeBook.chapters.map((ch, idx) => (
                  <button
                    key={ch.number}
                    onClick={() => {
                      setActiveChapterIdx(idx);
                      setPdfPage(ch.page);
                      setViewTab('pdf');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      activeChapterIdx === idx
                        ? 'bg-cyan-500/25 border border-cyan-400/60 text-cyan-200 font-bold'
                        : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-white/5'
                    }`}
                  >
                    {ch.number} ({t.pagePrefix}{ch.page})
                  </button>
                ))}
              </div>

              {/* Reader Body */}
              {viewTab === 'pdf' ? (
                <div className="flex-1 w-full overflow-hidden bg-slate-900 relative flex flex-col">
                  <PdfCanvasBookReader
                    pdfUrl={activeBook.pdfUrl}
                    page={pdfPage}
                    zoom={zoom}
                    onPageChange={setPdfPage}
                    onTotalPagesLoaded={(total) => setTotalPages(total)}
                  />
                  {/* Bottom Current Chapter Context Strip */}
                  {activeBook.chapters[activeChapterIdx] && (
                    <div className="px-4 py-2 bg-slate-950/95 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold mr-2">
                          {activeBook.chapters[activeChapterIdx].number}:
                        </span>
                        <span className="text-xs font-bold text-white">
                          {activeBook.chapters[activeChapterIdx].title}
                        </span>
                        <p className="text-[11px] text-slate-300 truncate mt-0.5">
                          {activeBook.chapters[activeChapterIdx].summary}
                        </p>
                      </div>
                      <button
                        onClick={() => setViewTab('chapters')}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold shrink-0 cursor-pointer"
                      >
                        {t.viewDetailedSummary}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* Book Metadata Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-white/10">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-gradient-to-r ${activeBook.accentColor} text-white`}>
                        {activeBook.badgeText}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {activeBook.institution}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white mb-1">
                      {activeBook.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-cyan-300 font-mono mb-3">
                      {activeBook.authors} • {activeBook.pages} {t.pagesWord} ({activeBook.language})
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {activeBook.overview}
                    </p>
                  </div>

                  {/* Structured Chapters List */}
                  <div className="grid grid-cols-1 gap-3.5">
                    {activeBook.chapters.map((chapter, idx) => (
                      <div
                        key={chapter.number}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col gap-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold">
                              {chapter.number}
                            </span>
                            <h4 className="text-sm sm:text-base font-extrabold text-white">
                              {chapter.title}
                            </h4>
                          </div>
                          <button
                            onClick={() => handleJumpToChapterPdf(chapter.page, idx)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {t.openInPdfPage} {chapter.page})
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {chapter.summary}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {chapter.keyTopics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-white/10 text-[11px] font-mono text-slate-300"
                            >
                              • {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
