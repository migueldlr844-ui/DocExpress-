'use client';

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AnimatePresence } from 'framer-motion';

import HeroText from '@/components/HeroText';
import EditorialList from '@/components/EditorialList';
import SplashScreen from '@/components/SplashScreen';

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const PAYMENT_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_NUMBER || '6XX XX XX XX';
const STORAGE_KEY = 'docexpress_order_id';

const C = {
  bg: '#0B132B',
  card: '#1C2541',
  border: '#3A506B',
  cyan: '#4CC9F0',
  blue: '#4361EE',
  pink: '#F72585',
  green: '#10B981',
  muted: '#9CA3AF',
  soft: '#D1D5DB',
};

const card: React.CSSProperties = {
  backgroundColor: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: '12px',
  padding: '1.5rem',
};

const btn = (bg: string, color = '#FFFFFF'): React.CSSProperties => ({
  width: '100%',
  padding: '0.9rem',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: bg,
  color,
  fontWeight: 'bold',
  fontSize: '1rem',
  cursor: 'pointer',
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem',
  borderRadius: '8px',
  border: `1px solid ${C.border}`,
  backgroundColor: C.bg,
  color: '#FFFFFF',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const WATERMARK = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='260' height='180'><text x='20' y='110' transform='rotate(-28 130 90)' font-family='Arial' font-weight='bold' font-size='34' fill='rgba(0,0,0,0.10)'>APERÇU</text></svg>"
)}")`;

// ---------------------------------------------------------------------------
// LOGO
// ---------------------------------------------------------------------------
const AppLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="10" fill="url(#logo_grad)" />
    <path d="M13 11H23L29 17V29C29 30.1046 28.1046 31 27 31H13C11.8954 31 11 30.1046 11 29V13C11 11.8954 11.8954 11 13 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 11V18H29" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 21L17 26H21L19 30L24 25H20L21 21Z" fill="#F72585" stroke="#F72585" strokeWidth="0.5" strokeLinejoin="round" />
    <defs>
      <linearGradient id="logo_grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4361EE" />
        <stop offset="1" stopColor="#4CC9F0" />
      </linearGradient>
    </defs>
  </svg>
);

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type Step =
  | 'home' | 'form' | 'review' | 'preview' | 'payment'
  | 'pending' | 'success' | 'admin_login' | 'admin_dashboard';

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
  manual?: boolean;
  fields: FormField[];
}

interface ApiOrder {
  id: string;
  status: string;
  doc_title: string;
  template_id: string;
  amount: number;
  transaction_ref: string;
  created_at: string;
  form_data: Record<string, string> | null;
}

interface CurrentOrder {
  id: string;
  templateId: string;
  docTitle: string;
  price: string;
  transactionRef: string;
  status: 'PENDING' | 'APPROVED';
  createdAt: string;
}

