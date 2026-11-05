import React from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Heart, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="bg-[#232B38] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Truck className="w-3.5 h-3.5 text-[#FF6000]" /> Livraison sous 72h
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF6000]" /> Garantie 3 ans PcComponentes
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-slate-300 font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-[#FF6000]" /> Retours gratuits sous 30 jours
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <Link href="/contact" className="hover:text-white transition-colors">Centre d'aide & SAV</Link>
            <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
          <span className="bg-[#FF6000] text-white font-black text-xl px-2 py-0.5 rounded tracking-tight">Pc</span>
          <span className="text-[#232B38] font-bold text-xl tracking-tight">Componentes</span>
        </Link>

        <div className="flex-1 max-w-2xl relative">
          <div className="flex items-center rounded-lg border border-slate-300 overflow-hidden focus-within:border-[#FF6000] focus-within:ring-1 focus-within:ring-[#FF6000]">
            <input
              type="text"
              placeholder="Que cherchez-vous ? (ex: RTX 5090, Ryzen 7 9800X3D...)"
              className="w-full px-4 py-2.5 text-sm text-slate-800 focus:outline-none bg-slate-50 focus:bg-white"
            />
            <button
              type="button"
              className="bg-[#FF6000] hover:bg-[#E05500] text-white px-5 py-2.5 transition-colors flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/contact" className="flex items-center gap-2 text-slate-700 hover:text-[#FF6000] transition-colors">
            <User className="w-5 h-5" />
            <div className="hidden xl:block text-left text-xs leading-tight">
              <span className="text-slate-400">Assistance</span>
              <p className="font-semibold text-slate-800">Support Client</p>
            </div>
          </Link>

          <Link href="/mentions-legales" className="text-slate-700 hover:text-[#FF6000] p-1.5 transition-colors">
            <Heart className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2.5 bg-[#FF6000] text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-sm cursor-pointer hover:bg-[#E05500]">
            <ShoppingCart className="w-4 h-4" />
            <span>Mon Panier</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-bold">0</span>
          </div>
        </div>
      </div>
    </header>
  );
};
