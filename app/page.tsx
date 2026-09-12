'use client';

import React, { useState } from 'react';

export default function Home() {
  const [step, setStep] = useState<'home' | 'form' | 'preview' | 'payment' | 'success'>('home');
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; price: string } | null>(null);
  const [formStep, setFormStep] = useState(1);
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

  return (
    <div style={{ backgroundColor: '#0B132B', color: '#FFFFFF', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* --- EN-TÊTE / NAVIGATION --- */}
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

        {/* ================= 1. PAGE D'ACCUEIL ================= */}
        {step === 'home' && (
          <div>
            {/* Hero Section */}
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

            {/* Section Les plus demandés */}
            <section style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔥 Les documents les plus populaires
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {popularDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    style={{ backgroundColor: '#1C2541', borderRadius: '12px', padding: '1.2rem', border: '1px solid #3A506B', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.7rem', color: '#4CC9F0', fontWeight: 'bold', letterSpacing: '0.5px' }}>{doc.category}</span>
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

        {/* ================= 4. FORMULAIRE MULTI-ÉTAPES ================= */}
        {step === 'form' && selectedDoc && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#4CC9F0' }}>Créons votre {selectedDoc.title}</span>
              <h2 style={{ fontSize: '1.2rem', margin: '0.2rem 0 0.8rem 0' }}>Étape {formStep} sur 4</h2>
              {/* Barre de progression */}
              <div style={{ backgroundColor: '#0B132B', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#4361EE', width: `${(formStep / 4) * 100}%`, height: '100%', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            {formStep === 1 && (
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>👤 Informations du bailleur</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>Nom complet</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Jean Dupont" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #3A506B', backgroundColor: '#0B132B', color: '#FFF', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>Téléphone</label>
                    <input 
                      type="text" 
                      placeholder="6XX XX XX XX" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #3A506B', backgroundColor: '#0B132B', color: '#FFF', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>Adresse</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Yaoundé, Bastos" 
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #3A506B', backgroundColor: '#0B132B', color: '#FFF', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {formStep === 2 && (
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🏠 Le logement</h3>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>Désignation des locaux</label>
                  <textarea 
                    placeholder="Ex: Appartement 3 chambres, salon, cuisine situé à Omnisports" 
                    value={formData.propertyDetails}
                    onChange={(e) => setFormData({ ...formData, propertyDetails: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #3A506B', backgroundColor: '#0B132B', color: '#FFF', minHeight: '100px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {formStep === 3 && (
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>💰 Conditions financières</h3>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>Loyer mensuel (FCFA)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 150000" 
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #3A506B', backgroundColor: '#0B132B', color: '#FFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {formStep === 4 && (
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📋 Vérification</h3>
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
                <button 
                  onClick={() => setFormStep(formStep - 1)}
                  style={{ flex: 1, backgroundColor: '#0B132B', color: '#FFF', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold' }}>
                  Retour
                </button>
              )}
              <button 
                onClick={() => formStep < 4 ? setFormStep(formStep + 1) : setStep('preview')}
                style={{ flex: 2, backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {formStep === 4 ? 'Aperçu du document →' : 'Continuer →'}
              </button>
            </div>
          </div>
        )}

        {/* ================= 5. APERÇU AVANT PAIEMENT ================= */}
        {step === 'preview' && selectedDoc && (
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>Votre document est prêt</h2>
            
            {/* Feuille A4 Spécimen */}
            <div style={{ backgroundColor: '#FFF', color: '#000', padding: '1.5rem', borderRadius: '8px', position: 'relative', overflow: 'hidden', minHeight: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
              <div style={{ position: 'absolute', top: '40%', left: '10%', transform: 'rotate(-30deg)', fontSize: '3rem', fontWeight: '900', color: 'rgba(230, 57, 70, 0.25)', pointerEvents: 'none', userSelect: 'none' }}>
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

            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#8D99AE', margin: '1rem 0' }}>
              Vérifiez vos informations avant de continuer.
            </p>

            <div style={{ backgroundColor: '#1C2541', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.9rem', display: 'block' }}>{selectedDoc.title}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4CC9F0' }}>{selectedDoc.price}</span>
              </div>
              <button 
                onClick={() => setStep('payment')}
                style={{ backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Continuer vers le paiement →
              </button>
            </div>
          </div>
        )}

        {/* ================= 6. PAIEMENT MOBILE MONEY ================= */}
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
                <span style={{ fontSize: '0.75rem', color: '#8D99AE' }}>NOM DU COMPTE</span>
              </div>

              <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #FFCC00' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FFCC00' }}>🟡 MTN Mobile Money</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', fontSize: '1.05rem' }}>6XX XX XX XX</p>
                <span style={{ fontSize: '0.75rem', color: '#8D99AE' }}>NOM DU COMPTE</span>
              </div>
            </div>

            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>② Signalez votre paiement</h3>
            <p style={{ fontSize: '0.8rem', color: '#8D99AE', marginBottom: '1rem' }}>
              Après avoir effectué le transfert, cliquez ci-dessous pour confirmer votre commande.
            </p>

            <button 
              onClick={() => setStep('success')}
              style={{ width: '100%', backgroundColor: '#25D366', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              🟢 J'AI EFFECTUÉ LE PAIEMENT
            </button>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '0.8rem', backgroundColor: '#0B132B', borderRadius: '8px', fontSize: '0.8rem' }}>
              <span>Votre commande : <strong>DOC-583921</strong></span><br />
              <span style={{ color: '#FFCC00' }}>Statut : En attente de vérification</span>
            </div>
          </div>
        )}

        {/* ================= 7. APRÈS VALIDATION / SUCCÈS ================= */}
        {step === 'success' && selectedDoc && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#1C2541', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.4rem', color: '#4CC9F0', marginBottom: '0.5rem' }}>Votre document est prêt !</h2>
            <p style={{ fontSize: '0.85rem', color: '#8D99AE', marginBottom: '1.5rem' }}>Votre paiement a été confirmé.</p>

            <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.85rem' }}>
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Document :</strong> {selectedDoc.title}</p>
              <p style={{ margin: 0 }}><strong>Référence :</strong> DOC-583921</p>
            </div>

            <button 
              onClick={() => alert('Téléchargement du PDF...')}
              style={{ width: '100%', backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem' }}>
              ⬇️ TÉLÉCHARGER MON PDF
            </button>

            <p style={{ fontSize: '0.75rem', color: '#8D99AE' }}>Conservez votre document dans un endroit sûr.</p>
          </div>
        )}

      </main>
    </div>
  );
}
