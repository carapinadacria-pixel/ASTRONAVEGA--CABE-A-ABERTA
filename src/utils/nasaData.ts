import type { PlanetInfo } from '../store';
import type { Language } from './i18n';

// NASA Verified Planetary & Exploration Telemetry Data
// Sourced from NASA Planetary Fact Sheets, USGS Astrogeology, and NASA Exoplanet Archive

export interface PlanetaryTelemetry {
  id: string;
  name: string;
  namePt: string;
  gravity: number; // m/s^2
  gravityG: number; // G relative to Earth
  surfacePressure: string;
  averageHumidity: string;
  averageHumidityEn?: string;
  temperatureKelvin: number;
  temperatureCelsius: number;
  atmosphereComposition: string;
  primaryResources: string[];
  scientificDescription: string;
  scientificDescriptionEn?: string;
}

export const NASA_PLANETARY_DATA: Record<string, PlanetaryTelemetry> = {
  earth: {
    id: 'earth',
    name: 'Earth',
    namePt: 'Terra',
    gravity: 9.807,
    gravityG: 1.0,
    surfacePressure: '101.325 kPa (1.00 atm)',
    averageHumidity: '65% - 85% (Ambiente Costeiro)',
    averageHumidityEn: '65% - 85% (Coastal Climate)',
    temperatureKelvin: 288,
    temperatureCelsius: 15,
    atmosphereComposition: '78.08% N₂, 20.95% O₂, 0.93% Ar, 0.04% CO₂',
    primaryResources: ['Quartzo (SiO₂)', 'Minério de Ferro', 'Titânio', 'Lítio', 'Silício', 'Água H₂O'],
    scientificDescription:
      'O único corpo celeste conhecido com hidrosfera ativa e atmosfera densa de nitrogénio-oxigénio rica em vida e abundância mineral.',
    scientificDescriptionEn:
      'The only known celestial body with an active hydrosphere and a dense nitrogen-oxygen atmosphere rich in life and mineral diversity.',
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    namePt: 'Lua',
    gravity: 1.62,
    gravityG: 0.165,
    surfacePressure: '3 × 10⁻¹⁰ Pa (Vácuo Duro)',
    averageHumidity: '0.0% (Gelo apenas em crateras polares)',
    averageHumidityEn: '0.0% (Polar crater ice only)',
    temperatureKelvin: 220,
    temperatureCelsius: -53,
    atmosphereComposition: 'Vestígios de Hélio, Néon e Hidrogénio (Exosfera)',
    primaryResources: ['Regolito Lunar', 'Ilmenite (FeTiO₃)', 'Hélio-3 (He-3)', 'Gelo Polar H₂O'],
    scientificDescription:
      'Satélite natural da Terra com crosta de anortosito e mares basálticos ricos em ilmenite de titânio, gelo polar e isótopos de Hélio-3 solares.',
    scientificDescriptionEn:
      'Earth’s natural satellite with anorthosite highlands and basaltic maria rich in titanium ilmenite, polar water ice, and solar-implanted Helium-3.',
  },
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    namePt: 'Mercúrio',
    gravity: 3.7,
    gravityG: 0.378,
    surfacePressure: '< 10⁻⁹ Pa (Exosfera Solar)',
    averageHumidity: '0.0% (Exposição Solar Direta)',
    averageHumidityEn: '0.0% (Direct Solar Irradiation)',
    temperatureKelvin: 440,
    temperatureCelsius: 167,
    atmosphereComposition: 'O₂, Na, H₂, He, K (Exosfera Ténue)',
    primaryResources: ['Ferro Metálico Nativo', 'Silicato de Sódio', 'Ilmenite Térmica'],
    scientificDescription:
      'O planeta mais próximo do Sol, dotado de núcleo metálico gigantesco (~85% do raio) e planícies basálticas ricas em ferro e sódio.',
    scientificDescriptionEn:
      'Innermost planet of the Solar System with a colossal iron core (~85% radius) and scorched basaltic plains rich in iron and sodium silicates.',
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    namePt: 'Vénus',
    gravity: 8.87,
    gravityG: 0.905,
    surfacePressure: '9.3 MPa (92 atm)',
    averageHumidity: '0.002% (Nuvens de H₂SO₄)',
    averageHumidityEn: '0.002% (H₂SO₄ Clouds)',
    temperatureKelvin: 737,
    temperatureCelsius: 464,
    atmosphereComposition: '96.5% CO₂, 3.5% N₂, SO₂ / H₂SO₄',
    primaryResources: ['Enxofre Basáltico', 'Vapor Sulfúrico Corrosivo', 'Blindagem GGPEN'],
    scientificDescription:
      'Mundo hiper-aquecido pelo efeito de estufa descontrolado com pressão superficial esmagadora e depósitos vulcânicos ricos em enxofre.',
    scientificDescriptionEn:
      'Super-heated runaway greenhouse world with crushing surface pressure and volcanic plains saturated with sulfur minerals and sulfuric aerosol.',
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    namePt: 'Marte',
    gravity: 3.721,
    gravityG: 0.38,
    surfacePressure: '0.636 kPa (0.006 atm)',
    averageHumidity: '0.03% (Permafrost Subterrâneo)',
    averageHumidityEn: '0.03% (Subsurface Permafrost)',
    temperatureKelvin: 210,
    temperatureCelsius: -63,
    atmosphereComposition: '95.32% CO₂, 2.6% N₂, 1.9% Ar, 0.13% O₂',
    primaryResources: ['Hematite (Fe₂O₃)', 'Percloratos (ClO₄⁻)', 'Gelo Seco CO₂', 'Água H₂O'],
    scientificDescription:
      'Planeta telúrico rico em óxidos de ferro superficiais, sais percloratos oxidantes, gelo carbónico polar e aquíferos congelados.',
    scientificDescriptionEn:
      'Terrestrial world rich in iron-oxide hematite dust, oxidizing perchlorate salts, dry CO₂ ice, and buried water ice reservoirs.',
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    namePt: 'Júpiter',
    gravity: 24.79,
    gravityG: 2.53,
    surfacePressure: '100 - 1,000 kPa (Nível Aeroestático)',
    averageHumidity: 'Nuvens de NH₃ & Hidrosulfureto',
    averageHumidityEn: 'NH₃ & Hydrosulfide Cloud Decks',
    temperatureKelvin: 165,
    temperatureCelsius: -108,
    atmosphereComposition: '89.8% H₂, 10.2% He, Traços de CH₄ & NH₃',
    primaryResources: ['Hidrogénio Metálico', 'Cristais de Amoníaco', 'Célula de Plasma'],
    scientificDescription:
      'Maior gigante gasoso do Sistema Solar com tempestades anticiclónicas de amoníaco, magnetosfera extrema e transição para hidrogénio metálico.',
    scientificDescriptionEn:
      'Largest gas giant in the Solar System featuring ammonia cloud bands, extreme magnetospheric plasma, and deep metallic hydrogen.',
  },
  saturn: {
    id: 'saturn',
    name: 'Saturn',
    namePt: 'Saturno',
    gravity: 10.44,
    gravityG: 1.065,
    surfacePressure: '140 kPa (Deck Aeroestático)',
    averageHumidity: 'Bandas de NH₃ & Gelo de Anéis',
    averageHumidityEn: 'NH₃ Bands & Ring Ice Particles',
    temperatureKelvin: 134,
    temperatureCelsius: -139,
    atmosphereComposition: '96.3% H₂, 3.25% He, 0.45% CH₄ & NH₃',
    primaryResources: ['Granizo de Diamante', 'Cristais de Amoníaco', 'Hidrogénio Metálico'],
    scientificDescription:
      'Gigante dos anéis onde tempestades atmosféricas cristalizam carbono metânico em chuva de diamantes líquidos e sólidos em profundidade.',
    scientificDescriptionEn:
      'Ringed gas giant whose deep storms compress atmospheric methane soot into crystalline diamond hailstones and metallic hydrogen.',
  },
  uranus: {
    id: 'uranus',
    name: 'Uranus',
    namePt: 'Úrano',
    gravity: 8.69,
    gravityG: 0.886,
    surfacePressure: '120 kPa (Troposfera Superior)',
    averageHumidity: 'Gelo Superiónico & Metano CH₄',
    averageHumidityEn: 'Superionic Ice & CH₄ Haze',
    temperatureKelvin: 76,
    temperatureCelsius: -197,
    atmosphereComposition: '82.5% H₂, 15.2% He, 2.3% CH₄',
    primaryResources: ['Granizo de Diamante', 'Gelo Criogénico H₂O', 'Cristais de Amoníaco'],
    scientificDescription:
      'Gigante de gelo com inclinação axial extrema de 98°, manto fluido de água-amoníaco-metano e formação contínua de nanodiamantes.',
    scientificDescriptionEn:
      'Ice giant tilted 98° on its side with a supercritical water-ammonia-methane mantle generating diamond hail and methane crystals.',
  },
  neptune: {
    id: 'neptune',
    name: 'Neptune',
    namePt: 'Neptuno',
    gravity: 11.15,
    gravityG: 1.14,
    surfacePressure: '150 kPa (Nível Supersonico)',
    averageHumidity: 'Ventos de 2,100 km/h + Metano CH₄',
    averageHumidityEn: '2,100 km/h Winds + CH₄ Clouds',
    temperatureKelvin: 72,
    temperatureCelsius: -201,
    atmosphereComposition: '80.0% H₂, 19.0% He, 1.5% CH₄',
    primaryResources: ['Granizo de Diamante', 'Hidrogénio Metálico', 'Gelo Criogénico H₂O'],
    scientificDescription:
      'Gigante azul profundo fustigado pelos ventos supersónicos mais velozes do Sistema Solar e precipitação energética de diamantes.',
    scientificDescriptionEn:
      'Deep azure ice giant swept by the fastest supersonic winds in the Solar System and high-pressure hydrocarbon diamond rain.',
  },
  titan: {
    id: 'titan',
    name: 'Titan',
    namePt: 'Titã',
    gravity: 1.352,
    gravityG: 0.138,
    surfacePressure: '146.7 kPa (1.45 atm)',
    averageHumidity: 'Saturação de Metano Líquido',
    averageHumidityEn: 'Liquid Methane Saturation',
    temperatureKelvin: 94,
    temperatureCelsius: -179,
    atmosphereComposition: '94.2% N₂, 5.65% CH₄, 0.1% H₂',
    primaryResources: ['Metano Líquido (CH₄)', 'Tolinas Orgânicas', 'Gelo Criogénico H₂O'],
    scientificDescription:
      'Maior lua de Saturno com ciclo hidrológico criogénico de metano líquido, lagos de hidrocarbonetos e dunas de tolinas pré-bióticas.',
    scientificDescriptionEn:
      'Saturn’s largest moon featuring a cryogenic liquid methane cycle, hydrocarbon lakes, and complex prebiotic tholin dunes.',
  },
  exoplanet: {
    id: 'exoplanet',
    name: 'NASA Exoplanet',
    namePt: 'Exoplaneta NASA',
    gravity: 12.0,
    gravityG: 1.22,
    surfacePressure: 'Variável (Arquivo NASA Exoplanet Archive)',
    averageHumidity: 'Espectroscopia Infravermelha NASA',
    averageHumidityEn: 'NASA IR Spectroscopy',
    temperatureKelvin: 290,
    temperatureCelsius: 17,
    atmosphereComposition: 'H₂O / CO₂ / N₂ / Silicatos Exóticos (Caltech API)',
    primaryResources: ['Liga Superdensa', 'Cristal de Silicato Exótico', 'Gelo Criogénico / Fulgor de Plasma'],
    scientificDescription:
      'Mundo extrassolar catalogado em tempo real pela API do NASA Exoplanet Archive (Caltech), com mineralogia moldada por massa, raio e temperatura orbital.',
    scientificDescriptionEn:
      'Extrasolar world cataloged live via the NASA Exoplanet Archive API (Caltech), featuring exotic mineralogy shaped by orbital temperature and mass.',
  },
};