interface AdminOrder {
  id: string;
  doc_title: string;
  amount: number;
  customer_name: string;
  sender_phone: string;
  transaction_ref: string;
  status: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// CATALOGUE (garder les prix synchronisés avec app/api/orders/route.ts)
// ---------------------------------------------------------------------------
const DOCUMENTS_CONFIG: Record<string, DocumentConfig> = {
  quittance_loyer: {
    id: 'quittance_loyer', title: 'Quittance de loyer', category: 'IMMOBILIER', price: '500 FCFA', priceNumeric: 500,
    desc: 'Attestation officielle de paiement intégral du loyer mensuel.',
    fields: [
      { id: 'bailleur_nom', label: 'Nom complet du bailleur', type: 'text', step: 1, required: true },
      { id: 'bailleur_phone', label: 'Téléphone bailleur', type: 'text', step: 1 },
      { id: 'locataire_nom', label: 'Nom complet du locataire', type: 'text', step: 1, required: true },
      { id: 'logement_adresse', label: 'Adresse du logement', type: 'text', placeholder: 'Ex: Omnisports, Yaoundé', step: 2, required: true },
      { id: 'periode', label: 'Période / Mois concerné', type: 'text', placeholder: 'Ex: Mois de Septembre 2026', step: 2, required: true },
      { id: 'loyer_montant', label: 'Montant du loyer (FCFA)', type: 'number', step: 2, required: true },
      { id: 'paiement_date', label: 'Date de paiement', type: 'text', placeholder: 'JJ/MM/AAAA', step: 3, required: true },
      { id: 'paiement_mode', label: 'Mode de paiement', type: 'select', options: ['Espèces', 'Orange Money', 'MTN Mobile Money', 'Virement bancaire'], step: 3, required: true },
    ],
  },
  recu_loyer: {
    id: 'recu_loyer', title: 'Reçu de paiement de loyer', category: 'IMMOBILIER', price: '500 FCFA', priceNumeric: 500,
    desc: 'Preuve de paiement partiel ou d’acompte sur le loyer.',
    fields: [
      { id: 'receveur_nom', label: 'Nom du bénéficiaire (Bailleur)', type: 'text', step: 1, required: true },
      { id: 'payeur_nom', label: 'Nom du payeur (Locataire)', type: 'text', step: 1, required: true },
      { id: 'logement_adresse', label: 'Adresse du logement', type: 'text', step: 2, required: true },
      { id: 'montant', label: 'Montant perçu (FCFA)', type: 'number', step: 2, required: true },
      { id: 'motif', label: 'Motif du paiement', type: 'text', placeholder: 'Ex: Acompte loyer Septembre', step: 2, required: true },
      { id: 'reste_a_payer', label: 'Reste éventuel à payer (FCFA)', type: 'number', step: 3 },
    ],
  },
  attestation_location: {
    id: 'attestation_location', title: 'Attestations locatives', category: 'IMMOBILIER', price: '500 FCFA', priceNumeric: 500,
    desc: 'Attestations d’hébergement, de location ou de paiement.',
    fields: [
      { id: 'attestation_type', label: 'Type d’attestation', type: 'select', options: ['Attestation d’hébergement', 'Attestation de location', 'Attestation de paiement de loyer'], step: 1, required: true },
      { id: 'declarant_nom', label: 'Nom complet du déclarant', type: 'text', step: 1, required: true },
      { id: 'declarant_adresse', label: 'Adresse du déclarant', type: 'text', step: 1, required: true },
      { id: 'beneficiaire_nom', label: 'Nom complet du bénéficiaire', type: 'text', step: 2, required: true },
      { id: 'date_debut', label: 'Réside / Hébergé depuis le', type: 'text', placeholder: 'JJ/MM/AAAA', step: 2, required: true },
    ],
  },
  recu_vente: {
    id: 'recu_vente', title: 'Reçu de vente', category: 'BUSINESS', price: '500 FCFA', priceNumeric: 500,
    desc: 'Justificatif de vente directe de produits ou services.',
    fields: [
      { id: 'vendeur_nom', label: 'Nom du vendeur / Boutique', type: 'text', step: 1, required: true },
      { id: 'acheteur_nom', label: 'Nom de l’acheteur', type: 'text', step: 1, required: true },
      { id: 'articles_liste', label: 'Désignation des articles achetés', type: 'textarea', placeholder: 'Ex: 2x Riz 25kg (18000), 1x Huile 5L (6500)', step: 2, required: true },
      { id: 'montant_recu', label: 'Montant encaissé (FCFA)', type: 'number', step: 3, required: true },
    ],
  },
  lettre: {
    id: 'lettre', title: 'Lettre de motivation', category: 'CARRIÈRE', price: '500 FCFA', priceNumeric: 500, badge: 'POPULAIRE',
    desc: 'Rédigée sur mesure et au format professionnel.',
    fields: [
      { id: 'name', label: 'Nom & Prénom', type: 'text', step: 1, required: true },
      { id: 'phone', label: 'Téléphone', type: 'text', step: 1, required: true },
      { id: 'address', label: 'Ville / Adresse', type: 'text', step: 1 },
      { id: 'jobTitle', label: 'Poste recherché', type: 'text', step: 2, required: true },
      { id: 'recipient', label: 'Entreprise / Destinataire', type: 'text', step: 2, required: true },
      { id: 'experience', label: 'Vos points forts & Parcours', type: 'textarea', step: 3, required: true },
      { id: 'motivation', label: 'Pourquoi ce poste ?', type: 'textarea', step: 3, required: true },
    ],
  },
  contrat_bail: {
    id: 'contrat_bail', title: 'Contrat de bail d’habitation', category: 'IMMOBILIER', price: '1 000 FCFA', priceNumeric: 1000,
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
      { id: 'date_debut', label: 'Date de début du bail', type: 'text', placeholder: 'JJ/MM/AAAA', step: 3, required: true },
    ],
  },
  facture_simple: {
    id: 'facture_simple', title: 'Facture simple', category: 'BUSINESS', price: '1 000 FCFA', priceNumeric: 1000,
    desc: 'Facture commerciale claire avec calcul automatique des totaux.',
    fields: [
      { id: 'vendeur_nom', label: 'Nom commercial / Entreprise', type: 'text', step: 1, required: true },
      { id: 'vendeur_phone', label: 'Téléphone / WhatsApp', type: 'text', step: 1, required: true },
      { id: 'client_nom', label: 'Nom du client / Entreprise', type: 'text', step: 2, required: true },
      { id: 'objets_factures', label: 'Détail des prestations ou articles', type: 'textarea', placeholder: 'Ex: 2x Conception Logo (15000), 1x Impression Bâche (20000)', step: 3, required: true },
    ],
  },
  facture_proforma: {
    id: 'facture_proforma', title: 'Facture proforma', category: 'BUSINESS', price: '1 000 FCFA', priceNumeric: 1000,
    desc: 'Devis et offre commerciale officielle avant prestation.',
    fields: [
      { id: 'vendeur_nom', label: 'Nom de votre entreprise', type: 'text', step: 1, required: true },
      { id: 'client_nom', label: 'Client destinataire', type: 'text', step: 1, required: true },
      { id: 'validite', label: 'Validité de l’offre', type: 'text', placeholder: 'Ex: 15 jours', step: 2, required: true },
      { id: 'objets_factures', label: 'Services ou produits proposés', type: 'textarea', placeholder: 'Ex: 1x Maintenance informatique (50000)', step: 3, required: true },
    ],
  },
  bon_commande: {
    id: 'bon_commande', title: 'Bon de commande', category: 'BUSINESS', price: '1 000 FCFA', priceNumeric: 1000,
    desc: 'Ordre d’achat officiel adressé à un fournisseur.',
    fields: [
      { id: 'acheteur_nom', label: 'Nom de votre entreprise', type: 'text', step: 1, required: true },
      { id: 'fournisseur_nom', label: 'Nom du fournisseur', type: 'text', step: 1, required: true },
      { id: 'produits_commandes', label: 'Liste des produits commandés', type: 'textarea', step: 2, required: true },
      { id: 'livraison_adresse', label: 'Lieu de livraison souhaité', type: 'text', step: 3, required: true },
    ],
  },
  cv: {
    id: 'cv', title: 'CV professionnel', category: 'CARRIÈRE', price: '1 000 FCFA', priceNumeric: 1000, badge: 'POPULAIRE',
    desc: 'Format moderne optimisé pour le marché de l’emploi.',
    fields: [
      { id: 'name', label: 'Nom complet', type: 'text', step: 1, required: true },
      { id: 'phone', label: 'Téléphone & WhatsApp', type: 'text', step: 1, required: true },
      { id: 'jobTitle', label: 'Poste visé', type: 'text', placeholder: 'Ex: Commercial terrain', step: 2, required: true },
      { id: 'experience', label: 'Vos expériences (Postes, entreprises, tâches)', type: 'textarea', step: 3, required: true },
      { id: 'education', label: 'Formations & Diplômes', type: 'textarea', step: 3 },
    ],
  },
  pack_emploi: {
    id: 'pack_emploi', title: 'Pack Emploi (CV + Lettre)', category: 'PACKS', price: '1 500 FCFA', priceNumeric: 1500, badge: 'MEILLEURE OFFRE',
    desc: 'Formulaire unique pour obtenir votre CV et votre Lettre.',
    fields: [
      { id: 'name', label: 'Nom complet', type: 'text', step: 1, required: true },
      { id: 'phone', label: 'Téléphone & WhatsApp', type: 'text', step: 1, required: true },
      { id: 'jobTitle', label: 'Poste recherché', type: 'text', step: 2, required: true },
      { id: 'recipient', label: 'Entreprise visée', type: 'text', step: 2, required: true },
      { id: 'experience', label: 'Parcours & Expériences', type: 'textarea', step: 3, required: true },
    ],
  },
  pack_entrepreneur: {
    id: 'pack_entrepreneur', title: 'Pack Entrepreneur (5 documents)', category: 'PACKS', price: '4 000 FCFA', priceNumeric: 4000, badge: 'PRO', manual: true,
    desc: '5 documents administratifs ou commerciaux pour votre entreprise.',
    fields: [
      { id: 'vendeur_nom', label: 'Nom de votre entreprise', type: 'text', step: 1, required: true },
      { id: 'vendeur_phone', label: 'Téléphone pro / WhatsApp', type: 'text', step: 1, required: true },
      { id: 'docs_selection', label: 'Précisez les 5 documents souhaités', type: 'textarea', step: 2, required: true },
    ],
  },
};

