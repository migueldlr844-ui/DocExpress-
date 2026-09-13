'use client';

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- CONFIGURATION DYNAMIQUE DES 12 PRODUITS ---
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'select';
  placeholder?: string;
  options?: string[];
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
  contrat_bail: {
    id: 'contrat_bail',
    title: 'Contrat de bail d’habitation',
    category: 'IMMOBILIER',
    price: '1 000 FCFA',
    desc: 'Bail d’habitation complet sécurisé avec clauses d’occupation.',
    fields: [
      { id: 'bailleur_nom', label: 'Nom du bailleur', type: 'text', placeholder: 'Ex: MBARGA', step: 1, required: true },
      { id: 'bailleur_prenom', label: 'Prénom(s) du bailleur', type: 'text', placeholder: 'Ex: Paul', step: 1, required: true },
      { id: 'bailleur_phone', label: 'Téléphone bailleur', type: 'text', placeholder: 'Ex: 6XX XX XX XX', step: 1, required: true },
      { id: 'bailleur_adresse', label: 'Adresse bailleur', type: 'text', step: 1 },
      { id: 'locataire_nom', label: 'Nom du locataire', type: 'text', placeholder: 'Ex: KOUAM', step: 2, required: true },
      { id: 'locataire_prenom', label: 'Prénom(s) du locataire', type: 'text', step: 2, required: true },
      { id: 'locataire_phone', label: 'Téléphone locataire', type: 'text', step: 2, required: true },
      { id: 'logement_type', label: 'Type de logement', type: 'select', options: ['Studio', 'Appartement', 'Chambre', 'Maison villa'], step: 3, required: true },
      { id: 'logement_ville', label: 'Ville & Quartier', type: 'text', placeholder: 'Ex: Yaoundé, Bastos', step: 3, required: true },
      { id: 'loyer_montant', label: 'Loyer mensuel (FCFA)', type: 'number', placeholder: 'Ex: 75000', step: 3, required: true },
      { id: 'caution_montant', label: 'Montant de la caution (FCFA)', type: 'number', step: 3 },
      { id: 'date_debut', label: 'Date de début du bail', type: 'text', placeholder: 'JJ/MM/AAAA', step: 3, required: true }
    ]
  },
  quittance_loyer: {
    id: 'quittance_loyer',
    title: 'Quittance de loyer',
    category: 'IMMOBILIER',
    price: '500 FCFA',
    desc: 'Attestation officielle de paiement intégral du loyer mensuel.',
    fields: [
      { id: 'bailleur_nom', label: 'Nom complet du bailleur', type: 'text', step: 1, required: true },
      { id: 'bailleur_phone', label: 'Téléphone bailleur', type: 'text', step: 1 },
      { id: 'locataire_nom', label: 'Nom complet du locataire', type: 'text', step: 1, required: true },
      { id: 'logement_adresse', label: 'Adresse du logement', type: 'text', placeholder: 'Ex: Omnisports, Yaoundé', step: 2, required: true },
      { id: 'periode', label: 'Période / Mois concerné', type: 'text', placeholder: 'Ex: Mois de Septembre 2026', step: 2, required: true },
      { id: 'loyer_montant', label: 'Montant du loyer (FCFA)', type: 'number', step: 2, required: true },
      { id: 'paiement_date', label: 'Date de paiement', type: 'text', placeholder: 'JJ/MM/AAAA', step: 3, required: true },
      { id: 'paiement_mode', label: 'Mode de paiement', type: 'select', options: ['Espèces', 'Orange Money', 'MTN Mobile Money', 'Virement bancaire'], step: 3, required: true }
    ]
  },
  recu_loyer: {
    id: 'recu_loyer',
    title: 'Reçu de paiement de loyer',
    category: 'IMMOBILIER',
    price: '500 FCFA',
    desc: 'Preuve de paiement partiel ou d’acompte sur le loyer.',
    fields: [
      { id: 'receveur_nom', label: 'Nom du bénéficiaire (Bailleur)', type: 'text', step: 1, required: true },
      { id: 'payeur_nom', label: 'Nom du payeur (Locataire)', type: 'text', step: 1, required: true },
      { id: 'logement_adresse', label: 'Adresse du logement', type: 'text', step: 2, required: true },
      { id: 'montant', label: 'Montant perçu (FCFA)', type: 'number', step: 2, required: true },
      { id: 'motif', label: 'Motif du paiement', type: 'text', placeholder: 'Ex: Acompte loyer Septembre', step: 2, required: true },
      { id: 'reste_a_payer', label: 'Reste éventuel à payer (FCFA)', type: 'number', step: 3 }
    ]
  },
  attestation_location: {
    id: 'attestation_location',
    title: 'Attestations locatives',
    category: 'IMMOBILIER',
    price: '500 FCFA',
    desc: 'Attestations d’hébergement, de location ou de paiement.',
    fields: [
      { id: 'attestation_type', label: 'Type d’attestation', type: 'select', options: ['Attestation d’hébergement', 'Attestation de location', 'Attestation de paiement de loyer'], step: 1, required: true },
      { id: 'declarant_nom', label: 'Nom complet du déclarant', type: 'text', step: 1, required: true },
      { id: 'declarant_adresse', label: 'Adresse du déclarant', type: 'text', step: 1, required: true },
      { id: 'beneficiaire_nom', label: 'Nom complet du bénéficiaire', type: 'text', step: 2, required: true },
      { id: 'date_debut', label: 'Réside / Hébergé depuis le', type: 'text', placeholder: 'JJ/MM/AAAA', step: 2, required: true }
    ]
  },
  facture_simple: {
    id: 'facture_simple',
    title: 'Facture simple',
    category: 'BUSINESS',
    price: '1 000 FCFA',
    desc: 'Facture commerciale claire avec calculs des totaux.',
    fields: [
      { id: 'vendeur_nom', label: 'Nom commercial / Entreprise', type: 'text', step: 1, required: true },
      { id: 'vendeur_phone', label: 'Téléphone / WhatsApp', type: 'text', step: 1, required: true },
      { id: 'client_nom', label: 'Nom du client / Entreprise', type: 'text', step: 2, required: true },
      { id: 'objets_factures', label: 'Détail des prestations ou articles', type: 'textarea', placeholder: 'Ex: 2x Conception Logo (15000), 1x Impression Bâche (20000)', step: 3, required: true }
    ]
  },
  facture_proforma: {
    id: 'facture_proforma',
    title: 'Facture proforma',
    category: 'BUSINESS',
    price: '1 000 FCFA',
    desc: 'Devis et offre commerciale officielle avant prestation.',
    fields: [
      { id: 'vendeur_nom', label: 'Nom de votre entreprise', type: 'text', step: 1, required: true },
      { id: 'client_nom', label: 'Client destinataire', type: 'text', step: 1, required: true },
      { id: 'validite', label: 'Validité de l’offre', type: 'text', placeholder: 'Ex: 15 jours', step: 2, required: true },
      { id: 'objets_factures', label: 'Services ou produits proposés', type: 'textarea', placeholder: 'Ex: 1x Maintenance informatique (50000)', step: 3, required: true }
    ]
  },
  recu_vente: {
    id: 'recu_vente',
    title: 'Reçu de vente',
    category: 'BUSINESS',
    price: '500 FCFA',
    desc: 'Justificatif de vente directe de produits ou services.',
    fields: [
      { id: 'vendeur_nom', label: 'Nom du vendeur / Boutique', type: 'text', step: 1, required: true },
      { id: 'acheteur_nom', label: 'Nom de l’acheteur', type: 'text', step: 1, required: true },
      { id: 'articles_liste', label: 'Désignation des articles achetés', type: 'textarea', step: 2, required: true },
      { id: 'montant_recu', label: 'Montant encaissé (FCFA)', type: 'number', step: 3, required: true }
    ]
  },
  bon_commande: {
    id: 'bon_commande',
    title: 'Bon de commande',
    category: 'BUSINESS',
    price: '1 000 FCFA',
    desc: 'Ordre d’achat officiel adressé à un fournisseur.',
    fields: [
      { id: 'acheteur_nom', label: 'Nom de votre entreprise', type: 'text', step: 1, required: true },
      { id: 'fournisseur_nom', label: 'Nom du fournisseur', type: 'text', step: 1, required: true },
      { id: 'produits_commandes', label: 'Liste des produits commandés', type: 'textarea', step: 2, required: true },
      { id: 'livraison_adresse', label: 'Lieu de livraison souhaité', type: 'text', step: 3, required: true }
    ]
  },
  cv: {
    id: 'cv',
    title: 'CV professionnel',
    category: 'CARRIÈRE',
    price: '1 000 FCFA',
    badge: 'POPULAIRE',
    desc: 'Format moderne optimisé pour le marché de l’emploi.',
    fields: [
      { id: 'name', label: 'Nom complet', type: 'text', step: 1, required: true },
      { id: 'phone', label: 'Téléphone & WhatsApp', type: 'text', step: 1, required: true },
      { id: 'jobTitle', label: 'Poste visé', type: 'text', placeholder: 'Ex: Commercial terrain', step: 2, required: true },
      { id: 'experience', label: 'Vos expériences (Postes, entreprises, tâches)', type: 'textarea', step: 3, required: true },
      { id: 'education', label: 'Formations & Diplômes', type: 'textarea', step: 3 }
    ]
  },
  lettre: {
    id: 'lettre',
    title: 'Lettre de motivation',
    category: 'CARRIÈRE',
    price: '500 FCFA',
    badge: 'POPULAIRE',
    desc: 'Rédigée sur mesure et au format professionnel.',
    fields: [
      { id: 'name', label: 'Nom & Prénom', type: 'text', step: 1, required: true },
      { id: 'phone', label: 'Téléphone', type: 'text', step: 1, required: true },
      { id: 'address', label: 'Ville / Adresse', type: 'text', step: 1 },
      { id: 'jobTitle', label: 'Poste recherché', type: 'text', step: 2, required: true },
      { id: 'recipient', label: 'Entreprise / Destinataire', type: 'text', step: 2, required: true },
      { id: 'experience', label: 'Vos points forts & Parcours', type: 'textarea', step: 3, required: true },
      { id: 'motivation', label: 'Pourquoi ce poste ?', type: 'textarea', step: 3, required: true }
    ]
  },
  pack_emploi: {
    id: 'pack_emploi',
    title: 'Pack Emploi (CV + Lettre)',
    category: 'PACKS',
    price: '1 500 FCFA',
    badge: 'MEILLEURE OFFRE',
    desc: 'Formulaire unique pour obtenir votre CV et votre Lettre.',
    fields: [
      { id: 'name', label: 'Nom complet', type: 'text', step: 1, required: true },
      { id: 'phone', label: 'Téléphone & WhatsApp', type: 'text', step: 1, required: true },
      { id: 'jobTitle', label: 'Poste recherché', type: 'text', step: 2, required: true },
      { id: 'recipient', label: 'Entreprise visée', type: 'text', step: 2, required: true },
      { id: 'experience', label: 'Parcours & Expériences', type: 'textarea', step: 3, required: true }
    ]
  },
  pack_entrepreneur: {
    id: 'pack_entrepreneur',
    title: 'Pack Entrepreneur (5 documents)',
    category: 'PACKS',
    price: '4 000 FCFA',
    badge: 'PRO',
    desc: '5 documents administratifs ou commerciaux pour votre entreprise.',
    fields: [
      { id: 'vendeur_nom', label: 'Nom de votre entreprise', type: 'text', step: 1, required: true },
      { id: 'vendeur_phone', label: 'Téléphone pro / WhatsApp', type: 'text', step: 1, required: true },
      { id: 'docs_selection', label: 'Précisez les 5 documents souhaités', type: 'textarea', step: 2, required: true }
    ]
  }
};

