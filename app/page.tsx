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
  // --- ÉTATS ANIMATIONS ET NIGATION ---
  const [showSplash, setShowSplash] = useState(true);
  const [wordIndex, setWordIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'accueil' | 'documents' | 'commandes' | 'profil'>('accueil');
  const [selectedDoc, setSelectedDoc] = useState<DocumentTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'TOUS' | 'EMPLOI' | 'BUSINESS' | 'LOCATION'>('TOUS');
  const [step, setStep] = useState<'form' | 'preview' | 'payment'>('form');
  
  // --- FORMULAIRE & PAIMENT ---
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [phoneNumber, setPhoneNumber] = useState('');
  const [generationStep, setGenerationStep] = useState<number>(0); // 0: Idle, 1: Données, 2: Mise en forme, 3: Généré
  const [isProcessing, setIsProcessing] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  // 1. Gestion du Splashscreen (Une fois par session ou 3 secondes max)
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('docexpress_visited');
    if (hasVisited) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('docexpress_visited', 'true');
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, []);

  // 4. Animation du texte évolutif (Mots changeants)
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
      alert('Une erreur est survenue lors du téléchargement.');
    }
  };

  // 🚀 Signature Visuelle : Animation étape par étape avant téléchargement
  const handlePayAndDownload = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      alert('Veuillez entrer un numéro Mobile Money valide (Orange / MTN Cameroun).');
      return;
    }

    setIsProcessing(true);
    setGenerationStep(1); // Données reçues

    setTimeout(() => {
      setGenerationStep(2); // Mise en forme...
    }, 1200);

    setTimeout(async () => {
      setGenerationStep(3); // Document généré

      // Sauvegarde dans Supabase
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
    <div className="bg-[#020617] text-[#f8fafc] min-h-screen font-sans selection:bg-[#2563eb] selection:text-white pb-24 md:pb-12">
      
      {/* 1. ÉCRAN D'OUVERTURE ANIMÉ (SPLASHSCREEN) */}
      {showSplash && (
        <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center p-6 select-none">
          <div className="text-center space-y-4 max-w-sm w-full">
            <h1 className="text-3xl font-extrabold tracking-[0.2em] text-white animate-pulse">
              DOCEXPRESS
            </h1>
            
            {/* Ligne imprimante */}
            <div className="w-full h-[2px] bg-[#1e293b] relative overflow-hidden my-4">
              <div className="absolute top-0 left-0 h-full w-full bg-[#2563eb] animate-[printLine_1.5s_ease-in-out_infinite]"></div>
            </div>

            {/* Fragments de documents */}
            <div className="h-6 flex items-center justify-center font-mono text-xs text-[#94a3b8] tracking-widest uppercase">
              <span className="animate-[fadeSequence_2.5s_infinite]">
                CONTRAT • FACTURE • CV • QUITTANCE
              </span>
            </div>

            <p className="text-xs text-[#cbd5e1] font-light pt-2">
              Vos documents. Votre activité. En quelques minutes.
            </p>

            <button
              onClick={() => setShowSplash(false)}
              className="mt-6 text-xs font-bold text-[#2563eb] tracking-wider uppercase border-b border-[#2563eb] pb-1 hover:text-white transition-colors"
            >
              COMMENCER →
            </button>
          </div>
        </div>
      )}

      {/* HEADER ÉDITORIAL */}
      <header className="max-w-4xl mx-auto px-6 py-6 border-b border-[#1e293b] flex justify-between items-center">
        <div 
          className="cursor-pointer group"
          onClick={() => { setSelectedDoc(null); setActiveTab('accueil'); }}
        >
          <span className="text-xl font-black tracking-[0.15em] text-white group-hover:text-[#2563eb] transition-colors">
            DOCEXPRESS
          </span>
          <span className="text-[10px] text-[#38bdf8] block font-mono tracking-widest -mt-1">
            CAMEROUN
          </span>
        </div>

        <div className="hidden md:flex gap-8 text-xs font-semibold tracking-wider text-[#94a3b8]">
          <button onClick={() => { setSelectedDoc(null); setActiveTab('accueil'); }} className={activeTab === 'accueil' ? 'text-white' : 'hover:text-white'}>ACCUEIL</button>
          <button onClick={() => { setSelectedDoc(null); setActiveTab('documents'); }} className={activeTab === 'documents' ? 'text-white' : 'hover:text-white'}>CATALOGUE</button>
          <button onClick={() => setActiveTab('commandes')} className={activeTab === 'commandes' ? 'text-white' : 'hover:text-white'}>HISTORIQUE</button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-6 pt-8">
        
        {/* VUE CATALOGUE / ACCUEIL SANS DOCUMENT SÉLECTIONNÉ */}
        {!selectedDoc && (
          <div>
            {/* 4. ANIMATION DES MOTS CHANGEANTS */}
            <section className="py-8 border-b border-[#1e293b]">
              <p className="text-xs uppercase tracking-widest font-mono text-[#38bdf8] mb-2">
                // Service de génération conforme
              </p>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                Vous avez les informations. <br />
                Nous avons le{' '}
                <span className="inline-block text-[#2563eb] underline underline-offset-8 transition-all duration-300 min-w-[120px]">
                  {WORDS[wordIndex]}
                </span>
              </h2>
              <p className="text-sm text-[#cbd5e1] mt-4 font-light max-w-lg">
                Éditez des documents officiels pré-structurés selon les normes locales. Paiement instantané via Mobile Money.
              </p>
            </section>

            {/* 5. INTERFACE MOBILE DE SÉLECTION RAPIDE */}
            <section className="py-6 border-b border-[#1e293b]">
              <p className="text-sm font-semibold text-white mb-1">Bonjour 👋</p>
              <h3 className="text-lg font-bold text-[#f8fafc] mb-6">Quel document vous faut-il aujourd’hui ?</h3>

              {/* Filtres par catégories */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none font-mono text-xs">
                {(['TOUS', 'EMPLOI', 'BUSINESS', 'LOCATION'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 uppercase tracking-wider rounded-none transition-all border ${
                      selectedCategory === cat 
                        ? 'bg-white text-[#020617] font-bold border-white' 
                        : 'bg-[#0f172a] text-[#94a3b8] border-[#1e293b] hover:border-[#334155]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* 3. LISTE ÉDITORIALE PLATE DES DOCUMENTS (SANS CARTES) */}
            <section className="py-8">
              <div className="space-y-0 divide-y divide-[#1e293b]">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className="group py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#0f172a]/50 px-2 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#38bdf8]">{doc.code} —</span>
                        <h4 className="text-base font-bold tracking-wide text-white group-hover:text-[#2563eb] transition-colors">
                          {doc.title}
                        </h4>
                      </div>
                      <p className="text-xs text-[#94a3b8] font-light max-w-xl pl-8">
                        {doc.description}
                      </p>
                    </div>

                    <div className="pl-8 md:pl-0 flex items-center gap-4 justify-between md:justify-end">
                      <span className="font-mono text-xs text-[#cbd5e1]">{doc.price} FCFA</span>
                      <span className="text-xs font-bold text-[#2563eb] group-hover:translate-x-1 transition-transform">
                        Remplir →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ÉDITION ET APERÇU D'UN DOCUMENT SÉLECTIONNÉ */}
        {selectedDoc && (
          <div className="py-4">
            <button
              onClick={() => setSelectedDoc(null)}
              className="text-xs font-mono text-[#94a3b8] hover:text-white mb-6 block"
            >
              ← RETOUR AUX DOCUMENTS
            </button>

            {step === 'form' && (
              <div className="max-w-xl mx-auto space-y-6">
                <div>
                  <span className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-widest">// ÉTAPE 1 SUR 2</span>
                  <h3 className="text-xl font-bold text-white mt-1">{selectedDoc.title}</h3>
                  <p className="text-xs text-[#94a3b8] mt-1">Saisissez les informations requises.</p>
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
                        className="w-full bg-[#0f172a] border border-[#1e293b] focus:border-[#2563eb] p-3 text-sm text-white outline-none transition-colors"
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
                  <div>
                    <span className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-widest">// ÉTAPE 2 SUR 2</span>
                    <h3 className="text-lg font-bold text-white">Vérification de l'Aperçu</h3>
                  </div>
                  <button 
                    onClick={() => setStep('form')}
                    className="text-xs text-[#94a3b8] underline hover:text-white"
                  >
                    Modifier les champs
                  </button>
                </div>

                {/* DOCUMENT PDF STRUCTURÉ CAMEROUN */}
                <div
                  ref={documentRef}
                  className="bg-white text-black p-8 shadow-2xl font-serif text-sm max-w-2xl mx-auto space-y-6 border-t-8 border-[#020617]"
                >
                  <div className="text-center border-b pb-4 border-black">
                    <h2 className="text-xl font-extrabold uppercase tracking-widest">{selectedDoc.title}</h2>
                    <p className="text-[10px] font-sans tracking-widest text-gray-500 uppercase mt-1">République du Cameroun — Document officiel</p>
                  </div>

                  <div className="leading-relaxed space-y-4 text-gray-900">
                    {selectedDoc.id === 'quittance-loyer' && (
                      <>
                        <p>
                          Je soussigné(e), <strong>{formData.bailleur || '________________'}</strong>, propriétaire du logement situé à <strong>{formData.adresse || '________________'}</strong>, atteste avoir reçu de M./Mme <strong>{formData.locataire || '________________'}</strong> la somme de <strong>{formData.montant || '0'} FCFA</strong>.
                        </p>
                        <p>
                          Ce versement constitue le règlement intégral du loyer pour la période suivante : <strong>{formData.periode || '________________'}</strong>.
                        </p>
                      </>
                    )}

                    {selectedDoc.id === 'recu-loyer' && (
                      <>
                        <p>
                          Reçu de M./Mme <strong>{formData.locataire || '________________'}</strong> la somme totale de <strong>{formData.montant || '0'} FCFA</strong>.
                        </p>
                        <p>
                          <strong>Motif du versement :</strong> {formData.motif || '________________'}.
                        </p>
                      </>
                    )}

                    {selectedDoc.id === 'attestation-honneur' && (
                      <>
                        <p>
                          Je soussigné(e), <strong>{formData.declarant || '________________'}</strong>, résidant à <strong>{formData.adresse || '________________'}</strong>, titulaire de la pièce d’identité N° <strong>{formData.cni || '________________'}</strong>, atteste formellement sur l’honneur que :
                        </p>
                        <p className="p-4 bg-gray-50 border-l-2 border-black italic font-sans text-xs">
                          « {formData.declaration || '________________'} »
                        </p>
                      </>
                    )}

                    {selectedDoc.id === 'facture-proforma' && (
                      <>
                        <div className="flex justify-between font-sans text-xs mb-4">
                          <div>Ets : <strong>{formData.entreprise || '________________'}</strong></div>
                          <div>Client : <strong>{formData.client || '________________'}</strong></div>
                        </div>
                        <p><strong>Désignation de la prestation :</strong> {formData.service || '________________'}</p>
                        <p className="text-right text-base font-bold font-sans mt-4">Net à payer : {formData.montant || '0'} FCFA</p>
                      </>
                    )}
                  </div>

                  <div className="pt-8 flex justify-between items-end border-t border-gray-200 text-xs font-sans">
                    <div>
                      <p>Fait à : {formData.faitA || 'Yaoundé'}</p>
                      <p>Le : {formData.datePaiement || formData.date || '27/09/2026'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Signature / Cachet</p>
                      <div className="h-12 w-24 mt-2 border-dashed border border-gray-300"></div>
                    </div>
                  </div>
                </div>

                {/* ANIMATION MODALE DE GÉNÉRATION OU BOUTON DE PAIEMENT */}
                {generationStep > 0 ? (
                  <div className="bg-[#0f172a] border border-[#2563eb] p-6 text-center space-y-4 max-w-sm mx-auto">
                    <span className="text-xs font-mono text-[#38bdf8] block">TRAITEMENT SÉCURISÉ</span>
                    <div className="space-y-2 text-xs font-mono">
                      <p className={generationStep >= 1 ? 'text-white' : 'text-[#64748b]'}>
                        {generationStep >= 1 ? '✓ Données reçues' : '○ En attente des données'}
                      </p>
                      <p className={generationStep >= 2 ? 'text-white' : 'text-[#64748b]'}>
                        {generationStep >= 2 ? '✓ Mise en forme conforme...' : '○ Structuration PDF'}
                      </p>
                      <p className={generationStep >= 3 ? 'text-[#38bdf8] font-bold' : 'text-[#64748b]'}>
                        {generationStep >= 3 ? '✓ Document généré !' : '○ Impression'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto bg-[#0f172a] border border-[#1e293b] p-6 space-y-4">
                    <p className="text-xs font-mono text-[#cbd5e1]">
                      Paiement Mobile Money — <strong className="text-white">{selectedDoc.price} FCFA</strong>
                    </p>
                    <input
                      type="tel"
                      placeholder="N° Orange ou MTN (ex: 699000000)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#020617] border border-[#334155] p-3 text-sm text-white outline-none"
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

      {/* 5. BARRE DE NAVIGATION MOBILE FIXE (EN BAS) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020617] border-t border-[#1e293b] py-3 px-6 flex justify-around items-center text-[10px] font-mono tracking-wider text-[#94a3b8] z-40">
        <button 
          onClick={() => { setSelectedDoc(null); setActiveTab('accueil'); }} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'accueil' ? 'text-white font-bold' : ''}`}
        >
          <span>ACCUEIL</span>
        </button>
        <button 
          onClick={() => { setSelectedDoc(null); setActiveTab('documents'); }} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'documents' ? 'text-white font-bold' : ''}`}
        >
          <span>DOCUMENTS</span>
        </button>
        <button 
          onClick={() => setActiveTab('commandes')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'commandes' ? 'text-white font-bold' : ''}`}
        >
          <span>COMMANDES</span>
        </button>
        <button 
          onClick={() => setActiveTab('profil')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'profil' ? 'text-white font-bold' : ''}`}
        >
          <span>PROFIL</span>
        </button>
      </nav>

      {/* ANIMATIONS CSS GLOBALES POUR L'OUVERTURE */}
      <style jsx global>{`
        @keyframes printLine {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeSequence {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