export type ResourceRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ResourceCategory = 'minerals' | 'chemicals' | 'tech';

export interface ResourceDefinition {
  id: string;
  name: string;
  nameEn?: string;
  formula: string;
  category: ResourceCategory;
  rarity: ResourceRarity;
  rarityLabel: string;
  rarityLabelEn?: string;
  color: string;
  glowColor: string;
  weightPerUnit: number; // kg
  description: string;
  descriptionEn?: string;
  nasaApplication: string;
  nasaApplicationEn?: string;
  iconType: 'gem' | 'ore' | 'flask' | 'battery' | 'cpu' | 'dna' | 'droplet';
  effectType?: 'hazard_radiation' | 'hazard_toxic' | 'boost_protection' | 'boost_oxygen' | 'boost_both' | 'expand_backpack';
  effectLabel?: string;
  effectLabelEn?: string;
}

export function getLocalizedResourceDef(def: ResourceDefinition, lang: Language) {
  if (lang === 'en') {
    return {
      name: def.nameEn || def.name,
      rarityLabel: def.rarityLabelEn || def.rarityLabel,
      description: def.descriptionEn || def.description,
      nasaApplication: def.nasaApplicationEn || def.nasaApplication,
      effectLabel: def.effectLabelEn || def.effectLabel,
    };
  }
  return {
    name: def.name,
    rarityLabel: def.rarityLabel,
    description: def.description,
    nasaApplication: def.nasaApplication,
    effectLabel: def.effectLabel,
  };
}