// ---------------------------------------------------------------------------
// HELPERS : échappement, nombres, génération des documents
// ---------------------------------------------------------------------------
const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v: unknown): string => String(v ?? '').replace(/[&<>"']/g, (c) => ESC_MAP[c]);
const fmt = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const num = (v?: string): number => {
  const n = parseInt(String(v ?? '').replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

interface Item { label: string; qty: number; unit: number | null }

const parseItems = (raw = ''): Item[] =>
  raw
    .replace(/\)\s*,/g, ')\n')
    .split(/\n|;/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      let qty = 1;
      let rest = line;
      const q = rest.match(/^(\d+(?:[.,]\d+)?)\s*[x×]\s*(.+)$/i);
      if (q) {
        qty = parseFloat(q[1].replace(',', '.'));
        rest = q[2];
      }
      const p = rest.match(/^(.*?)[\s(:=-]*(\d[\d\s.]*)\s*(?:fcfa|f\s?cfa|xaf|f)?\s*\)?\s*$/i);
      if (p && p[1].trim()) return { label: p[1].trim(), qty, unit: num(p[2]) };
      return { label: rest, qty, unit: null };
    });

const TD = 'padding:8px;border:1px solid #ddd;';

const itemsBlock = (raw: string): { html: string; total: number | null } => {
  const items = parseItems(raw);
  const priced = items.length > 0 && items.every((i) => i.unit !== null);
  if (!priced) {
    return {
      html: `<div style="background:#f9f9f9;padding:12px;border:1px solid #ddd;white-space:pre-wrap;">${esc(raw)}</div>`,
      total: null,
    };
  }
  let total = 0;
  const rows = items
    .map((i) => {
      const line = i.qty * (i.unit as number);
      total += line;
      return `<tr><td style="${TD}">${esc(i.label)}</td><td style="${TD}text-align:right;">${esc(i.qty)}</td><td style="${TD}text-align:right;">${fmt(i.unit as number)}</td><td style="${TD}text-align:right;">${fmt(line)}</td></tr>`;
    })
    .join('');
  return {
    html: `<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f2f2f2;text-align:left;"><th style="${TD}">Désignation</th><th style="${TD}text-align:right;">Qté</th><th style="${TD}text-align:right;">P.U. (FCFA)</th><th style="${TD}text-align:right;">Total (FCFA)</th></tr></thead><tbody>${rows}</tbody></table>`,
    total,
  };
};

const sig = (left: string, right?: string): string =>
  right
    ? `<div style="display:flex;justify-content:space-between;margin-top:40px;"><div><strong>${left}</strong><br/><br/><i>(Signature)</i></div><div style="text-align:right;"><strong>${right}</strong><br/><br/><i>(Signature)</i></div></div>`
    : `<div style="text-align:right;margin-top:40px;"><strong>${left}</strong><br/><br/><i>(Signature)</i></div>`;

const cvHtml = (d: Record<string, string>, withEdu: boolean): string => `
  <div style="border-bottom:3px solid #4361EE;padding-bottom:10px;margin-bottom:20px;">
    <h1 style="margin:0;text-transform:uppercase;">${esc(d.name)}</h1>
    <h3 style="margin:5px 0;color:#4361EE;">${esc(d.jobTitle)}</h3>
    <p style="margin:0;color:#555;">Tél : ${esc(d.phone)}</p>
  </div>
  <h3 style="background:#f0f0f0;padding:5px 10px;border-left:4px solid #4361EE;">EXPÉRIENCES PROFESSIONNELLES</h3>
  <p style="white-space:pre-wrap;line-height:1.6;">${esc(d.experience)}</p>
  ${
    withEdu
      ? `<h3 style="background:#f0f0f0;padding:5px 10px;border-left:4px solid #4361EE;margin-top:20px;">FORMATIONS &amp; DIPLÔMES</h3>
         <p style="white-space:pre-wrap;line-height:1.6;">${esc(d.education || 'Non renseigné')}</p>`
      : ''
  }`;

const letterHtml = (d: Record<string, string>): string => `
  <p><strong>${esc(d.name)}</strong><br/>Tél : ${esc(d.phone)}${d.address ? `<br/>${esc(d.address)}` : ''}</p>
  <p style="text-align:right;"><strong>À l'attention du Recruteur</strong><br/>${esc(d.recipient || "L'Entreprise")}</p>
  <br/>
  <p><strong>Objet : Candidature au poste de ${esc(d.jobTitle)}</strong></p>
  <p>Madame, Monsieur,</p>
  <p>C'est avec un vif intérêt que je vous adresse ma candidature pour le poste de <strong>${esc(d.jobTitle)}</strong> au sein de votre structure.</p>
  <p style="white-space:pre-wrap;">${esc(d.motivation || 'Mon parcours et ma motivation me permettent de répondre pleinement aux exigences de ce poste.')}</p>
  <p>Fort de mon parcours :</p>
  <p style="white-space:pre-wrap;">${esc(d.experience)}</p>
  <p>Je reste à votre entière disposition pour un entretien d'embauche.</p>
  <p>Cordialement,</p>
  <p style="text-align:right;"><strong>${esc(d.name)}</strong></p>`;

const buildDocument = (id: string, d: Record<string, string>, title: string, date: string): string => {
  const g = (k: string): string => esc(d[k] ?? '');

  switch (id) {
    case 'contrat_bail':
      return `
        <h2 style="text-align:center;text-transform:uppercase;border-bottom:2px solid #000;padding-bottom:5px;">CONTRAT DE BAIL À USAGE D'HABITATION</h2>
        <p><strong>ENTRE LES SOUSSIGNÉS :</strong></p>
        <p><strong>Le Bailleur :</strong> M./Mme ${g('bailleur_nom')} ${g('bailleur_prenom')}, Tél : ${g('bailleur_phone')}, Domicilié à : ${esc(d.bailleur_adresse || 'N/A')}.</p>
        <p><strong>ET</strong></p>
        <p><strong>Le Locataire :</strong> M./Mme ${g('locataire_nom')} ${g('locataire_prenom')}, Tél : ${g('locataire_phone')}.</p>
        <hr style="margin:15px 0;" />
        <p><strong>1. OBJET :</strong> Le bailleur donne à bail d'habitation le bien situé à : <strong>${g('logement_ville')}</strong> (Type : ${esc(d.logement_type || 'Logement')}).</p>
        <p><strong>2. DURÉE :</strong> Prend effet le <strong>${g('date_debut')}</strong> pour une durée d'un an renouvelable par tacite reconduction.</p>
        <p><strong>3. CONDITIONS FINANCIÈRES :</strong> Loyer mensuel fixé à <strong>${fmt(num(d.loyer_montant))} FCFA</strong>. Caution versée : <strong>${fmt(num(d.caution_montant))} FCFA</strong>.</p>
        <p style="text-align:right;margin-top:20px;">Fait le ${date}</p>
        ${sig('Le Bailleur', 'Le Locataire')}`;

    case 'quittance_loyer':
      return `
        <h2 style="text-align:center;text-transform:uppercase;">QUITTANCE DE LOYER</h2>
        <p style="text-align:right;"><strong>Période :</strong> ${g('periode')}</p>
        <p>Je soussigné <strong>${g('bailleur_nom')}</strong>${d.bailleur_phone ? ` (Tél : ${g('bailleur_phone')})` : ''}, propriétaire du logement situé à <strong>${g('logement_adresse')}</strong>,</p>
        <p>Reconnais avoir reçu de M./Mme <strong>${g('locataire_nom')}</strong> la somme de <strong>${fmt(num(d.loyer_montant))} FCFA</strong> au titre du paiement du loyer pour la période susmentionnée.</p>
        <p><strong>Mode de paiement :</strong> ${esc(d.paiement_mode || 'Espèces')} le ${g('paiement_date')}.</p>
        <p style="margin-top:20px;"><i>Sous réserve de tous mes droits. Document délivré pour servir et valoir ce que de droit.</i></p>
        <p style="text-align:right;">Fait le ${date}</p>
        ${sig('Le Bailleur / Gestionnaire')}`;

    case 'recu_loyer':
      return `
        <h2 style="text-align:center;text-transform:uppercase;">REÇU DE PAIEMENT DE LOYER</h2>
        <p>Reçu de M./Mme <strong>${g('payeur_nom')}</strong></p>
        <p>La somme de : <strong>${fmt(num(d.montant))} FCFA</strong></p>
        <p><strong>Motif :</strong> ${esc(d.motif || 'Acompte / Loyer')} pour le logement situé à ${g('logement_adresse')}.</p>
        <p><strong>Reste à payer :</strong> ${fmt(num(d.reste_a_payer))} FCFA.</p>
        <p style="text-align:right;">Fait le ${date}</p>
        ${sig('Le Payeur', `Le Bénéficiaire (${g('receveur_nom')})`)}`;

    case 'attestation_location':
      return `
        <h2 style="text-align:center;text-transform:uppercase;">${esc((d.attestation_type || 'ATTESTATION').toUpperCase())}</h2>
        <br/>
        <p>Je soussigné(e) <strong>${g('declarant_nom')}</strong>, demeurant à <strong>${g('declarant_adresse')}</strong>,</p>
        <p>Atteste sur l'honneur que M./Mme <strong>${g('beneficiaire_nom')}</strong> est hébergé(e) / réside à mon adresse susmentionnée depuis le <strong>${g('date_debut')}</strong>.</p>
        <p>En foi de quoi, la présente attestation est établie pour servir et valoir ce que de droit.</p>
        <p style="text-align:right;">Fait le ${date}</p>
        ${sig('Le Déclarant')}`;

    case 'facture_simple':
    case 'facture_proforma':
    case 'recu_vente': {
      const isPro = id === 'facture_proforma';
      const isRecu = id === 'recu_vente';
      const docTitle = isPro ? 'FACTURE PROFORMA' : isRecu ? 'REÇU DE VENTE' : 'FACTURE';
      const { html: table, total } = itemsBlock(d.objets_factures || d.articles_liste || '');
      return `
        <div style="display:flex;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:10px;">
          <div>
            <h2 style="margin:0;">${esc(d.vendeur_nom || 'ENTREPRISE')}</h2>
            ${d.vendeur_phone ? `<p style="margin:5px 0;">Tél/WhatsApp : ${g('vendeur_phone')}</p>` : ''}
          </div>
          <div style="text-align:right;">
            <h3 style="margin:0;color:#4361EE;">${docTitle}</h3>
            <p style="margin:5px 0;">Date : ${date}</p>
            ${isPro ? `<p style="margin:5px 0;">Validité : ${esc(d.validite || '15 jours')}</p>` : ''}
          </div>
        </div>
        <p style="margin-top:18px;"><strong>Client :</strong> ${esc(d.client_nom || d.acheteur_nom || '')}</p>
        <div style="margin-top:10px;">${table}</div>
        ${!isRecu && total !== null ? `<h3 style="text-align:right;margin-top:15px;">TOTAL : ${fmt(total)} FCFA</h3>` : ''}
        ${isRecu ? `<h3 style="text-align:right;margin-top:15px;">Total encaissé : ${fmt(num(d.montant_recu))} FCFA</h3>` : ''}
        ${sig('La Direction / Le Vendeur')}`;
    }

    case 'bon_commande':
      return `
        <h2 style="text-align:center;text-transform:uppercase;">BON DE COMMANDE</h2>
        <p style="text-align:right;">Date : ${date}</p>
        <p><strong>Acheteur :</strong> ${g('acheteur_nom')}</p>
        <p><strong>Fournisseur :</strong> ${g('fournisseur_nom')}</p>
        <p><strong>Lieu de livraison :</strong> ${g('livraison_adresse')}</p>
        <hr/>
        <h3>Détail des articles commandés :</h3>
        <div style="background:#f9f9f9;padding:15px;border:1px solid #ddd;white-space:pre-wrap;">${g('produits_commandes')}</div>
        ${sig("L'Acheteur", 'Confirmation Fournisseur')}`;

    case 'cv':
      return cvHtml(d, true);

    case 'lettre':
      return letterHtml(d);

    case 'pack_emploi':
      return `${cvHtml(d, false)}<div style="margin:40px 0;border-top:2px dashed #bbb;"></div>${letterHtml(d)}`;

    default:
      return `
        <h2 style="text-align:center;text-transform:uppercase;">${esc(title)}</h2>
        <hr/>
        <p><strong>Nom / Raison Sociale :</strong> ${esc(d.name || d.vendeur_nom || '')}</p>
        <p><strong>Contact :</strong> ${esc(d.phone || d.vendeur_phone || '')}</p>
        <p style="text-align:right;">Date : ${date}</p>
        <div style="background:#f9f9f9;padding:15px;border-radius:5px;white-space:pre-wrap;border:1px solid #ddd;">${esc(d.docs_selection || d.experience || '')}</div>`;
  }
};

const guessCustomerName = (d: Record<string, string>): string => {
  const keys = ['name', 'locataire_nom', 'payeur_nom', 'acheteur_nom', 'client_nom', 'vendeur_nom', 'bailleur_nom', 'declarant_nom'];
  for (const k of keys) if (d[k]) return d[k];
  return 'Client';
};

const fmtDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// ---------------------------------------------------------------------------
// API (toutes les opérations Supabase passent par le serveur)
// ---------------------------------------------------------------------------
async function api<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || 'Erreur serveur');
  return json as T;
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState<Step>('home');
  const [selectedDoc, setSelectedDoc] = useState<DocumentConfig | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [senderPhoneInput, setSenderPhoneInput] = useState('');
  const [transactionRefInput, setTransactionRefInput] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const [currentOrder, setCurrentOrder] = useState<CurrentOrder | null>(null);
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);

  const [adminPin, setAdminPin] = useState('');
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  const pdfRef = useRef<HTMLDivElement>(null);

  const sortedDocuments = Object.values(DOCUMENTS_CONFIG).sort((a, b) => a.priceNumeric - b.priceNumeric);
  const maxStep = selectedDoc ? Math.max(...selectedDoc.fields.map((f) => f.step)) : 1;

  // --- Splash
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // --- Commande en cours mémorisée sur l'appareil
  useEffect(() => {
    try {
      setSavedOrderId(localStorage.getItem(STORAGE_KEY));
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const applyOrder = (o: ApiOrder) => {
    setSelectedDoc(DOCUMENTS_CONFIG[o.template_id] ?? null);
    setCurrentOrder({
      id: o.id,
      templateId: o.template_id,
      docTitle: o.doc_title,
      price: `${fmt(o.amount)} FCFA`,
      transactionRef: o.transaction_ref,
      status: o.status === 'completed' ? 'APPROVED' : 'PENDING',
      createdAt: o.created_at,
    });
    if (o.status === 'completed') {
      setFormData(o.form_data || {});
      setStep('success');
    } else {
      setStep('pending');
    }
  };

  const resumeOrder = async (id: string) => {
    try {
      const o = await api<ApiOrder>('status', { orderId: id });
      applyOrder(o);
      setIsMenuOpen(false);
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setSavedOrderId(null);
    }
  };

  // --- Polling du statut (écran d'attente)
  useEffect(() => {
    if (step !== 'pending' || !currentOrder) return;
    const id = currentOrder.id;
    const timer = setInterval(async () => {
      try {
        const o = await api<ApiOrder>('status', { orderId: id });
        if (o.status === 'completed') applyOrder(o);
      } catch (e) {
        console.error(e);
      }
    }, 4000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentOrder?.id]);

  // --- Admin : chargement + rafraîchissement auto
  const loadOrders = async () => {
    try {
      const r = await api<{ orders: AdminOrder[] }>('admin_list', { pin: adminPin });
      setOrders(r.orders);
      setAdminError('');
    } catch (e) {
      setAdminError(e instanceof Error ? e.message : 'Erreur de chargement');
    }
  };

  useEffect(() => {
    if (step !== 'admin_dashboard' || !adminPin) return;
    loadOrders();
    const t = setInterval(loadOrders, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, adminPin]);

  // --- Handlers
  const handleSelectDoc = (doc: DocumentConfig) => {
    setSelectedDoc(doc);
    setFormStep(1);
    setFormData({});
    setPreviewHtml('');
    setSenderPhoneInput('');
    setTransactionRefInput('');
    setPaymentError('');
    setStep('form');
    setIsMenuOpen(false);
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleBack = () => {
    if (step === 'form') {
      if (formStep > 1) setFormStep(formStep - 1);
      else setStep('home');
    } else if (step === 'review') setStep('form');
    else if (step === 'preview') setStep('review');
    else if (step === 'payment') setStep('preview');
    else setStep('home'); // pending, success, admin_*
  };

  const handleProcessDocument = () => {
    if (!selectedDoc) return;
    setPreviewHtml(buildDocument(selectedDoc.id, formData, selectedDoc.title, new Date().toLocaleDateString('fr-FR')));
    setStep('preview');
  };

  const handleInitiatePayment = async () => {
    if (!selectedDoc) return;
    setPaymentError('');

    const phone = senderPhoneInput.replace(/[\s.-]/g, '');
    if (!/^(\+?237)?6\d{8}$/.test(phone)) {
      setPaymentError('Numéro invalide. Exemple : 699000000');
      return;
    }
    const ref = transactionRefInput.trim();
    if (ref.length < 6) {
      setPaymentError('Référence de transaction trop courte. Recopiez-la depuis le SMS.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const r = await api<{ id: string; created_at: string }>('create', {
        templateId: selectedDoc.id,
        formData,
        senderPhone: phone,
        transactionRef: ref,
        customerName: guessCustomerName(formData),
      });
      try {
        localStorage.setItem(STORAGE_KEY, r.id);
      } catch {
        /* ignore */
      }
      setSavedOrderId(r.id);
      setCurrentOrder({
        id: r.id,
        templateId: selectedDoc.id,
        docTitle: selectedDoc.title,
        price: selectedDoc.price,
        transactionRef: ref.toUpperCase(),
        status: 'PENDING',
        createdAt: r.created_at,
      });
      setStep('pending');
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPinError(false);
    try {
      await api('admin_login', { pin: adminPinInput });
      setAdminPin(adminPinInput);
      setAdminPinInput('');
      setStep('admin_dashboard');
    } catch {
      setAdminPinError(true);
    }
  };

  const handleAdminLogout = () => {
    setAdminPin('');
    setOrders([]);
    setStep('home');
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      await api('admin_approve', { pin: adminPin, orderId });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'completed' } : o)));
    } catch (e) {
      setAdminError(e instanceof Error ? e.message : 'Erreur lors de la validation.');
    }
  };

  const generatePDF = async () => {
    if (!pdfRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = 210;
      const pageH = 297;
      const imgH = (canvas.height * pageW) / canvas.width;

      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(img, 'JPEG', 0, position, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, position, pageW, imgH);
        heightLeft -= pageH;
      }

      const name = (selectedDoc?.title || currentOrder?.docTitle || 'Document').replace(/[^\w\-]+/g, '_');
      pdf.save(`${name}_DocExpress.pdf`);
    } catch (error) {
      console.error('Erreur lors du téléchargement :', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const successHtml =
    selectedDoc && currentOrder
      ? buildDocument(selectedDoc.id, formData, selectedDoc.title, new Date(currentOrder.createdAt).toLocaleDateString('fr-FR'))
      : '';

  // -------------------------------------------------------------------------
  // RENDU
  // -------------------------------------------------------------------------
  return (
    <div
      className="app-root"
      style={{ backgroundColor: C.bg, color: '#FFFFFF', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <style>{`
        .app-root select option { background-color: #0B132B; color: #FFFFFF; }
        .app-root ::placeholder { color: #9CA3AF; opacity: 1; }
        .app-root .doc-paper { background-color: #FFFFFF; color: #000000; }

        @keyframes pulseGlow {
          0% { box-shadow: 0 0 15px rgba(67, 97, 238, 0.4); }
          50% { box-shadow: 0 0 35px rgba(76, 201, 240, 0.7); }
          100% { box-shadow: 0 0 15px rgba(67, 97, 238, 0.4); }
        }
        .hero-logo-box { animation: pulseGlow 3s infinite ease-in-out; }
        .card-hover { transition: transform 0.2s ease, border-color 0.2s ease; }
        .card-hover:hover { transform: translateY(-3px); border-color: #4CC9F0 !important; }
      `}</style>

      <AnimatePresence>{showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}</AnimatePresence>

      <div>
        {/* EN-TÊTE */}
        <header style={{ padding: '0.9rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C2541', position: 'sticky', top: 0, backgroundColor: 'rgba(11, 19, 43, 0.95)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => { setStep('home'); setIsMenuOpen(false); }}>
            <AppLogo size={34} />
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '1px' }}>DOCEXPRESS</span>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', width: '32px', height: '32px', zIndex: 101 }}>
            <span style={{ width: '100%', height: '3px', backgroundColor: C.cyan, borderRadius: '2px', transition: 'all 0.3s ease', transform: isMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'rotate(0)' }} />
            <span style={{ width: '100%', height: '3px', backgroundColor: C.cyan, borderRadius: '2px', transition: 'all 0.3s ease', opacity: isMenuOpen ? 0 : 1 }} />
            <span style={{ width: '100%', height: '3px', backgroundColor: C.cyan, borderRadius: '2px', transition: 'all 0.3s ease', transform: isMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'rotate(0)' }} />
          </button>
        </header>

        {/* MENU MOBILE */}
        {isMenuOpen && (
          <div style={{ position: 'fixed', top: '64px', left: 0, width: '100vw', height: 'calc(100vh - 64px)', backgroundColor: C.bg, zIndex: 9999, padding: '1.5rem', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
            <button
              onClick={() => { setStep('home'); setIsMenuOpen(false); }}
              style={{ backgroundColor: C.card, color: '#FFFFFF', border: `1px solid ${C.border}`, padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', cursor: 'pointer' }}>
              🏠 Page d'accueil
            </button>

            <button
              onClick={() => { setStep(adminPin ? 'admin_dashboard' : 'admin_login'); setIsMenuOpen(false); }}
              style={{ backgroundColor: C.card, color: C.pink, border: `1px solid ${C.pink}`, padding: '1rem', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', cursor: 'pointer' }}>
              🔒 Espace Administration
            </button>

            <div>
              <h3 style={{ fontSize: '0.85rem', color: C.soft, textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '1px' }}>Tous les documents</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {sortedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    style={{ backgroundColor: C.card, padding: '0.9rem 1rem', borderRadius: '8px', border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{doc.title}</span>
                    <span style={{ fontSize: '0.85rem', color: C.cyan, fontWeight: 'bold' }}>{doc.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
          {step !== 'home' && (
            <div style={{ marginBottom: '1rem' }}>
              <button onClick={handleBack} style={{ background: 'none', border: 'none', color: C.cyan, fontSize: '0.9rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 'bold' }}>
                ⬅️ Page précédente
              </button>
            </div>
          )}

          {/* 1. ACCUEIL */}
          {step === 'home' && (
            <div>
              <div style={{ textAlign: 'center', margin: '1.5rem 0 2.5rem 0' }}>
                <div className="hero-logo-box" style={{ display: 'inline-block', padding: '1rem', borderRadius: '20px', backgroundColor: C.card, marginBottom: '1rem', border: `1px solid ${C.border}` }}>
                  <AppLogo size={60} />
                </div>
                <HeroText />
              </div>

              <EditorialList />

              {savedOrderId && (
                <div style={{ ...card, padding: '1rem', marginBottom: '1.5rem', borderColor: C.cyan }}>
                  <p style={{ margin: '0 0 0.7rem 0', fontSize: '0.9rem' }}>Vous avez une commande enregistrée sur cet appareil.</p>
                  <button onClick={() => resumeOrder(savedOrderId)} style={btn(C.blue)}>Reprendre ma commande ➔</button>
                </div>
              )}

              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', letterSpacing: '0.5px' }}>📄 Choisissez votre document :</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="card-hover"
                    onClick={() => handleSelectDoc(doc)}
                    style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.2rem', cursor: 'pointer', position: 'relative' }}>
                    {doc.badge && (
                      <span style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: C.pink, color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                        {doc.badge}
                      </span>
                    )}
                    <div style={{ fontSize: '0.75rem', color: C.cyan, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{doc.category}</div>
                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.4rem 0', paddingRight: doc.badge ? '80px' : '0' }}>{doc.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: C.muted, margin: '0 0 1rem 0', lineHeight: 1.4 }}>{doc.desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: C.cyan }}>{doc.price}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Générer ➔</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. FORMULAIRE */}
          {step === 'form' && selectedDoc && (
            <div style={card}>
              <div style={{ marginBottom: '1.5rem', borderBottom: `1px solid ${C.border}`, paddingBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: C.cyan, fontWeight: 'bold' }}>ÉTAPE {formStep} SUR {maxStep}</span>
                <h2 style={{ fontSize: '1.3rem', margin: '0.2rem 0' }}>{selectedDoc.title}</h2>
                <p style={{ fontSize: '0.85rem', color: C.muted, margin: 0 }}>Remplissez les informations ci-dessous pour votre document.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (formStep < maxStep) setFormStep(formStep + 1);
                  else setStep('review');
                }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {selectedDoc.fields
                    .filter((field) => field.step === formStep)
                    .map((field) => (
                      <div key={field.id}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                          {field.label} {field.required && <span style={{ color: C.pink }}>*</span>}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea required={field.required} placeholder={field.placeholder} value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                        ) : field.type === 'select' ? (
                          <select required={field.required} value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} style={inputStyle}>
                            <option value="">-- Sélectionner --</option>
                            {field.options?.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input type={field.type} min={field.type === 'number' ? 0 : undefined} required={field.required} placeholder={field.placeholder} value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} style={inputStyle} />
                        )}
                      </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
                  {formStep > 1 && (
                    <button type="button" onClick={() => setFormStep(formStep - 1)} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: 'transparent', color: '#FFFFFF', fontWeight: 'bold', cursor: 'pointer' }}>
                      Précédent
                    </button>
                  )}
                  <button type="submit" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', backgroundColor: C.blue, color: '#FFFFFF', fontWeight: 'bold', cursor: 'pointer' }}>
                    {formStep === maxStep ? 'Vérifier les données ➔' : 'Suivant ➔'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. RÉCAPITULATIF */}
          {step === 'review' && selectedDoc && (
            <div style={card}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Récapitulatif de votre saisie</h2>
              <p style={{ fontSize: '0.85rem', color: C.muted, marginBottom: '1.5rem' }}>Vérifiez attentivement les informations fournies avant de générer l'aperçu.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', backgroundColor: C.bg, padding: '1rem', borderRadius: '8px', border: `1px solid ${C.border}`, marginBottom: '1.5rem' }}>
                {selectedDoc.fields.map((field) => (
                  <div key={field.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: C.cyan }}>{field.label}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {formData[field.id] || <i style={{ color: '#6B7280' }}>Non renseigné</i>}
                    </span>
                  </div>
                ))}
              </div>

              <button onClick={handleProcessDocument} style={btn(C.blue)}>Générer l’aperçu du document ➔</button>
            </div>
          )}

          {/* 4. APERÇU (filigrane, non téléchargeable) */}
          {step === 'preview' && selectedDoc && (
            <div>
              <div style={{ ...card, padding: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>📄 Aperçu de votre document</h2>
                <p style={{ fontSize: '0.8rem', color: C.muted, margin: 0 }}>
                  Ceci est un aperçu filigrané. Après le paiement de <strong style={{ color: '#FFFFFF' }}>{selectedDoc.price}</strong> et validation, vous recevrez le PDF officiel sans filigrane.
                </p>
              </div>

              <div style={{ position: 'relative', marginBottom: '1.5rem', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', userSelect: 'none' }}>
                <div className="doc-paper" style={{ padding: '2.5rem 2rem', minHeight: '400px', fontSize: '14px', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: WATERMARK, pointerEvents: 'none' }} />
              </div>

              <button onClick={() => setStep('payment')} style={{ ...btn(C.pink), padding: '1rem', fontSize: '1.05rem' }}>
                Payer {selectedDoc.price} & Recevoir le PDF ➔
              </button>
            </div>
          )}

          {/* 5. PAIEMENT */}
          {step === 'payment' && selectedDoc && (
            <div style={card}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>💳 Paiement Mobile Money</h2>
              <p style={{ fontSize: '0.85rem', color: C.muted, marginBottom: '1.5rem' }}>
                Montant à régler : <strong style={{ color: C.cyan, fontSize: '1.1rem' }}>{selectedDoc.price}</strong>
              </p>

              <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', color: C.cyan, marginTop: 0 }}>Consignes de paiement :</h3>
                <ol style={{ fontSize: '0.85rem', color: C.soft, paddingLeft: '1.2rem', margin: 0, lineHeight: 1.6 }}>
                  <li>Effectuez un transfert Orange Money ou MTN Mobile Money au : <strong style={{ color: '#FFFFFF' }}>{PAYMENT_NUMBER}</strong>.</li>
                  <li>Inscrivez ci-dessous le numéro utilisé et le TxID / Référence reçu par SMS.</li>
                  <li>Cliquez sur "Valider le paiement".</li>
                </ol>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Votre numéro de téléphone (Expéditeur)</label>
                  <input type="tel" placeholder="Ex: 699000000" value={senderPhoneInput} onChange={(e) => setSenderPhoneInput(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Référence de la transaction (TxID SMS)</label>
                  <input type="text" placeholder="Ex: MP260926.1124.A12345" value={transactionRefInput} onChange={(e) => setTransactionRefInput(e.target.value)} style={inputStyle} />
                </div>
                {paymentError && <p style={{ color: C.pink, fontSize: '0.85rem', margin: 0 }}>{paymentError}</p>}
              </div>

              <button onClick={handleInitiatePayment} disabled={isSubmittingPayment} style={{ ...btn(C.cyan, C.bg), opacity: isSubmittingPayment ? 0.7 : 1 }}>
                {isSubmittingPayment ? 'Enregistrement...' : 'Valider le paiement ➔'}
              </button>
            </div>
          )}

          {/* 6. EN ATTENTE */}
          {step === 'pending' && currentOrder && (
            <div style={{ ...card, padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Paiement en cours de vérification</h2>
              <p style={{ fontSize: '0.9rem', color: C.muted, marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Nous vérifions la réception de votre paiement Mobile Money.<br />
                Dès confirmation, votre document PDF officiel sera disponible ici. Vous pouvez fermer la page : votre commande est enregistrée sur cet appareil.
              </p>

              <div style={{ backgroundColor: C.bg, padding: '1rem', borderRadius: '8px', border: `1px solid ${C.border}`, textAlign: 'left', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
                <div><strong>Commande n° :</strong> {currentOrder.id.slice(0, 8).toUpperCase()}</div>
                <div><strong>Document :</strong> {currentOrder.docTitle}</div>
                <div><strong>Montant :</strong> {currentOrder.price}</div>
                <div><strong>Référence :</strong> {currentOrder.transactionRef}</div>
              </div>

              <div style={{ fontSize: '0.8rem', color: C.cyan }}>🔄 Vérification automatique en cours...</div>
            </div>
          )}

          {/* 7. SUCCÈS */}
          {step === 'success' && currentOrder && selectedDoc && (
            <div>
              <div style={{ ...card, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.4rem', color: C.cyan, marginBottom: '0.5rem' }}>Paiement approuvé !</h2>
                <p style={{ fontSize: '0.9rem', color: C.soft, marginBottom: '1.5rem' }}>
                  {selectedDoc.manual
                    ? 'Votre commande est validée. Notre équipe vous livre vos 5 documents sur WhatsApp. Vous pouvez aussi télécharger le récapitulatif ci-dessous.'
                    : 'Votre document est prêt et validé. Téléchargez votre fichier PDF.'}
                </p>

                <button onClick={generatePDF} disabled={isGeneratingPDF} style={{ ...btn(C.cyan, C.bg), padding: '1rem', fontSize: '1.05rem', marginBottom: '1rem', opacity: isGeneratingPDF ? 0.7 : 1 }}>
                  {isGeneratingPDF ? 'Génération du PDF...' : '📥 Télécharger mon PDF'}
                </button>

                <button
                  onClick={() => {
                    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
                    setSavedOrderId(null);
                    setCurrentOrder(null);
                    setStep('home');
                  }}
                  style={{ background: 'none', border: 'none', color: C.muted, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  Générer un autre document
                </button>
              </div>

              {/* Aperçu visible */}
              <div className="doc-paper" style={{ padding: '2.5rem 2rem', minHeight: '300px', borderRadius: '4px', fontSize: '14px', lineHeight: 1.5, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} dangerouslySetInnerHTML={{ __html: successHtml }} />

              {/* Conteneur A4 hors écran, utilisé pour générer le PDF */}
              <div style={{ position: 'fixed', left: '-10000px', top: 0 }}>
                <div ref={pdfRef} className="doc-paper" style={{ width: '794px', minHeight: '1123px', padding: '64px', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '15px', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: successHtml }} />
              </div>
            </div>
          )}

          {/* 8. CONNEXION ADMIN */}
          {step === 'admin_login' && (
            <div style={card}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: C.pink }}>🔒 Espace Administration</h2>
              <form onSubmit={handleAdminLogin}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Code d'accès</label>
                  <input type="password" placeholder="Entrez le code" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} style={inputStyle} />
                  {adminPinError && <p style={{ color: C.pink, fontSize: '0.8rem', marginTop: '0.3rem' }}>Code incorrect.</p>}
                </div>
                <button type="submit" style={{ ...btn(C.pink), padding: '0.8rem', fontSize: '0.95rem' }}>Se connecter ➔</button>
              </form>
            </div>
          )}

          {/* 9. DASHBOARD ADMIN */}
          {step === 'admin_dashboard' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: C.pink, margin: 0 }}>📊 Tableau de bord</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={loadOrders} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: `1px solid ${C.border}`, backgroundColor: C.card, color: '#FFFFFF', fontSize: '0.8rem', cursor: 'pointer' }}>🔄 Actualiser</button>
                  <button onClick={handleAdminLogout} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: `1px solid ${C.pink}`, backgroundColor: C.card, color: C.pink, fontSize: '0.8rem', cursor: 'pointer' }}>Quitter</button>
                </div>
              </div>

              {adminError && <p style={{ color: C.pink, fontSize: '0.85rem' }}>{adminError}</p>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.length === 0 ? (
                  <p style={{ textAlign: 'center', color: C.muted }}>Aucune commande enregistrée.</p>
                ) : (
                  orders.map((order) => {
                    const done = order.status === 'completed';
                    const digits = (order.sender_phone || '').replace(/\D/g, '');
                    const wa = digits.startsWith('237') ? digits : `237${digits}`;
                    return (
                      <div key={order.id} style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: C.cyan }}>{order.doc_title}</span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: done ? C.green : '#F59E0B', color: '#FFFFFF', height: 'fit-content' }}>
                            {done ? 'APPROVED' : 'PENDING'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: C.soft, lineHeight: 1.6 }}>
                          <div><strong>Client :</strong> {order.customer_name}</div>
                          <div><strong>Téléphone :</strong> {order.sender_phone}</div>
                          <div><strong>Montant :</strong> {fmt(order.amount)} FCFA</div>
                          <div><strong>Réf SMS :</strong> {order.transaction_ref || 'N/A'}</div>
                          <div><strong>Date :</strong> {fmtDateTime(order.created_at)}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', padding: '0.5rem', borderRadius: '6px', backgroundColor: '#25D366', color: '#FFFFFF', fontWeight: 'bold', fontSize: '0.85rem', textDecoration: 'none' }}>
                            WhatsApp
                          </a>
                          {!done && (
                            <button onClick={() => handleApproveOrder(order.id)} style={{ flex: 2, padding: '0.5rem', borderRadius: '6px', border: 'none', backgroundColor: C.green, color: '#FFFFFF', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                              ✓ Approuver
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PIED DE PAGE */}
      <footer style={{ padding: '1.5rem', textAlign: 'center', borderTop: '1px solid #1C2541', marginTop: '2rem', fontSize: '0.8rem', color: C.muted }}>
        <p style={{ margin: 0 }}>© 2026 DocExpress. Tous droits réservés.</p>
        <p style={{ fontSize: '0.65rem', color: '#4B5563', margin: '0.3rem 0 0 0' }}>Développé avec soin par Désiré Atangana Atangana</p>
        <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem' }}>Service sécurisé de génération administrative.</p>
      </footer>
    </div>
  );
}
