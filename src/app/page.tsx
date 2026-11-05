'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { PCCOMPONENTES_CATALOG } from '@/data/products';
import { ShieldCheck, Truck, RotateCcw, Headphones, Flame } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  const categories = [
    'Tous',
    'Cartes Graphiques',
    'Processeurs',
    'Consoles',
    'Périphériques Gaming',
    'Stockage & Mémoire'
  ];

  const filteredProducts = PCCOMPONENTES_CATALOG.filter(product => {
    return selectedCategory === 'Tous' || product.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        <section className="bg-gradient-to-r from-[#232B38] to-[#111827] text-white rounded-2xl p-8 mb-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-[#FF6000] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              <Flame className="w-4 h-4" /> Catalogue PcComponentes France
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Composants PC & Gaming Haute Performance
            </h1>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed">
              Livraison garantie sous 72h, garantie légale de 3 ans sur tous les composants neufs et retours gratuits pendant 30 jours.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
            <Truck className="w-6 h-6 text-[#FF6000]" />
            <div>
              <p className="text-xs font-bold text-slate-900">Livraison sous 72h</p>
              <p className="text-[11px] text-slate-500">Expédié avec suivi direct</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-[#FF6000]" />
            <div>
              <p className="text-xs font-bold text-slate-900">Garantie 3 ans</p>
              <p className="text-[11px] text-slate-500">Tranquillité absolue</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
            <RotateCcw className="w-6 h-6 text-[#FF6000]" />
            <div>
              <p className="text-xs font-bold text-slate-900">30 jours de retour</p>
              <p className="text-[11px] text-slate-500">Sans justification</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
            <Headphones className="w-6 h-6 text-[#FF6000]" />
            <div>
              <p className="text-xs font-bold text-slate-900">Support Expert</p>
              <p className="text-[11px] text-slate-500">Conseillers spécialisés</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#FF6000] text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#232B38]">
            {selectedCategory === 'Tous' ? 'Toutes nos références disponibles' : selectedCategory}
            <span className="text-xs text-slate-500 font-normal ml-2">({filteredProducts.length} articles)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
