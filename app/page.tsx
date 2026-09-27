'use client';

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- TYPES ---
interface FieldConfig {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
}

interface DocumentTemplate {
  id: string;
  code: string;
  title: string;
  category: 'EMPLOI' | 'BUSINESS' | 'LOCATION';
  price: number;
  description: string;
  fields: FieldConfig[];
}

// --- CATALOGUE DES DOCUMENTS ---
const DOCUMENTS: DocumentTemplate[] = [
  {
    id: 'quittance-loyer',
    code: '01',
    title: 'QUITTANCE DE LOYER',
    category: 'LOCATION',
    price: 500,
    description: 'Attestation officielle de paiement intégral du loyer mensuel conforme aux usages locaux.',
    fields: [
      { name: 'bailleur', label: 'Nom complet du Bailleur / Propriétaire', placeholder: 'Ex: M. Nkoua Joseph' },
      { name: 'locataire', label: 'Nom du Locataire', placeholder: 'Ex: Mme Ngo Ndack' },
      { name: 'montant', label: 'Montant du loyer (FCFA)', placeholder: 'Ex: 75000', type: 'number' },
      { name: 'adresse', label: 'Quartier & Ville du logement', placeholder: 'Ex: Yaoundé, Bastos' },
      { name: 'periode', label: 'Période (Mois / Année)', placeholder: 'Ex: Octobre 2026' },
      { name: 'datePaiement', label: 'Date du versement', placeholder: 'Ex: 05/10/2026' },
    ],
  },
  {
    id: 'recu-loyer',
    code: '02',
    title: 'REÇU DE VERSEMENT',
    category: 'LOCATION',
    price: 500,
    description: 'Reçu justificatif de versement d’acompte, d’avance ou de loyer.',
    fields: [
      { name: 'bailleur', label: 'Nom du Bailleur / Receptrice', placeholder: 'Ex: M. Nkoua Joseph' },
      { name: 'locataire', label: 'Nom du Payeur', placeholder: 'Ex: Mme Ngo Ndack' },
      { name: 'montant', label: 'Montant versé (FCFA)', placeholder: 'Ex: 50000', type: 'number' },
      { name: 'motif', label: 'Motif du versement', placeholder: 'Ex: Avance loyer 2 mois' },
      { name: 'datePaiement', label: 'Date de la transaction', placeholder: 'Ex: 05/10/2026' },
    ],
  },
  {
    id: 'attestation-honneur',
    code: '03',
    title: 'ATTESTATION SUR L’HONNEUR',
    category: 'EMPLOI',
    price: 500,
    description: 'Déclaration officielle sur l’honneur pour démarches administratives et dossiers.',
    fields: [
      { name: 'declarant', label: 'Nom complet du déclarant', placeholder: 'Ex: Atangana Désiré' },
      { name: 'adresse', label: 'Ville & Quartier de résidence', placeholder: 'Ex: Yaoundé, Minkan' },
      { name: 'cni', label: 'Numéro de CNI / Passeport', placeholder: 'Ex: 102938475' },
      { name: 'declaration', label: 'Objet de la déclaration', placeholder: 'Ex: Je certifie sur l’honneur ne pas occuper un autre emploi...' },
      { name: 'faitA', label: 'Fait à', placeholder: 'Ex: Yaoundé' },
      { name: 'date', label: 'Date', placeholder: 'Ex: 27/09/2026' },
    ],
  },
  {
    id: 'facture-proforma',
    code: '04',
    title: 'FACTURE PROFORMA',
    category: 'BUSINESS',
    price: 1000,
    description: 'Document commercial chiffré pour devis, prestations et prestations de services.',
    fields: [
      { name: 'entreprise', label: 'Nom de votre Structure / Ets', placeholder: 'Ex: Spirit Tech Agency' },
      { name: 'client', label: 'Nom du Client / Entreprise', placeholder: 'Ex: Groupe CADYS' },
      { name: 'service', label: 'Description de la prestation', placeholder: 'Ex: Conception visuelle et supports marketing' },
      { name: 'montant', label: 'Montant Total HT (FCFA)', placeholder: 'Ex: 250000', type: 'number' },
      { name: 'date', label: 'Date d’émission', placeholder: 'Ex: 27/09/2026' },
    ],
  },
];

