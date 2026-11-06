import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between">
      <Header />
      <main className="max-w-3xl mx-auto py-16 px-4 w-full flex-1">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-wider text-[#FF6000]">
            Configuration de la boutique
          </p>
          <h1 className="text-3xl font-black text-[#232B38] mt-2">
            Contact
          </h1>
          <p className="text-slate-600 mt-4 leading-relaxed">
            Les coordonnées du service client n’ont pas encore été fournies.
            Aucun formulaire n’enregistre ni n’envoie de données personnelles.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
