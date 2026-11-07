import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LEGAL_NOTICE, SITE_COOKIES } from '@pcc/shared/legal';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: "Informations légales sur l'éditeur, l'hébergeur, les données personnelles et les cookies du site.",
};

/** Affiche la valeur fournie par l'éditeur, ou un repère visible tant qu'elle manque. */
function Value({ children }: { children: string | null }) {
  if (children) return <>{children}</>;
  return (
    <mark className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">[[à compléter]]</mark>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="font-semibold text-slate-900">{label}</dt>
      <dd className="mt-0.5">
        <Value>{value}</Value>
      </dd>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
      <h2 id={id} className="mb-3 text-base font-bold text-[#232B38]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function MentionsLegalesPage() {
  const { publisher, host, privacy, consumerMediator } = LEGAL_NOTICE;

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#F4F5F7]">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-12">
          <h1 className="text-3xl font-black text-[#232B38]">Mentions légales</h1>
          <p className="mt-2 text-sm text-slate-500">
            Informations prévues par la loi pour la confiance dans l’économie numérique (LCEN) et le Code de la
            consommation.
          </p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
            <Section id="editeur" title="1. Éditeur du site">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Dénomination sociale" value={publisher.companyName} />
                <Field label="Forme juridique" value={publisher.legalForm} />
                <Field label="Capital social" value={publisher.shareCapital} />
                <Field label="Siège social" value={publisher.address} />
                <Field label="Immatriculation (registre et numéro)" value={publisher.registration} />
                <Field label="N° de TVA intracommunautaire" value={publisher.vatNumber} />
                <Field label="Téléphone" value={publisher.phone} />
                <Field label="E-mail" value={publisher.email} />
              </dl>
            </Section>

            <Section id="directeur" title="2. Directeur de la publication">
              <p>
                <Value>{LEGAL_NOTICE.publicationDirector}</Value>
              </p>
            </Section>

            <Section id="hebergeur" title="3. Hébergement">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Hébergeur" value={host.name} />
                <Field label="Adresse" value={host.address} />
                <Field label="Téléphone" value={host.phone} />
              </dl>
            </Section>

            <Section id="propriete" title="4. Propriété intellectuelle">
              <p>
                Les marques, logos, textes, photographies et éléments graphiques présentés sur ce site appartiennent à
                leurs titulaires respectifs. Toute reproduction ou représentation, totale ou partielle, sans
                autorisation préalable est interdite.
              </p>
            </Section>

            <Section id="donnees" title="5. Données personnelles">
              <dl className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Responsable du traitement" value={privacy.controller} />
                <Field label="Contact pour exercer vos droits" value={privacy.contactEmail} />
              </dl>
              <p>
                Les données saisies lors de la création d’un compte (nom, prénom, adresse e-mail, téléphone) servent à
                gérer ce compte et, le cas échéant, vos commandes. Conformément au Règlement général sur la protection
                des données (RGPD), vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation,
                d’opposition et de portabilité de vos données. Vous pouvez également introduire une réclamation auprès
                de la{' '}
                <a
                  href="https://www.cnil.fr/fr/plaintes"
                  className="font-semibold text-[#FF6000] hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  CNIL
                </a>
                .
              </p>
            </Section>

            <Section id="cookies" title="6. Cookies">
              <p className="mb-3">
                Ce site n’utilise que des cookies strictement nécessaires à son fonctionnement, exemptés de consentement.
                Aucun cookie publicitaire ni de mesure d’audience n’est déposé.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-900">
                      <th scope="col" className="py-2 pr-4 font-semibold">Cookie</th>
                      <th scope="col" className="py-2 pr-4 font-semibold">Finalité</th>
                      <th scope="col" className="py-2 font-semibold">Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SITE_COOKIES.map((cookie) => (
                      <tr key={cookie.name} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono">{cookie.name}</td>
                        <td className="py-2 pr-4">{cookie.purpose}</td>
                        <td className="py-2">{cookie.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="mediation" title="7. Médiation de la consommation">
              <p className="mb-4">
                Conformément à l’article L612-1 du Code de la consommation, le consommateur peut recourir gratuitement
                au médiateur de la consommation désigné ci-dessous, après une réclamation écrite restée sans réponse
                satisfaisante auprès du service client.
              </p>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Médiateur" value={consumerMediator.name} />
                <Field label="Adresse" value={consumerMediator.address} />
                <Field label="Site internet" value={consumerMediator.website} />
              </dl>
            </Section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
