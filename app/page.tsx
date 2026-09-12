'use client';

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Home() {
  const [step, setStep] = useState<'home' | 'form' | 'preview' | 'payment' | 'success'>('home');
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; price: string } | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    propertyDetails: '',
    amount: '',
  });

  const popularDocs = [
    { id: 'bail', title: 'Contrat de bail', category: 'IMMOBILIER', price: '1 000 FCFA', badge: 'POPULAIRE', desc: 'Créez facilement votre contrat de bail personnalisé.' },
    { id: 'cv', title: 'CV professionnel', category: 'CARRIÈRE', price: '1 000 FCFA', badge: 'POPULAIRE', desc: 'Format moderne optimisé pour le marché local.' },
    { id: 'facture', title: 'Facture proforma', category: 'FINANCE', price: '1 000 FCFA', badge: 'POPULAIRE', desc: 'Facture conforme pour vos clients et prestations.' },
    { id: 'lettre', title: 'Lettre de motivation', category: 'CARRIÈRE', price: '500 FCFA', badge: '', desc: 'Rédigée sur mesure selon votre profil.' },
  ];

  const handleSelectDoc = (doc: { title: string; price: string }) => {
    setSelectedDoc(doc);
    setFormStep(1);
    setStep('form');
  };

  const generatePDF = async () => {
    if (!documentRef.current) return;
    setIsGenerating(true);

    try {
      const element = documentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${selectedDoc?.title || 'Document'}_DocExpress.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF :', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0B132B', color: '#FFFFFF', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* --- EN-TÊTE --- */}
      <header style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C2541' }}>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '1px', color: '#4CC9F0' }}>DOCEXPRESS</span>
          <p style={{ fontSize: '0.75rem', color: '#8D99AE', margin: 0 }}>Vos documents. Simplement.</p>
        </div>
        <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#8D99AE' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setStep('home')}>Documents</span>
          <span style={{ cursor: 'pointer' }}>FAQ</span>
        </nav>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>

        {/* ================= 1. ACCUEIL ================= */}
        {step === 'home' && (
          <div>
            <section style={{ textAlign: 'center', padding: '2rem 0' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '1rem' }}>
                Vos documents professionnels en quelques minutes.
              </h1>
              <p style={{ color: '#8D99AE', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Créez vos contrats, factures, CV, lettres et reçus directement depuis votre téléphone.
              </p>
              <button 
                onClick={() => handleSelectDoc(popularDocs[0])}
                style={{ backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.9rem 1.8rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', width: '100%' }}>
                Créer mon document →
              </button>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#4CC9F0' }}>
                ⚡ Rapide · 📱 100% mobile · 🇨🇲 Adapté au Cameroun
              </div>
            </section>

            <section style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🔥 Les documents les plus populaires</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {popularDocs.map((doc) => (
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

        {/* ================= 2. FORMULAIRE ================= */}
        {step === 'form' && selectedDoc && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#4CC9F0' }}>Créons votre {selectedDoc.title}</span>
              <h2 style={{ fontSize: '1.2rem', margin: '0.2rem 0 0.8rem 0' }}>Étape {formStep} sur 4</h2>
              <div style={{ backgroundColor: '#0B132B', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#4361EE', width: `${(formStep / 4) * 100}%`, height: '100%', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            {formStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem' }}>👤 Informations du bailleur</h3>
                <input type="text" placeholder="Nom complet (Ex: Jean Dupont)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #3A506B', backgroundColor: '#0B132B', color: '#FFF', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Téléphone (6XX XX XX XX)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #3A506B', backgroundColor: '#0B132B', color: '#FFF', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Adresse (Ex: Yaoundé, Bastos)" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #3A506B', backgroundColor: '#0B132B', color: '#FFF', boxSizing: 'border-box' }} />
              </div>
            )}

            {formStep === 2 && (
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🏠 Le logement</h3>
                <textarea placeholder="Ex: Appartement 3 chambres, salon, cuisine situé à Omnisports" value={formData.propertyDetails} onChange={(e) => setFormData({ ...formData, propertyDetails: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #3A506B', backgroundColor: '#0B132B', color: '#FFF', minHeight: '100px', boxSizing: 'border-box' }} />
              </div>
            )}

            {formStep === 3 && (
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>💰 Conditions financières</h3>
                <input type="number" placeholder="Loyer mensuel en FCFA (Ex: 150000)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #3A506B', backgroundColor: '#0B132B', color: '#FFF', boxSizing: 'border-box' }} />
              </div>
            )}

            {formStep === 4 && (
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📋 Recapitulatif</h3>
                <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <p><strong>Bailleur :</strong> {formData.name || 'Non renseigné'}</p>
                  <p><strong>Téléphone :</strong> {formData.phone || 'Non renseigné'}</p>
                  <p><strong>Adresse :</strong> {formData.address || 'Non renseigné'}</p>
                  <p><strong>Logement :</strong> {formData.propertyDetails || 'Non renseigné'}</p>
                  <p><strong>Loyer :</strong> {formData.amount ? `${formData.amount} FCFA` : 'Non renseigné'}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              {formStep > 1 && (
                <button onClick={() => setFormStep(formStep - 1)} style={{ flex: 1, backgroundColor: '#0B132B', color: '#FFF', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold' }}>
                  Retour
                </button>
              )}
              <button onClick={() => formStep < 4 ? setFormStep(formStep + 1) : setStep('preview')} style={{ flex: 2, backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {formStep === 4 ? 'Aperçu du document →' : 'Continuer →'}
              </button>
            </div>
          </div>
        )}

        {/* ================= 3. APERÇU SPÉCIMEN ================= */}
        {step === 'preview' && selectedDoc && (
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>Votre document est prêt</h2>
            
            <div style={{ backgroundColor: '#FFF', color: '#000', padding: '1.5rem', borderRadius: '8px', position: 'relative', overflow: 'hidden', minHeight: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
              <div style={{ position: 'absolute', top: '40%', left: '10%', transform: 'rotate(-30deg)', fontSize: '3rem', fontWeight: '900', color: 'rgba(230, 57, 70, 0.25)', pointerEvents: 'none' }}>
                SPÉCIMEN
              </div>
              <h3 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>{selectedDoc.title.toUpperCase()}</h3>
              <div style={{ fontSize: '0.75rem', marginTop: '1rem', lineHeight: '1.6' }}>
                <p><strong>ENTRE LES SOUSSIGNÉS :</strong></p>
                <p>M./Mme <u>{formData.name || '................................'}</u>, domicilié(e) à <u>{formData.address || '................'}</u>.</p>
                <p><strong>IL A ÉTÉ CONVENU CE QUI SUIT :</strong></p>
                <p>Bail portant sur les locaux situés à : <u>{formData.propertyDetails || '................................'}</u>.</p>
                <p>Loyer mensuel fixé à la somme de : <u>{formData.amount || '........'} FCFA</u>.</p>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#8D99AE', margin: '1rem 0' }}>Vérifiez vos informations avant de continuer.</p>

            <div style={{ backgroundColor: '#1C2541', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        {/* ================= 4. PAIEMENT ================= */}
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

        {/* ================= 5. SUCCÈS & TÉLÉCHARGEMENT PDF ================= */}
        {step === 'success' && selectedDoc && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#1C2541', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.4rem', color: '#4CC9F0', marginBottom: '0.5rem' }}>Votre document est prêt !</h2>
            <p style={{ fontSize: '0.85rem', color: '#8D99AE', marginBottom: '1.5rem' }}>Votre paiement a été confirmé.</p>

            {/* Document PDF Final (Masqué du visuel mais capturé pour le PDF propre sans filigrane) */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <div ref={documentRef} style={{ width: '800px', backgroundColor: '#FFF', color: '#000', padding: '3rem', fontFamily: 'serif' }}>
                <h1 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem', fontSize: '1.8rem' }}>{selectedDoc.title.toUpperCase()}</h1>
                <div style={{ marginTop: '2rem', lineHeight: '2', fontSize: '1.1rem' }}>
                  <p><strong>ENTRE LES SOUSSIGNÉS :</strong></p>
                  <p>M./Mme <strong>{formData.name || '................................'}</strong>, domicilié(e) à <strong>{formData.address || '................'}</strong>, désigné(e) ci-après "Le Bailleur".</p>
                  <p style={{ marginTop: '1.5rem' }}><strong>IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :</strong></p>
                  <p><strong>Objet :</strong> Le Bailleur donne à bail à loyer les locaux ci-après désignés : {formData.propertyDetails || '................................'}.</p>
                  <p><strong>Loyer :</strong> Le présent bail est consenti et accepté moyennant un loyer mensuel de <strong>{formData.amount || '........'} FCFA</strong>.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                    <div>
                      <p>Fait à Yaoundé, le {new Date().toLocaleDateString('fr-FR')}</p>
                      <p style={{ marginTop: '3rem' }}><strong>Le Bailleur</strong></p>
                    </div>
                    <div>
                      <p style={{ marginTop: '4rem' }}><strong>Le Preneur</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={generatePDF}
              disabled={isGenerating}
              style={{ width: '100%', backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem' }}>
              {isGenerating ? 'Génération en cours...' : '⬇️ TÉLÉCHARGER MON PDF'}
            </button>

            <p style={{ fontSize: '0.75rem', color: '#8D99AE' }}>Conservez votre document dans un endroit sûr.</p>
          </div>
        )}

      </main>
    </div>
  );
}
