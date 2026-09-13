'use client';

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type DocType = {
  id: 'bail' | 'cv' | 'facture' | 'lettre';
  title: string;
  category: string;
  price: string;
  badge: string;
  desc: string;
};

export default function Home() {
  const [step, setStep] = useState<'home' | 'form' | 'preview' | 'payment' | 'success'>('home');
  const [selectedDoc, setSelectedDoc] = useState<DocType | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    recipient: '',
    recipientAddress: '',
    details: '',
    amount: '',
  });

  const popularDocs: DocType[] = [
    { id: 'bail', title: 'Contrat de bail', category: 'IMMOBILIER', price: '1 000 FCFA', badge: 'POPULAIRE', desc: 'Contrat de bail à usage d’habitation formalisé.' },
    { id: 'lettre', title: 'Lettre de motivation', category: 'CARRIÈRE', price: '500 FCFA', badge: 'POPULAIRE', desc: 'Rédigée sur mesure et au format professionnel.' },
    { id: 'facture', title: 'Facture proforma', category: 'FINANCE', price: '1 000 FCFA', badge: 'POPULAIRE', desc: 'Facture proforma détaillée avec calcul automatique.' },
    { id: 'cv', title: 'CV professionnel', category: 'CARRIÈRE', price: '1 000 FCFA', badge: '', desc: 'Format moderne optimisé pour le marché.' },
  ];

  const handleSelectDoc = (doc: DocType) => {
    setSelectedDoc(doc);
    setFormStep(1);
    setFormData({ name: '', phone: '', address: '', email: '', recipient: '', recipientAddress: '', details: '', amount: '' });
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
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${selectedDoc?.title || 'Document'}_DocExpress.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF :', error);
    } finally {
      setIsGenerating(false);
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
                Vos documents professionnels en quelques minutes.
              </h1>
              <p style={{ color: '#8D99AE', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Créez vos contrats, factures, CV et lettres directement depuis votre téléphone.
              </p>
              <button 
                onClick={() => handleSelectDoc(popularDocs[1])}
                style={{ backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.9rem 1.8rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', width: '100%' }}>
                Créer une lettre de motivation →
              </button>
            </section>

            <section style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🔥 Choisissez votre document</h2>
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

        {/* 2. FORMULAIRE */}
        {step === 'form' && selectedDoc && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#4CC9F0' }}>Créons votre {selectedDoc.title}</span>
              <h2 style={{ fontSize: '1.2rem', margin: '0.2rem 0 0.8rem 0' }}>Étape {formStep} sur 3</h2>
              <div style={{ backgroundColor: '#0B132B', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#4361EE', width: `${(formStep / 3) * 100}%`, height: '100%', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            {/* Étape 1 : Expéditeur */}
            {formStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem' }}>👤 Vos coordonnées</h3>
                <input type="text" placeholder="Nom et Prénom complets" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                <input type="text" placeholder="Numéro de téléphone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
                <input type="email" placeholder="Adresse email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                <input type="text" placeholder="Ville / Adresse" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={inputStyle} />
              </div>
            )}

            {/* Étape 2 : Destinataire / Poste */}
            {formStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem' }}>🏢 Contexte et Destinataire</h3>
                
                {selectedDoc.id === 'lettre' && (
                  <>
                    <input type="text" placeholder="Intitulé du poste recherché (Ex: Comptable)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} style={inputStyle} />
                    <input type="text" placeholder="Nom de l'entreprise ou 'Le Directeur'" value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} style={inputStyle} />
                    <input type="text" placeholder="Ville / Adresse de l'entreprise" value={formData.recipientAddress} onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })} style={inputStyle} />
                  </>
                )}

                {selectedDoc.id === 'bail' && (
                  <>
                    <input type="text" placeholder="Nom complet du Locataire" value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} style={inputStyle} />
                    <input type="number" placeholder="Loyer mensuel (FCFA)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} style={inputStyle} />
                  </>
                )}

                {selectedDoc.id === 'facture' && (
                  <>
                    <input type="text" placeholder="Nom du Client" value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} style={inputStyle} />
                    <input type="number" placeholder="Montant total (FCFA)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} style={inputStyle} />
                  </>
                )}

                {selectedDoc.id === 'cv' && (
                  <input type="text" placeholder="Titre professionnel" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} style={inputStyle} />
                )}
              </div>
            )}

            {/* Étape 3 : Informations spécifiques */}
            {formStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem' }}>✍️ Éléments clés à intégrer</h3>
                
                {selectedDoc.id === 'lettre' && (
                  <textarea 
                    placeholder="Résumez vos compétences et votre expérience (Ex: 3 ans d'expérience en comptabilité, maîtrise de Sage, dynamique et rigoureux)" 
                    value={formData.details} 
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })} 
                    style={{ ...inputStyle, minHeight: '140px' }} 
                  />
                )}

                {selectedDoc.id === 'bail' && (
                  <textarea placeholder="Description précise des locaux (Ex: Appartement 3 chambres situé au 2ème étage à Bastos)" value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} style={{ ...inputStyle, minHeight: '120px' }} />
                )}

                {selectedDoc.id === 'facture' && (
                  <textarea placeholder="Détails des prestations / marchandises" value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} style={{ ...inputStyle, minHeight: '120px' }} />
                )}

                {selectedDoc.id === 'cv' && (
                  <textarea placeholder="Parcours et formations" value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} style={{ ...inputStyle, minHeight: '120px' }} />
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              {formStep > 1 && (
                <button onClick={() => setFormStep(formStep - 1)} style={{ flex: 1, backgroundColor: '#0B132B', color: '#FFF', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Retour
                </button>
              )}
              <button onClick={() => formStep < 3 ? setFormStep(formStep + 1) : setStep('preview')} style={{ flex: 2, backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {formStep === 3 ? 'Aperçu du document →' : 'Continuer →'}
              </button>
            </div>
          </div>
        )}

        {/* 3. APERÇU SPÉCIMEN */}
        {step === 'preview' && selectedDoc && (
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>Votre document est généré</h2>
            <div style={{ backgroundColor: '#FFF', color: '#000', padding: '1.5rem', borderRadius: '8px', position: 'relative', overflow: 'hidden', minHeight: '300px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
              <div style={{ position: 'absolute', top: '40%', left: '10%', transform: 'rotate(-30deg)', fontSize: '3rem', fontWeight: '900', color: 'rgba(230, 57, 70, 0.25)', pointerEvents: 'none' }}>
                SPÉCIMEN
              </div>
              <h3 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>{selectedDoc.title.toUpperCase()}</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}><strong>Expéditeur :</strong> {formData.name}</p>
              <p style={{ fontSize: '0.85rem' }}><strong>Destinataire :</strong> {formData.recipient || 'N/A'}</p>
              <p style={{ fontSize: '0.85rem' }}><strong>Objet :</strong> {selectedDoc.id === 'lettre' ? `Candidature au poste de ${formData.amount}` : selectedDoc.title}</p>
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

        {/* 5. SUCCÈS & RENDER PDF EN BONNE ET DUE FORME */}
        {step === 'success' && selectedDoc && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#1C2541', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.4rem', color: '#4CC9F0', marginBottom: '0.5rem' }}>Votre document est disponible !</h2>

            {/* DOCUMENT GENERATION CONTAINER (CACHÉ POUR LA CAPTURE PDF) */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <div ref={documentRef} style={{ width: '794px', minHeight: '1123px', backgroundColor: '#FFF', color: '#111', padding: '4rem', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}>
                
                {/* 📄 CAS 1 : LETTRE DE MOTIVATION EN BONNE ET DUE FORME */}
                {selectedDoc.id === 'lettre' && (
                  <div>
                    {/* En-tête Expéditeur & Destinataire */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                      <div style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>{formData.name || 'Nom & Prénom'}</p>
                        <p style={{ margin: 0 }}>{formData.address || 'Adresse / Ville'}</p>
                        <p style={{ margin: 0 }}>Tél : {formData.phone || '06000000'}</p>
                        <p style={{ margin: 0 }}>Email : {formData.email || 'email@exemple.com'}</p>
                      </div>
                      <div style={{ fontSize: '1rem', lineHeight: '1.5', textAlign: 'right' }}>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>À l'attention de : {formData.recipient || 'La Direction des Ressources Humaines'}</p>
                        <p style={{ margin: 0 }}>{formData.recipientAddress || 'Ville'}</p>
                      </div>
                    </div>

                    <p style={{ textAlign: 'right', marginBottom: '2rem' }}>Fait le {new Date().toLocaleDateString('fr-FR')}</p>

                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '2rem' }}>
                      Objet : Candidature au poste de {formData.amount || '................................'}
                    </p>

                    <div style={{ fontSize: '1.1rem', lineHeight: '1.8', textAlign: 'justify' }}>
                      <p>Madame, Monsieur,</p>

                      <p>
                        C'est avec un vif intérêt que je vous adresse ma candidature pour le poste de <strong>{formData.amount || 'professionnel'}</strong> au sein de votre structure.
                      </p>

                      <p>
                        Au cours de mon parcours, j'ai développé de solides compétences dans ce domaine. 
                        {formData.details ? ` Notamment : ${formData.details}.` : " Mon expérience m'a permis d'acquérir une rigueur et une capacité d'adaptation essentielles."}
                      </p>

                      <p>
                        Intégrer votre équipe représente pour moi une réelle opportunité de mettre mes compétences au service de vos objectifs stratégiques tout en continuant d'évoluer professionnellement.
                      </p>

                      <p>
                        Restant à votre entière disposition pour tout entretien à votre convenance, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.
                      </p>
                    </div>

                    <div style={{ marginTop: '4rem', float: 'right', textAlign: 'center' }}>
                      <p style={{ marginBottom: '3rem' }}><strong>{formData.name}</strong></p>
                      <p style={{ fontSize: '0.85rem', color: '#666' }}>(Signature)</p>
                    </div>
                  </div>
                )}

                {/* 📄 CAS 2 : CONTRAT DE BAIL EN BONNE ET DUE FORME */}
                {selectedDoc.id === 'bail' && (
                  <div>
                    <h1 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.5rem', fontSize: '1.6rem' }}>CONTRAT DE BAIL À USAGE D'HABITATION</h1>
                    
                    <div style={{ fontSize: '1rem', lineHeight: '1.8', marginTop: '2rem', textAlign: 'justify' }}>
                      <p><strong>ENTRE LES SOUSSIGNÉS :</strong></p>
                      <p><strong>Le Bailleur :</strong> M./Mme <strong>{formData.name}</strong>, domicilié(e) à {formData.address}, Tél : {formData.phone}.</p>
                      <p><strong>Et Le Preneur :</strong> M./Mme <strong>{formData.recipient || '................................'}</strong>.</p>

                      <p style={{ marginTop: '1.5rem' }}><strong>IL A ÉTÉ CONVENU CE QUI SUIT :</strong></p>
                      <p><strong>Article 1 - Objet :</strong> Le Bailleur donne à bail à loyer au Preneur les locaux désignés ci-après : {formData.details || 'Locaux à usage d habitation'}.</p>
                      <p><strong>Article 2 - Loyer :</strong> Le présent bail est consenti et accepté moyennant un loyer mensuel de <strong>{formData.amount || '........'} FCFA</strong>, payable d'avance le 05 de chaque mois.</p>
                      <p><strong>Article 3 - Obligations :</strong> Le Preneur s'engage à maintenir les lieux en bon état et à les utiliser de manière paisible.</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                        <div>
                          <p>Le Bailleur</p>
                        </div>
                        <div>
                          <p>Le Preneur</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 📄 CAS 3 : FACTURE PROFORMA */}
                {selectedDoc.id === 'facture' && (
                  <div>
                    <h1 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '2rem' }}>FACTURE PROFORMA</h1>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                      <div>
                        <p><strong>Émetteur :</strong> {formData.name}</p>
                        <p>Tél : {formData.phone}</p>
                      </div>
                      <div>
                        <p><strong>Client :</strong> {formData.recipient}</p>
                        <p>Date : {new Date().toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                          <th style={{ border: '1px solid #dddddd', padding: '8px', textAlign: 'left' }}>Description</th>
                          <th style={{ border: '1px solid #dddddd', padding: '8px', textAlign: 'right' }}>Total (FCFA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{formData.details}</td>
                          <td style={{ border: '1px solid #dddddd', padding: '8px', textAlign: 'right' }}>{formData.amount} FCFA</td>
                        </tr>
                      </tbody>
                    </table>

                    <h2 style={{ textAlign: 'right', marginTop: '2rem' }}>Total à payer : {formData.amount} FCFA</h2>
                  </div>
                )}

              </div>
            </div>

            <button 
              onClick={generatePDF}
              disabled={isGenerating}
              style={{ width: '100%', backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem' }}>
              {isGenerating ? 'Génération en cours...' : '⬇️ TÉLÉCHARGER LE DOCUMENT REDIGÉ'}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
