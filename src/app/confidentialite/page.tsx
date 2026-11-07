import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between">
      <Header />
      <main className="max-w-4xl mx-auto py-12 px-4 w-full flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12 text-sm text-slate-700 leading-relaxed">
          <h1 className="text-3xl font-black text-[#232B38] mb-2">Politique de Protection des Données (RGPD)</h1>
          <p className="text-xs text-slate-500 mb-8 border-b pb-4">Conformité au Règlement (UE) 2016/679 du Parlement européen.</p>

          <section className="space-y-4">
            <h2 className="text-base font-bold text-[#232B38]">1. Responsable du Traitement</h2>
            <p>
              Le responsable du traitement des données personnelles est la société <strong>PC COMPONENTES Y MULTIMEDIA S.L.U.</strong>, CIF ESB73347494, sise Polígono Industrial Las Salinas, 30840 Alhama de Murcia (Espagne). Contact du Délégué à la Protection des Données (DPO) : <strong>lopd@pccomponentes.com</strong>.
            </p>

            <h2 className="text-base font-bold text-[#232B38]">2. Finalités et Base Légale</h2>
            <p>
              Vos données sont recueillies exclusivement pour : le traitement de vos commandes et livraisons sous 72h, l'exécution des garanties de 3 ans et la gestion de notre relation client.
            </p>

            <h2 className="text-base font-bold text-[#232B38]">3. Vos Droits</h2>
            <p>
              Vous disposez à tout moment d'un droit d'accès, de rectification, de portabilité, d'opposition et d'effacement de vos données personnelles par simple email adressé à <strong>lopd@pccomponentes.com</strong> ou <strong>support@pccomponentes.com</strong>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
