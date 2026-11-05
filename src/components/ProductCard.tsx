import React from 'react';
import { ShoppingCart, CheckCircle, Truck, Cpu, Monitor, Gamepad2, Keyboard, Mouse, Headphones, HardDrive, Layers, Armchair } from 'lucide-react';
import { Product } from '@/data/products';

// Composant de rendu visuel haute fidélité pour chaque type de matériel
const ProductVisual: React.FC<{ product: Product }> = ({ product }) => {
  const getVisual = () => {
    switch (product.id) {
      case 'rtx-5090':
      case 'rtx-5080':
      case 'rx-9070-xt':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg p-3 text-cyan-400">
            <div className="w-full flex justify-between items-center px-2 py-1 border-b border-slate-800 text-[10px] font-mono text-slate-400">
              <span>PCIe 5.0</span>
              <span className="text-[#FF6000] font-bold">{product.brand}</span>
            </div>
            {/* Triple ventilateurs stylisés */}
            <div className="flex items-center justify-center gap-3 my-3">
              <div className="w-12 h-12 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center animate-spin-slow">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-400"></div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-400"></div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-400"></div>
              </div>
            </div>
            <div className="w-full bg-amber-500/20 text-amber-300 text-[9px] text-center py-0.5 rounded border border-amber-500/30 font-mono">
              CONNECTEURS GDDR7 / GOLD CONTACTS
            </div>
          </div>
        );
      case 'ryzen-7-9800x3d':
      case 'core-ultra-7-270k-plus':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg p-4 border border-slate-300">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-400 rounded-lg border-2 border-slate-400 p-2 shadow-inner flex flex-col items-center justify-center text-center">
              <Cpu className="w-8 h-8 text-slate-700 mb-1" />
              <span className="text-[10px] font-mono font-black text-slate-800">{product.brand}</span>
              <span className="text-[8px] font-mono text-slate-600">3D V-CACHE / LGA</span>
            </div>
            <span className="mt-2 text-[10px] font-bold text-slate-500">IHS Plaque Cuivre Nickelé</span>
          </div>
        );
      case 'playstation-5':
      case 'switch-2':
      case 'xbox-series-x':
      case 'xbox-series-s':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg p-4 text-white">
            <Gamepad2 className="w-16 h-16 text-[#FF6000] mb-2" />
            <span className="text-xs font-bold tracking-wider">{product.name}</span>
            <span className="text-[10px] text-slate-400">Pack Console Officielle</span>
          </div>
        );
      case 'rog-swift-oled-pg34wcdn':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-lg p-4 text-cyan-400">
            <Monitor className="w-16 h-16 text-cyan-400 mb-2" />
            <span className="text-xs font-bold text-white">34" QD-OLED Incurvé</span>
            <span className="text-[10px] text-[#FF6000] font-mono font-bold">360 Hz · 0.03 ms</span>
          </div>
        );
      case 'huntsman-v3-pro-tkl':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-lg p-4 text-emerald-400">
            <Keyboard className="w-16 h-16 text-emerald-400 mb-2" />
            <span className="text-xs font-bold text-white">Format TKL Analogique</span>
            <span className="text-[10px] text-slate-400">Switchs Optiques Gen-2</span>
          </div>
        );
      case 'pro-x-superlight-2':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-lg p-4 text-slate-800 border border-slate-200">
            <Mouse className="w-14 h-14 text-slate-800 mb-2" />
            <span className="text-xs font-bold text-slate-900">Capteur HERO 2</span>
            <span className="text-[10px] text-[#FF6000] font-bold">Sans-Fil 60 g</span>
          </div>
        );
      case 'arctis-nova-pro-wireless':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-lg p-4 text-white">
            <Headphones className="w-16 h-16 text-[#FF6000] mb-2" />
            <span className="text-xs font-bold">Hi-Res Audio + ANC</span>
            <span className="text-[10px] text-slate-400">Double batterie sans interruption</span>
          </div>
        );
      case 'titan-evo':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-lg p-4 text-slate-800 border border-slate-200">
            <Armchair className="w-16 h-16 text-slate-700 mb-2" />
            <span className="text-xs font-bold text-slate-900">Ergonomie L-ADAPT</span>
            <span className="text-[10px] text-slate-500">Mousse durcie à froid</span>
          </div>
        );
      case 'samsung-9100-pro':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-lg p-4 text-cyan-300">
            <HardDrive className="w-14 h-14 text-cyan-400 mb-2" />
            <span className="text-xs font-bold text-white">M.2 NVMe PCIe 5.0</span>
            <span className="text-[10px] text-amber-400 font-mono">14 000 Mo/s</span>
          </div>
        );
      case 'dominator-titanium-ddr5-7200':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-lg p-4 text-white">
            <Layers className="w-14 h-14 text-[#FF6000] mb-2" />
            <span className="text-xs font-bold">DDR5 7200 MHz</span>
            <span className="text-[10px] text-slate-400">Barre supérieure RGB</span>
          </div>
        );
      default:
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-lg p-4 text-slate-600">
            <Cpu className="w-12 h-12 text-slate-400 mb-2" />
            <span className="text-xs font-bold">{product.name}</span>
          </div>
        );
    }
  };

  return (
    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-200 shadow-inner">
      {getVisual()}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-white/90 backdrop-blur-sm rounded py-0.5 px-2 text-center border border-slate-200">
        <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-tight">
          Photo officielle en cours de réception
        </span>
      </div>
    </div>
  );
};

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <article className="group relative flex flex-col justify-between bg-white rounded-lg border border-slate-200 p-4 transition-all duration-200 hover:shadow-lg hover:border-[#FF6000]/60">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            {product.brand}
          </span>
          {product.badge && (
            <span className="bg-[#FFF3EB] text-[#FF6000] text-[11px] font-bold px-2 py-0.5 rounded border border-[#FF6000]/30">
              {product.badge}
            </span>
          )}
        </div>

        {/* Visuel vectoriel technique garanti affiché */}
        <ProductVisual product={product} />

        <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-[#FF6000] transition-colors leading-snug">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
          {product.shortSpecs}
        </p>

        {product.supplierNote && (
          <div className="mt-2 rounded bg-amber-50 border border-amber-200 p-1.5 text-[10px] text-amber-800">
            ℹ️ {product.supplierNote}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900">
            {product.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </span>
          <span className="text-[10px] text-slate-400 font-medium">TTC</span>
        </div>

        {/* Réassurance de livraison 72h */}
        <div className="mt-2 space-y-1 text-xs">
          <p className="text-emerald-700 font-medium flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> En stock · Prêt pour expédition
          </p>
          <p className="text-slate-700 font-semibold flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-[#FF6000]" /> Livraison sous 72h chez vous
          </p>
        </div>

        <button
          type="button"
          className="mt-3 w-full flex items-center justify-center gap-2 bg-[#FF6000] hover:bg-[#E05500] text-white py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-sm active:scale-[0.98]"
        >
          <ShoppingCart className="w-4 h-4" />
          Ajouter au panier
        </button>
      </div>
    </article>
  );
};
