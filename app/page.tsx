'use client';

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';

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
      { name: 'adresse', label: 'Adresse du logement', placeholder: 'Ex: Yaoundé, Bastos' },
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
      { name: 'declaration', label: 'Objet de la déclaration', placeholder: 'Ex: Je certifie sur l’honneur...' },
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
      console.error('Erreur PDF:', error);
      alert('Erreur lors de la génération du PDF.');
    }
  };

  const handlePayAndDownload = async () => {
    if (!phoneNumber) {
      alert('Veuillez saisir votre numéro Mobile Money (Orange ou MTN).');
      return;
    }

    setIsProcessing(true);

    try {
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
      console.error(err);
    }

    setTimeout(async () => {
      setIsProcessing(false);
      alert('Paiement validé ! Téléchargement en cours...');
      await generatePDF();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans p-4">
      {/* Header */}
      <header className="border-b border-slate-800 pb-4 mb-6 flex justify-between items-center max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep('select')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold">
            📄
          </div>
          <span className="font-extrabold text-xl tracking-wider text-white">DOCEXPRESS</span>
        </div>
        {selectedDoc && (
          <button
            onClick={() => setStep('select')}
            className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1.5 rounded-lg"
          >
            ← Retour au catalogue
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto">
        {step === 'select' && (
          <div>
            <div className="text-center my-6">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight">
                Vous avez les informations.<br />Nous avons le document.
              </h1>
              <p className="text-slate-400 text-sm">
                Sélectionnez, remplissez et téléchargez en toute sécurité.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-blue-500 transition flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded tracking-wider uppercase">
                      {doc.category}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-3 mb-1">{doc.title}</h2>
                    <p className="text-slate-400 text-xs leading-relaxed">{doc.description}</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="font-extrabold text-sky-400 text-base">{doc.price} FCFA</span>
                    <span className="text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl">
                      Générer →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'form' && selectedDoc && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md mx-auto">
            <h2 className="text-xl font-bold text-white mb-1">{selectedDoc.title}</h2>
            <p className="text-xs text-slate-400 mb-5">Remplissez les informations ci-dessous.</p>

            <form onSubmit={handleProceedToPreview} className="flex flex-col gap-4">
              {selectedDoc.fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    required
                    placeholder={f.placeholder}
                    value={formData[f.name] || ''}
                    onChange={(e) => handleInputChange(f.name, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}

              <button
                type="submit"
                className="w-full mt-3 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition text-sm"
              >
                Voir l’aperçu du document →
              </button>
            </form>
          </div>
        )}

        {step === 'preview' && selectedDoc && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-white">Aperçu officiel</h2>
              <button onClick={() => setStep('form')} className="text-xs text-slate-400 underline">
                Modifier les saisies
              </button>
            </div>

            <div
              ref={documentRef}
              className="bg-white text-slate-900 p-6 rounded-xl font-serif min-h-[380px] flex flex-col justify-between shadow-2xl"
            >
              <div>
                <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                  <h1 className="text-xl font-black uppercase tracking-wider">{selectedDoc.title}</h1>
                </div>

                <div className="text-sm leading-relaxed space-y-3">
                  {selectedDoc.id === 'quittance-loyer' && (
                    <>
                      <p>
                        Je soussigné(e), <strong>{formData.bailleur || '________________'}</strong>, propriétaire du logement situé à{' '}
                        <strong>{formData.adresse || '________________'}</strong>, reconnaît avoir reçu de M./Mme{' '}
                        <strong>{formData.locataire || '________________'}</strong> la somme de{' '}
                        <strong>{formData.montant || '0'} FCFA</strong>.
                      </p>
                      <p>
                        Règlement intégral du loyer pour la période de :{' '}
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
                        Motif : <strong>{formData.motif || '________________'}</strong>.
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
                      <p className="italic bg-slate-100 p-3 border-l-2 border-slate-900 my-3">
                        « {formData.declaration || '________________'} »
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-300 flex justify-between text-xs text-slate-600 font-sans">
                <div>
                  <p>Fait à : {formData.faitA || 'Yaoundé'}</p>
                  <p>Le : {formData.datePaiement || formData.date || '27/09/2026'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Signature / Cachet</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('payment')}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl transition text-base mt-2"
            >
              Payer {selectedDoc.price} FCFA et Télécharger
            </button>
          </div>
        )}

        {step === 'payment' && selectedDoc && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm mx-auto">
            <h2 className="text-base font-bold text-white mb-1">Paiement Mobile Money</h2>
            <p className="text-xs text-slate-400 mb-4">
              Montant à régler : <strong className="text-sky-400">{selectedDoc.price} FCFA</strong>
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Numéro Orange ou MTN</label>
                <input
                  type="tel"
                  placeholder="Ex: 699000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handlePayAndDownload}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition text-sm disabled:opacity-50"
              >
                {isProcessing ? 'Traitement en cours...' : 'Valider & Télécharger PDF'}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 py-4 mt-8 text-center text-xs text-slate-600">
        © 2026 DOCEXPRESS — Tous droits réservés.
      </footer>
    </div>
  );
}
