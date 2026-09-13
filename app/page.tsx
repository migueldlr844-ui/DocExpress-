'use client';

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- CONFIGURATION DYNAMIQUE DES DOCUMENTS ---
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email';
  placeholder?: string;
  step: number;
  required?: boolean;
}

interface DocumentConfig {
  id: string;
  title: string;
  category: string;
  price: string;
  badge?: string;
  desc: string;
  fields: FormField[];
}

const DOCUMENTS_CONFIG: Record<string, DocumentConfig> = {
  lettre: {
    id: 'lettre',
    title: 'Lettre de motivation',
    category: 'CARRIÈRE',
    price: '500 FCFA',
    badge: 'POPULAIRE',
    desc: 'Rédigée sur mesure et au format professionnel par notre moteur IA.',
    fields: [
      { id: 'name', label: 'Nom & Prénom', type: 'text', placeholder: 'Ex: ATANGANA DESIRE', step: 1, required: true },
      { id: 'phone', label: 'Téléphone', type: 'text', placeholder: 'Ex: 6XX XX XX XX', step: 1, required: true },
      { id: 'email', label: 'Email', type: 'email', placeholder: 'Ex: contact@exemple.com', step: 1 },
      { id: 'address', label: 'Ville / Adresse', type: 'text', placeholder: 'Ex: Yaoundé, Cameroun', step: 1 },
      
      { id: 'jobTitle', label: 'Poste recherché', type: 'text', placeholder: 'Ex: Chargé d’affaires', step: 2, required: true },
      { id: 'recipient', label: 'Nom de l’entreprise / Destinataire', type: 'text', placeholder: 'Ex: AFRIBIZ', step: 2, required: true },
      { id: 'recipientAddress', label: 'Ville de l’entreprise', type: 'text', placeholder: 'Ex: Douala', step: 2 },
      
      { id: 'education', label: 'Formation / Niveau d’études', type: 'text', placeholder: 'Ex: Master en Banque & Finance', step: 3 },
      { id: 'experience', label: 'Expériences & Postes précédents', type: 'textarea', placeholder: 'Ex: 3 ans chez XYZ en gestion du portefeuille clients...', step: 3 },
      { id: 'skills', label: 'Compétences & Qualités clés', type: 'textarea', placeholder: 'Ex: Négociation, analyse financière, rigueur...', step: 3 },
      { id: 'motivation', label: 'Pourquoi ce poste / cette entreprise ?', type: 'textarea', placeholder: 'Ex: Attiré par le leadership d’AFRIBIZ...', step: 3 },
    ]
  },
  cv: {
    id: 'cv',
    title: 'CV professionnel',
    category: 'CARRIÈRE',
    price: '1 000 FCFA',
    badge: 'POPULAIRE',
    desc: 'Format moderne optimisé pour le marché.',
    fields: [
      { id: 'name', label: 'Nom complet', type: 'text', step: 1, required: true },
      { id: 'phone', label: 'Téléphone', type: 'text', step: 1, required: true },
      { id: 'jobTitle', label: 'Titre du profil', type: 'text', step: 2, required: true },
      { id: 'experience', label: 'Description de vos expériences', type: 'textarea', step: 3 },
    ]
  }
};

