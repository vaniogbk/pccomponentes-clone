import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PcComponentes France | Boutique High-Tech, Composants PC & Gaming',
  description: 'Achetez vos cartes graphiques, processeurs, consoles et composants PC au meilleur prix avec PcComponentes. Livraison sous 72h et garantie légale 3 ans.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
