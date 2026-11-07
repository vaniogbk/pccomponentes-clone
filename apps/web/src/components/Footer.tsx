import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 bg-[#1B2430] text-slate-300 text-xs">
      <div className="border-b border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-lg font-black text-white">Tarifs à confirmer</p>
            <p className="text-slate-400 mt-1">Données de livraison à renseigner</p>
          </div>
          <div>
            <p className="text-lg font-black text-white">Catalogue démo</p>
            <p className="text-slate-400 mt-1">Prix et références à valider</p>
          </div>
          <div>
            <p className="text-lg font-black text-white">Stock à confirmer</p>
            <p className="text-slate-400 mt-1">Aucune commande n’est activée</p>
          </div>
          <div>
            <p className="text-lg font-black text-white">Virement SEPA</p>
            <p className="text-slate-400 mt-1">Paiement indisponible sans coordonnées</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="bg-[#FF6000] text-white font-black text-lg px-2 py-0.5 rounded">Pc</span>
            <span className="text-white font-bold text-lg">Componentes</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs">
            Catalogue de démonstration de composants informatiques, consoles et périphériques gaming.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-wider mb-3">Nos Rayons</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:text-white">Cartes Graphiques RTX 50 & RX 9000</Link></li>
            <li><Link href="/" className="hover:text-white">Processeurs AMD Ryzen & Intel Ultra</Link></li>
            <li><Link href="/" className="hover:text-white">Consoles PS5, Xbox Series & Switch 2</Link></li>
            <li><Link href="/" className="hover:text-white">SSD M.2 Gen5 & Mémoire DDR5</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-wider mb-3">Assistance & SAV</h4>
          <ul className="space-y-2">
            <li><Link href="/contact" className="hover:text-white">Informations de contact à configurer</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-wider mb-3">Informations Légales</h4>
          <ul className="space-y-2">
            <li><Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link></li>
            <li><span className="text-slate-500">Paiement par carte bancaire (bientôt disponible)</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-slate-500">
        <p>Site de démonstration · informations de la boutique à compléter</p>
      </div>
    </footer>
  );
};