export default function Home() {
  const [step, setStep] = useState<'home' | 'form' | 'preview' | 'payment' | 'success'>('home');
  const [selectedDoc, setSelectedDoc] = useState<DocumentConfig | null>(null);
  const [formStep, setFormStep] = useState(1);
  
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generatedBody, setGeneratedBody] = useState<string>('');

  const documentRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSelectDoc = (doc: DocumentConfig) => {
    setSelectedDoc(doc);
    setFormStep(1);
    setFormData({});
    setGeneratedBody('');
    setStep('form');
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleProcessDocument = async () => {
    setIsGeneratingContent(true);
    try {
      const res = await fetch('/api/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: selectedDoc?.id,
          formData,
        }),
      });

      const data = await res.json();
      setGeneratedBody(data.content || '<p>Rédaction complétée avec succès.</p>');
      setStep('preview');
    } catch (err) {
      console.error('Erreur de traitement:', err);
      // Fallback local en cas d'erreur réseau
      setGeneratedBody(`
        <p>Madame, Monsieur,</p>
        <p>C'est avec un vif intérêt que je pose ma candidature pour le poste de <strong>${formData.jobTitle || 'professionnel'}</strong> au sein de votre entreprise <strong>${formData.recipient || ''}</strong>.</p>
        <p>Mon parcours et mes compétences correspondent aux exigences de ce poste.</p>
        <p>Je reste à votre entière disposition pour un entretien.</p>
        <p>Cordialement,</p>
      `);
      setStep('preview');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const generatePDF = async () => {
    if (!documentRef.current) return;
    setIsGeneratingPDF(true);

    try {
      const element = documentRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${selectedDoc?.title || 'Document'}_DocExpress.pdf`);
    } catch (error) {
      console.error('Erreur lors du téléchargement :', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid #3A506B',
    backgroundColor: '#0B132B',
    color: '#FFF',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ backgroundColor: '#0B132B', color: '#FFFFFF', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* EN-TÊTE */}
      <header style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C2541' }}>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '1px', color: '#4CC9F0', cursor: 'pointer' }} onClick={() => setStep('home')}>DOCEXPRESS</span>
          <p style={{ fontSize: '0.75rem', color: '#8D99AE', margin: 0 }}>Vos documents. Simplement.</p>
        </div>
        <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#8D99AE' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setStep('home')}>Documents</span>
          <span style={{ cursor: 'pointer' }}>FAQ</span>
        </nav>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>

        {/* 1. ACCUEIL */}
        {step === 'home' && (
          <div>
            <section style={{ textAlign: 'center', padding: '2rem 0' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '1rem' }}>
                Vos documents professionnels rédigés sur mesure.
              </h1>
              <p style={{ color: '#8D99AE', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Transformez vos informations brutes en documents rédigés et mis en forme instantanément.
              </p>
              <button 
                onClick={() => handleSelectDoc(DOCUMENTS_CONFIG.lettre)}
                style={{ backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.9rem 1.8rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', width: '100%' }}>
                Créer une lettre de motivation →
              </button>
            </section>

            <section style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🔥 Choisissez votre document</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.values(DOCUMENTS_CONFIG).map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    style={{ backgroundColor: '#1C2541', borderRadius: '12px', padding: '1.2rem', border: '1px solid #3A506B', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.7rem', color: '#4CC9F0', fontWeight: 'bold' }}>{doc.category}</span>
                      {doc.badge && (
                        <span style={{ backgroundColor: '#4361EE', color: '#FFF', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                          {doc.badge}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', margin: '0.4rem 0' }}>{doc.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#8D99AE', margin: '0 0 1rem 0' }}>{doc.desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#FFF' }}>{doc.price}</span>
                      <span style={{ color: '#4CC9F0', fontWeight: 'bold', fontSize: '0.9rem' }}>Créer →</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 2. FORMULAIRE DYNAMIQUE */}
        {step === 'form' && selectedDoc && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#4CC9F0' }}>Création de votre {selectedDoc.title}</span>
              <h2 style={{ fontSize: '1.2rem', margin: '0.2rem 0 0.8rem 0' }}>Étape {formStep} sur 3</h2>
              <div style={{ backgroundColor: '#0B132B', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#4361EE', width: `${(formStep / 3) * 100}%`, height: '100%', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedDoc.fields
                .filter(f => f.step === formStep)
                .map(field => (
                  <div key={field.id}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#8D99AE' }}>
                      {field.label} {field.required && '*'}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        style={{ ...inputStyle, minHeight: '100px' }}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        style={inputStyle}
                      />
                    )}
                  </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              {formStep > 1 && (
                <button onClick={() => setFormStep(formStep - 1)} disabled={isGeneratingContent} style={{ flex: 1, backgroundColor: '#0B132B', color: '#FFF', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Retour
                </button>
              )}
              
              {formStep < 3 ? (
                <button onClick={() => setFormStep(formStep + 1)} style={{ flex: 2, backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Continuer →
                </button>
              ) : (
                <button onClick={handleProcessDocument} disabled={isGeneratingContent} style={{ flex: 2, backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isGeneratingContent ? 'Rédaction IA en cours...' : 'Rédiger mon document →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. APERÇU SPÉCIMEN RÉDIGÉ */}
        {step === 'preview' && selectedDoc && (
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>Aperçu de votre document rédigé</h2>
            
            <div style={{ backgroundColor: '#FFF', color: '#111', padding: '1.5rem', borderRadius: '8px', position: 'relative', overflow: 'hidden', minHeight: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: "'Times New Roman', Times, serif" }}>
              <div style={{ position: 'absolute', top: '40%', left: '10%', transform: 'rotate(-30deg)', fontSize: '3.5rem', fontWeight: '900', color: 'rgba(230, 57, 70, 0.15)', pointerEvents: 'none', select: 'none' }}>
                SPÉCIMEN
              </div>

              <div style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>{formData.name || 'Nom & Prénom'}</p>
                    <p style={{ margin: 0 }}>{formData.address || 'Ville'}</p>
                    <p style={{ margin: 0 }}>Tél : {formData.phone || '06000000'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>À l'attention de : {formData.recipient || 'Entreprise'}</p>
                    <p style={{ margin: 0 }}>{formData.recipientAddress || ''}</p>
                  </div>
                </div>

                {formData.jobTitle && (
                  <p style={{ fontWeight: 'bold', margin: '1rem 0 0.8rem 0' }}>
                    Objet : Candidature au poste de {formData.jobTitle}
                  </p>
                )}

                <div dangerouslySetInnerHTML={{ __html: generatedBody }} />
              </div>
            </div>

            <div style={{ backgroundColor: '#1C2541', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.9rem', display: 'block' }}>{selectedDoc.title}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4CC9F0' }}>{selectedDoc.price}</span>
              </div>
              <button onClick={() => setStep('payment')} style={{ backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Continuer vers le paiement →
              </button>
            </div>
          </div>
        )}

        {/* 4. PAIEMENT */}
        {step === 'payment' && selectedDoc && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Finaliser votre commande</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #3A506B', marginBottom: '1.5rem' }}>
              <span>{selectedDoc.title}</span>
              <span style={{ fontWeight: 'bold', color: '#4CC9F0' }}>{selectedDoc.price}</span>
            </div>

            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.8rem' }}>① Effectuez votre paiement</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #FF7900' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FF7900' }}>🟠 Orange Money</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', fontSize: '1.05rem' }}>6XX XX XX XX</p>
                <span style={{ fontSize: '0.75rem', color: '#8D99AE' }}>DOCEXPRESS</span>
              </div>

              <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #FFCC00' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FFCC00' }}>🟡 MTN Mobile Money</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', fontSize: '1.05rem' }}>6XX XX XX XX</p>
                <span style={{ fontSize: '0.75rem', color: '#8D99AE' }}>DOCEXPRESS</span>
              </div>
            </div>

            <button onClick={() => setStep('success')} style={{ width: '100%', backgroundColor: '#25D366', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              🟢 J'AI EFFECTUÉ LE PAIEMENT
            </button>
          </div>
        )}

        {/* 5. SUCCÈS & EXPORT DU PDF FINAL PROPRE */}
        {step === 'success' && selectedDoc && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#1C2541', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.4rem', color: '#4CC9F0', marginBottom: '0.5rem' }}>Votre document rédigé est prêt !</h2>

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <div ref={documentRef} style={{ width: '794px', minHeight: '1123px', backgroundColor: '#FFF', color: '#111', padding: '4rem', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                  <div style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>{formData.name || ''}</p>
                    <p style={{ margin: 0 }}>{formData.address || ''}</p>
                    <p style={{ margin: 0 }}>Tél : {formData.phone || ''}</p>
                    {formData.email && <p style={{ margin: 0 }}>Email : {formData.email}</p>}
                  </div>
                  <div style={{ fontSize: '1rem', lineHeight: '1.5', textAlign: 'right' }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>À l'attention de : {formData.recipient || ''}</p>
                    <p style={{ margin: 0 }}>{formData.recipientAddress || ''}</p>
                  </div>
                </div>

                <p style={{ textAlign: 'right', marginBottom: '2.5rem' }}>
                  Fait le {new Date().toLocaleDateString('fr-FR')}
                </p>

                {formData.jobTitle && (
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Objet : Candidature au poste de {formData.jobTitle}
                  </p>
                )}

                <div style={{ fontSize: '1.1rem', lineHeight: '1.8', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: generatedBody }} />

                <div style={{ marginTop: '4rem', float: 'right', textAlign: 'center' }}>
                  <p style={{ marginBottom: '3rem' }}><strong>{formData.name}</strong></p>
                </div>

              </div>
            </div>

            <button 
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              style={{ width: '100%', backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem' }}>
              {isGeneratingPDF ? 'Téléchargement en cours...' : '⬇️ TÉLÉCHARGER MON PDF'}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
