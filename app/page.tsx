'use client';

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createClient } from '@supabase/supabase-js';

// --- INITIALISATION SUPABASE SÉCURISÉE POUR BUILD VERCEL ---
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  'https://placeholder-url.supabase.co';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- INTERFACES & CONFIGURATION ---
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
  priceNumeric: number;
  badge?: string;
  desc: string;
  fields: FormField[];
}

interface Order {
  id: string;
  docTitle: string;
  price: string;
  clientPhone: string;
  senderPhone?: string;
  transactionRef?: string;
  status: 'PENDING' | 'APPROVED';
  createdAt: string;
  formData: Record<string, string>;
  generatedBody: string;
}

const DOCUMENTS_CONFIG: Record<string, DocumentConfig> = {
  quittance_loyer: {
    id: 'quittance_loyer',
    title: 'Quittance de loyer',
    category: 'IMMOBILIER',
    price: '500 FCFA',
    priceNumeric: 500,
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
    priceNumeric: 500,
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
    priceNumeric: 500,
    desc: 'Attestations d’hébergement, de location ou de paiement.',
    fields: [
      { id: 'attestation_type', label: 'Type d’attestation', type: 'select', options: ['Attestation d’hébergement', 'Attestation de location', 'Attestation de paiement de loyer'], step: 1, required: true },
      { id: 'declarant_nom', label: 'Nom complet du déclarant', type: 'text', step: 1, required: true },
      { id: 'declarant_adresse', label: 'Adresse du déclarant', type: 'text', step: 1, required: true },
      { id: 'beneficiaire_nom', label: 'Nom complet du bénéficiaire', type: 'text', step: 2, required: true },
      { id: 'date_debut', label: 'Réside / Hébergé depuis le', type: 'text', placeholder: 'JJ/MM/AAAA', step: 2, required: true }
    ]
  },
  recu_vente: {
    id: 'recu_vente',
    title: 'Reçu de vente',
    category: 'BUSINESS',
    price: '500 FCFA',
    priceNumeric: 500,
    desc: 'Justificatif de vente directe de produits ou services.',
    fields: [
      { id: 'vendeur_nom', label: 'Nom du vendeur / Boutique', type: 'text', step: 1, required: true },
      { id: 'acheteur_nom', label: 'Nom de l’acheteur', type: 'text', step: 1, required: true },
      { id: 'articles_liste', label: 'Désignation des articles achetés', type: 'textarea', step: 2, required: true },
      { id: 'montant_recu', label: 'Montant encaissé (FCFA)', type: 'number', step: 3, required: true }
    ]
  },
  lettre: {
    id: 'lettre',
    title: 'Lettre de motivation',
    category: 'CARRIÈRE',
    price: '500 FCFA',
    priceNumeric: 500,
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
  contrat_bail: {
    id: 'contrat_bail',
    title: 'Contrat de bail d’habitation',
    category: 'IMMOBILIER',
    price: '1 000 FCFA',
    priceNumeric: 1000,
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
  facture_simple: {
    id: 'facture_simple',
    title: 'Facture simple',
    category: 'BUSINESS',
    price: '1 000 FCFA',
    priceNumeric: 1000,
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
    priceNumeric: 1000,
    desc: 'Devis et offre commerciale officielle avant prestation.',
    fields: [
      { id: 'vendeur_nom', label: 'Nom de votre entreprise', type: 'text', step: 1, required: true },
      { id: 'client_nom', label: 'Client destinataire', type: 'text', step: 1, required: true },
      { id: 'validite', label: 'Validité de l’offre', type: 'text', placeholder: 'Ex: 15 jours', step: 2, required: true },
      { id: 'objets_factures', label: 'Services ou produits proposés', type: 'textarea', placeholder: 'Ex: 1x Maintenance informatique (50000)', step: 3, required: true }
    ]
  },
  bon_commande: {
    id: 'bon_commande',
    title: 'Bon de commande',
    category: 'BUSINESS',
    price: '1 000 FCFA',
    priceNumeric: 1000,
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
    priceNumeric: 1000,
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
  pack_emploi: {
    id: 'pack_emploi',
    title: 'Pack Emploi (CV + Lettre)',
    category: 'PACKS',
    price: '1 500 FCFA',
    priceNumeric: 1500,
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
    priceNumeric: 4000,
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
  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState<'home' | 'form' | 'review' | 'preview' | 'payment' | 'pending' | 'success' | 'admin_login' | 'admin_dashboard'>('home');
  const [selectedDoc, setSelectedDoc] = useState<DocumentConfig | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generatedBody, setGeneratedBody] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});

  const [senderPhoneInput, setSenderPhoneInput] = useState('');
  const [transactionRefInput, setTransactionRefInput] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);
  const sortedDocuments = Object.values(DOCUMENTS_CONFIG).sort((a, b) => a.priceNumeric - b.priceNumeric);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const fetchSupabaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        const mappedOrders: Order[] = data.map((item: any) => ({
          id: item.id,
          docTitle: item.doc_title || 'Document',
          price: `${item.amount || 0} FCFA`,
          clientPhone: item.sender_phone || 'Non renseigné',
          senderPhone: item.sender_phone,
          transactionRef: item.transaction_ref,
          status: item.status === 'completed' ? 'APPROVED' : 'PENDING',
          createdAt: new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          formData: item.form_data || {},
          generatedBody: item.generated_body || ''
        }));
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error('Erreur Supabase:', err);
    }
  };

  useEffect(() => {
    fetchSupabaseOrders();
  }, [step]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'pending' && currentOrder) {
      interval = setInterval(async () => {
        try {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('id', currentOrder.id)
            .single();

          if (data && data.status === 'completed') {
            setCurrentOrder(prev => prev ? { ...prev, status: 'APPROVED' } : null);
            setStep('success');
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [step, currentOrder]);

  const handleSelectDoc = (doc: DocumentConfig) => {
    setSelectedDoc(doc);
    setFormStep(1);
    setFormData({});
    setGeneratedBody('');
    setSenderPhoneInput('');
    setTransactionRefInput('');
    setStep('form');
    setIsMenuOpen(false);
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleBack = () => {
    if (step === 'form') {
      if (formStep > 1) {
        setFormStep(formStep - 1);
      } else {
        setStep('home');
      }
    } else if (step === 'review') {
      setStep('form');
    } else if (step === 'preview') {
      setStep('review');
    } else if (step === 'payment') {
      setStep('preview');
    } else if (step === 'pending') {
      setStep('payment');
    } else if (step === 'success') {
      setStep('home');
    } else if (step === 'admin_login' || step === 'admin_dashboard') {
      setStep('home');
    }
  };

  const handleProcessDocument = async () => {
    setIsGeneratingContent(true);
    let content = '';
    const id = selectedDoc?.id;

    if (id === 'contrat_bail') {
      content = `
        <h2 style="text-align: center; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 5px;">CONTRAT DE BAIL À USAGE D'HABITATION</h2>
        <p><strong>ENTRE LES SOUSSIGNÉS :</strong></p>
        <p><strong>Le Bailleur :</strong> M./Mme ${formData.bailleur_nom || ''} ${formData.bailleur_prenom || ''}, Tél : ${formData.bailleur_phone || ''}, Domicilié à : ${formData.bailleur_adresse || 'N/A'}.</p>
        <p><strong>ET</strong></p>
        <p><strong>Le Locataire :</strong> M./Mme ${formData.locataire_nom || ''} ${formData.locataire_prenom || ''}, Tél : ${formData.locataire_phone || ''}.</p>
        <hr style="margin: 15px 0;" />
        <p><strong>1. OBJET :</strong> Le bailleur donne à bail d'habitation le bien situé à : <strong>${formData.logement_ville || ''}</strong> (Type : ${formData.logement_type || 'Logement'}).</p>
        <p><strong>2. DURÉE :</strong> Prend effet le <strong>${formData.date_debut || ''}</strong> pour une durée d'un an renouvelable par tacite reconduction.</p>
        <p><strong>3. CONDITIONS FINANCIÈRES :</strong> Loyer mensuel fixé à <strong>${formData.loyer_montant || 0} FCFA</strong>. Caution versée : <strong>${formData.caution_montant || 0} FCFA</strong>.</p>
        <br/><br/>
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div><strong>Le Bailleur</strong><br/><br/><i>(Signature)</i></div>
          <div><strong>Le Locataire</strong><br/><br/><i>(Signature)</i></div>
        </div>
      `;
    } else if (id === 'quittance_loyer') {
      content = `
        <h2 style="text-align: center; text-transform: uppercase;">QUITTANCE DE LOYER</h2>
        <p style="text-align: right;"><strong>Période :</strong> ${formData.periode || ''}</p>
        <p>Je soussigné <strong>${formData.bailleur_nom || ''}</strong> (Tél : ${formData.bailleur_phone || ''}), propriétaire du logement situé à <strong>${formData.logement_adresse || ''}</strong>,</p>
        <p>Reconnais avoir reçu de M./Mme <strong>${formData.locataire_nom || ''}</strong> la somme de <strong>${formData.loyer_montant || 0} FCFA</strong> au titre du paiement du loyer pour la période susmentionnée.</p>
        <p><strong>Mode de paiement :</strong> ${formData.paiement_mode || 'Espèces'} le ${formData.paiement_date || ''}.</p>
        <p style="margin-top: 20px;"><i>Sous réserve de tous mes droits. Document délivré pour servir et valoir ce que de droit.</i></p>
        <br/><br/>
        <div style="text-align: right; margin-top: 30px;">
          <strong>Le Bailleur / Gestionnaire</strong><br/><br/><i>(Signature & Cachet)</i>
        </div>
      `;
    } else if (id === 'recu_loyer') {
      content = `
        <h2 style="text-align: center; text-transform: uppercase;">REÇU DE PAIEMENT DE LOYER</h2>
        <p>Reçu de M./Mme <strong>${formData.payeur_nom || ''}</strong></p>
        <p>La somme de : <strong>${formData.montant || 0} FCFA</strong></p>
        <p><strong>Motif :</strong> ${formData.motif || 'Acompte / Loyer'} pour le logement situé à ${formData.logement_adresse || ''}.</p>
        <p><strong>Reste à payer :</strong> ${formData.reste_a_payer || 0} FCFA.</p>
        <br/><br/>
        <div style="display: flex; justify-content: space-between; margin-top: 30px;">
          <div><strong>Le Payeur</strong></div>
          <div><strong>Le Bénéficiaire (${formData.receveur_nom || ''})</strong><br/><br/><i>(Signature)</i></div>
        </div>
      `;
    } else if (id === 'attestation_location') {
      content = `
        <h2 style="text-align: center; text-transform: uppercase;">${(formData.attestation_type || "ATTESTATION").toUpperCase()}</h2>
        <br/>
        <p>Je soussigné(e) <strong>${formData.declarant_nom || ''}</strong>, demeurant à <strong>${formData.declarant_adresse || ''}</strong>,</p>
        <p>Atteste sur l'honneur que M./Mme <strong>${formData.beneficiaire_nom || ''}</strong> est hébergé(e) / réside à mon adresse susmentionnée depuis le <strong>${formData.date_debut || ''}</strong>.</p>
        <p>En foi de quoi, la présente attestation est établie pour servir et valoir ce que de droit.</p>
        <br/><br/>
        <div style="text-align: right; margin-top: 40px;">
          <strong>Fait pour valoir de droit,</strong><br/><br/>
          <strong>Le Déclarant</strong><br/><i>(Signature)</i>
        </div>
      `;
    } else if (id === 'facture_simple' || id === 'facture_proforma' || id === 'recu_vente') {
      const isProforma = id === 'facture_proforma';
      const isRecu = id === 'recu_vente';
      const title = isProforma ? 'FACTURE PROFORMA' : isRecu ? 'REÇU DE VENTE' : 'FACTURE';

      content = `
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px;">
          <div>
            <h2 style="margin: 0; color: #111;">${formData.vendeur_nom || 'ENTREPRISE'}</h2>
            <p style="margin: 5px 0;">Tél/WhatsApp : ${formData.vendeur_phone || ''}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0; color: #4361EE;">${title}</h3>
            ${isProforma ? `<p style="margin: 5px 0;">Validité : ${formData.validite || '15 jours'}</p>` : ''}
          </div>
        </div>
        <br/>
        <p><strong>Client :</strong> ${formData.client_nom || formData.acheteur_nom || ''}</p>
        <br/>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f2f2f2; text-align: left;">
              <th style="padding: 8px; border: 1px solid #ddd;">Désignation / Prestation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; white-space: pre-wrap;">${formData.objets_factures || formData.articles_liste || ''}</td>
            </tr>
          </tbody>
        </table>
        ${formData.montant_recu ? `<h3 style="text-align: right; margin-top: 15px;">Total encaissé : ${formData.montant_recu} FCFA</h3>` : ''}
        <br/><br/>
        <div style="text-align: right; margin-top: 30px;">
          <strong>La Direction / Le Vendeur</strong><br/><br/><i>(Signature)</i>
        </div>
      `;
    } else if (id === 'bon_commande') {
      content = `
        <h2 style="text-align: center; text-transform: uppercase;">BON DE COMMANDE</h2>
        <p><strong>Acheteur :</strong> ${formData.acheteur_nom || ''}</p>
        <p><strong>Fournisseur :</strong> ${formData.fournisseur_nom || ''}</p>
        <p><strong>Lieu de livraison :</strong> ${formData.livraison_adresse || ''}</p>
        <hr/>
        <h3>Détail des articles commandés :</h3>
        <div style="background: #f9f9f9; padding: 15px; border: 1px solid #ddd; white-space: pre-wrap;">
          ${formData.produits_commandes || ''}
        </div>
        <br/><br/>
        <div style="display: flex; justify-content: space-between; margin-top: 30px;">
          <div><strong>L'Acheteur</strong><br/><br/><i>(Signature)</i></div>
          <div><strong>Confirmation Fournisseur</strong><br/><br/><i>(Signature)</i></div>
        </div>
      `;
    } else if (id === 'cv') {
      content = `
        <div style="border-bottom: 3px solid #4361EE; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #111; text-transform: uppercase;">${formData.name || ''}</h1>
          <h3 style="margin: 5px 0; color: #4361EE;">${formData.jobTitle || ''}</h3>
          <p style="margin: 0; color: #555;">Tél : ${formData.phone || ''}</p>
        </div>
        
        <h3 style="background: #f0f0f0; padding: 5px 10px; border-left: 4px solid #4361EE;">EXPÉRIENCES PROFESSIONNELLES</h3>
        <p style="white-space: pre-wrap; line-height: 1.6;">${formData.experience || ''}</p>

        <h3 style="background: #f0f0f0; padding: 5px 10px; border-left: 4px solid #4361EE; margin-top: 20px;">FORMATIONS & DIPLÔMES</h3>
        <p style="white-space: pre-wrap; line-height: 1.6;">${formData.education || 'Non renseigné'}</p>
      `;
    } else if (id === 'lettre') {
      content = `
        <p><strong>${formData.name || ''}</strong><br/>Tél : ${formData.phone || ''}<br/>${formData.address || ''}</p>
        <p style="text-align: right;"><strong>À l'attention du Recruteur</strong><br/>${formData.recipient || 'L\'Entreprise'}</p>
        <br/>
        <p><strong>Objet : Candidature au poste de ${formData.jobTitle || ''}</strong></p>
        <br/>
        <p>Madame, Monsieur,</p>
        <p>C'est avec un vif intérêt que je vous adresse ma candidature pour le poste de <strong>${formData.jobTitle || ''}</strong> au sein de votre structure.</p>
        <p>${formData.motivation || ''}</p>
        <p>Fort de mon parcours :</p>
        <p style="white-space: pre-wrap;">${formData.experience || ''}</p>
        <p>Je reste à votre entière disposition pour un entretien d'embauche.</p>
        <br/>
        <p style="text-align: right;"><strong>${formData.name || ''}</strong></p>
      `;
    } else {
      content = `
        <h2 style="text-align: center; text-transform: uppercase;">${selectedDoc?.title || 'DOCUMENT'}</h2>
        <hr/>
        <p><strong>Nom / Raison Sociale :</strong> ${formData.name || formData.vendeur_nom || ''}</p>
        <p><strong>Contact :</strong> ${formData.phone || formData.vendeur_phone || ''}</p>
        ${formData.jobTitle ? `<p><strong>Poste visé :</strong> ${formData.jobTitle}</p>` : ''}
        ${formData.recipient ? `<p><strong>Destinataire :</strong> ${formData.recipient}</p>` : ''}
        <br/>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap; border: 1px solid #ddd;">
          ${formData.experience || formData.docs_selection || 'Détails enregistrés pour le traitement de votre pack.'}
        </div>
      `;
    }

    setGeneratedBody(content);
    setStep('preview');
    setIsGeneratingContent(false);
  };

  const handleInitiatePayment = async () => {
    if (!selectedDoc) return;
    if (!senderPhoneInput || !transactionRefInput) {
      alert('Veuillez renseigner votre numéro expéditeur et la référence de transaction SMS.');
      return;
    }

    setIsSubmittingPayment(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            amount: selectedDoc.priceNumeric,
            payment_method: 'om_manual',
            sender_phone: senderPhoneInput,
            transaction_ref: transactionRefInput,
            status: 'pending_verification',
            doc_title: selectedDoc.title,
            form_data: formData,
            generated_body: generatedBody
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newOrder: Order = {
        id: data.id,
        docTitle: selectedDoc.title,
        price: selectedDoc.price,
        clientPhone: senderPhoneInput,
        senderPhone: senderPhoneInput,
        transactionRef: transactionRefInput,
        status: 'PENDING',
        createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        formData,
        generatedBody
      };

      setCurrentOrder(newOrder);
      setStep('pending');
    } catch (err: any) {
      console.error('Erreur Supabase :', err);
      alert('Impossible d\'enregistrer la commande dans Supabase. Vérifiez votre connexion.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === '1234') {
      setAdminPinError(false);
      setStep('admin_dashboard');
    } else {
      setAdminPinError(true);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (!error) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'APPROVED' as const } : o));
      } else {
        alert('Erreur lors de la validation sur Supabase.');
      }
    } catch (err) {
      console.error(err);
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
      pdf.save(`${selectedDoc?.title || currentOrder?.docTitle || 'Document'}_DocExpress.pdf`);
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
    <div style={{ backgroundColor: '#0B132B', color: '#FFFFFF', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      
      {/* 0. ÉCRAN DE BIENVENUE */}
      {showSplash && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0B132B',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            letterSpacing: '3px',
            color: '#4CC9F0',
            marginBottom: '0.2rem',
            textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(76, 201, 240, 0.4)'
          }}>
            DOCEXPRESS
          </div>
          <p style={{
            fontSize: '0.75rem',
            letterSpacing: '2px',
            color: '#F72585',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}>
            PAR DESIRE ATANGANA ATANGANA
          </p>
          <p style={{
            fontSize: '1.2rem',
            color: '#8D99AE',
            letterSpacing: '2px',
            fontWeight: '300',
            margin: 0
          }}>
            BIENVENUE
          </p>
          <div style={{
            marginTop: '2rem',
            width: '40px',
            height: '40px',
            border: '3px solid #1C2541',
            borderTop: '3px solid #4CC9F0',
            borderRadius: '50%'
          }} />
        </div>
      )}

      {/* EN-TÊTE FIXE */}
      <header style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C2541', position: 'sticky', top: 0, backgroundColor: '#0B132B', zIndex: 100 }}>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '1px', color: '#4CC9F0', cursor: 'pointer' }} onClick={() => { setStep('home'); setIsMenuOpen(false); }}>DOCEXPRESS</span>
          <p style={{ fontSize: '0.65rem', color: '#F72585', fontWeight: 'bold', margin: '0.1rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            par DESIRE ATANGANA ATANGANA
          </p>
        </div>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            width: '32px',
            height: '32px',
            zIndex: 101
          }}>
          <span style={{
            width: '100%',
            height: '3px',
            backgroundColor: '#4CC9F0',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            transform: isMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'rotate(0)'
          }} />
          <span style={{
            width: '100%',
            height: '3px',
            backgroundColor: '#4CC9F0',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            opacity: isMenuOpen ? 0 : 1
          }} />
          <span style={{
            width: '100%',
            height: '3px',
            backgroundColor: '#4CC9F0',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            transform: isMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'rotate(0)'
          }} />
        </button>
      </header>

      {/* MENU DÉROULANT CORRIGÉ */}
      {isMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0B132B',
          zIndex: 99,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          overflowY: 'auto'
        }}>
          <button 
            onClick={() => { setStep('home'); setIsMenuOpen(false); }}
            style={{ backgroundColor: '#1C2541', color: '#FFF', border: '1px solid #3A506B', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', cursor: 'pointer' }}>
            🏠 Page d'accueil
          </button>

          <button 
            onClick={() => { setStep('admin_login'); setIsMenuOpen(false); }}
            style={{ backgroundColor: '#1C2541', color: '#F72585', border: '1px solid #F72585', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', cursor: 'pointer' }}>
            🔒 Espace Administration
          </button>

          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#8D99AE', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Tous les documents</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sortedDocuments.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  style={{ backgroundColor: '#1C2541', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #3A506B', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.95rem', color: '#FFF' }}>{doc.title}</span>
                  <span style={{ fontSize: '0.8rem', color: '#4CC9F0', fontWeight: 'bold' }}>{doc.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>

        {/* BARRE DE RETOUR */}
        {step !== 'home' && (
          <div style={{ marginBottom: '1rem' }}>
            <button 
              onClick={handleBack}
              style={{ background: 'none', border: 'none', color: '#8D99AE', fontSize: '0.9rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              ⬅️ Page précédente
            </button>
          </div>
        )}

        {/* 1. ACCUEIL */}
        {step === 'home' && (
          <div>
            <section style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                display: 'inline-block',
                backgroundColor: 'rgba(247, 37, 133, 0.1)',
                border: '1px solid #F72585',
                color: '#F72585',
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                letterSpacing: '1px'
              }}>
                UNE CRÉATION DE DESIRE ATANGANA ATANGANA
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '0.8rem' }}>
                Vos documents professionnels rédigés sur mesure.
              </h1>
              <p style={{ color: '#8D99AE', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Transformez vos informations en documents officiels instantanément.
              </p>
            </section>

            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>🔥 Choisissez votre document</h2>
                <span style={{ fontSize: '0.75rem', color: '#8D99AE', fontStyle: 'italic' }}>Du - au + coûteux</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedDocuments.map((doc) => (
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
              <button onClick={handleBack} style={{ flex: 1, backgroundColor: '#0B132B', color: '#FFF', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Retour
              </button>
              
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
              <div style={{ position: 'absolute', top: '35%', left: '5%', right: '5%', transform: 'rotate(-25deg)', fontSize: '2.2rem', fontWeight: '900', color: 'rgba(230, 57, 70, 0.18)', pointerEvents: 'none', userSelect: 'none', textAlign: 'center', border: '4px dashed rgba(230, 57, 70, 0.25)', padding: '10px' }}>
                SPÉCIMEN - DOCEXPRESS
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

        {/* 5. PAIEMENT MANUEL ORANGE MONEY */}
        {step === 'payment' && selectedDoc && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Paiement Orange Money</h2>
            <p style={{ fontSize: '0.85rem', color: '#8D99AE', marginBottom: '1rem' }}>
              Effectuez un transfert du montant exact vers le numéro ci-dessous, puis saisissez les informations de votre SMS de confirmation.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #3A506B', marginBottom: '1.5rem' }}>
              <span>{selectedDoc.title}</span>
              <span style={{ fontWeight: 'bold', color: '#4CC9F0' }}>{selectedDoc.price}</span>
            </div>

            <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #FF7900', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FF7900' }}>🟠 Numéro Orange Money</span>
              <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px' }}>+237 655 06 93 96</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#8D99AE' }}>Votre Numéro Expéditeur (Orange Money)</label>
                <input 
                  type="text" 
                  value={senderPhoneInput} 
                  onChange={(e) => setSenderPhoneInput(e.target.value)} 
                  placeholder="Ex: 655XXXXXX"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#8D99AE' }}>Référence de Transaction SMS</label>
                <input 
                  type="text" 
                  value={transactionRefInput} 
                  onChange={(e) => setTransactionRefInput(e.target.value)} 
                  placeholder="Ex: PP260914.XXXX.XXXXX"
                  style={inputStyle}
                />
              </div>
            </div>

            <button 
              onClick={handleInitiatePayment} 
              disabled={isSubmittingPayment}
              style={{ width: '100%', backgroundColor: '#FF7900', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              {isSubmittingPayment ? 'Enregistrement en cours...' : '✅ VALIDER MA COMMANDE'}
            </button>
          </div>
        )}

        {/* 6. ÉCRAN D'ATTENTE CLIENT */}
        {step === 'pending' && currentOrder && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#1C2541', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ width: '50px', height: '50px', border: '4px solid #1C2541', borderTop: '4px solid #4CC9F0', borderRadius: '50%', margin: '0 auto 1.5rem auto' }} />
            
            <h2 style={{ fontSize: '1.3rem', color: '#4CC9F0', marginBottom: '0.5rem' }}>Vérification du paiement en cours...</h2>
            <p style={{ fontSize: '0.85rem', color: '#8D99AE', marginBottom: '1.5rem' }}>
              Votre demande a bien été transmise dans Supabase. Dès confirmation de votre dépôt par l'administration, votre document PDF sera automatiquement disponible ci-dessous.
            </p>

            <div style={{ backgroundColor: '#0B132B', padding: '1rem', borderRadius: '10px', textAlign: 'left', fontSize: '0.85rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#8D99AE' }}>ID Commande Supabase : <strong style={{ color: '#FFF' }}>{currentOrder.id}</strong></p>
              <p style={{ margin: '0 0 0.5rem 0', color: '#8D99AE' }}>Document : <strong style={{ color: '#FFF' }}>{currentOrder.docTitle}</strong></p>
              <p style={{ margin: '0 0 0.5rem 0', color: '#8D99AE' }}>Expéditeur : <strong style={{ color: '#FFF' }}>{currentOrder.senderPhone}</strong></p>
              <p style={{ margin: 0, color: '#8D99AE' }}>Montant : <strong style={{ color: '#4CC9F0' }}>{currentOrder.price}</strong></p>
            </div>
          </div>
        )}

        {/* 7. TÉLÉCHARGEMENT FINAL */}
        {step === 'success' && (selectedDoc || currentOrder) && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#1C2541', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.4rem', color: '#4CC9F0', marginBottom: '0.5rem' }}>Paiement Confirmé !</h2>
            <p style={{ fontSize: '0.85rem', color: '#8D99AE', marginBottom: '1.5rem' }}>
              Votre document a été validé. Vous pouvez le télécharger au format PDF officiel.
            </p>

            {/* ELEMENT MASQUÉ POUR IMPRESSION PDF */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <div ref={documentRef} style={{ width: '794px', minHeight: '1123px', backgroundColor: '#FFF', color: '#111', padding: '4rem', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: currentOrder?.generatedBody || generatedBody }} />
              </div>
            </div>

            <button 
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              style={{ width: '100%', backgroundColor: '#4361EE', color: '#FFF', border: 'none', padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem' }}>
              {isGeneratingPDF ? 'Téléchargement...' : '⬇️ TÉLÉCHARGER MON PDF'}
            </button>

            <button 
              onClick={() => setStep('home')}
              style={{ width: '100%', backgroundColor: '#0B132B', color: '#8D99AE', border: '1px solid #3A506B', padding: '0.8rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}>
              🏠 Créer un autre document
            </button>
          </div>
        )}

        {/* 8. CONNEXION ADMIN */}
        {step === 'admin_login' && (
          <div style={{ backgroundColor: '#1C2541', padding: '1.5rem', borderRadius: '16px', border: '1px solid #3A506B' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#F72585', marginBottom: '1rem' }}>🔒 Espace Administration</h2>
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#8D99AE' }}>Code PIN Accès</label>
                <input 
                  type="password" 
                  value={adminPinInput} 
                  onChange={(e) => setAdminPinInput(e.target.value)} 
                  placeholder="Entrez le code PIN (ex: 1234)"
                  style={inputStyle}
                />
              </div>
              {adminPinError && <p style={{ color: '#E63946', fontSize: '0.8rem', margin: 0 }}>Code PIN incorrect.</p>}
              <button type="submit" style={{ backgroundColor: '#F72585', color: '#FFF', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Se connecter
              </button>
            </form>
          </div>
        )}

        {/* 9. DASHBOARD ADMIN */}
        {step === 'admin_dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#F72585', margin: 0 }}>📊 Suivi des Paiements Supabase</h2>
              <button onClick={() => setStep('home')} style={{ backgroundColor: '#0B132B', color: '#FFF', border: '1px solid #3A506B', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                Quitter
              </button>
            </div>

            {orders.length === 0 ? (
              <p style={{ color: '#8D99AE', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Aucune commande enregistrée dans Supabase pour le moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((ord) => (
                  <div key={ord.id} style={{ backgroundColor: '#1C2541', padding: '1rem', borderRadius: '10px', border: '1px solid #3A506B', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#4CC9F0', fontSize: '0.85rem' }}>{ord.id}</span>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: ord.status === 'APPROVED' ? 'rgba(37, 211, 102, 0.2)' : 'rgba(247, 37, 133, 0.2)', color: ord.status === 'APPROVED' ? '#25D366' : '#F72585', fontWeight: 'bold' }}>
                        {ord.status === 'APPROVED' ? 'VALIDE' : 'EN ATTENTE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem' }}>
                      <p style={{ margin: '0 0 0.2rem 0' }}>Document : <strong>{ord.docTitle}</strong></p>
                      <p style={{ margin: '0 0 0.2rem 0' }}>Montant : <strong>{ord.price}</strong></p>
                      <p style={{ margin: '0 0 0.2rem 0' }}>Expéditeur OM : <strong>{ord.senderPhone}</strong></p>
                      <p style={{ margin: 0 }}>Réf SMS : <strong>{ord.transactionRef || 'N/A'}</strong> ({ord.createdAt})</p>
                    </div>

                    {ord.status === 'PENDING' && (
                      <button 
                        onClick={() => handleApproveOrder(ord.id)}
                        style={{ marginTop: '0.5rem', backgroundColor: '#25D366', color: '#FFF', border: 'none', padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                        ✅ Valider le paiement
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
