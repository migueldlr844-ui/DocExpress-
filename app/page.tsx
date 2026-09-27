'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FieldConfig {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
}

interface DocumentTemplate {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  fields: FieldConfig[];
}

const DOCUMENTS: DocumentTemplate[] = [
  {
    id: 'quittance-loyer',
    title: 'Quittance de loyer',
    category: 'IMMOBILIER',
    price: 500,
    description: 'Attestation officielle de paiement intégral du loyer mensuel.',
    fields: [
      { name: 'bailleur', label: 'Nom du Bailleur / Propriétaire', placeholder: 'Ex: M. Jean Dupont' },
      { name: 'locataire', label: 'Nom du Locataire', placeholder: 'Ex: Mme Marie Curie' },
      { name: 'montant', label: 'Montant du loyer (FCFA)', placeholder: 'Ex: 75000', type: 'number' },
      { name: 'adresse', label: 'Adresse du logement', placeholder: 'Ex: Yaoundé, Quartier Bastos' },
      { name: 'periode', label: 'Période (Mois/Année)', placeholder: 'Ex: Septembre 2026' },
      { name: 'datePaiement', label: 'Date du paiement', placeholder: 'Ex: 05/09/2026' },
    ],
  },
  {
    id: 'recu-loyer',
    title: 'Reçu de paiement de loyer',
    category: 'IMMOBILIER',
    price: 500,
    description: 'Reçu justificatif de versement d’acompte ou de loyer.',
    fields: [
      { name: 'bailleur', label: 'Nom du Bailleur', placeholder: 'Ex: M. Jean Dupont' },
      { name: 'locataire', label: 'Nom du Locataire', placeholder: 'Ex: Mme Marie Curie' },
      { name: 'montant', label: 'Montant versé (FCFA)', placeholder: 'Ex: 50000', type: 'number' },
      { name: 'motif', label: 'Motif du versement', placeholder: 'Ex: Acompte loyer Septembre' },
      { name: 'datePaiement', label: 'Date', placeholder: 'Ex: 05/09/2026' },
    ],
  },
  {
    id: 'attestation-honneur',
    title: 'Attestation sur l’honneur',
    category: 'ADMINISTRATIF',
    price: 500,
    description: 'Déclaration officielle sur l’honneur pour diverses démarches.',
    fields: [
      { name: 'declarant', label: 'Nom complet du déclarant', placeholder: 'Ex: Paul Biya' },
      { name: 'adresse', label: 'Adresse de résidence', placeholder: 'Ex: Yaoundé' },
      { name: 'cni', label: 'Numéro de CNI / Passeport', placeholder: 'Ex: 123456789' },
      { name: 'declaration', label: 'Objet de la déclaration', placeholder: 'Ex: Je certifie sur l’honneur ne pas occuper d’autre emploi...' },
      { name: 'faitA', label: 'Fait à', placeholder: 'Ex: Yaoundé' },
      { name: 'date', label: 'Date', placeholder: 'Ex: 27/09/2026' },
    ],
  },
];