export const RESOURCE_DEFINITIONS: Record<string, ResourceDefinition> = {
  quartz: {
    id: 'quartz',
    name: 'Quartzo Cristalino',
    nameEn: 'Crystalline Quartz',
    formula: 'SiO₂',
    category: 'minerals',
    rarity: 'common',
    rarityLabel: 'Comum',
    rarityLabelEn: 'Common',
    color: '#38bdf8',
    glowColor: '#7dd3fc',
    weightPerUnit: 0.5,
    description: 'Dióxido de silício cristalizado de alta pureza ótica, abundante nas dunas e zonas costeiras terrestres.',
    descriptionEn: 'Optically pure crystallized silicon dioxide abundant across coastal dunes and shorelines on Earth.',
    nasaApplication: 'Base para fabricação de vidros de sensores, lentes óticas de satélites e osciladores piezoelétricos de relógio atómico.',
    nasaApplicationEn: 'Used in optical satellite lenses, sensor viewports, and atomic-clock piezoelectric oscillators.',
    iconType: 'gem',
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Minério de Ferro',
    nameEn: 'Iron Ore',
    formula: 'Fe₂O₃',
    category: 'minerals',
    rarity: 'common',
    rarityLabel: 'Comum',
    rarityLabelEn: 'Common',
    color: '#94a3b8',
    glowColor: '#cbd5e1',
    weightPerUnit: 1.8,
    description: 'Composto oxidado de ferro magnético extraído das formações rochosas terrestres.',
    descriptionEn: 'Magnetic iron-oxide mineral boulder extracted from terrestrial rock formations.',
    nasaApplication: 'Elemento fundamental para vigas estruturais, reforço de plataformas de lançamento e blindagem magnética.',
    nasaApplicationEn: 'Essential raw material for launch pad steel girders, structural trusses, and magnetic shielding.',
    iconType: 'ore',
  },
  silicon: {
    id: 'silicon',
    name: 'Silício Puro',
    nameEn: 'Pure Silicon',
    formula: 'Si-99',
    category: 'minerals',
    rarity: 'uncommon',
    rarityLabel: 'Incomum',
    rarityLabelEn: 'Uncommon',
    color: '#60a5fa',
    glowColor: '#93c5fd',
    weightPerUnit: 0.8,
    description: 'Semicondutor de ultra-alta pureza obtido por refinamento de areias siliciosas costeiras.',
    descriptionEn: 'Ultra-pure semiconductor crystal refined from coastal silica sands.',
    nasaApplication: 'Construção de microchips de bordo de satélites, células fotovoltaicas e matrizes de computação quântica.',
    nasaApplicationEn: 'Manufactures radiation-hardened flight microchips and high-efficiency spacecraft solar arrays.',
    iconType: 'gem',
  },
  lithium: {
    id: 'lithium',
    name: 'Lítio Metálico',
    nameEn: 'Metallic Lithium',
    formula: 'Li',
    category: 'minerals',
    rarity: 'uncommon',
    rarityLabel: 'Incomum',
    rarityLabelEn: 'Uncommon',
    color: '#c084fc',
    glowColor: '#e9d5ff',
    weightPerUnit: 0.4,
    description: 'Metal alcalino leve de elevada densidade energética, recolhido em salmouras minerais terrestres.',
    descriptionEn: 'Lightweight alkali metal with high energy density harvested from terrestrial pegmatite veins.',
    nasaApplication: 'Células de bateria de íon-lítio para alimentação dos sistemas de suporte de vida (PLSS) e rovers.',
    nasaApplicationEn: 'Powers high-capacity Li-Ion batteries in EVA life support backpacks (PLSS) and planetary rovers.',
    iconType: 'ore',
  },
  pure_water: {
    id: 'pure_water',
    name: 'Água Potável Desmineralizada',
    nameEn: 'Purified Drinking Water',
    formula: 'H₂O',
    category: 'chemicals',
    rarity: 'common',
    rarityLabel: 'Comum',
    rarityLabelEn: 'Common',
    color: '#06b6d4',
    glowColor: '#22d3ee',
    weightPerUnit: 1.0,
    description: 'Água pura filtrada da hidrosfera costeira ou de aquíferos com eletrólitos calibrados para astronautas.',
    descriptionEn: 'Filtered potable water with calibrated electrolytes for EVA astronaut hydration and cooling.',
    nasaApplication: 'Suporte metabólico vital no fato EVA, arrefecimento de trajes espaciais e matéria-prima para eletrólise de O₂.',
    nasaApplicationEn: 'Supports metabolic hydration, liquid-cooling garment circulation, and O₂ electrolysis.',
    iconType: 'droplet',
    effectType: 'boost_both',
    effectLabel: '+25% Água & O₂ • +5 Proteção do Traje',
    effectLabelEn: '+25% Water & O₂ • +5 Suit Protection',
  },
  oxygen_canister: {
    id: 'oxygen_canister',
    name: 'Canister de Oxigénio O₂',
    nameEn: 'Cryogenic O₂ Canister',
    formula: 'O₂ Cryo',
    category: 'chemicals',
    rarity: 'rare',
    rarityLabel: 'Raro',
    rarityLabelEn: 'Rare',
    color: '#0284c7',
    glowColor: '#38bdf8',
    weightPerUnit: 2.2,
    description: 'Cilindro de oxigénio líquido pressurizado com regulador criogénico de duplo estágio.',
    descriptionEn: 'Pressurized liquid-oxygen tank fitted with a dual-stage cryogenic regulator.',
    nasaApplication: 'Reabastecimento dos reservatórios de suporte de vida da mochila dorsal e pressurização de câmaras.',
    nasaApplicationEn: 'Refills backpack breathing O₂ reserves and pressurizes planetary airlock chambers.',
    iconType: 'flask',
    effectType: 'boost_oxygen',
    effectLabel: 'Recarrega Água & O₂ (até 100%)',
    effectLabelEn: 'Refills Water & O₂ (up to 100%)',
  },
  hydrogen_fuel: {
    id: 'hydrogen_fuel',
    name: 'Hidrogénio Líquido LH₂',
    nameEn: 'Liquid Hydrogen LH₂',
    formula: 'LH₂',
    category: 'chemicals',
    rarity: 'epic',
    rarityLabel: 'Épico',
    rarityLabelEn: 'Epic',
    color: '#ec4899',
    glowColor: '#f472b6',
    weightPerUnit: 1.2,
    description: 'Propelente criogénico de altíssimo impulso específico mantido a -253 °C.',
    descriptionEn: 'High-specific-impulse cryogenic rocket propellant stored at -253 °C.',
    nasaApplication: 'Combustível principal dos motores de estágio superior de foguetões de exploração do espaço profundo.',
    nasaApplicationEn: 'Primary upper-stage fuel for heavy deep-space launch vehicles.',
    iconType: 'flask',
  },
  titanium_alloy: {
    id: 'titanium_alloy',
    name: 'Titânio Aeroespacial Ti-6Al-4V',
    nameEn: 'Aerospace Titanium Ti-6Al-4V',
    formula: 'Ti-Alloy',
    category: 'minerals',
    rarity: 'rare',
    rarityLabel: 'Raro',
    rarityLabelEn: 'Rare',
    color: '#38bdf8',
    glowColor: '#67e8f9',
    weightPerUnit: 2.0,
    description: 'Liga de titânio, alumínio e vanádio de altíssima relação resistência/peso.',
    descriptionEn: 'High-strength titanium-aluminum-vanadium alloy ingot resistant to extreme corrosion.',
    nasaApplication: 'Cascos de naves espaciais, anéis de desconexão de capacetes e reforço do traje EVA.',
    nasaApplicationEn: 'Builds spacecraft pressure hulls, helmet disconnect rings, and EVA suit reinforcement.',
    iconType: 'ore',
    effectType: 'boost_protection',
    effectLabel: '+20% Proteção do Traje EVA',
    effectLabelEn: '+20% EVA Suit Protection',
  },
  ggpen_composite: {
    id: 'ggpen_composite',
    name: 'Placa Composta GGPEN',
    nameEn: 'GGPEN Composite Plate',
    formula: 'GGPEN-C8',
    category: 'tech',
    rarity: 'epic',
    rarityLabel: 'Épico',
    rarityLabelEn: 'Epic',
    color: '#eab308',
    glowColor: '#fde047',
    weightPerUnit: 1.5,
    description: 'Blindagem de fibra de carbono aeroespacial desenvolvida pelo Programa Espacial Nacional Angolano.',
    descriptionEn: 'Aerospace carbon-composite shielding engineered by Angola’s National Space Program.',
    nasaApplication: 'Isolamento micrometeorítico e térmico para satélites AngoSat e proteção reforçada do traje.',
    nasaApplicationEn: 'Provides micrometeorite & thermal insulation for AngoSat spacecraft and reinforced EVA armor.',
    iconType: 'cpu',
    effectType: 'boost_protection',
    effectLabel: '+30% Proteção do Traje (Máx. 150)',
    effectLabelEn: '+30% Suit Protection (Max 150)',
  },
  plasma_core: {
    id: 'plasma_core',
    name: 'Célula de Plasma Confinado',
    nameEn: 'Confined Plasma Cell',
    formula: 'Ion-Plasma',
    category: 'tech',
    rarity: 'legendary',
    rarityLabel: 'Lendário',
    rarityLabelEn: 'Legendary',
    color: '#a855f7',
    glowColor: '#c084fc',
    weightPerUnit: 3.0,
    description: 'Núcleo eletromagnético contendo gás ionizado a alta densidade com confinamento toroidal.',
    descriptionEn: 'Magnetic containment canister housing high-density ionized plasma.',
    nasaApplication: 'Alimentação de propulsores iónicos de efeito Hall para missões interplanetárias de longa duração.',
    nasaApplicationEn: 'Powers Hall-effect ion thrusters for deep-space interplanetary transit.',
    iconType: 'battery',
  },
  meteorite_shard: {
    id: 'meteorite_shard',
    name: 'Fragmento de Meteorito Níquel-Ferro',
    nameEn: 'Nickel-Iron Meteorite Shard',
    formula: 'Fe-Ni',
    category: 'minerals',
    rarity: 'legendary',
    rarityLabel: 'Lendário',
    rarityLabelEn: 'Legendary',
    color: '#f97316',
    glowColor: '#fb923c',
    weightPerUnit: 2.5,
    description: 'Amostra extraterrestre primitiva com padrões de Widmanstätten originária do cinturão de asteroides.',
    descriptionEn: 'Primitive extraterrestrial Widmanstätten iron-nickel fragment from asteroid impacts.',
    nasaApplication: 'Estudos cronológicos da formação do sistema solar e síntese de super-ligas cósmicas.',
    nasaApplicationEn: 'Reveals early Solar System chronology and aids cosmic super-alloy metallurgy.',
    iconType: 'gem',
  },
  suit_nanopolymer: {
    id: 'suit_nanopolymer',
    name: 'Kit Blindagem Nanopolímero EVA',
    nameEn: 'EVA Nanopolymer Armor Kit',
    formula: 'Kevlar-Nano',
    category: 'tech',
    rarity: 'rare',
    rarityLabel: 'Raro',
    rarityLabelEn: 'Rare',
    color: '#10b981',
    glowColor: '#34d399',
    weightPerUnit: 1.1,
    description: 'Módulo composto autorreparador com camadas de alumínio-mylar e nanotubos de carbono.',
    descriptionEn: 'Self-healing aluminized mylar and carbon-nanotube patch kit against radiation and punctures.',
    nasaApplication: 'Reforço estrutural instantâneo da proteção do traje EVA contra radiação e aerossóis corrosivos.',
    nasaApplicationEn: 'Instantly repairs and upgrades EVA suit radiation & pressure shielding up to 150.',
    iconType: 'cpu',
    effectType: 'boost_protection',
    effectLabel: '+35% Proteção do Traje (Máx. 150) • +10% O₂',
    effectLabelEn: '+35% Suit Protection (Max 150) • +10% O₂',
  },
  uranium_ore: {
    id: 'uranium_ore',
    name: 'Minério de Urânio Radioativo',
    nameEn: 'Radioactive Uranium Ore',
    formula: 'U-238 / UO₂',
    category: 'minerals',
    rarity: 'epic',
    rarityLabel: 'Perigo',
    rarityLabelEn: 'Hazard',
    color: '#84cc16',
    glowColor: '#bef264',
    weightPerUnit: 3.4,
    description: 'Depósito mineral altamente radioativo que emite partículas alfa/gama num raio de 5 metros.',
    descriptionEn: 'Highly radioactive deposit emitting ionizing radiation within a 5-meter perimeter.',
    nasaApplication: 'Aproximar-se degrada o traje e O₂. Coletar neutraliza o risco local para estudo em reatores RTG.',
    nasaApplicationEn: 'Drains suit and O₂ nearby; harvesting neutralizes the local hazard for RTG power research.',
    iconType: 'ore',
    effectType: 'hazard_radiation',
    effectLabel: 'PERIGO: Radiação (-Traje & -Água/O₂ ao passar perto)',
    effectLabelEn: 'HAZARD: Radiation (-Suit & -Water/O₂ when nearby)',
  },
  toxic_sulfur: {
    id: 'toxic_sulfur',
    name: 'Fumarola de Enxofre Tóxico',
    nameEn: 'Toxic Sulfur Vent',
    formula: 'H₂S / SO₂',
    category: 'chemicals',
    rarity: 'uncommon',
    rarityLabel: 'Tóxico',
    rarityLabelEn: 'Toxic',
    color: '#facc15',
    glowColor: '#fde047',
    weightPerUnit: 1.6,
    description: 'Cristalização vulcânica instável que liberta sulfeto de hidrogénio e dióxido de enxofre corrosivo.',
    descriptionEn: 'Unstable volcanic vent releasing corrosive hydrogen sulfide and sulfur dioxide gas.',
    nasaApplication: 'Satura filtros purificadores de O₂/Água e corrói os selos do fato a curta distância.',
    nasaApplicationEn: 'Overloads life-support scrubbers and corrodes spacesuit seals within close range.',
    iconType: 'flask',
    effectType: 'hazard_toxic',
    effectLabel: 'PERIGO: Gás Tóxico (-Traje & -Água/O₂ ao passar perto)',
    effectLabelEn: 'HAZARD: Toxic Gas (-Suit & -Water/O₂ when nearby)',
  },

  // ==================== MOON RESOURCES ====================
  lunar_regolith: {
    id: 'lunar_regolith',
    name: 'Regolito Lunar Basáltico',
    nameEn: 'Basaltic Lunar Regolith',
    formula: 'SiO₂-Al₂O₃',
    category: 'minerals',
    rarity: 'common',
    rarityLabel: 'Comum',
    rarityLabelEn: 'Common',
    color: '#cbd5e1',
    glowColor: '#f1f5f9',
    weightPerUnit: 1.4,
    description: 'Poeira mineral anortosítica e basáltica da superfície da Lua vitrificada por micrometeoritos.',
    descriptionEn: 'Fine lunar anorthosite and basaltic dust formed by billions of years of micrometeorite impacts.',
    nasaApplication: 'Impressão 3D de habitats lunares Artemis (sinterização solar) e extração de oxigénio por redução térmica.',
    nasaApplicationEn: '3D-printed Artemis lunar habitats via sintering and oxygen extraction.',
    iconType: 'ore',
  },
  ilmenite: {
    id: 'ilmenite',
    name: 'Ilmenite Lunar (Titânio-Ferro)',
    nameEn: 'Lunar Ilmenite Ore',
    formula: 'FeTiO₃',
    category: 'minerals',
    rarity: 'rare',
    rarityLabel: 'Raro',
    rarityLabelEn: 'Rare',
    color: '#38bdf8',
    glowColor: '#93c5fd',
    weightPerUnit: 2.1,
    description: 'Mineral denso dos mares lunares rico em óxidos de ferro e titânio metálico facilmente separável.',
    descriptionEn: 'Dense lunar mare oxide mineral containing recoverable iron, titanium, and bound oxygen.',
    nasaApplication: 'Principal fonte ISRU da NASA para extrair O₂ respirável no solo lunar aquecendo com hidrogénio.',
    nasaApplicationEn: 'NASA’s primary ISRU feedstock for producing breathable lunar oxygen via hydrogen reduction.',
    iconType: 'gem',
  },
  helium3: {
    id: 'helium3',
    name: 'Isótopo Hélio-3 Solar',
    nameEn: 'Solar Helium-3 Isotope',
    formula: '³He',
    category: 'tech',
    rarity: 'legendary',
    rarityLabel: 'Lendário',
    rarityLabelEn: 'Legendary',
    color: '#34d399',
    glowColor: '#6ee7b7',
    weightPerUnit: 0.6,
    description: 'Isótopo não-radioativo implantado no regolito lunar pelo vento solar ao longo de biliões de anos.',
    descriptionEn: 'Non-radioactive isotope implanted into lunar regolith by solar wind.',
    nasaApplication: 'Combustível estratégico de fusão nuclear limpa aneutrónica para propulsão espacial profunda.',
    nasaApplicationEn: 'Clean aneutronic fusion fuel prized for advanced deep-space propulsion reactors.',
    iconType: 'battery',
  },
  lunar_ice: {
    id: 'lunar_ice',
    name: 'Gelo de Água Polar Lunar',
    nameEn: 'Lunar Polar Water Ice',
    formula: 'H₂O (Ice)',
    category: 'chemicals',
    rarity: 'uncommon',
    rarityLabel: 'Incomum',
    rarityLabelEn: 'Uncommon',
    color: '#22d3ee',
    glowColor: '#a5f3fc',
    weightPerUnit: 1.0,
    description: 'Cristais de água congelada preservados em sombras permanentes de crateras lunares.',
    descriptionEn: 'Ancient frozen water crystals preserved inside permanently shadowed lunar craters.',
    nasaApplication: 'Eletrólise para gerar oxigénio respirável, hidrogénio propelente e hidratação direta da tripulação.',
    nasaApplicationEn: 'Electrolyzed for LOX/LH₂ propellant and purified directly into crew drinking water.',
    iconType: 'droplet',
    effectType: 'boost_both',
    effectLabel: '+25% Água & O₂ • +5 Proteção do Traje',
    effectLabelEn: '+25% Water & O₂ • +5 Suit Protection',
  },

  // ==================== MARS RESOURCES ====================
  mars_hematite: {
    id: 'mars_hematite',
    name: 'Hematite Marciana ("Mirtilos")',
    nameEn: 'Martian Hematite Concretions',
    formula: 'α-Fe₂O₃',
    category: 'minerals',
    rarity: 'common',
    rarityLabel: 'Comum',
    rarityLabelEn: 'Common',
    color: '#ea580c',
    glowColor: '#fb923c',
    weightPerUnit: 1.7,
    description: 'Concreções esféricas ricas em ferro formadas na antiga água líquida de Marte (descoberta Opportunity).',
    descriptionEn: 'Iron-rich mineral spherules formed in ancient liquid water environments on Mars.',
    nasaApplication: 'Metalurgia marciana em forno solar e prova geoquímica de oceanos antigos em Marte.',
    nasaApplicationEn: 'Key geological proof of past Martian liquid water and local iron-refining ore.',
    iconType: 'ore',
  },
  perchlorate: {
    id: 'perchlorate',
    name: 'Sais Percloratos de Marte',
    nameEn: 'Martian Perchlorate Salts',
    formula: 'Mg(ClO₄)₂',
    category: 'chemicals',
    rarity: 'uncommon',
    rarityLabel: 'Incomum',
    rarityLabelEn: 'Uncommon',
    color: '#f43f5e',
    glowColor: '#fda4af',
    weightPerUnit: 1.3,
    description: 'Sais altamente oxidantes presentes no solo marciano, identificados pela sonda Phoenix da NASA.',
    descriptionEn: 'Highly oxidizing salts identified across Martian regolith by NASA’s Phoenix lander.',
    nasaApplication: 'Síntese química de oxigénio de emergência e oxidante sólido para veículos de subida de Marte.',
    nasaApplicationEn: 'Chemical oxygen generation and solid rocket oxidizer synthesis for Mars Ascent Vehicles.',
    iconType: 'flask',
  },
  co2_ice: {
    id: 'co2_ice',
    name: 'Gelo Carbónico Seco de Marte',
    nameEn: 'Martian Dry CO₂ Ice',
    formula: 'CO₂ (s)',
    category: 'chemicals',
    rarity: 'rare',
    rarityLabel: 'Raro',
    rarityLabelEn: 'Rare',
    color: '#e0f2fe',
    glowColor: '#bae6fd',
    weightPerUnit: 1.5,
    description: 'Bloco sólido de dióxido de carbono sublimado do ciclo atmosférico sazonal marciano.',
    descriptionEn: 'Frozen carbon-dioxide block deposited during Martian seasonal atmospheric cycles.',
    nasaApplication: 'Matéria-prima para reatores Sabatier e MOXIE na produção in-situ de metano e O₂.',
    nasaApplicationEn: 'Feedstock for MOXIE & Sabatier reactors producing oxygen and methane return propellant.',
    iconType: 'flask',
    effectType: 'boost_oxygen',
    effectLabel: '+35% Água & O₂ (Conversão MOXIE)',
    effectLabelEn: '+35% Water & O₂ (MOXIE Conversion)',
  },

  // ==================== MERCURY & VENUS RESOURCES ====================
  metallic_iron: {
    id: 'metallic_iron',
    name: 'Nódulo de Ferro Hermeano Denso',
    nameEn: 'Hermean Dense Iron Nodule',
    formula: 'Fe-Cr-Ni',
    category: 'minerals',
    rarity: 'rare',
    rarityLabel: 'Raro',
    rarityLabelEn: 'Rare',
    color: '#f59e0b',
    glowColor: '#fde047',
    weightPerUnit: 2.9,
    description: 'Afloramento metálico exposto pelos impactos no gigantesco núcleo de ferro de Mercúrio.',
    descriptionEn: 'High-density metallic iron outcrop exposed near Mercury’s enormous planetary core.',
    nasaApplication: 'Blindagem térmica anti-radiação solar e super-estrutura de coletores fototérmicos.',
    nasaApplicationEn: 'High-temperature thermal shields and orbital solar collector framing.',
    iconType: 'ore',
  },
  sodium_silicate: {
    id: 'sodium_silicate',
    name: 'Cristal de Silicato de Sódio',
    nameEn: 'Sodium Silicate Crystal',
    formula: 'Na₂SiO₃',
    category: 'minerals',
    rarity: 'uncommon',
    rarityLabel: 'Incomum',
    rarityLabelEn: 'Uncommon',
    color: '#fde047',
    glowColor: '#fef08a',
    weightPerUnit: 1.1,
    description: 'Cristal amarelado sinterizado pela intensa radiação solar de Mercúrio (observado pela sonda MESSENGER).',
    descriptionEn: 'Golden silicate mineral baked by intense solar wind flux on Mercury.',
    nasaApplication: 'Selantes cerâmicos de alta temperatura para bocais propulsores e escudos térmicos.',
    nasaApplicationEn: 'High-temperature ceramic adhesives for heat shields and thruster nozzles.',
    iconType: 'gem',
  },
  basalt_sulfur: {
    id: 'basalt_sulfur',
    name: 'Basalto Vulcânico Sulfurizado',
    nameEn: 'Sulfurized Volcanic Basalt',
    formula: 'FeS₂ / Basalt',
    category: 'minerals',
    rarity: 'rare',
    rarityLabel: 'Raro',
    rarityLabelEn: 'Rare',
    color: '#d97706',
    glowColor: '#fbbf24',
    weightPerUnit: 2.4,
    description: 'Rocha vulcânica venusiana forjada sob 92 atmosferas de pressão e 464 °C.',
    descriptionEn: 'Venusian volcanic basalt crystallized under 92 atmospheres of pressure at 464 °C.',
    nasaApplication: 'Estudo de sensores eletrónicos de carboneto de silício resistentes a ambientes infernais.',
    nasaApplicationEn: 'Tests high-pressure silicon-carbide electronics for Venus surface landers.',
    iconType: 'ore',
  },
  sulfuric_vapor: {
    id: 'sulfuric_vapor',
    name: 'Bolsa de Ácido Sulfúrico H₂SO₄',
    nameEn: 'Sulfuric Acid Vapor Vent',
    formula: 'H₂SO₄ / SO₂',
    category: 'chemicals',
    rarity: 'epic',
    rarityLabel: 'Tóxico',
    rarityLabelEn: 'Toxic',
    color: '#eab308',
    glowColor: '#fef08a',
    weightPerUnit: 1.8,
    description: 'Fissura corrosiva libertando aerossóis concentrados de ácido sulfúrico venusiano.',
    descriptionEn: 'Corrosive fissure emitting concentrated Venusian sulfuric acid aerosol.',
    nasaApplication: 'PERIGO: Corrói instantaneamente juntas EVA se permanecer dentro do anel amarelo.',
    nasaApplicationEn: 'HAZARD: Rapidly corrodes EVA suit seals while standing inside the yellow ring.',
    iconType: 'flask',
    effectType: 'hazard_toxic',
    effectLabel: 'PERIGO: Nuvem Ácida (-Traje & -Água/O₂ ao passar perto)',
    effectLabelEn: 'HAZARD: Acid Cloud (-Suit & -Water/O₂ when nearby)',
  },

  // ==================== GAS GIANTS & TITAN RESOURCES ====================
  metallic_hydrogen: {
    id: 'metallic_hydrogen',
    name: 'Cápsula de Hidrogénio Metálico',
    nameEn: 'Metallic Hydrogen Pod',
    formula: 'H⁺ (Metal)',
    category: 'tech',
    rarity: 'legendary',
    rarityLabel: 'Lendário',
    rarityLabelEn: 'Legendary',
    color: '#38bdf8',
    glowColor: '#7dd3fc',
    weightPerUnit: 1.9,
    description: 'Amostra confinada em campo magnético extraída das profundezas dos gigantes gasosos.',
    descriptionEn: 'Magnetically stabilized liquid-metallic hydrogen harvested by deep atmospheric scoops.',
    nasaApplication: 'Supercondutor à temperatura ambiente e propelente teórico de impulso específico extremo.',
    nasaApplicationEn: 'High-efficiency superconductor and theoretical ultra-high-ISP rocket propellant.',
    iconType: 'battery',
  },
  ammonia_crystal: {
    id: 'ammonia_crystal',
    name: 'Cristal Atmosférico de Amoníaco',
    nameEn: 'Atmospheric Ammonia Crystal',
    formula: 'NH₃ (s)',
    category: 'chemicals',
    rarity: 'uncommon',
    rarityLabel: 'Incomum',
    rarityLabelEn: 'Uncommon',
    color: '#a5f3fc',
    glowColor: '#cffafe',
    weightPerUnit: 0.9,
    description: 'Aerosóis de amoníaco cristalizados capturados nos coletores aeroestáticos superiores.',
    descriptionEn: 'Frozen ammonia crystals captured by upper-troposphere aerostat collectors.',
    nasaApplication: 'Síntese de hidrazina propulsora, fertilizantes hidropónicos e fluido refrigerante espacial.',
    nasaApplicationEn: 'Synthesizes hydrazine thruster fuel, hydroponic nitrogen, and spacecraft coolant.',
    iconType: 'flask',
  },
  diamond_hail: {
    id: 'diamond_hail',
    name: 'Granizo de Diamante Planetário',
    nameEn: 'Planetary Diamond Hailstone',
    formula: 'C (Cubic)',
    category: 'minerals',
    rarity: 'legendary',
    rarityLabel: 'Lendário',
    rarityLabelEn: 'Legendary',
    color: '#e0f2fe',
    glowColor: '#ffffff',
    weightPerUnit: 1.5,
    description: 'Diamantes puros cristalizados por relâmpagos gigantes em atmosferas de metano de Saturno, Úrano e Neptuno.',
    descriptionEn: 'Pure diamond hailstones forged from lightning-heated methane across giant planets.',
    nasaApplication: 'Janelas óticas laser indestrutíveis, processadores quânticos NV-center e brocas de perfuração.',
    nasaApplicationEn: 'Indestructible laser optics, quantum NV sensors, and planetary core drill tips.',
    iconType: 'gem',
  },
  liquid_methane: {
    id: 'liquid_methane',
    name: 'Metano Líquido Criogénico CH₄',
    nameEn: 'Liquid Methane Sample CH₄',
    formula: 'CH₄ (l)',
    category: 'chemicals',
    rarity: 'rare',
    rarityLabel: 'Raro',
    rarityLabelEn: 'Rare',
    color: '#0ea5e9',
    glowColor: '#38bdf8',
    weightPerUnit: 1.2,
    description: 'Hidrocarboneto líquido recolhido nas margens criogénicas de Titã a -179 °C.',
    descriptionEn: 'Liquid hydrocarbon collected from Titan’s cryogenic lakes at -179 °C.',
    nasaApplication: 'Propelente metano-oxigénio limpo de alta eficiência para regressos interplanetários.',
    nasaApplicationEn: 'Clean high-efficiency methalox propellant for return launch vehicles.',
    iconType: 'droplet',
  },
  tholin_organics: {
    id: 'tholin_organics',
    name: 'Polímero Orgânico Tolina',
    nameEn: 'Prebiotic Tholin Organics',
    formula: 'CₓHᵧNᵤ',
    category: 'chemicals',
    rarity: 'epic',
    rarityLabel: 'Épico',
    rarityLabelEn: 'Epic',
    color: '#f59e0b',
    glowColor: '#fbbf24',
    weightPerUnit: 0.7,
    description: 'Macromoléculas ricas em azoto e carbono sintetizadas por fotólise ultravioleta na bruma de Titã.',
    descriptionEn: 'Complex nitrogen-carbon macromolecules synthesized by UV photolysis in Titan’s orange haze.',
    nasaApplication: 'Investigação astrobiológica da NASA sobre os precursores químicos da origem da vida.',
    nasaApplicationEn: 'Astrobiology breakthrough studying prebiotic organic molecules prior to life on Earth.',
    iconType: 'dna',
  },
  cryo_water_ice: {
    id: 'cryo_water_ice',
    name: 'Gelo Criogénico Ultra-Duro',
    nameEn: 'Cryogenic Water-Ice Core',
    formula: 'H₂O (Cryo)',
    category: 'chemicals',
    rarity: 'uncommon',
    rarityLabel: 'Incomum',
    rarityLabelEn: 'Uncommon',
    color: '#67e8f9',
    glowColor: '#a5f3fc',
    weightPerUnit: 1.1,
    description: 'Rocha de água congelada à dureza do granito nas luas e gigantes de gelo do Sistema Solar exterior.',
    descriptionEn: 'Bedrock-hard water ice formed at deep cryogenic outer Solar System temperatures.',
    nasaApplication: 'Purificável em água potável de reserva e oxigénio respirável para trajes EVA.',
    nasaApplicationEn: 'Purified into backup drinking water and breathable oxygen for long-range EVA missions.',
    iconType: 'droplet',
    effectType: 'boost_both',
    effectLabel: '+25% Água & O₂ • +5 Proteção do Traje',
    effectLabelEn: '+25% Water & O₂ • +5 Suit Protection',
  },

  // ==================== NASA EXOPLANET ARCHIVE RESOURCES ====================
  exo_superdense_alloy: {
    id: 'exo_superdense_alloy',
    name: 'Liga Metálica Super-Terra',
    nameEn: 'Super-Earth Superdense Alloy',
    formula: 'Fe-Os-Ex',
    category: 'minerals',
    rarity: 'epic',
    rarityLabel: 'Épico',
    rarityLabelEn: 'Epic',
    color: '#c084fc',
    glowColor: '#e9d5ff',
    weightPerUnit: 2.6,
    description: 'Mineral extrassolar hiper-compactado pela gravidade elevada de exoplanetas catalogados pela NASA.',
    descriptionEn: 'Hyper-compressed extrasolar alloy formed under intense Super-Earth gravity.',
    nasaApplication: 'Reforço estrutural de próxima geração para naves interestelares e blindagem EVA.',
    nasaApplicationEn: 'Next-generation structural armor plating for interstellar spacecraft and EVA suits.',
    iconType: 'ore',
    effectType: 'boost_protection',
    effectLabel: '+25% Proteção do Traje (Máx. 150)',
    effectLabelEn: '+25% Suit Protection (Max 150)',
  },
  exo_silicate_crystal: {
    id: 'exo_silicate_crystal',
    name: 'Cristal de Silicato Extrassolar',
    nameEn: 'Extrasolar Silicate Crystal',
    formula: 'MgSiO₃*',
    category: 'minerals',
    rarity: 'rare',
    rarityLabel: 'Raro',
    rarityLabelEn: 'Rare',
    color: '#a855f7',
    glowColor: '#d8b4fe',
    weightPerUnit: 1.2,
    description: 'Silicato luminescente formado por pressão tectónica em mundos rochosos confirmados pelo telescópio Kepler/TESS.',
    descriptionEn: 'Luminescent high-pressure silicate verified on rocky exoplanets discovered by Kepler/TESS.',
    nasaApplication: 'Matéria-prima para ótica de telescópios espaciais e matrizes fotónicas interestelares.',
    nasaApplicationEn: 'Used in deep-space photonic waveguides and high-energy optical arrays.',
    iconType: 'gem',
  },
  exo_cryo_ice: {
    id: 'exo_cryo_ice',
    name: 'Gelo Hidrosférico Exoplanetário',
    nameEn: 'Exoplanet Hydrosphere Ice',
    formula: 'H₂O (Exo)',
    category: 'chemicals',
    rarity: 'rare',
    rarityLabel: 'Raro',
    rarityLabelEn: 'Rare',
    color: '#22d3ee',
    glowColor: '#67e8f9',
    weightPerUnit: 1.0,
    description: 'Amostra de água congelada detetada em exoplanetas de zona habitável ou frios (dados Caltech NASA).',
    descriptionEn: 'Frozen water sample harvested from temperate or cold exoplanets in the NASA Exoplanet Archive.',
    nasaApplication: 'Bioassinatura essencial da NASA e fonte direta de água e O₂ para astronautas.',
    nasaApplicationEn: 'Primary NASA biosignature and direct water + oxygen life-support supply.',
    iconType: 'droplet',
    effectType: 'boost_both',
    effectLabel: '+25% Água & O₂ • +5 Proteção do Traje',
    effectLabelEn: '+25% Water & O₂ • +5 Suit Protection',
  },
  exo_plasma_flare: {
    id: 'exo_plasma_flare',
    name: 'Condensado de Plasma Estelar',
    nameEn: 'Stellar Flare Plasma Node',
    formula: 'Ex-Plasma',
    category: 'tech',
    rarity: 'legendary',
    rarityLabel: 'Lendário',
    rarityLabelEn: 'Legendary',
    color: '#f43f5e',
    glowColor: '#fb7185',
    weightPerUnit: 2.2,
    description: 'Energia ionizada aprisionada na crosta de exoplanetas próximos à estrela hospedeira (> 400 K).',
    descriptionEn: 'Ionized magnetic plasma trapped inside crust minerals on high-temperature exoplanets (> 400 K).',
    nasaApplication: 'Propulsão eletromagnética interestelar e investigação de erupções de anãs vermelhas.',
    nasaApplicationEn: 'Feeds interstellar plasma propulsion research and red-dwarf flare shielding.',
    iconType: 'battery',
  },
  orbital_cargo_expander: {
    id: 'orbital_cargo_expander',
    name: 'Expansor Modular de Mochila',
    nameEn: 'Orbital Cargo Expander',
    formula: 'EVA-MOD+',
    category: 'tech',
    rarity: 'epic',
    rarityLabel: 'Espacial',
    rarityLabelEn: 'Space Tech',
    color: '#10b981',
    glowColor: '#6ee7b7',
    weightPerUnit: 0.8,
    description: 'Módulo espacial dobrável de Vectran-Kevlar concebido para ampliar a capacidade de carga e compartimentos da mochila EVA.',
    descriptionEn: 'Expandable Vectran-Kevlar orbital cargo pod engineered to increase EVA backpack weight capacity and storage slots.',
    nasaApplication: 'Tecnologia logística ISS/Gateway: use na mochila para ganhar +20.0 kg de carga e +6 slots adicionais (até 3 expansões).',
    nasaApplicationEn: 'ISS/Gateway expandable cargo logistics: use inside your backpack to gain +20.0 kg load and +6 extra slots (up to 3 upgrades).',
    iconType: 'cpu',
    effectType: 'expand_backpack',
    effectLabel: '+20.0 kg Carga & +6 Slots na Mochila (Ao Usar)',
    effectLabelEn: '+20.0 kg Load & +6 Backpack Slots (On Use)',
  },
};

