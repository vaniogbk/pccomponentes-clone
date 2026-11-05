import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 bg-[#1B2430] text-slate-300 text-xs">
      <div className="border-b border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-lg font-black text-white">Livraison sous 72h</p>
            <p className="text-slate-400 mt-1">Expédition soignée avec suivi</p>
          </div>
          <div>
            <p className="text-lg font-black text-white">Garantie 3 ans</p>
            <p className="text-slate-400 mt-1">Sur tous vos composants neufs</p>
          </div>
          <div>
            <p className="text-lg font-black text-white">Retours 30 jours</p>
            <p className="text-slate-400 mt-1">Retours simples et gratuits</p>
          </div>
          <div>
            <p className="text-lg font-black text-white">Support Technique</p>
            <p className="text-slate-400 mt-1">Conseillers tech spécialisés</p>
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
            Spécialiste de la vente en ligne de composants informatiques, ordinateurs de bureau sur mesure, périphériques gaming et électronique grand public.
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
            <li><Link href="/contact" className="hover:text-white">Formulaire de contact & SAV</Link></li>
            <li><Link href="/contact" className="hover:text-white">Rétractation sous 30 jours</Link></li>
            <li><Link href="/contact" className="hover:text-white">Garantie 3 ans PcComponentes</Link></li>
            <li><a href="mailto:support@pccomponentes.com" className="text-[#FF6000] hover:underline">support@pccomponentes.com</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-wider mb-3">Informations Légales</h4>
          <ul className="space-y-2">
            <li><Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-white">Conditions Générales de Vente (CGV)</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-white">Protection des données & RGPD</Link></li>
            <li><span className="text-slate-500">Paiement 100% sécurisé SSL / 3D-Secure</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-slate-500">
        <p>© 2026 PcComponentes (PC COMPONENTES Y MULTIMEDIA S.L.U. - CIF ESB73347494). Tous droits réservés.</p>
      </div>
    </footer>
  );
};
