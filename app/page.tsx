'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  code: string;
  title: string;
  category: 'EMPLOI' | 'BUSINESS' | 'LOCATION';
  price: number;
  description: string;
  fields: FieldConfig[];
}

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
  const [step, setStep] = useState<'form' | 'preview'>('form');
  
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
      }, 2500);
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
      alert('Une erreur est survenue lors du téléchargement.');
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
    <div style={{ backgroundColor: '#020617', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      
      {/* 1. ANIMATION D'OUVERTURE (SPLASH SCREEN) */}
      {showSplash && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '320px', width: '100%' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '0.2em', color: '#ffffff', margin: 0 }}>
              DOCEXPRESS
            </h1>
            <div style={{ width: '100%', height: '2px', backgroundColor: '#1e293b', position: 'relative', overflow: 'hidden', margin: '16px 0' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', backgroundColor: '#2563eb' }}></div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              CONTRAT • FACTURE • CV • QUITTANCE
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '12px', fontWeight: '300' }}>
              Vos documents. Votre activité. En quelques minutes.
            </p>
            <button
              onClick={() => setShowSplash(false)}
              style={{ marginTop: '24px', fontSize: '11px', fontWeight: '700', color: '#2563eb', background: 'none', border: 'none', borderBottom: '1px solid #2563eb', paddingBottom: '2px', cursor: 'pointer' }}
            >
              COMMENCER →
            </button>
          </div>
        </div>
      )}

      {/* HEADER ÉDITORIAL */}
      <header style={{ backgroundColor: '#020617', borderBottom: '1px solid #1e293b', padding: '20px 24px', maxWidth: '768px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={() => { setSelectedDoc(null); setActiveTab('accueil'); }} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.15em', color: '#ffffff', display: 'block', lineHeight: 1 }}>
            DOCEXPRESS
          </span>
          <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '0.2em', display: 'block', marginTop: '4px' }}>
            CAMEROUN
          </span>
        </div>

        <div style={{ display: 'flex', gap: '24px', fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>
          <button onClick={() => { setSelectedDoc(null); setActiveTab('accueil'); }} style={{ background: 'none', border: 'none', color: activeTab === 'accueil' ? '#ffffff' : '#94a3b8', cursor: 'pointer' }}>ACCUEIL</button>
          <button onClick={() => { setSelectedDoc(null); setActiveTab('documents'); }} style={{ background: 'none', border: 'none', color: activeTab === 'documents' ? '#ffffff' : '#94a3b8', cursor: 'pointer' }}>CATALOGUE</button>
          <button onClick={() => setActiveTab('commandes')} style={{ background: 'none', border: 'none', color: activeTab === 'commandes' ? '#ffffff' : '#94a3b8', cursor: 'pointer' }}>HISTORIQUE</button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main style={{ maxWidth: '768px', margin: '0 auto', padding: '0 24px' }}>
        
        {!selectedDoc && (
          <div>
            {/* TEXTE DYNAMIQUE */}
            <section style={{ borderBottom: '1px solid #1e293b', padding: '24px 0' }}>
              <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                // Service de génération conforme
              </p>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', lineHeight: '1.3', margin: 0 }}>
                Vous avez les informations. <br />
                Nous avons le{' '}
                <span style={{ color: '#2563eb', textDecoration: 'underline', textUnderlineOffset: '6px' }}>
                  {WORDS[wordIndex]}
                </span>
              </h2>
              <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '12px', fontWeight: '300', lineHeight: '1.5' }}>
                Éditez des documents officiels pré-structurés selon les normes locales. Paiement instantané via Mobile Money.
              </p>
            </section>

            {/* SELECTION PAR CATÉGORIES */}
            <section style={{ borderBottom: '1px solid #1e293b', padding: '20px 0' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>Bonjour 👋</p>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: '0 0 16px 0' }}>Quel document vous faut-il aujourd’hui ?</h3>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', fontFamily: 'monospace', fontSize: '11px' }}>
                {(['TOUS', 'EMPLOI', 'BUSINESS', 'LOCATION'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      backgroundColor: selectedCategory === cat ? '#ffffff' : '#0f172a',
                      color: selectedCategory === cat ? '#020617' : '#94a3b8',
                      border: `1px solid ${selectedCategory === cat ? '#ffffff' : '#1e293b'}`,
                      padding: '6px 12px',
                      textTransform: 'uppercase',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* LISTE PLATE ÉDITORIALE (PRIX ET BOUTON SEPARÉS PARFAITEMENT) */}
            <section style={{ padding: '16px 0' }}>
              <div>
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    style={{ borderBottom: '1px solid #1e293b', padding: '20px 0', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>{doc.code} —</span>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                        {doc.title}
                      </h4>
                    </div>

                    <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '300', margin: '8px 0 12px 0', paddingLeft: '24px' }}>
                      {doc.description}
                    </p>

                    <div style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '12px' }}>
                      <span style={{ color: '#cbd5e1', fontWeight: '700' }}>{doc.price} FCFA</span>
                      <span style={{ color: '#2563eb', fontWeight: '700', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Remplir <span style={{ fontSize: '14px' }}>→</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ÉDITION ET APERÇU DE DOCUMENT */}
        {selectedDoc && (
          <div style={{ padding: '24px 0' }}>
            <button
              onClick={() => setSelectedDoc(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}
            >
              ← RETOUR AUX DOCUMENTS
            </button>

            {step === 'form' && (
              <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>// ÉTAPE 1 SUR 2</span>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: '4px 0 0 0' }}>{selectedDoc.title}</h3>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); setStep('preview'); }}>
                  {selectedDoc.fields.map((f) => (
                    <div key={f.name} style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '6px' }}>{f.label}</label>
                      <input
                        type={f.type || 'text'}
                        required
                        placeholder={f.placeholder}
                        value={formData[f.name] || ''}
                        onChange={(e) => handleInputChange(f.name, e.target.value)}
                        style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '12px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}

                  <button
                    type="submit"
                    style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '700', border: 'none', padding: '14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', marginTop: '16px' }}
                  >
                    Générer l’aperçu conforme →
                  </button>
                </form>
              </div>
            )}

            {step === 'preview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Vérification de l'Aperçu</h3>
                  <button 
                    onClick={() => setStep('form')}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Modifier
                  </button>
                </div>

                <div
                  ref={documentRef}
                  style={{ backgroundColor: '#ffffff', color: '#000000', padding: '32px', fontFamily: 'serif', fontSize: '12px', maxWidth: '600px', margin: '0 auto', borderTop: '4px solid #020617', width: '100%', boxSizing: 'border-box' }}
                >
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #000000', paddingBottom: '12px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{selectedDoc.title}</h2>
                    <p style={{ fontSize: '9px', fontFamily: 'sans-serif', letterSpacing: '0.1em', color: '#666666', textTransform: 'uppercase', marginTop: '4px' }}>République du Cameroun — Document officiel</p>
                  </div>

                  <div style={{ lineHeight: '1.8', color: '#111111' }}>
                    {selectedDoc.id === 'quittance-loyer' && (
                      <>
                        <p style={{ margin: '0 0 12px 0' }}>
                          Je soussigné(e), <strong>{formData.bailleur || '________________'}</strong>, propriétaire du logement situé à <strong>{formData.adresse || '________________'}</strong>, atteste avoir reçu de M./Mme <strong>{formData.locataire || '________________'}</strong> la somme de <strong>{formData.montant || '0'} FCFA</strong>.
                        </p>
                        <p style={{ margin: 0 }}>
                          Ce versement constitue le règlement intégral du loyer pour la période : <strong>{formData.periode || '________________'}</strong>.
                        </p>
                      </>
                    )}
                  </div>

                  <div style={{ paddingTop: '24px', marginTop: '32px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', fontFamily: 'sans-serif' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0' }}>Fait à : {formData.faitA || 'Yaoundé'}</p>
                      <p style={{ margin: 0 }}>Le : {formData.datePaiement || formData.date || '27/09/2026'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '700', margin: '0 0 4px 0' }}>Signature / Cachet</p>
                      <div style={{ height: '32px', width: '80px', border: '1px dashed #cccccc' }}></div>
                    </div>
                  </div>
                </div>

                {generationStep > 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #2563eb', padding: '20px', textAlign: 'center', maxWidth: '360px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8', display: 'block', marginBottom: '8px' }}>TRAITEMENT SÉCURISÉ</span>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      <p style={{ color: generationStep >= 1 ? '#ffffff' : '#64748b', margin: '4px 0' }}>
                        {generationStep >= 1 ? '✓ Données reçues' : '○ En attente'}
                      </p>
                      <p style={{ color: generationStep >= 2 ? '#ffffff' : '#64748b', margin: '4px 0' }}>
                        {generationStep >= 2 ? '✓ Mise en forme PDF...' : '○ Structuration'}
                      </p>
                      <p style={{ color: generationStep >= 3 ? '#38bdf8' : '#64748b', fontWeight: generationStep >= 3 ? '700' : '400', margin: '4px 0' }}>
                        {generationStep >= 3 ? '✓ Document généré !' : '○ Impression'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', maxWidth: '360px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                    <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#cbd5e1', margin: '0 0 12px 0' }}>
                      Paiement Mobile Money — <strong style={{ color: '#ffffff' }}>{selectedDoc.price} FCFA</strong>
                    </p>
                    <input
                      type="tel"
                      placeholder="N° Mobile Money (ex: 699000000)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #334155', padding: '12px', fontSize: '12px', color: '#ffffff', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
                    />
                    <button
                      onClick={handlePayAndDownload}
                      disabled={isProcessing}
                      style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '700', border: 'none', padding: '12px', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}
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

      {/* BARRE DE NAVIGATION MOBILE FIXE (EN BAS) */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#020617', borderTop: '1px solid #1e293b', padding: '12px 24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.1em', color: '#94a3b8', zIndex: 40 }}>
        <button onClick={() => { setSelectedDoc(null); setActiveTab('accueil'); }} style={{ background: 'none', border: 'none', color: activeTab === 'accueil' ? '#ffffff' : '#94a3b8', fontWeight: activeTab === 'accueil' ? '700' : '400', cursor: 'pointer' }}>
          ACCUEIL
        </button>
        <button onClick={() => { setSelectedDoc(null); setActiveTab('documents'); }} style={{ background: 'none', border: 'none', color: activeTab === 'documents' ? '#ffffff' : '#94a3b8', fontWeight: activeTab === 'documents' ? '700' : '400', cursor: 'pointer' }}>
          DOCUMENTS
        </button>
        <button onClick={() => setActiveTab('commandes')} style={{ background: 'none', border: 'none', color: activeTab === 'commandes' ? '#ffffff' : '#94a3b8', fontWeight: activeTab === 'commandes' ? '700' : '400', cursor: 'pointer' }}>
          COMMANDES
        </button>
        <button onClick={() => setActiveTab('profil')} style={{ background: 'none', border: 'none', color: activeTab === 'profil' ? '#ffffff' : '#94a3b8', fontWeight: activeTab === 'profil' ? '700' : '400', cursor: 'pointer' }}>
          PROFIL
        </button>
      </nav>

    </div>
  );
}