export interface WorldResourceNode {
  id: string;
  resourceId: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  yieldAmount: number;
}

export const EARTH_RESOURCE_NODES: WorldResourceNode[] = [
  // Common & Near-Base Beach / Plains Resources (Easy to find)
  { id: 'node-quartz-beach-1', resourceId: 'quartz', position: [-25.5, 0.35, 15], rotation: [0.1, 0.4, -0.2], scale: 1.1, yieldAmount: 3 },
  { id: 'node-quartz-beach-2', resourceId: 'quartz', position: [-25, 0.25, -45], rotation: [-0.1, 1.2, 0.15], scale: 0.95, yieldAmount: 2 },
  { id: 'node-quartz-beach-3', resourceId: 'quartz', position: [-22, 0.3, 108], rotation: [0.1, 0.7, 0.1], scale: 1.05, yieldAmount: 3 },
  { id: 'node-quartz-plains-4', resourceId: 'quartz', position: [38, 0.35, 42], rotation: [0.2, 1.1, 0], scale: 1.0, yieldAmount: 3 },
  { id: 'node-silica-dunes-1', resourceId: 'silicon', position: [-22, 0.3, -15], rotation: [0, 0.8, 0], scale: 1.0, yieldAmount: 4 },
  { id: 'node-silica-dunes-2', resourceId: 'silicon', position: [-24, 0.25, 75], rotation: [0.1, 2.1, -0.1], scale: 1.2, yieldAmount: 5 },
  { id: 'node-silica-dunes-3', resourceId: 'silicon', position: [-20, 0.3, -95], rotation: [0, 1.5, 0.1], scale: 1.1, yieldAmount: 4 },
  { id: 'node-water-spring-1', resourceId: 'pure_water', position: [-16, 0.15, -60], scale: 1.0, yieldAmount: 2 },
  { id: 'node-water-spring-2', resourceId: 'pure_water', position: [-14, 0.15, 38], scale: 1.0, yieldAmount: 3 },
  { id: 'node-water-spring-3', resourceId: 'pure_water', position: [-18, 0.15, 128], scale: 1.0, yieldAmount: 2 },
  { id: 'node-oxygen-canister-1', resourceId: 'oxygen_canister', position: [15, 0.35, 32], rotation: [0, 0.4, 0], scale: 1.05, yieldAmount: 2 },
  { id: 'node-oxygen-canister-2', resourceId: 'oxygen_canister', position: [74, 0.35, -36], rotation: [0, 1.4, 0], scale: 1.0, yieldAmount: 2 },
  { id: 'node-iron-plain-1', resourceId: 'iron_ore', position: [48, 0.55, -32], rotation: [0.2, 0.6, -0.1], scale: 1.3, yieldAmount: 5 },
  { id: 'node-iron-plain-2', resourceId: 'iron_ore', position: [88, 0.6, 52], rotation: [-0.15, 1.4, 0.2], scale: 1.4, yieldAmount: 6 },
  { id: 'node-iron-plain-3', resourceId: 'iron_ore', position: [135, 0.55, -75], rotation: [0.3, 2.5, 0], scale: 1.2, yieldAmount: 4 },
  { id: 'node-iron-plain-4', resourceId: 'iron_ore', position: [24, 0.5, -58], rotation: [0.1, 0.9, 0], scale: 1.15, yieldAmount: 4 },
  { id: 'node-iron-plain-5', resourceId: 'iron_ore', position: [108, 0.55, 110], rotation: [-0.2, 1.8, 0], scale: 1.25, yieldAmount: 5 },

  // Uncommon Mid-Range Deposits
  { id: 'node-lithium-deposit-1', resourceId: 'lithium', position: [65, 0.45, 88], rotation: [0, 0.5, 0.2], scale: 1.1, yieldAmount: 3 },
  { id: 'node-lithium-deposit-2', resourceId: 'lithium', position: [142, 0.45, -118], rotation: [0.2, 1.8, -0.15], scale: 1.0, yieldAmount: 3 },
  { id: 'node-lithium-deposit-3', resourceId: 'lithium', position: [168, 0.45, 48], rotation: [0.1, 0.4, 0], scale: 1.1, yieldAmount: 3 },
  { id: 'node-titanium-alloy-1', resourceId: 'titanium_alloy', position: [182, 0.35, 58], rotation: [0, 0.9, 0], scale: 1.05, yieldAmount: 3 },
  { id: 'node-titanium-alloy-2', resourceId: 'titanium_alloy', position: [115, 0.35, -145], rotation: [0, 2.1, 0], scale: 1.05, yieldAmount: 2 },
  { id: 'node-suit-nanopolymer-1', resourceId: 'suit_nanopolymer', position: [18, 0.4, -26], rotation: [0, 0.5, 0], scale: 1.05, yieldAmount: 1 },
  { id: 'node-suit-nanopolymer-2', resourceId: 'suit_nanopolymer', position: [155, 0.4, -32], rotation: [0, 1.2, 0], scale: 1.05, yieldAmount: 1 },

  // Rare & Hazardous Mid-Outer Deposits
  { id: 'node-uranium-hazard-1', resourceId: 'uranium_ore', position: [56, 0.45, 62], rotation: [0.1, 0.9, 0], scale: 1.25, yieldAmount: 1 },
  { id: 'node-uranium-hazard-2', resourceId: 'uranium_ore', position: [122, 0.45, 68], rotation: [-0.1, 1.7, 0.1], scale: 1.25, yieldAmount: 1 },
  { id: 'node-uranium-hazard-3', resourceId: 'uranium_ore', position: [215, 0.45, 138], rotation: [0.2, 0.5, 0], scale: 1.25, yieldAmount: 2 },
  { id: 'node-toxic-sulfur-1', resourceId: 'toxic_sulfur', position: [64, 0.35, -72], rotation: [0, 0.6, 0], scale: 1.2, yieldAmount: 2 },
  { id: 'node-toxic-sulfur-2', resourceId: 'toxic_sulfur', position: [138, 0.4, -60], rotation: [0.1, 2.2, 0], scale: 1.2, yieldAmount: 2 },
  { id: 'node-meteorite-1', resourceId: 'meteorite_shard', position: [98, 0.45, -105], rotation: [0.4, 0.7, 0.3], scale: 1.2, yieldAmount: 2 },
  { id: 'node-meteorite-2', resourceId: 'meteorite_shard', position: [165, 0.5, 115], rotation: [-0.3, 2.1, 0.4], scale: 1.3, yieldAmount: 2 },
  { id: 'node-meteorite-3', resourceId: 'meteorite_shard', position: [265, 0.45, 92], rotation: [0.2, 1.5, 0.1], scale: 1.25, yieldAmount: 2 },

  // Hard-to-Find Frontier Epic & Legendary Deposits (Distant Perimeter with Rarity Glow)
  { id: 'node-ggpen-composite-1', resourceId: 'ggpen_composite', position: [238, 0.4, -22], rotation: [0, 0.3, 0], scale: 1.05, yieldAmount: 2 },
  { id: 'node-ggpen-composite-2', resourceId: 'ggpen_composite', position: [285, 0.4, -185], rotation: [0, 1.4, 0], scale: 1.15, yieldAmount: 2 },
  { id: 'node-plasma-core-1', resourceId: 'plasma_core', position: [214, 0.4, -48], rotation: [0, 1.1, 0], scale: 1.05, yieldAmount: 1 },
  { id: 'node-plasma-core-2', resourceId: 'plasma_core', position: [305, 0.4, 165], rotation: [0, 2.3, 0], scale: 1.2, yieldAmount: 2 },
  { id: 'node-plasma-core-3', resourceId: 'plasma_core', position: [-8, 0.4, 245], rotation: [0, 0.6, 0], scale: 1.2, yieldAmount: 1 },
  { id: 'node-earth-expander-1', resourceId: 'orbital_cargo_expander', position: [292, 0.4, -75], rotation: [0, 0.9, 0], scale: 1.15, yieldAmount: 1 },
  { id: 'node-earth-expander-2', resourceId: 'orbital_cargo_expander', position: [148, 0.4, 232], rotation: [0, 1.9, 0], scale: 1.15, yieldAmount: 1 },
];