export default function DocExpressApp() {
  const [selectedDoc, setSelectedDoc] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'select' | 'form' | 'preview' | 'payment'>('select');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  const handleSelectDoc = (doc: DocumentTemplate) => {
    setSelectedDoc(doc);
    setFormData({});
    setStep('form');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProceedToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('preview');
  };

  const generatePDF = async () => {
    if (!documentRef.current) return;
    try {
      const canvas = await html2canvas(documentRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedDoc?.id || 'document'}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
    }
  };

  const handlePayAndDownload = async () => {
    if (!phoneNumber) {
      alert('Veuillez saisir votre numéro Mobile Money (Orange ou MTN).');
      return;
    }

    setIsProcessing(true);

    try {
      // Enregistrement dans Supabase si configuré
      if (supabaseUrl && supabaseAnonKey) {
        await supabase.from('transactions').insert([
          {
            phone_number: phoneNumber,
            document_type: selectedDoc?.id,
            amount: selectedDoc?.price,
            status: 'completed',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Erreur Supabase:', err);
    }

    // Simulation du délai de paiement Mobile Money
    setTimeout(async () => {
      setIsProcessing(false);
      alert('Paiement validé avec succès ! Votre document va se télécharger.');
      await generatePDF();
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep('select')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              📄
            </div>
            <span className="font-extrabold text-xl tracking-wider text-white">DOCEXPRESS</span>
          </div>

          {selectedDoc && (
            <button
              onClick={() => setStep('select')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              ← Retour au catalogue
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
        {/* Étape 1 : Choix du document */}
        {step === 'select' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center my-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                Vous avez les informations. Nous avons le document.
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
                Tout ça, dans un seul endroit. Sélectionnez, remplissez et téléchargez en toute sécurité.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 p-5 rounded-2xl cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                      {doc.category}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-3 group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </h2>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">{doc.description}</p>
                  </div>
                  <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-800/80">
                    <span className="font-extrabold text-blue-400 text-sm">{doc.price} FCFA</span>
                    <span className="text-xs font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-xl group-hover:bg-blue-500 transition">
                      Générer →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Étape 2 : Formulaire de saisie */}
        {step === 'form' && selectedDoc && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-xl mx-auto w-full">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-xl font-bold text-white mb-1">{selectedDoc.title}</h2>
              <p className="text-xs text-slate-400 mb-6">Remplissez les informations ci-dessous pour générer le document.</p>

              <form onSubmit={handleProceedToPreview} className="space-y-4">
                {selectedDoc.fields.map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      required
                      placeholder={f.placeholder}
                      value={formData[f.name] || ''}
                      onChange={(e) => handleInputChange(f.name, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/25"
                >
                  Voir l’aperçu du document →
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Étape 3 : Aperçu du document */}
        {step === 'preview' && selectedDoc && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Aperçu officiel</h2>
              <button
                onClick={() => setStep('form')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Modifier les saisies
              </button>
            </div>

            {/* Document imprimable / capturable */}
            <div
              ref={documentRef}
              className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl font-serif max-w-2xl mx-auto border border-slate-200 min-h-[450px] flex flex-col justify-between"
            >
              <div>
                <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                  <h1 className="text-2xl font-black uppercase tracking-wider">{selectedDoc.title}</h1>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  {selectedDoc.id === 'quittance-loyer' && (
                    <>
                      <p>
                        Je soussigné(e), <strong>{formData.bailleur || '________________'}</strong>, propriétaire du logement situé à{' '}
                        <strong>{formData.adresse || '________________'}</strong>, reconnaît avoir reçu de M./Mme{' '}
                        <strong>{formData.locataire || '________________'}</strong> la somme de{' '}
                        <strong>{formData.montant || '0'} FCFA</strong>.
                      </p>
                      <p>
                        Ce versement correspond au règlement intégral du loyer pour la période de{' '}
                        <strong>{formData.periode || '________________'}</strong>.
                      </p>
                    </>
                  )}

                  {selectedDoc.id === 'recu-loyer' && (
                    <>
                      <p>
                        Reçu de M./Mme <strong>{formData.locataire || '________________'}</strong> la somme de{' '}
                        <strong>{formData.montant || '0'} FCFA</strong>.
                      </p>
                      <p>
                        Motif du versement : <strong>{formData.motif || '________________'}</strong>.
                      </p>
                    </>
                  )}

                  {selectedDoc.id === 'attestation-honneur' && (
                    <>
                      <p>
                        Je soussigné(e), <strong>{formData.declarant || '________________'}</strong>, demeurant à{' '}
                        <strong>{formData.adresse || '________________'}</strong>, titulaire de la CNI n°{' '}
                        <strong>{formData.cni || '________________'}</strong>, atteste sur l’honneur que :
                      </p>
                      <p className="italic my-4 bg-slate-50 p-4 border-l-4 border-slate-900">
                        « {formData.declaration || '________________'} »
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-300 flex justify-between text-xs font-sans text-slate-600">
                <div>
                  <p>Fait à : {formData.faitA || 'Yaoundé'}</p>
                  <p>Le : {formData.datePaiement || formData.date || '27/09/2026'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Signature / Cachet</p>
                  <div className="h-12"></div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => setStep('payment')}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-green-500/25 text-center"
              >
                Payer {selectedDoc.price} FCFA et Télécharger
              </button>
            </div>
          </motion.div>
        )}

        {/* Étape 4 : Paiement Mobile Money */}
        {step === 'payment' && selectedDoc && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto w-full">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold text-white mb-2">Paiement Mobile Money</h2>
              <p className="text-xs text-slate-400 mb-6">
                Montant à régler : <strong className="text-blue-400">{selectedDoc.price} FCFA</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Numéro de téléphone Orange / MTN
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: 699000000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <button
                  onClick={handlePayAndDownload}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-green-500/20 disabled:opacity-50"
                >
                  {isProcessing ? 'Traitement du paiement...' : 'Valider & Télécharger PDF'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        © 2026 DOCEXPRESS — Tous droits réservés.
      </footer>
    </div>
  );
}