export default function Home() {
  const [step, setStep] = useState<'home' | 'form' | 'review' | 'preview' | 'payment' | 'success'>('home');
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
      setGeneratedBody(`
        <p>Document rédigé avec succès selon les informations fournies.</p>
        <p><strong>Bénéficiaire :</strong> ${formData.name || formData.client_nom || formData.locataire_nom || 'Client'}</p>
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
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>

        {/* 1. ACCUEIL */}
        {step === 'home' && (
          <div>
            <section style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '0.8rem' }}>
                Vos documents professionnels rédigés sur mesure.
              </h1>
              <p style={{ color: '#8D99AE', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Transformez vos informations en documents officiels instantanément.
              </p>
            </section>

            <section>
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
                        style={{ ...inputStyle, minHeight: '90px' }}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        style={inputStyle}>
                        <option value="">Sélectionnez...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
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
                <button onClick={() => setFormStep(formStep - 1)} style={{ flex: 1, backgroundColor: '#0B132B', color: '#FFF', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Retour
                </button>
              )}
              
              {formStep < 3 ? (
                <button onClick={() => setFormStep(formStep + 1)} style={{ flex: 2, backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Continuer →
                </button>
              ) : (
                <button onClick={() => setStep('review')} style={{ flex: 2, backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Vérifier mes infos →
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. ÉCRAN DE VÉRIFICATION */}
        {step === 'review' && selectedDoc && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#4CC9F0', marginBottom: '1rem' }}>🔍 Vérifiez vos informations</h2>
            <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
              {selectedDoc.fields.map(field => (
                formData[field.id] ? (
                  <div key={field.id} style={{ borderBottom: '1px solid #1C2541', paddingBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8D99AE', display: 'block' }}>{field.label}</span>
                    <span style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 'bold' }}>{formData[field.id]}</span>
                  </div>
                ) : null
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setStep('form')} style={{ flex: 1, backgroundColor: '#0B132B', color: '#FFF', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✏️ Modifier
              </button>
              <button onClick={handleProcessDocument} disabled={isGeneratingContent} style={{ flex: 2, backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isGeneratingContent ? 'Génération...' : '🚀 Générer mon document →'}
              </button>
            </div>
          </div>
        )}

        {/* 4. APERÇU SPÉCIMEN */}
        {step === 'preview' && selectedDoc && (
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>Aperçu de votre document</h2>
            
            <div style={{ backgroundColor: '#FFF', color: '#111', padding: '1.5rem', borderRadius: '8px', position: 'relative', overflow: 'hidden', minHeight: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: "'Times New Roman', Times, serif" }}>
              <div style={{ position: 'absolute', top: '40%', left: '10%', transform: 'rotate(-30deg)', fontSize: '3.5rem', fontWeight: '900', color: 'rgba(230, 57, 70, 0.15)', pointerEvents: 'none', userSelect: 'none' }}>
                SPÉCIMEN
              </div>

              <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: generatedBody }} />
            </div>

            <div style={{ backgroundColor: '#1C2541', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.9rem', display: 'block' }}>{selectedDoc.title}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4CC9F0' }}>{selectedDoc.price}</span>
              </div>
              <button onClick={() => setStep('payment')} style={{ backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Payer pour télécharger →
              </button>
            </div>
          </div>
        )}

        {/* 5. PAIEMENT */}
        {step === 'payment' && selectedDoc && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Paiement</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #3A506B', marginBottom: '1.5rem' }}>
              <span>{selectedDoc.title}</span>
              <span style={{ fontWeight: 'bold', color: '#4CC9F0' }}>{selectedDoc.price}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #FF7900' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FF7900' }}>🟠 Orange Money</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', fontSize: '1.05rem' }}>6XX XX XX XX</p>
              </div>

              <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #FFCC00' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FFCC00' }}>🟡 MTN Mobile Money</span>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', fontSize: '1.05rem' }}>6XX XX XX XX</p>
              </div>
            </div>

            <button onClick={() => setStep('success')} style={{ width: '100%', backgroundColor: '#25D366', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              🟢 J'AI EFFECTUÉ LE PAIEMENT
            </button>
          </div>
        )}

        {/* 6. TELECHARGEMENT FINAL */}
        {step === 'success' && selectedDoc && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#1C2541', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.4rem', color: '#4CC9F0', marginBottom: '1rem' }}>Votre document est prêt !</h2>

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <div ref={documentRef} style={{ width: '794px', minHeight: '1123px', backgroundColor: '#FFF', color: '#111', padding: '4rem', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: generatedBody }} />
              </div>
            </div>

            <button 
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              style={{ width: '100%', backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              {isGeneratingPDF ? 'Téléchargement...' : '⬇️ TÉLÉCHARGER MON PDF'}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