// Deterministic hash helpers so API-driven planetary nodes never shift randomly across frames
function hashPlanetSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function seededUnit(seed: number, step: number): number {
  const x = Math.sin(seed * 0.0017 + step * 19.313) * 43758.5453123;
  return x - Math.floor(x);
}

interface PlanetResourceTierPlan {
  common: string[];
  uncommon: string[];
  rare: string[];
  epic: string[];
  legendary: string[];
}

// Compute planet-authentic resource palette directly from NASA / Solar System API telemetry
function buildApiPlanetResourcePlan(planet: PlanetInfo): PlanetResourceTierPlan {
  const density = planet.density ?? NASA_PLANETARY_DATA[planet.type]?.gravityG ?? 3.5;
  const tempK = planet.temperature ?? NASA_PLANETARY_DATA[planet.type]?.temperatureKelvin ?? 260;
  const massEarth = planet.mass ?? 1.0;

  switch (planet.type) {
    case 'moon':
      return {
        common: ['lunar_regolith', 'quartz'],
        uncommon: ['ilmenite', 'lunar_ice', 'iron_ore'],
        rare: ['titanium_alloy', 'oxygen_canister', 'meteorite_shard'],
        epic: ['suit_nanopolymer', 'orbital_cargo_expander', 'ggpen_composite'],
        legendary: ['helium3', 'plasma_core'],
      };

    case 'mercury':
      return {
        common: ['metallic_iron', 'quartz'],
        uncommon: ['sodium_silicate', 'ilmenite', 'iron_ore'],
        rare: ['titanium_alloy', 'uranium_ore', 'meteorite_shard'],
        epic: ['suit_nanopolymer', 'orbital_cargo_expander', 'ggpen_composite'],
        legendary: ['plasma_core', 'exo_plasma_flare'],
      };

    case 'venus':
      return {
        common: ['basalt_sulfur', 'quartz'],
        uncommon: ['iron_ore', 'toxic_sulfur', 'titanium_alloy'],
        rare: ['sulfuric_vapor', 'uranium_ore', 'suit_nanopolymer'],
        epic: ['ggpen_composite', 'orbital_cargo_expander'],
        legendary: ['plasma_core', 'exo_plasma_flare'],
      };

    case 'mars':
      return {
        common: ['mars_hematite', 'iron_ore', 'quartz'],
        uncommon: ['perchlorate', 'co2_ice', 'silicon'],
        rare: ['pure_water', 'lithium', 'meteorite_shard'],
        epic: ['titanium_alloy', 'suit_nanopolymer', 'orbital_cargo_expander'],
        legendary: ['ggpen_composite', 'plasma_core'],
      };

    case 'titan':
      return {
        common: ['cryo_water_ice', 'quartz'],
        uncommon: ['liquid_methane', 'ammonia_crystal', 'silicon'],
        rare: ['tholin_organics', 'oxygen_canister', 'meteorite_shard'],
        epic: ['suit_nanopolymer', 'orbital_cargo_expander', 'ggpen_composite'],
        legendary: ['diamond_hail', 'metallic_hydrogen'],
      };

    case 'jupiter':
    case 'saturn':
    case 'uranus':
    case 'neptune': {
      const isIceGiant = planet.type === 'uranus' || planet.type === 'neptune' || tempK < 110;
      return {
        common: isIceGiant ? ['cryo_water_ice', 'ammonia_crystal'] : ['ammonia_crystal', 'oxygen_canister'],
        uncommon: isIceGiant ? ['liquid_methane', 'oxygen_canister'] : ['cryo_water_ice', 'titanium_alloy'],
        rare: ['tholin_organics', 'suit_nanopolymer', 'uranium_ore'],
        epic: ['ggpen_composite', 'orbital_cargo_expander'],
        legendary: planet.type === 'jupiter' ? ['metallic_hydrogen', 'plasma_core'] : ['diamond_hail', 'metallic_hydrogen'],
      };
    }

    case 'exoplanet':
    default: {
      // Dynamic mineralogy inferred directly from NASA Exoplanet Archive API telemetry
      const isHotWorld = tempK >= 400 || (planet.insolation ?? 1) > 12;
      const isCryoWorld = tempK <= 245;
      const isSuperDense = density >= 5.0 || massEarth >= 2.4;

      const common = isHotWorld
        ? ['basalt_sulfur', 'metallic_iron', 'quartz']
        : isCryoWorld
        ? ['cryo_water_ice', 'quartz', 'silicon']
        : ['quartz', 'silicon', 'iron_ore'];

      const uncommon = isHotWorld
        ? ['sodium_silicate', 'iron_ore', 'ilmenite']
        : isCryoWorld
        ? ['exo_cryo_ice', 'ammonia_crystal', 'liquid_methane']
        : ['pure_water', 'lithium', 'exo_cryo_ice'];

      const rare = isSuperDense
        ? ['exo_silicate_crystal', 'titanium_alloy', 'uranium_ore']
        : ['exo_silicate_crystal', 'oxygen_canister', 'meteorite_shard'];

      const epic = ['exo_superdense_alloy', 'suit_nanopolymer', 'orbital_cargo_expander', 'ggpen_composite'];
      const legendary = isHotWorld
        ? ['exo_plasma_flare', 'plasma_core']
        : isCryoWorld
        ? ['diamond_hail', 'metallic_hydrogen']
        : ['exo_plasma_flare', 'helium3', 'plasma_core'];

      return { common, uncommon, rare, epic, legendary };
    }
  }
}

