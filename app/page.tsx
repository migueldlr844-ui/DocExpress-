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
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setStep('select')}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              📄
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.05em', color: '#ffffff' }}>DOCEXPRESS</span>
          </div>

          {selectedDoc && (
            <button
              onClick={() => setStep('select')}
              style={{ fontSize: '0.75rem', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
            >
              ← Retour au catalogue
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 16px' }}>
        {step === 'select' && (
          <div>
            <div style={{ textAlign: 'center', margin: '24px 0 32px 0' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', lineHeight: 1.3 }}>
                Vous avez les informations.<br />Nous avons le document.
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                Sélectionnez, remplissez et téléchargez en toute sécurité.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '4px 8px', borderRadius: '6px', letterSpacing: '0.05em' }}>
                      {doc.category}
                    </span>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginTop: '12px', marginBottom: '6px' }}>
                      {doc.title}
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {doc.description}
                    </p>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '1rem' }}>{doc.price} FCFA</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', backgroundColor: '#2563eb', padding: '8px 14px', borderRadius: '10px' }}>
                      Générer →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'form' && selectedDoc && (
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '24px', borderRadius: '16px', maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>{selectedDoc.title}</h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '20px' }}>Remplissez les informations ci-dessous.</p>

            <form onSubmit={handleProceedToPreview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedDoc.fields.map((f) => (
                <div key={f.name}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    required
                    placeholder={f.placeholder}
                    value={formData[f.name] || ''}
                    onChange={(e) => handleInputChange(f.name, e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontSize: '0.875rem',
                      color: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}

              <button
                type="submit"
                style={{
                  width: '100%',
                  marginTop: '12px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Voir l’aperçu du document →
              </button>
            </form>
          </div>
        )}

        {step === 'preview' && selectedDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Aperçu officiel</h2>
              <button onClick={() => setStep('form')} style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                Modifier les saisies
              </button>
            </div>

            <div
              ref={documentRef}
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                padding: '24px',
                borderRadius: '12px',
                fontFamily: 'serif',
                minHeight: '380px',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}
            >
              <div>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selectedDoc.title}</h1>
                </div>

                <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {selectedDoc.id === 'quittance-loyer' && (
                    <>
                      <p style={{ marginBottom: '10px' }}>
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
                      <p style={{ marginBottom: '10px' }}>
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
                      <p style={{ marginBottom: '10px' }}>
                        Je soussigné(e), <strong>{formData.declarant || '________________'}</strong>, demeurant à{' '}
                        <strong>{formData.adresse || '________________'}</strong>, titulaire de la CNI n°{' '}
                        <strong>{formData.cni || '________________'}</strong>, atteste sur l’honneur que :
                      </p>
                      <p style={{ fontStyle: 'italic', backgroundColor: '#f1f5f9', padding: '12px', borderLeft: '3px solid #0f172a', margin: '12px 0' }}>
                        « {formData.declaration || '________________'} »
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569', fontFamily: 'sans-serif' }}>
                <div>
                  <p>Fait à : {formData.faitA || 'Yaoundé'}</p>
                  <p>Le : {formData.datePaiement || formData.date || '27/09/2026'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700 }}>Signature / Cachet</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('payment')}
              style={{
                width: '100%',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontWeight: 700,
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                marginTop: '8px'
              }}
            >
              Payer {selectedDoc.price} FCFA et Télécharger
            </button>
          </div>
        )}

        {step === 'payment' && selectedDoc && (
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '24px', borderRadius: '16px', maxWidth: '400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>Paiement Mobile Money</h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '16px' }}>
              Montant à régler : <strong style={{ color: '#38bdf8' }}>{selectedDoc.price} FCFA</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '6px' }}>Numéro Orange ou MTN</label>
                <input
                  type="tel"
                  placeholder="Ex: 699000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    fontSize: '0.875rem',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                onClick={handlePayAndDownload}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                {isProcessing ? 'Traitement en cours...' : 'Valider & Télécharger PDF'}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid #1e293b', padding: '16px', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '32px' }}>
        © 2026 DOCEXPRESS — Tous droits réservés.
      </footer>
    </div>
  );
}
