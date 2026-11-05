import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Building, ShieldCheck, Mail, FileText, Scale } from 'lucide-react';

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between">
      <Header />
      <main className="max-w-4xl mx-auto py-12 px-4 w-full flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12">
          <div className="border-b border-slate-200 pb-6 mb-8">
            <h1 className="text-3xl font-black text-[#232B38]">Mentions Légales & Réglementation</h1>
            <p className="text-sm text-slate-500 mt-2">
              Conformité stricte aux directives européennes et à la législation française du commerce électronique.
            </p>
          </div>

          <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
            <section className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h2 className="text-base font-bold text-[#232B38] flex items-center gap-2 mb-4">
                <Building className="w-5 h-5 text-[#FF6000]" /> 1. Informations sur la Société Éditrice
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-slate-900">Dénomination légale :</p>
                  <p>PC COMPONENTES Y MULTIMEDIA S.L.U.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Numéro d'identification fiscale (CIF / TVA intra) :</p>
                  <p>ESB73347494</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Siège social :</p>
                  <p>Avenida Europa, Parcelas 2-5 y 2-6</p>
                  <p>Polígono Industrial Las Salinas, 30840 Alhama de Murcia, Espagne</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Registre du Commerce :</p>
                  <p>Inscrite au Registre du Commerce de Murcie, Tome 2168, Folio 14, Feuille MU-49934</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base font-bold text-[#232B38] flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-[#FF6000]" /> 2. Coordonnées & Support
              </h2>
              <p>Email du service client : <a href="mailto:support@pccomponentes.com" className="text-[#FF6000] font-semibold">support@pccomponentes.com</a></p>
              <p>Délégué à la Protection des Données (DPO) : <a href="mailto:lopd@pccomponentes.com" className="text-[#FF6000] font-semibold">lopd@pccomponentes.com</a></p>
            </section>

            <section>
              <h2 className="text-base font-bold text-[#232B38] flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-[#FF6000]" /> 3. Engagements & Garanties
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Garantie légale de conformité de 3 ans sur tous les articles neufs vendus.</li>
                <li>Droit de rétractation étendu à 30 jours à compter de la réception du colis.</li>
                <li>Prise en charge SAV et expéditions suivies sous 24/48h ouvrées.</li>
              </ul>
            </section>

            <section className="border-t border-slate-200 pt-6">
              <h2 className="text-base font-bold text-[#232B38] flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-[#FF6000]" /> 4. Règlement des Litiges en Ligne
              </h2>
              <p>
                Plateforme de règlement en ligne des litiges de l'Union Européenne :
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#FF6000] hover:underline ml-1">
                  https://ec.europa.eu/consumers/odr
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