export function getSurfaceResourceNodes(planet: PlanetInfo): WorldResourceNode[] {
  if (planet.type === 'earth') {
    return EARTH_RESOURCE_NODES;
  }

  const plan = buildApiPlanetResourcePlan(planet);
  const seed = hashPlanetSeed(`${planet.id}:${planet.name}:${planet.density ?? 0}:${planet.temperature ?? 0}`);
  const isGasGiant =
    planet.type === 'jupiter' || planet.type === 'saturn' || planet.type === 'uranus' || planet.type === 'neptune';

  // Tier counts total 38 deposits on solid worlds and 34 deposits on aerostat decks (30-45 high density range)
  const tierQuotas: Array<{ tier: keyof PlanetResourceTierPlan; count: number; minR: number; maxR: number; yieldRange: [number, number] }> =
    isGasGiant
      ? [
          { tier: 'common', count: 12, minR: 15, maxR: 48, yieldRange: [3, 5] },
          { tier: 'uncommon', count: 9, minR: 38, maxR: 66, yieldRange: [2, 4] },
          { tier: 'rare', count: 6, minR: 58, maxR: 80, yieldRange: [2, 3] },
          { tier: 'epic', count: 4, minR: 72, maxR: 90, yieldRange: [1, 2] },
          { tier: 'legendary', count: 3, minR: 80, maxR: 93, yieldRange: [1, 2] },
        ]
      : [
          { tier: 'common', count: 14, minR: 18, maxR: 105, yieldRange: [3, 6] },
          { tier: 'uncommon', count: 10, minR: 82, maxR: 175, yieldRange: [2, 4] },
          { tier: 'rare', count: 7, minR: 162, maxR: 255, yieldRange: [2, 3] },
          { tier: 'epic', count: 4, minR: 228, maxR: 315, yieldRange: [1, 2] },
          { tier: 'legendary', count: 3, minR: 265, maxR: 350, yieldRange: [1, 2] },
        ];

  const baseCoordsMap: Record<string, [number, number]> = {
    moon: [24, -24],
    mercury: [26, 22],
    venus: [26, -22],
    mars: [26, -24],
    titan: [24, -24],
    jupiter: [0, -28],
    saturn: [0, -28],
    uranus: [0, -28],
    neptune: [0, -28],
    exoplanet: [24, -22],
  };
  const basePos = baseCoordsMap[planet.type] || [24, -22];
  const slug = planet.id.replace(/[^a-zA-Z0-9_-]/g, '');

  const nodes: WorldResourceNode[] = [];
  const minSpacing = isGasGiant ? 6.0 : 12.0;

  let globalIdx = 0;
  for (const q of tierQuotas) {
    const pool = plan[q.tier];
    for (let k = 0; k < q.count; k++) {
      const resourceId = pool[(k + (seed % pool.length)) % pool.length];
      let placedX = 0;
      let placedZ = 0;

      // Golden-angle spiral candidate search with structure + neighbor collision avoidance
      for (let attempt = 0; attempt < 28; attempt++) {
        const u1 = seededUnit(seed, globalIdx * 13 + attempt * 7 + 1);
        const u2 = seededUnit(seed, globalIdx * 17 + attempt * 11 + 3);
        const radius = q.minR + (q.maxR - q.minR) * (0.15 + 0.85 * ((k + u1) / Math.max(1, q.count)));
        const angle = globalIdx * 2.399963 + attempt * 0.47 + u2 * 0.6;
        const cx = Math.cos(angle) * radius;
        const cz = Math.sin(angle) * radius;

        // Clear capsule landing zone [0, 0]
        if (Math.hypot(cx, cz) < 13.5) continue;
        // Clear offworld base footprint
        if (Math.hypot(cx - basePos[0], cz - basePos[1]) < 15.0) continue;
        // Clear Mars greenhouse
        if (planet.type === 'mars' && Math.hypot(cx - 46, cz + 24) < 11.5) continue;
        // Clear Gas Giant atmospheric scoops at [±30, 0]
        if (isGasGiant && (Math.hypot(cx - 30, cz) < 8.5 || Math.hypot(cx + 30, cz) < 8.5)) continue;
        // Keep deep Titan methane lake interior reserved for shoreline methane
        if (planet.type === 'titan' && resourceId !== 'liquid_methane' && Math.hypot(cx + 50, cz - 50) < 46) continue;
        // Ensure spacing between generated nodes
        let tooClose = false;
        for (const existing of nodes) {
          if (Math.hypot(cx - existing.position[0], cz - existing.position[2]) < minSpacing) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        placedX = cx;
        placedZ = cz;
        break;
      }

      if (placedX === 0 && placedZ === 0) {
        const fallbackAngle = globalIdx * 2.399963;
        const fallbackR = (q.minR + q.maxR) * 0.5;
        placedX = Math.cos(fallbackAngle) * fallbackR;
        placedZ = Math.sin(fallbackAngle) * fallbackR;
      }

      const [minY, maxY] = q.yieldRange;
      const yieldAmount = minY + Math.floor(seededUnit(seed, globalIdx * 23 + 5) * (maxY - minY + 1));
      const scale =
        q.tier === 'legendary'
          ? 1.28
          : q.tier === 'epic'
          ? 1.2
          : q.tier === 'rare'
          ? 1.15
          : 1.05 + seededUnit(seed, globalIdx * 29) * 0.15;

      nodes.push({
        id: `${slug}-${q.tier}-${globalIdx}`,
        resourceId,
        position: [parseFloat(placedX.toFixed(1)), isGasGiant ? 0.35 : 0.3, parseFloat(placedZ.toFixed(1))],
        rotation: [0.05 * ((globalIdx % 3) - 1), seededUnit(seed, globalIdx * 31) * Math.PI * 2, 0],
        scale: parseFloat(scale.toFixed(2)),
        yieldAmount,
      });
      globalIdx++;
    }
  }

  return nodes;
}


