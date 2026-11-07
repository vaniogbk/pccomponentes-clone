import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between">
      <Header />
      <main className="max-w-4xl mx-auto py-12 px-4 w-full flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12 text-sm text-slate-700 leading-relaxed">
          <h1 className="text-3xl font-black text-[#232B38] mb-2">Conditions Générales de Vente (CGV)</h1>
          <p className="text-xs text-slate-500 mb-8 border-b pb-4">Dernière mise à jour : 1er novembre 2026 - PC COMPONENTES Y MULTIMEDIA S.L.U.</p>

          <section className="space-y-4">
            <h2 className="text-base font-bold text-[#232B38]">Article 1 - Identification de la Société</h2>
            <p>
              Le présent service est édité par la société <strong>PC COMPONENTES Y MULTIMEDIA S.L.U.</strong>, au capital social enregistré en Espagne sous le CIF ESB73347494, dont le siège social est situé Avenida Europa, Parcelas 2-5 y 2-6, Polígono Industrial Las Salinas, 30840 Alhama de Murcia (Espagne), inscrite au Registre du Commerce de Murcie, Tome 2168, Folio 14, Feuille MU-49934. Contact support : support@pccomponentes.com.
            </p>

            <h2 className="text-base font-bold text-[#232B38]">Article 2 - Prix et Commandes</h2>
            <p>
              Tous les prix indiqués sur notre catalogue sont libellés en euros (€) et s'entendent toutes taxes comprises (TTC), incluant la TVA légale applicable en France métropolitaine. Les fiches produits comportant une mention constructeur ou une déclinaison partenaire sont honorées selon les spécifications exactes indiquées lors de la commande.
            </p>

            <h2 className="text-base font-bold text-[#232B38]">Article 3 - Expédition et Délais de Livraison (72h)</h2>
            <p>
              Les produits en stock sont préparés et remis aux transporteurs agréés pour une <strong>livraison sous 72 heures ouvrées</strong> à l'adresse renseignée par l'acheteur en France métropolitaine. Un numéro de suivi interactif est immédiatement transmis lors de l'expédition du colis.
            </p>

            <h2 className="text-base font-bold text-[#232B38]">Article 4 - Droit de Rétractation sous 30 Jours</h2>
            <p>
              PcComponentes étend le délai légal de rétractation à <strong>30 jours calendaires</strong> à compter de la réception de la commande. Le client peut retourner tout article intact dans son emballage d'origine sans pénalité avec étiquette de retour prépayée fournie par notre service client.
            </p>

            <h2 className="text-base font-bold text-[#232B38]">Article 5 - Garantie Légale Étendue à 3 Ans</h2>
            <p>
              Tous les matériels neufs vendus bénéficient d'une <strong>garantie légale de conformité de 3 ans</strong> pièces et main-d'œuvre. En cas de dysfonctionnement avéré, PcComponentes assure la réparation, le remplacement ou le remboursement sous 24 à 48 heures ouvrées après diagnostic SAV.
            </p>

            <h2 className="text-base font-bold text-[#232B38]">Article 6 - Droit Applicable et Litiges</h2>
            <p>
              Les présentes conditions sont soumises à la législation européenne et aux dispositions impératives du Code de la consommation français. En cas de litige non résolu à l'amiable, le client peut recourir à la plateforme européenne de Règlement en Ligne des Litiges (RLL) : https://ec.europa.eu/consumers/odr.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
