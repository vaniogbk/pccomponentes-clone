'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Trash2, Plus, Minus, ShieldCheck, Truck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const [ordered, setOrdered] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#232B38] mb-6">Mon Panier d'achat</h1>

        {ordered ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[#232B38]">Commande confirmée avec succès !</h2>
            <p className="mt-2 text-sm text-slate-600">
              Votre matériel est en cours de préparation dans nos entrepôts. Livraison garantie sous 72h ouvrées avec suivi.
            </p>
            <Link
              href="/"
              onClick={() => { clearCart(); setOrdered(false); }}
              className="mt-6 inline-block bg-[#FF6000] hover:bg-[#E05500] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg"
            >
              Retourner à la boutique
            </Link>
          </div>
        ) : cart.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-600 text-sm mb-4">Votre panier est actuellement vide.</p>
            <Link href="/" className="inline-block bg-[#FF6000] hover:bg-[#E05500] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg">
              Découvrir nos 16 composants disponibles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map(item => (
                <div key={item.product.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between gap-4 shadow-sm">
                  <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-contain" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{item.product.name}</h3>
                    <p className="text-xs text-slate-500">{item.product.price.toFixed(2)} € / unité</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{(item.product.price * item.quantity).toFixed(2)} €</p>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-[11px] text-red-500 hover:underline flex items-center gap-1 justify-end mt-1">
                      <Trash2 className="w-3 h-3" /> Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6 h-fit shadow-sm">
              <h2 className="text-base font-bold text-[#232B38] mb-4">Récapitulatif de la commande</h2>
              <div className="space-y-2 text-xs border-b border-slate-200 pb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total articles</span>
                  <span>{totalPrice.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Frais de port (Livraison sous 72h)</span>
                  <span className="text-emerald-600 font-bold">Gratuit</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Garantie 3 ans PcComponentes</span>
                  <span className="text-emerald-600 font-bold">Incluse</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-4 mb-6">
                <span className="text-sm font-bold text-slate-900">Total TTC</span>
                <span className="text-2xl font-black text-slate-900">{totalPrice.toFixed(2)} €</span>
              </div>

              <button
                type="button"
                onClick={() => setOrdered(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#FF6000] hover:bg-[#E05500] text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Passer la commande <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