const WORDS = ['CV.', 'FACTURE.', 'CONTRAT.', 'REÇU.'];

export default function DocExpressApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [wordIndex, setWordIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'accueil' | 'documents' | 'commandes' | 'profil'>('accueil');
  const [selectedDoc, setSelectedDoc] = useState<DocumentTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'TOUS' | 'EMPLOI' | 'BUSINESS' | 'LOCATION'>('TOUS');
  const [step, setStep] = useState<'form' | 'preview' | 'payment'>('form');
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [phoneNumber, setPhoneNumber] = useState('');
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('docexpress_visited');
    if (hasVisited) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('docexpress_visited', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDoc = (doc: DocumentTemplate) => {
    setSelectedDoc(doc);
    setFormData({});
    setStep('form');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      pdf.save(`${selectedDoc?.id || 'document'}_DocExpress.pdf`);
    } catch (error) {
      console.error('Erreur PDF:', error);
      alert('Une erreur est survenue lors de la génération.');
    }
  };

  const handlePayAndDownload = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      alert('Veuillez entrer un numéro Mobile Money valide.');
      return;
    }

    setIsProcessing(true);
    setGenerationStep(1);

    setTimeout(() => { setGenerationStep(2); }, 1200);

    setTimeout(async () => {
      setGenerationStep(3);
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
      } catch (e) {
        console.error(e);
      }

      await generatePDF();
      setIsProcessing(false);
      setGenerationStep(0);
    }, 2600);
  };

  const filteredDocs = selectedCategory === 'TOUS' 
    ? DOCUMENTS 
    : DOCUMENTS.filter(d => d.category === selectedCategory);

  return (
    <div className="bg-[#020617] text-[#f8fafc] min-h-screen font-sans w-full pb-24 md:pb-12 border-t-4 border-[#2563eb]">
      
      {/* 1. SPLASHSCREEN */}
      {showSplash && (
        <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center p-6 text-white">
          <div className="text-center space-y-4 max-w-sm w-full">
            <h1 className="text-3xl font-black tracking-[0.2em]">
              DOCEXPRESS
            </h1>
            <div className="w-full h-[2px] bg-[#1e293b] relative overflow-hidden my-4">
              <div className="absolute top-0 left-0 h-full w-full bg-[#2563eb] animate-[printLine_1.5s_ease-in-out_infinite]"></div>
            </div>
            <div className="h-6 flex items-center justify-center font-mono text-xs text-[#94a3b8] tracking-widest uppercase">
              <span>CONTRAT • FACTURE • CV • QUITTANCE</span>
            </div>
            <p className="text-xs text-[#cbd5e1] font-light">
              Vos documents. Votre activité. En quelques minutes.
            </p>
            <button
              onClick={() => setShowSplash(false)}
              className="mt-6 text-xs font-bold text-[#2563eb] tracking-wider uppercase border-b border-[#2563eb] pb-1"
            >
              COMMENCER →
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="max-w-3xl mx-auto px-6 py-6 border-b border-[#1e293b] flex justify-between items-center bg-[#020617]">
        <div 
          className="cursor-pointer"
          onClick={() => { setSelectedDoc(null); setActiveTab('accueil'); }}
        >
          <span className="text-xl font-black tracking-[0.15em] text-white">
            DOCEXPRESS
          </span>
          <span className="text-[10px] text-[#38bdf8] block font-mono tracking-widest">
            CAMEROUN
          </span>
        </div>

        <div className="hidden md:flex gap-8 text-xs font-semibold tracking-wider text-[#94a3b8]">
          <button onClick={() => { setSelectedDoc(null); setActiveTab('accueil'); }} className={activeTab === 'accueil' ? 'text-white' : 'hover:text-white'}>ACCUEIL</button>
          <button onClick={() => { setSelectedDoc(null); setActiveTab('documents'); }} className={activeTab === 'documents' ? 'text-white' : 'hover:text-white'}>CATALOGUE</button>
          <button onClick={() => setActiveTab('commandes')} className={activeTab === 'commandes' ? 'text-white' : 'hover:text-white'}>HISTORIQUE</button>
        </div>
      </header>

      {/* CONTENU */}
      <main className="max-w-3xl mx-auto px-6 pt-6">
        
        {!selectedDoc && (
          <div>
            {/* TEXTE DYNAMIQUE */}
            <section className="py-6 border-b border-[#1e293b]">
              <p className="text-xs font-mono text-[#38bdf8] mb-2 uppercase tracking-wider">
                // Service de génération conforme
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                Vous avez les informations. <br />
                Nous avons le{' '}
                <span className="inline-block text-[#2563eb] underline underline-offset-8 transition-all duration-300">
                  {WORDS[wordIndex]}
                </span>
              </h2>
              <p className="text-xs text-[#cbd5e1] mt-3 font-light leading-relaxed">
                Éditez des documents officiels pré-structurés selon les normes locales. Paiement instantané via Mobile Money.
              </p>
            </section>

            {/* SELECTION PAR CATÉGORIES */}
            <section className="py-6 border-b border-[#1e293b]">
              <p className="text-xs font-semibold text-white mb-1">Bonjour 👋</p>
              <h3 className="text-base font-bold text-[#f8fafc] mb-4">Quel document vous faut-il aujourd’hui ?</h3>

              <div className="flex gap-2 overflow-x-auto pb-2 font-mono text-[11px]">
                {(['TOUS', 'EMPLOI', 'BUSINESS', 'LOCATION'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 uppercase tracking-wider border transition-all ${
                      selectedCategory === cat 
                        ? 'bg-white text-[#020617] font-bold border-white' 
                        : 'bg-[#0f172a] text-[#94a3b8] border-[#1e293b]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* LISTE EDITORIALE SANS CARTES (CORRIGÉE FLEXBOX) */}
            <section className="py-4">
              <div className="divide-y divide-[#1e293b]">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className="group py-5 flex flex-col gap-2 cursor-pointer hover:bg-[#0f172a]/60 px-2 transition-colors"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-bold text-[#38bdf8]">{doc.code} —</span>
                      <h4 className="text-sm font-bold tracking-wide text-white group-hover:text-[#2563eb] transition-colors">
                        {doc.title}
                      </h4>
                    </div>

                    <p className="text-xs text-[#94a3b8] font-light pl-6">
                      {doc.description}
                    </p>

                    <div className="pl-6 pt-1 flex items-center justify-between text-xs">
                      <span className="font-mono text-[#cbd5e1] font-semibold">{doc.price} FCFA</span>
                      <span className="font-bold text-[#2563eb] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Remplir <span className="text-sm">→</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ÉDITION DOCUMENT */}
        {selectedDoc && (
          <div className="py-4">
            <button
              onClick={() => setSelectedDoc(null)}
              className="text-xs font-mono text-[#94a3b8] hover:text-white mb-6 block"
            >
              ← RETOUR AUX DOCUMENTS
            </button>

            {step === 'form' && (
              <div className="max-w-lg mx-auto space-y-6">
                <div>
                  <span className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-widest">// ÉTAPE 1 SUR 2</span>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedDoc.title}</h3>
                </div>

                <form 
                  onSubmit={(e) => { e.preventDefault(); setStep('preview'); }} 
                  className="space-y-4"
                >
                  {selectedDoc.fields.map((f) => (
                    <div key={f.name} className="space-y-1">
                      <label className="block text-xs font-mono text-[#cbd5e1] uppercase">{f.label}</label>
                      <input
                        type={f.type || 'text'}
                        required
                        placeholder={f.placeholder}
                        value={formData[f.name] || ''}
                        onChange={(e) => handleInputChange(f.name, e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#1e293b] focus:border-[#2563eb] p-3 text-xs text-white outline-none"
                      />
                    </div>
                  ))}

                  <button
                    type="submit"
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3 text-xs uppercase tracking-wider transition-colors mt-6"
                  >
                    Générer l’aperçu conforme →
                  </button>
                </form>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-white">Vérification de l'Aperçu</h3>
                  <button 
                    onClick={() => setStep('form')}
                    className="text-xs text-[#94a3b8] underline hover:text-white"
                  >
                    Modifier
                  </button>
                </div>

                {/* VISUEL PDF */}
                <div
                  ref={documentRef}
                  className="bg-white text-black p-6 shadow-2xl font-serif text-xs max-w-xl mx-auto space-y-4 border-t-4 border-[#020617]"
                >
                  <div className="text-center border-b pb-3 border-black">
                    <h2 className="text-base font-extrabold uppercase tracking-widest">{selectedDoc.title}</h2>
                    <p className="text-[9px] font-sans tracking-widest text-gray-500 uppercase mt-0.5">République du Cameroun — Document officiel</p>
                  </div>

                  <div className="leading-relaxed space-y-3 text-gray-900">
                    {selectedDoc.id === 'quittance-loyer' && (
                      <>
                        <p>
                          Je soussigné(e), <strong>{formData.bailleur || '________________'}</strong>, propriétaire du logement situé à <strong>{formData.adresse || '________________'}</strong>, atteste avoir reçu de M./Mme <strong>{formData.locataire || '________________'}</strong> la somme de <strong>{formData.montant || '0'} FCFA</strong>.
                        </p>
                        <p>
                          Ce versement constitue le règlement intégral du loyer pour la période : <strong>{formData.periode || '________________'}</strong>.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="pt-6 flex justify-between items-end border-t border-gray-200 text-[10px] font-sans">
                    <div>
                      <p>Fait à : {formData.faitA || 'Yaoundé'}</p>
                      <p>Le : {formData.datePaiement || formData.date || '27/09/2026'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Signature / Cachet</p>
                      <div className="h-8 w-20 mt-1 border-dashed border border-gray-300"></div>
                    </div>
                  </div>
                </div>

                {generationStep > 0 ? (
                  <div className="bg-[#0f172a] border border-[#2563eb] p-4 text-center space-y-3 max-w-sm mx-auto">
                    <span className="text-xs font-mono text-[#38bdf8] block">TRAITEMENT SÉCURISÉ</span>
                    <div className="space-y-1 text-xs font-mono">
                      <p className={generationStep >= 1 ? 'text-white' : 'text-[#64748b]'}>
                        {generationStep >= 1 ? '✓ Données reçues' : '○ En attente'}
                      </p>
                      <p className={generationStep >= 2 ? 'text-white' : 'text-[#64748b]'}>
                        {generationStep >= 2 ? '✓ Mise en forme PDF...' : '○ Structuration'}
                      </p>
                      <p className={generationStep >= 3 ? 'text-[#38bdf8] font-bold' : 'text-[#64748b]'}>
                        {generationStep >= 3 ? '✓ Document généré !' : '○ Impression'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto bg-[#0f172a] border border-[#1e293b] p-5 space-y-3">
                    <p className="text-xs font-mono text-[#cbd5e1]">
                      Paiement Mobile Money — <strong className="text-white">{selectedDoc.price} FCFA</strong>
                    </p>
                    <input
                      type="tel"
                      placeholder="N° Mobile Money (ex: 699000000)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#020617] border border-[#334155] p-2.5 text-xs text-white outline-none"
                    />
                    <button
                      onClick={handlePayAndDownload}
                      disabled={isProcessing}
                      className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3 text-xs uppercase tracking-wider"
                    >
                      Payer & Télécharger PDF
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* BARRE DE NAVIGATION MOBILE FIXE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020617] border-t border-[#1e293b] py-3 px-6 flex justify-around items-center text-[10px] font-mono tracking-wider text-[#94a3b8] z-40">
        <button 
          onClick={() => { setSelectedDoc(null); setActiveTab('accueil'); }} 
          className={`flex flex-col items-center ${activeTab === 'accueil' ? 'text-white font-bold' : ''}`}
        >
          <span>ACCUEIL</span>
        </button>
        <button 
          onClick={() => { setSelectedDoc(null); setActiveTab('documents'); }} 
          className={`flex flex-col items-center ${activeTab === 'documents' ? 'text-white font-bold' : ''}`}
        >
          <span>DOCUMENTS</span>
        </button>
        <button 
          onClick={() => setActiveTab('commandes')} 
          className={`flex flex-col items-center ${activeTab === 'commandes' ? 'text-white font-bold' : ''}`}
        >
          <span>COMMANDES</span>
        </button>
        <button 
          onClick={() => setActiveTab('profil')} 
          className={`flex flex-col items-center ${activeTab === 'profil' ? 'text-white font-bold' : ''}`}
        >
          <span>PROFIL</span>
        </button>
      </nav>

      <style jsx global>{`
        @keyframes printLine {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
