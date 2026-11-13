import React, { useState, useMemo } from 'react';
import {
  X,
  Briefcase,
  Layers,
  Sparkles,
  Droplets,
  Cpu,
  Info,
  Scale,
  CheckCircle2,
  Compass,
  Trash2,
} from 'lucide-react';
import { useGameStore, PLANETS } from '../store';
import {
  RESOURCE_DEFINITIONS,
  NASA_PLANETARY_DATA,
  ResourceCategory,
  ResourceDefinition,
} from '../utils/nasaData';

interface InventoryModalProps {
  onClose: () => void;
}

export const InventoryModal = React.memo(function InventoryModal({ onClose }: InventoryModalProps) {
  const inventory = useGameStore((state) => state.inventory);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const currentPlanet = PLANETS[planetIndex] || PLANETS[0];
  const planetId = (currentPlanet.type || 'earth').toLowerCase();
  const planetaryTelemetry = NASA_PLANETARY_DATA[planetId] || NASA_PLANETARY_DATA.earth;

  const [activeCategory, setActiveCategory] = useState<'all' | ResourceCategory | 'telemetry'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>('quartz');

  // Compute total weight and occupied slots
  const { totalWeight, occupiedSlots, itemsList } = useMemo(() => {
    let weight = 0;
    let slots = 0;
    const list: Array<{ def: ResourceDefinition; count: number }> = [];

    Object.entries(inventory).forEach(([id, count]) => {
      const def = RESOURCE_DEFINITIONS[id];
      if (def && count > 0) {
        weight += def.weightPerUnit * count;
        slots += 1;
        list.push({ def, count });
      }
    });

    return { totalWeight: weight, occupiedSlots: slots, itemsList: list };
  }, [inventory]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return itemsList;
    if (activeCategory === 'telemetry') return [];
    return itemsList.filter((item) => item.def.category === activeCategory);
  }, [itemsList, activeCategory]);

  const activeSelectedEntry =
    filteredItems.find((item) => item.def.id === selectedItemId) || filteredItems[0] || null;
  const selectedDef = activeSelectedEntry?.def || null;
  const selectedCount = activeSelectedEntry?.count || 0;

  // Use consumable item (water, oxygen, or protective armor kits)
  const handleUseItem = (itemId: string) => {
    const store = useGameStore.getState();
    if (itemId === 'pure_water') {
      if (store.removeInventoryItem('pure_water', 1)) {
        store.applyLifeSupportBoost(5, 25);
      }
    } else if (itemId === 'oxygen_canister') {
      if (store.removeInventoryItem('oxygen_canister', 1)) {
        store.applyLifeSupportBoost(0, 100);
      }
    } else if (itemId === 'suit_nanopolymer') {
      if (store.removeInventoryItem('suit_nanopolymer', 1)) {
        store.applyLifeSupportBoost(35, 10, 150);
      }
    } else if (itemId === 'ggpen_composite') {
      if (store.removeInventoryItem('ggpen_composite', 1)) {
        store.applyLifeSupportBoost(30, 0, 150);
      }
    } else if (itemId === 'titanium_alloy') {
      if (store.removeInventoryItem('titanium_alloy', 1)) {
        store.applyLifeSupportBoost(20, 0);
      }
    }
  };

  const handleDiscardItem = (itemId: string, amount: number) => {
    useGameStore.getState().removeInventoryItem(itemId, amount);
  };

  return (
    <div className="bg-slate-900/95 p-4 sm:p-5 rounded-3xl backdrop-blur-2xl border border-blue-500/40 text-white w-full max-w-lg flex flex-col gap-3.5 shadow-2xl max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 text-amber-400 border border-amber-400/40 shadow-lg shadow-amber-500/15">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Mochila de Sobrevivência
              </h3>
              <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-400/30">
                EVA GGPEN
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Armazenamento Tático & Amostras de Campo
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Capacity & Weight Bar */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-800/60 border border-white/10 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              Carga Total:
            </span>
            <span className="font-mono font-bold text-slate-200">
              {totalWeight.toFixed(1)} / 40.0 kg
            </span>
          </div>
          <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalWeight / 40) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Slots Ocupados:
            </span>
            <span className="font-mono font-bold text-slate-200">
              {occupiedSlots} / 20 Slots
            </span>
          </div>
          <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (occupiedSlots / 20) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-medium whitespace-nowrap text-[11px] ${
            activeCategory === 'all'
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          Todos ({itemsList.length})
        </button>
        <button
          onClick={() => setActiveCategory('minerals')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-medium whitespace-nowrap text-[11px] flex items-center gap-1 ${
            activeCategory === 'minerals'
              ? 'bg-blue-600 text-white font-bold shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Minerais
        </button>
        <button
          onClick={() => setActiveCategory('chemicals')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-medium whitespace-nowrap text-[11px] flex items-center gap-1 ${
            activeCategory === 'chemicals'
              ? 'bg-blue-600 text-white font-bold shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Droplets className="w-3 h-3 text-blue-400" />
          Químicos
        </button>
        <button
          onClick={() => setActiveCategory('tech')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-medium whitespace-nowrap text-[11px] flex items-center gap-1 ${
            activeCategory === 'tech'
              ? 'bg-blue-600 text-white font-bold shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3 h-3 text-purple-400" />
          Aeroespacial
        </button>
        <button
          onClick={() => setActiveCategory('telemetry')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-medium whitespace-nowrap text-[11px] flex items-center gap-1 ml-auto ${
            activeCategory === 'telemetry'
              ? 'bg-amber-600 text-white font-bold shadow-md'
              : 'bg-slate-800/60 text-amber-300/80 hover:text-amber-200'
          }`}
        >
          <Compass className="w-3 h-3 text-amber-400" />
          NASA Dados
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[220px] max-h-[360px]">
        {activeCategory === 'telemetry' ? (
          /* NASA Planetary Telemetry Sheet */
          <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-blue-950/40 border border-blue-400/30 text-xs">
            <div className="flex items-center justify-between border-b border-blue-400/20 pb-2">
              <span className="font-bold text-sm text-blue-300 uppercase tracking-wide">
                Ficha Científica • {planetaryTelemetry.namePt} ({planetaryTelemetry.name})
              </span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold bg-blue-900/60 px-2 py-0.5 rounded">
                NASA Fact Sheet
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed italic">
              "{planetaryTelemetry.scientificDescription}"
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1 font-mono text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block">Gravidade Superficial:</span>
                <span className="text-sm font-bold text-cyan-300">
                  {planetaryTelemetry.gravity} m/s² ({planetaryTelemetry.gravityG} G)
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block">Humidade / Vapor:</span>
                <span className="text-sm font-bold text-emerald-300">
                  {planetaryTelemetry.averageHumidity}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block">Pressão Atmosférica:</span>
                <span className="text-xs font-bold text-slate-200">
                  {planetaryTelemetry.surfacePressure}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block">Temperatura Média:</span>
                <span className="text-xs font-bold text-amber-300">
                  {planetaryTelemetry.temperatureCelsius} °C ({planetaryTelemetry.temperatureKelvin} K)
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Composição Atmosférica:</span>
              <span className="text-[11px] font-mono text-slate-200">
                {planetaryTelemetry.atmosphereComposition}
              </span>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2">
            <Briefcase className="w-10 h-10 text-slate-600 mb-1" />
            <span className="text-xs font-bold text-slate-300">Nenhum recurso nesta categoria</span>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Explore o planeta Terra para recolher cristais de quartzo nas praias, minérios de ferro e canisters tecnológicos do GGPEN!
            </p>
          </div>
        ) : (
          /* Grid of Slots & Selected Item Details */
          <div className="flex flex-col gap-3">
            {/* Slot Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {filteredItems.map(({ def, count }) => {
                const isSelected = selectedDef?.id === def.id;
                return (
                  <button
                    key={def.id}
                    onClick={() => setSelectedItemId(def.id)}
                    className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer aspect-square ${
                      isSelected
                        ? 'bg-blue-600/30 border-2 border-blue-400 shadow-lg shadow-blue-500/20 scale-102'
                        : 'bg-slate-800/70 hover:bg-slate-800 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: def.color }}
                    />
                    <span className="text-[10px] font-bold text-slate-200 text-center leading-tight line-clamp-1">
                      {def.formula}
                    </span>
                    <span className="absolute bottom-1 right-1.5 font-mono text-[9px] font-black bg-black/60 px-1 rounded text-cyan-300">
                      x{count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Item Inspection Panel */}
            {selectedDef && (
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-white/10 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedDef.color }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {selectedDef.name}
                      </h4>
                      <span className="text-[10px] font-mono text-cyan-300">
                        {selectedDef.formula} • {selectedDef.rarityLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-200 block">
                      {selectedCount} em carga
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {(selectedDef.weightPerUnit * selectedCount).toFixed(1)} kg total
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">
                  {selectedDef.description}
                </p>

                {selectedDef.effectLabel && (
                  <div
                    className={`p-2 rounded-xl border text-[10px] font-mono font-bold ${
                      selectedDef.effectType?.startsWith('hazard')
                        ? 'bg-red-950/60 border-red-400/40 text-red-300'
                        : 'bg-emerald-950/60 border-emerald-400/40 text-emerald-300'
                    }`}
                  >
                    {selectedDef.effectLabel}
                  </div>
                )}

                <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5 flex items-start gap-1.5 text-[10px] text-slate-400">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-300 font-sans">Aplicação NASA: </strong>
                    {selectedDef.nasaApplication}
                  </span>
                </div>

                {/* Usable Action Button for Water, Oxygen & Suit Protection Kits */}
                {(selectedDef.id === 'pure_water' ||
                  selectedDef.id === 'oxygen_canister' ||
                  selectedDef.id === 'suit_nanopolymer' ||
                  selectedDef.id === 'ggpen_composite' ||
                  selectedDef.id === 'titanium_alloy') &&
                  selectedCount > 0 && (
                  <button
                    onClick={() => handleUseItem(selectedDef.id)}
                    className={`w-full mt-1 py-2 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-md ${
                      selectedDef.id === 'pure_water' || selectedDef.id === 'oxygen_canister'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    {selectedDef.id === 'pure_water'
                      ? 'Consumir Água (+25% O₂ & +5 Traje)'
                      : selectedDef.id === 'oxygen_canister'
                      ? 'Reabastecer Oxigénio (100%)'
                      : selectedDef.id === 'suit_nanopolymer'
                      ? 'Aplicar Nanopolímero (+35% Traje & +10% O₂)'
                      : selectedDef.id === 'ggpen_composite'
                      ? 'Instalar Blindagem GGPEN (+30% Traje)'
                      : 'Reforçar Fato com Titânio (+20% Traje)'}
                  </button>
                )}

                {/* Remove / Discard Resource Controls */}
                {selectedCount > 0 && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleDiscardItem(selectedDef.id, 1)}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 border border-rose-500/40 text-rose-200 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Remover 1</span>
                    </button>
                    {selectedCount > 1 && (
                      <button
                        onClick={() => handleDiscardItem(selectedDef.id, selectedCount)}
                        className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/90 border border-rose-500/30 text-rose-300 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Descartar ({selectedCount})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Close */}
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
      >
        Voltar à Exploração
      </button>
    </div>
  );
});
