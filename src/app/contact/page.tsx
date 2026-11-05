'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Mail, MessageSquare, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between">
      <Header />
      <main className="max-w-5xl mx-auto py-12 px-4 w-full flex-1">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6000]">Assistance PcComponentes</span>
          <h1 className="text-3xl font-black text-[#232B38] mt-1">Centre de Support & Contact SAV</h1>
          <p className="text-slate-600 text-sm mt-2">
            Une équipe de techniciens spécialisés à votre écoute pour vos commandes, garanties et questions techniques.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-[#FFF3EB] flex items-center justify-center text-[#FF6000] mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#232B38] text-sm">Support en Direct</h3>
              <p className="text-xs text-slate-500 mt-1">Assistance technique pour vos choix de composants et compatibilités.</p>
              <span className="inline-block mt-3 text-xs font-semibold text-[#FF6000]">Du Lundi au Vendredi (9h - 20h)</span>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-[#FFF3EB] flex items-center justify-center text-[#FF6000] mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#232B38] text-sm">Par E-mail</h3>
              <p className="text-xs text-slate-500 mt-1">Réponse garantie sous 24 heures ouvrées.</p>
              <a href="mailto:support@pccomponentes.com" className="inline-block mt-3 text-xs font-bold text-[#FF6000] hover:underline">
                support@pccomponentes.com
              </a>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-[#FFF3EB] flex items-center justify-center text-[#FF6000] mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#232B38] text-sm">Garantie 3 ans & Retours</h3>
              <p className="text-xs text-slate-500 mt-1">Prise en charge SAV directe et retours gratuits sous 30 jours.</p>
              <span className="inline-block mt-3 text-xs font-semibold text-slate-700">Traitement SAV sous 24h</span>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-[#232B38] mb-6">Envoyer une demande à notre équipe</h2>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-emerald-900">Message envoyé avec succès</h3>
                <p className="text-xs text-emerald-700 mt-1">
                  Un technicien traitera votre demande sous 24h ouvrées. Un e-mail récapitulatif vous a été adressé.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-xs font-bold text-[#FF6000] hover:underline"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet *</label>
                    <input required type="text" placeholder="Alexandre Martin" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#FF6000] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse e-mail *</label>
                    <input required type="email" placeholder="alexandre@example.fr" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#FF6000] focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Objet de la demande *</label>
                  <select required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#FF6000] focus:outline-none bg-white">
                    <option value="">Sélectionnez un motif</option>
                    <option value="conseil">Conseil technique avant-achat / Compatibilité</option>
                    <option value="suivi">Suivi de livraison</option>
                    <option value="sav">Garantie 3 ans & Service Après-Vente</option>
                    <option value="retour">Retour produit sous 30 jours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Votre message *</label>
                  <textarea required rows={5} placeholder="Décrivez votre question ou le problème rencontré..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#FF6000] focus:outline-none" />
                </div>

                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#FF6000] hover:bg-[#E05500] px-6 py-2.5 text-sm font-bold text-white transition-colors">
                  <Send className="w-4 h-4" /> Envoyer la demande
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
