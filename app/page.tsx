// app/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PRODUCTS, Product } from '@/lib/products';
import { DocumentRenderer } from '@/components/DocumentRenderer';

type Step = 'HOME' | 'DETAILS' | 'FORM' | 'VERIFY' | 'PREVIEW' | 'PAYMENT' | 'PENDING' | 'SUCCESS';

export default function Home() {
  const [step, setStep] = useState<Step>('HOME');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  // État générique des formulaires
  const [formData, setFormData] = useState<any>({});
  const [repeatableItems, setRepeatableItems] = useState<any[]>([{ designation: '', qte: 1, pu: 0, remise: 0 }]);
  const [experiences, setExperiences] = useState<any[]>([{ poste: '', entreprise: '', ville: '', date_debut: '', date_fin: '', actuel: false, missions: '', realisations: '' }]);
  const [formations, setFormations] = useState<any[]>([{ diplome: '', etablissement: '', ville: '', date_debut: '', date_fin: '' }]);
  
  // État Pack Entrepreneur
  const [selectedPackDocs, setSelectedPackDocs] = useState<string[]>([]);

  // Commande & Génération
  const [orderRef, setOrderRef] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  // Informations utilisateur réutilisables (Profil enregistré)
  const [savedUser, setSavedUser] = useState({
    nom: 'Atangana',
    prenom: 'Désiré',
    phone: '690000000',
    whatsapp: '690000000',
    email: 'contact@dezy.cm',
    adresse: 'Bastos',
    ville: 'Yaoundé',
    entreprise: 'DocExpress Studio',
    niu: 'M052600012345P',
    rccm: 'RC/YAO/2026/B/100'
  });

  // Sélection d'un produit
  const handleSelectProduct = (prod: Product) => {
    setActiveProduct(prod);
    // Pré-remplissage si données profil sauvegardées
    setFormData({
      bailleur_nom: `${savedUser.nom} ${savedUser.prenom}`,
      bailleur_phone: savedUser.phone,
      bailleur_adresse: `${savedUser.adresse}, ${savedUser.ville}`,
      vendeur_entreprise: savedUser.entreprise,
      vendeur_nom: `${savedUser.nom} ${savedUser.prenom}`,
      vendeur_phone: savedUser.phone,
      vendeur_whatsapp: savedUser.whatsapp,
      vendeur_email: savedUser.email,
      vendeur_adresse: savedUser.adresse,
      vendeur_ville: savedUser.ville,
      vendeur_niu: savedUser.niu,
      vendeur_rccm: savedUser.rccm,
      nom: savedUser.nom,
      prenom: savedUser.prenom,
      phone: savedUser.phone,
      whatsapp: savedUser.whatsapp,
      email: savedUser.email,
      ville: savedUser.ville,
      adresse: savedUser.adresse,
      candidat_nom: savedUser.nom,
      candidat_prenom: savedUser.prenom,
      candidat_phone: savedUser.phone,
      candidat_email: savedUser.email,
      candidat_adresse: savedUser.adresse,
      candidat_ville: savedUser.ville,
      fait_a: savedUser.ville,
      fait_le: new Date().toLocaleDateString('fr-FR')
    });
    setStep('DETAILS');
  };

  // Ajout de lignes dynamiques pour Factures/Bons de commande
  const handleAddItem = () => {
    setRepeatableItems([...repeatableItems, { designation: '', qte: 1, pu: 0, remise: 0 }]);
  };

  // Passage de commande (Calcul du total côté serveur/produit)
  const handleCreateOrder = () => {
    const generatedRef = `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderRef(generatedRef);

    // Injection des éléments répétables et calculs
    const finalData = {
      ...formData,
      items: repeatableItems,
      experiences,
      formations,
      auto_num: `${activeProduct?.id.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
      auto_date: new Date().toLocaleDateString('fr-FR'),
      // Calcul automatique sous-total/total pour factures
      subtotal: repeatableItems.reduce((acc, item) => acc + (Number(item.qte || 0) * Number(item.pu || 0)), 0),
      total_remise: repeatableItems.reduce((acc, item) => acc + Number(item.remise || 0), 0),
      total_final: repeatableItems.reduce((acc, item) => acc + ((Number(item.qte || 0) * Number(item.pu || 0)) - Number(item.remise || 0)), 0)
    };

    setFormData(finalData);
    setStep('PREVIEW');
  };

  // Génération du PDF
  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setIsGenerating(true);

    try {
      const element = documentRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${activeProduct?.id}_${orderRef}.pdf`);
    } catch (err) {
      console.error("Erreur d'impression :", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0B132B', color: '#FFF', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* EN-TÊTE */}
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #1C2541', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => setStep('HOME')}>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4CC9F0' }}>DOCEXPRESS</span>
          <span style={{ fontSize: '0.75rem', display: 'block', color: '#8D99AE' }}>Vos documents officiels au Cameroun</span>
        </div>
        {savedUser && (
          <div style={{ fontSize: '0.8rem', backgroundColor: '#1C2541', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #3A506B' }}>
            👤 {savedUser.nom} ({savedUser.entreprise})
          </div>
        )}
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>

        {/* ÉTAPE 1 : ACCUEIL & SELECTION */}
        {step === 'HOME' && (
          <div>
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <h1 style={{ fontSize: '2rem' }}>Créez vos documents en 3 minutes</h1>
              <p style={{ color: '#8D99AE' }}>Sélectionnez un document parmi nos 12 offres pour commencer.</p>
            </div>

            {['LOCATION & IMMOBILIER', 'ENTREPRISE & COMMERCE', 'EMPLOI & CARRIÈRE', 'PACKS'].map((cat) => (
              <div key={cat} style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#4CC9F0', borderBottom: '1px solid #1C2541', paddingBottom: '0.5rem' }}>{cat}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  {Object.values(PRODUCTS).filter(p => p.category === cat).map((prod) => (
                    <div 
                      key={prod.id} 
                      onClick={() => handleSelectProduct(prod)}
                      style={{ backgroundColor: '#1C2541', border: '1px solid #3A506B', borderRadius: '10px', padding: '1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {prod.badge && <span style={{ backgroundColor: '#4361EE', color: '#FFF', fontSize: '0.65rem', padding: '0.2rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>{prod.badge}</span>}
                        <h4 style={{ margin: '0.5rem 0' }}>{prod.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#8D99AE' }}>{prod.description}</p>
                      </div>
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#4CC9F0' }}>{prod.priceFormatted}</span>
                        <span style={{ fontSize: '0.85rem' }}>Choisir →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ÉTAPE 1 SUITE : PRÉSENTATION DU PRODUIT */}
        {step === 'DETAILS' && activeProduct && (
          <div style={{ backgroundColor: '#1C2541', padding: '2rem', borderRadius: '12px', border: '1px solid #3A506B' }}>
            <span style={{ fontSize: '0.8rem', color: '#4CC9F0' }}>{activeProduct.category}</span>
            <h1 style={{ margin: '0.5rem 0' }}>{activeProduct.title}</h1>
            <p style={{ color: '#8D99AE' }}>{activeProduct.description}</p>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CC9F0', margin: '1.5rem 0' }}>
              Prix : {activeProduct.priceFormatted}
            </div>
            <button 
              onClick={() => setStep('FORM')}
              style={{ width: '100%', backgroundColor: '#4361EE', color: '#FFF', padding: '1rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              Remplir le formulaire →
            </button>
          </div>
        )}

        {/* ÉTAPE 2 : FORMULAIRE SPÉCIFIQUE */}
        {step === 'FORM' && activeProduct && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '12px', border: '1px solid #3A506B' }}>
            <h2>Formulaire : {activeProduct.title}</h2>
            <p style={{ fontSize: '0.85rem', color: '#8D99AE', marginBottom: '1.5rem' }}>Saisissez vos informations spécifiques.</p>

            {/* FORMULAIRES CONDITIONNELS SELON LE PRODUIT */}
            
            {/* 1. BAIL */}
            {activeProduct.id === 'bail' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4>Informations du Bailleur</h4>
                <input placeholder="Nom et prénom(s)" value={formData.bailleur_nom || ''} onChange={(e) => setFormData({...formData, bailleur_nom: e.target.value})} style={inputStyle} />
                <input placeholder="Téléphone" value={formData.bailleur_phone || ''} onChange={(e) => setFormData({...formData, bailleur_phone: e.target.value})} style={inputStyle} />
                <input placeholder="Adresse" value={formData.bailleur_adresse || ''} onChange={(e) => setFormData({...formData, bailleur_adresse: e.target.value})} style={inputStyle} />
                <input placeholder="Profession" value={formData.bailleur_profession || ''} onChange={(e) => setFormData({...formData, bailleur_profession: e.target.value})} style={inputStyle} />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input placeholder="Type pièce (CNI/Passeport)" value={formData.bailleur_type_id || ''} onChange={(e) => setFormData({...formData, bailleur_type_id: e.target.value})} style={inputStyle} />
                  <input placeholder="N° Pièce" value={formData.bailleur_num_id || ''} onChange={(e) => setFormData({...formData, bailleur_num_id: e.target.value})} style={inputStyle} />
                </div>

                <h4>Informations du Locataire</h4>
                <input placeholder="Nom et prénom(s) locataire" value={formData.locataire_nom || ''} onChange={(e) => setFormData({...formData, locataire_nom: e.target.value})} style={inputStyle} />
                <input placeholder="Téléphone locataire" value={formData.locataire_phone || ''} onChange={(e) => setFormData({...formData, locataire_phone: e.target.value})} style={inputStyle} />
                <input placeholder="Adresse locataire" value={formData.locataire_adresse || ''} onChange={(e) => setFormData({...formData, locataire_adresse: e.target.value})} style={inputStyle} />

                <h4>Conditions Financières</h4>
                <input type="number" placeholder="Loyer mensuel (FCFA)" value={formData.loyer_montant || ''} onChange={(e) => setFormData({...formData, loyer_montant: e.target.value})} style={inputStyle} />
                <input type="number" placeholder="Caution (FCFA)" value={formData.loyer_caution || ''} onChange={(e) => setFormData({...formData, loyer_caution: e.target.value})} style={inputStyle} />
              </div>
            )}

            {/* 5. FACTURE & 6. PROFORMA */}
            {(activeProduct.id === 'facture' || activeProduct.id === 'proforma') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4>Informations Client</h4>
                <input placeholder="Nom du Client / Entreprise" value={formData.client_nom || ''} onChange={(e) => setFormData({...formData, client_nom: e.target.value})} style={inputStyle} />
                <input placeholder="Téléphone Client" value={formData.client_phone || ''} onChange={(e) => setFormData({...formData, client_phone: e.target.value})} style={inputStyle} />
                <input placeholder="Objet de la facture" value={formData.facture_objet || ''} onChange={(e) => setFormData({...formData, facture_objet: e.target.value})} style={inputStyle} />

                <h4>Articles / Services (Champs répétables)</h4>
                {repeatableItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#0B132B', padding: '0.5rem', borderRadius: '6px' }}>
                    <input placeholder="Désignation" value={item.designation} onChange={(e) => {
                      const updated = [...repeatableItems]; updated[idx].designation = e.target.value; setRepeatableItems(updated);
                    }} style={inputStyle} />
                    <input type="number" placeholder="Qté" value={item.qte} onChange={(e) => {
                      const updated = [...repeatableItems]; updated[idx].qte = e.target.value; setRepeatableItems(updated);
                    }} style={{ ...inputStyle, width: '70px' }} />
                    <input type="number" placeholder="P.U" value={item.pu} onChange={(e) => {
                      const updated = [...repeatableItems]; updated[idx].pu = e.target.value; setRepeatableItems(updated);
                    }} style={{ ...inputStyle, width: '100px' }} />
                  </div>
                ))}
                <button onClick={handleAddItem} style={{ backgroundColor: '#3A506B', color: '#FFF', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>+ Ajouter une ligne</button>
              </div>
            )}

            {/* 5. PACK ENTREPRENEUR */}
            {activeProduct.id === 'pack_entrepreneur' && (
              <div>
                <h4>Sélectionnez 5 documents inclus dans votre Pack :</h4>
                {['facture', 'proforma', 'recu_vente', 'bon_commande', 'quittance', 'recu_loyer'].map((docId) => (
                  <label key={docId} style={{ display: 'block', margin: '0.5rem 0' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedPackDocs.includes(docId)} 
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedPackDocs.length < 5) setSelectedPackDocs([...selectedPackDocs, docId]);
                        } else {
                          setSelectedPackDocs(selectedPackDocs.filter(id => id !== docId));
                        }
                      }} 
                    /> {PRODUCTS[docId]?.title}
                  </label>
                ))}
                <p style={{ fontSize: '0.8rem', color: '#4CC9F0' }}>Sélectionnés : {selectedPackDocs.length} / 5</p>
              </div>
            )}

            {/* FORMULAIRES AUTRES PRODUITS SIMPLIFIÉS EN REPRISE DU MÊME PATTERN */}
            {!['bail', 'facture', 'proforma', 'pack_entrepreneur'].includes(activeProduct.id) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input placeholder="Nom / Intitulé principal" value={formData.nom || ''} onChange={(e) => setFormData({...formData, nom: e.target.value})} style={inputStyle} />
                <textarea placeholder="Détails complémentaires..." value={formData.details || ''} onChange={(e) => setFormData({...formData, details: e.target.value})} style={{ ...inputStyle, minHeight: '100px' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setStep('DETAILS')} style={{ flex: 1, backgroundColor: '#0B132B', color: '#FFF', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '8px' }}>Retour</button>
              <button onClick={() => setStep('VERIFY')} style={{ flex: 2, backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold' }}>Vérifier les données →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : VÉRIFICATION DES INFORMATIONS */}
        {step === 'VERIFY' && activeProduct && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '12px', border: '1px solid #3A506B' }}>
            <h2>Vérification des informations</h2>
            <p style={{ color: '#8D99AE', fontSize: '0.85rem' }}>Assurez-vous que toutes les données saisies sont exactes avant la génération du spécimen.</p>
            
            <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '8px', margin: '1rem 0', fontSize: '0.85rem', lineHeight: '1.8' }}>
              {Object.entries(formData).map(([key, val]) => (
                typeof val === 'string' && val ? <div key={key}><strong>{key} :</strong> {val}</div> : null
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setStep('FORM')} style={{ flex: 1, backgroundColor: '#0B132B', color: '#FFF', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '8px' }}>Modifier</button>
              <button onClick={handleCreateOrder} style={{ flex: 2, backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold' }}>Générer l’aperçu →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 : APERÇU SPÉCIMEN */}
        {step === 'PREVIEW' && activeProduct && (
          <div>
            <h2 style={{ textAlign: 'center' }}>Aperçu de votre document</h2>
            <p style={{ textAlign: 'center', color: '#8D99AE', fontSize: '0.85rem' }}>Filigrane spécimen activé. Validez pour commander.</p>

            <div style={{ margin: '1.5rem 0' }}>
              <DocumentRenderer productId={activeProduct.id} data={formData} isWatermarked={true} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setStep('VERIFY')} style={{ flex: 1, backgroundColor: '#1C2541', color: '#FFF', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '8px' }}>Modifier</button>
              <button onClick={() => setStep('PAYMENT')} style={{ flex: 2, backgroundColor: '#25D366', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold' }}>Commander & Payer ({activeProduct.priceFormatted}) →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 6 & 7 : PAIEMENT & SIGNALEMENT */}
        {step === 'PAYMENT' && activeProduct && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '12px', border: '1px solid #3A506B' }}>
            <h2>Paiement Mobile Money</h2>
            <p style={{ fontSize: '0.85rem', color: '#8D99AE' }}>Référence de commande : <strong>{orderRef}</strong></p>
            <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '8px', margin: '1rem 0' }}>
              <p style={{ margin: 0 }}>Montant exact à envoyer : <strong style={{ color: '#4CC9F0' }}>{activeProduct.priceFormatted}</strong></p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderLeft: '4px solid #FF7900', backgroundColor: '#0B132B', padding: '1rem', borderRadius: '6px' }}>
                <strong>Orange Money Cameroun</strong><br />N° : 6XX XX XX XX (DocExpress)
              </div>
              <div style={{ borderLeft: '4px solid #FFCC00', backgroundColor: '#0B132B', padding: '1rem', borderRadius: '6px' }}>
                <strong>MTN Mobile Money Cameroun</strong><br />N° : 6XX XX XX XX (DocExpress)
              </div>
            </div>

            <button onClick={() => setStep('PENDING')} style={{ width: '100%', marginTop: '1.5rem', backgroundColor: '#25D366', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              🟢 J'AI EFFECTUÉ LE PAIEMENT
            </button>
          </div>
        )}

        {/* ÉTAPE 7 & 8 : SIGNALEMENT & VÉRIFICATION MANUELLE ADMIN */}
        {step === 'PENDING' && (
          <div style={{ textAlign: 'center', backgroundColor: '#1C2541', padding: '2rem', borderRadius: '12px', border: '1px solid #3A506B' }}>
            <div style={{ fontSize: '3rem' }}>⏳</div>
            <h2>PAIEMENT EN COURS DE VÉRIFICATION</h2>
            <p style={{ color: '#8D99AE', fontSize: '0.9rem' }}>Notre équipe vérifie le transfert pour la commande <strong>{orderRef}</strong>.</p>
            
            {/* Simulation de validation admin manuelle pour démo */}
            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed #3A506B', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.75rem', color: '#8D99AE' }}>[Espace Simulation Administrateur]</p>
              <button onClick={() => setStep('SUCCESS')} style={{ backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                Valider le paiement manuellement
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 9 & 10 : CONFIRMATION & TÉLÉCHARGEMENT PDF NETTOYÉ */}
        {step === 'SUCCESS' && activeProduct && (
          <div style={{ textAlign: 'center', backgroundColor: '#1C2541', padding: '2rem', borderRadius: '12px', border: '1px solid #3A506B' }}>
            <div style={{ fontSize: '3rem' }}>🎉</div>
            <h2 style={{ color: '#4CC9F0' }}>VOTRE DOCUMENT EST PRÊT !</h2>
            <p style={{ color: '#8D99AE' }}>Le paiement a été validé. Le filigrane spécimen a été retiré.</p>

            {/* DOM Masqué pour Capture PDF Propre sans filigrane */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <div ref={documentRef} style={{ width: '800px' }}>
                <DocumentRenderer productId={activeProduct.id} data={formData} isWatermarked={false} />
              </div>
            </div>

            <button 
              onClick={handleDownloadPDF} 
              disabled={isGenerating}
              style={{ width: '100%', backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', margin: '1.5rem 0' }}>
              {isGenerating ? 'Génération du PDF...' : '⬇️ Télécharger mon PDF'}
            </button>

            <button onClick={() => setStep('HOME')} style={{ backgroundColor: 'transparent', color: '#8D99AE', border: 'none', cursor: 'pointer' }}>
              Créer un autre document
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem',
  borderRadius: '6px',
  border: '1px solid #3A506B',
  backgroundColor: '#0B132B',
  color: '#FFF',
  boxSizing: 'border-box'
};
