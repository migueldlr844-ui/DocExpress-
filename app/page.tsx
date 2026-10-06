'use client';

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createClient } from '@supabase/supabase-js';
import { AnimatePresence } from 'framer-motion';

import HeroText from '@/components/HeroText';
import EditorialList from '@/components/EditorialList';
import SplashScreen from '@/components/SplashScreen';

// ============================================================
// SUPABASE
// ============================================================

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://madkfwcxvhjznidszbhi.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzU4MDYyMDQzLCJleHAiOjIwNzM2MzgwNDN9.4i4LqV6_TIs361C-Z4iK6_76wA3YJ6P181O7I8w9Hk0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================
// LOGO
// ============================================================

const AppLogo = ({ size = 32 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="40" height="40" rx="10" fill="url(#logo_grad)" />
    <path
      d="M13 11H23L29 17V29C29 30.1046 28.1046 31 27 31H13C11.8954 31 11 30.1046 11 29V13C11 11.8954 11.8954 11 13 11Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 11V18H29"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 21L17 26H21L19 30L24 25H20L21 21Z"
      fill="#F72585"
      stroke="#F72585"
      strokeWidth="0.5"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="logo_grad"
        x1="0"
        y1="0"
        x2="40"
        y2="40"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#4361EE" />
        <stop offset="1" stopColor="#4CC9F0" />
      </linearGradient>
    </defs>
  </svg>
);

// ============================================================
// INTERFACES
// ============================================================

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

// ============================================================
// CONFIGURATION DES DOCUMENTS
// ============================================================

const DOCUMENTS_CONFIG: Record<string, DocumentConfig> = {
  quittance_loyer: {
    id: 'quittance_loyer',
    title: 'Quittance de loyer',
    category: 'IMMOBILIER',
    price: '500 FCFA',
    priceNumeric: 500,
    desc: 'Attestation officielle de paiement intégral du loyer mensuel.',
    fields: [
      {
        id: 'bailleur_nom',
        label: 'Nom complet du bailleur',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'bailleur_phone',
        label: 'Téléphone bailleur',
        type: 'text',
        step: 1
      },
      {
        id: 'locataire_nom',
        label: 'Nom complet du locataire',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'logement_adresse',
        label: 'Adresse du logement',
        type: 'text',
        placeholder: 'Ex: Omnisports, Yaoundé',
        step: 2,
        required: true
      },
      {
        id: 'periode',
        label: 'Période / Mois concerné',
        type: 'text',
        placeholder: 'Ex: Mois de Septembre 2026',
        step: 2,
        required: true
      },
      {
        id: 'loyer_montant',
        label: 'Montant du loyer (FCFA)',
        type: 'number',
        step: 2,
        required: true
      },
      {
        id: 'paiement_date',
        label: 'Date de paiement',
        type: 'text',
        placeholder: 'JJ/MM/AAAA',
        step: 3,
        required: true
      },
      {
        id: 'paiement_mode',
        label: 'Mode de paiement',
        type: 'select',
        options: [
          'Espèces',
          'Orange Money',
          'MTN Mobile Money',
          'Virement bancaire'
        ],
        step: 3,
        required: true
      }
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
      {
        id: 'receveur_nom',
        label: 'Nom du bénéficiaire (Bailleur)',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'payeur_nom',
        label: 'Nom du payeur (Locataire)',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'logement_adresse',
        label: 'Adresse du logement',
        type: 'text',
        step: 2,
        required: true
      },
      {
        id: 'montant',
        label: 'Montant perçu (FCFA)',
        type: 'number',
        step: 2,
        required: true
      },
      {
        id: 'motif',
        label: 'Motif du paiement',
        type: 'text',
        placeholder: 'Ex: Acompte loyer Septembre',
        step: 2,
        required: true
      },
      {
        id: 'reste_a_payer',
        label: 'Reste éventuel à payer (FCFA)',
        type: 'number',
        step: 3
      }
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
      {
        id: 'attestation_type',
        label: 'Type d’attestation',
        type: 'select',
        options: [
          'Attestation d’hébergement',
          'Attestation de location',
          'Attestation de paiement de loyer'
        ],
        step: 1,
        required: true
      },
      {
        id: 'declarant_nom',
        label: 'Nom complet du déclarant',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'declarant_adresse',
        label: 'Adresse du déclarant',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'beneficiaire_nom',
        label: 'Nom complet du bénéficiaire',
        type: 'text',
        step: 2,
        required: true
      },
      {
        id: 'date_debut',
        label: 'Réside / Hébergé depuis le',
        type: 'text',
        placeholder: 'JJ/MM/AAAA',
        step: 2,
        required: true
      }
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
      {
        id: 'vendeur_nom',
        label: 'Nom du vendeur / Boutique',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'acheteur_nom',
        label: 'Nom de l’acheteur',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'articles_liste',
        label: 'Désignation des articles achetés',
        type: 'textarea',
        step: 2,
        required: true
      },
      {
        id: 'montant_recu',
        label: 'Montant encaissé (FCFA)',
        type: 'number',
        step: 3,
        required: true
      }
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
      {
        id: 'name',
        label: 'Nom & Prénom',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'phone',
        label: 'Téléphone',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'address',
        label: 'Ville / Adresse',
        type: 'text',
        step: 1
      },
      {
        id: 'jobTitle',
        label: 'Poste recherché',
        type: 'text',
        step: 2,
        required: true
      },
      {
        id: 'recipient',
        label: 'Entreprise / Destinataire',
        type: 'text',
        step: 2,
        required: true
      },
      {
        id: 'experience',
        label: 'Vos points forts & Parcours',
        type: 'textarea',
        step: 3,
        required: true
      },
      {
        id: 'motivation',
        label: 'Pourquoi ce poste ?',
        type: 'textarea',
        step: 3,
        required: true
      }
    ]
  },

  contrat_bail: {
    id: 'contrat_bail',
    title: 'Contrat de bail d’habitation',
    category: 'IMMOBILIER',
    price: '1 000 FCFA',
    priceNumeric: 1000,
    desc: 'Bail d’habitation complet structuré avec clauses d’occupation.',
    fields: [
      {
        id: 'bailleur_nom',
        label: 'Nom du bailleur',
        type: 'text',
        placeholder: 'Ex: MBARGA',
        step: 1,
        required: true
      },
      {
        id: 'bailleur_prenom',
        label: 'Prénom(s) du bailleur',
        type: 'text',
        placeholder: 'Ex: Paul',
        step: 1,
        required: true
      },
      {
        id: 'bailleur_phone',
        label: 'Téléphone bailleur',
        type: 'text',
        placeholder: 'Ex: 6XX XX XX XX',
        step: 1,
        required: true
      },
      {
        id: 'bailleur_adresse',
        label: 'Adresse bailleur',
        type: 'text',
        step: 1
      },
      {
        id: 'locataire_nom',
        label: 'Nom du locataire',
        type: 'text',
        placeholder: 'Ex: KOUAM',
        step: 2,
        required: true
      },
      {
        id: 'locataire_prenom',
        label: 'Prénom(s) du locataire',
        type: 'text',
        required: true,
        step: 2
      },
      {
        id: 'locataire_phone',
        label: 'Téléphone locataire',
        type: 'text',
        required: true,
        step: 2
      },
      {
        id: 'logement_type',
        label: 'Type de logement',
        type: 'select',
        options: ['Studio', 'Appartement', 'Chambre', 'Maison villa'],
        step: 3,
        required: true
      },
      {
        id: 'logement_ville',
        label: 'Ville & Quartier',
        type: 'text',
        placeholder: 'Ex: Yaoundé, Bastos',
        step: 3,
        required: true
      },
      {
        id: 'loyer_montant',
        label: 'Loyer mensuel (FCFA)',
        type: 'number',
        placeholder: 'Ex: 75000',
        step: 3,
        required: true
      },
      {
        id: 'caution_montant',
        label: 'Montant de la caution (FCFA)',
        type: 'number',
        step: 3
      },
      {
        id: 'date_debut',
        label: 'Date de début du bail',
        type: 'text',
        placeholder: 'JJ/MM/AAAA',
        step: 3,
        required: true
      }
    ]
  },

  facture_simple: {
    id: 'facture_simple',
    title: 'Facture simple',
    category: 'BUSINESS',
    price: '1 000 FCFA',
    priceNumeric: 1000,
    desc: 'Facture commerciale claire avec tableau des prestations.',
    fields: [
      {
        id: 'vendeur_nom',
        label: 'Nom commercial / Entreprise',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'vendeur_phone',
        label: 'Téléphone / WhatsApp',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'client_nom',
        label: 'Nom du client / Entreprise',
        type: 'text',
        step: 2,
        required: true
      },
      {
        id: 'objets_factures',
        label: 'Détail des prestations ou articles',
        type: 'textarea',
        placeholder:
          'Ex: 2x Conception Logo (15000), 1x Impression Bâche (20000)',
        step: 3,
        required: true
      }
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
      {
        id: 'vendeur_nom',
        label: 'Nom de votre entreprise',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'client_nom',
        label: 'Client destinataire',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'validite',
        label: 'Validité de l’offre',
        type: 'text',
        placeholder: 'Ex: 15 jours',
        step: 2,
        required: true
      },
      {
        id: 'objets_factures',
        label: 'Services ou produits proposés',
        type: 'textarea',
        placeholder: 'Ex: 1x Maintenance informatique (50000)',
        step: 3,
        required: true
      }
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
      {
        id: 'acheteur_nom',
        label: 'Nom de votre entreprise',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'fournisseur_nom',
        label: 'Nom du fournisseur',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'produits_commandes',
        label: 'Liste des produits commandés',
        type: 'textarea',
        step: 2,
        required: true
      },
      {
        id: 'livraison_adresse',
        label: 'Lieu de livraison souhaité',
        type: 'text',
        step: 3,
        required: true
      }
    ]
  },

  cv: {
    id: 'cv',
    title: 'CV professionnel',
    category: 'CARRIÈRE',
    price: '1 000 FCFA',
    priceNumeric: 1000,
    badge: 'POPULAIRE',
    desc: 'Format moderne structuré pour le marché de l’emploi.',
    fields: [
      {
        id: 'name',
        label: 'Nom complet',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'phone',
        label: 'Téléphone & WhatsApp',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'jobTitle',
        label: 'Poste visé',
        type: 'text',
        placeholder: 'Ex: Commercial terrain',
        step: 2,
        required: true
      },
      {
        id: 'experience',
        label: 'Vos expériences (Postes, entreprises, tâches)',
        type: 'textarea',
        step: 3,
        required: true
      },
      {
        id: 'education',
        label: 'Formations & Diplômes',
        type: 'textarea',
        step: 3
      }
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
      {
        id: 'name',
        label: 'Nom complet',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'phone',
        label: 'Téléphone & WhatsApp',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'jobTitle',
        label: 'Poste recherché',
        type: 'text',
        step: 2,
        required: true
      },
      {
        id: 'recipient',
        label: 'Entreprise visée',
        type: 'text',
        step: 2,
        required: true
      },
      {
        id: 'experience',
        label: 'Parcours & Expériences',
        type: 'textarea',
        step: 3,
        required: true
      }
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
      {
        id: 'vendeur_nom',
        label: 'Nom de votre entreprise',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'vendeur_phone',
        label: 'Téléphone pro / WhatsApp',
        type: 'text',
        step: 1,
        required: true
      },
      {
        id: 'docs_selection',
        label: 'Précisez les 5 documents souhaités',
        type: 'textarea',
        step: 2,
        required: true
      }
    ]
  }
};

// ============================================================
// OUTILS DE GÉNÉRATION
// ============================================================

const escapeHtml = (value: unknown): string => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatNumber = (value: unknown): string => {
  const number = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(number)) return '0';
  return new Intl.NumberFormat('fr-FR').format(number);
};

const todayFrench = () => {
  return new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const shortDate = () => {
  return new Date().toLocaleDateString('fr-FR');
};

const generateReference = (prefix: string) => {
  const date = new Date();
  const stamp =
    String(date.getFullYear()).slice(-2) +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');

  const random = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${stamp}-${random}`;
};

const numberToWordsUnder1000 = (n: number): string => {
  const units = [
    'zéro',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize'
  ];

  const tens = [
    '',
    '',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante'
  ];

  if (n < 17) return units[n];

  if (n < 20) {
    return `dix-${units[n - 10]}`;
  }

  if (n < 70) {
    const t = Math.floor(n / 10);
    const r = n % 10;

    if (r === 0) return tens[t];
    if (r === 1) return `${tens[t]} et un`;

    return `${tens[t]}-${units[r]}`;
  }

  if (n < 80) {
    if (n === 71) return 'soixante et onze';

    return `soixante-${numberToWordsUnder1000(n - 60)}`;
  }

  if (n < 100) {
    if (n === 80) return 'quatre-vingts';

    return `quatre-vingt-${numberToWordsUnder1000(n - 80)}`;
  }

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  let result =
    hundreds === 1
      ? 'cent'
      : `${numberToWordsUnder1000(hundreds)} cent`;

  if (remainder === 0 && hundreds > 1) {
    result += 's';
  }

  if (remainder > 0) {
    result += ` ${numberToWordsUnder1000(remainder)}`;
  }

  return result;
};

const numberToWords = (value: unknown): string => {
  const n = Math.floor(
    Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  );

  if (!Number.isFinite(n) || n < 0) return 'zéro';

  if (n < 1000) return numberToWordsUnder1000(n);

  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;

    let result =
      thousands === 1
        ? 'mille'
        : `${numberToWordsUnder1000(thousands)} mille`;

    if (remainder > 0) {
      result += ` ${numberToWordsUnder1000(remainder)}`;
    }

    return result;
  }

  if (n < 1000000000) {
    const millions = Math.floor(n / 1000000);
    const remainder = n % 1000000;

    let result =
      millions === 1
        ? 'un million'
        : `${numberToWords(millions)} millions`;

    if (remainder > 0) {
      result += ` ${numberToWords(remainder)}`;
    }

    return result;
  }

  const billions = Math.floor(n / 1000000000);
  const remainder = n % 1000000000;

  let result =
    billions === 1
      ? 'un milliard'
      : `${numberToWords(billions)} milliards`;

  if (remainder > 0) {
    result += ` ${numberToWords(remainder)}`;
  }

  return result;
};

const moneyInWords = (value: unknown) => {
  return `${numberToWords(value)} francs CFA`;
};

interface ParsedItem {
  quantity: number;
  description: string;
  unitPrice: number;
  total: number;
}

const parseItems = (raw: string): ParsedItem[] => {
  if (!raw.trim()) return [];

  return raw
    .split(/\n|,/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      let quantity = 1;
      let description = line;
      let unitPrice = 0;

      const quantityMatch = line.match(
        /^(\d+)\s*[xX×]\s*(.+?)(?:\s*\(([\d\s.]+)\))?$/
      );

      if (quantityMatch) {
        quantity = Number(quantityMatch[1]) || 1;
        description = quantityMatch[2].trim();
        unitPrice = Number(
          quantityMatch[3]?.replace(/[^\d]/g, '') || 0
        );
      } else {
        const pipeMatch = line.match(
          /^(.+?)\s*\|\s*(\d+)\s*\|\s*([\d\s.]+)$/
        );

        if (pipeMatch) {
          description = pipeMatch[1].trim();
          quantity = Number(pipeMatch[2]) || 1;
          unitPrice = Number(
            pipeMatch[3].replace(/[^\d]/g, '')
          );
        } else {
          const dashMatch = line.match(
            /^(.+?)\s*[-:]\s*([\d\s.]+)$/
          );

          if (dashMatch) {
            description = dashMatch[1].trim();
            unitPrice = Number(
              dashMatch[2].replace(/[^\d]/g, '')
            );
          }
        }
      }

      return {
        quantity,
        description,
        unitPrice,
        total: quantity * unitPrice
      };
    });
};

const documentStyles = `
  font-family: Arial, Helvetica, sans-serif;
  color: #111827;
  background: #ffffff;
  line-height: 1.55;
  font-size: 13px;
`;

const docHeader = (
  label: string,
  reference: string
) => `
  <div style="
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    border-bottom:3px solid #4361EE;
    padding-bottom:14px;
    margin-bottom:24px;
  ">
    <div>
      <div style="
        font-size:20px;
        font-weight:800;
        letter-spacing:1px;
        color:#111827;
      ">
        DOCEXPRESS
      </div>
      <div style="
        font-size:10px;
        color:#6B7280;
        margin-top:3px;
        letter-spacing:1px;
      ">
        GÉNÉRATION DOCUMENTAIRE
      </div>
    </div>

    <div style="text-align:right;">
      <div style="
        font-size:11px;
        font-weight:700;
        color:#4361EE;
        text-transform:uppercase;
      ">
        ${escapeHtml(label)}
      </div>
      <div style="
        font-size:10px;
        color:#6B7280;
        margin-top:4px;
      ">
        Réf. ${escapeHtml(reference)}
      </div>
      <div style="
        font-size:10px;
        color:#6B7280;
        margin-top:2px;
      ">
        ${todayFrench()}
      </div>
    </div>
  </div>
`;

const sectionTitle = (title: string) => `
  <div style="
    font-size:12px;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:.7px;
    color:#1F2937;
    border-left:4px solid #4361EE;
    background:#F3F6FF;
    padding:8px 10px;
    margin:20px 0 10px;
  ">
    ${escapeHtml(title)}
  </div>
`;

const signatureBlock = (
  left: string,
  right: string
) => `
  <div style="
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:40px;
    margin-top:45px;
    page-break-inside:avoid;
  ">
    <div style="text-align:center;">
      <strong>${escapeHtml(left)}</strong>
      <div style="height:55px;"></div>
      <div style="font-size:11px;color:#6B7280;">
        Signature
      </div>
    </div>

    <div style="text-align:center;">
      <strong>${escapeHtml(right)}</strong>
      <div style="height:55px;"></div>
      <div style="font-size:11px;color:#6B7280;">
        Signature
      </div>
    </div>
  </div>
`;

const commercialTable = (
  items: ParsedItem[],
  totalOverride?: number
) => {
  const validItems = items.length
    ? items
    : [
        {
          quantity: 1,
          description: 'Prestation / article',
          unitPrice: 0,
          total: 0
        }
      ];

  const calculatedTotal = validItems.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const total =
    typeof totalOverride === 'number'
      ? totalOverride
      : calculatedTotal;

  return `
    <table style="
      width:100%;
      border-collapse:collapse;
      margin-top:12px;
      font-size:11px;
    ">
      <thead>
        <tr>
          <th style="
            background:#111827;
            color:#fff;
            padding:9px;
            border:1px solid #111827;
            text-align:left;
          ">Désignation</th>

          <th style="
            background:#111827;
            color:#fff;
            padding:9px;
            border:1px solid #111827;
            text-align:center;
            width:55px;
          ">Qté</th>

          <th style="
            background:#111827;
            color:#fff;
            padding:9px;
            border:1px solid #111827;
            text-align:right;
            width:100px;
          ">Prix unit.</th>

          <th style="
            background:#111827;
            color:#fff;
            padding:9px;
            border:1px solid #111827;
            text-align:right;
            width:110px;
          ">Total</th>
        </tr>
      </thead>

      <tbody>
        ${validItems
          .map(
            item => `
          <tr>
            <td style="
              padding:9px;
              border:1px solid #D1D5DB;
            ">
              ${escapeHtml(item.description)}
            </td>

            <td style="
              padding:9px;
              border:1px solid #D1D5DB;
              text-align:center;
            ">
              ${item.quantity}
            </td>

            <td style="
              padding:9px;
              border:1px solid #D1D5DB;
              text-align:right;
            ">
              ${item.unitPrice
                ? `${formatNumber(item.unitPrice)} F`
                : '—'}
            </td>

            <td style="
              padding:9px;
              border:1px solid #D1D5DB;
              text-align:right;
              font-weight:700;
            ">
              ${item.total
                ? `${formatNumber(item.total)} F`
                : '—'}
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div style="
      margin-top:14px;
      margin-left:auto;
      width:230px;
      border-top:2px solid #111827;
      padding-top:10px;
    ">
      <div style="
        display:flex;
        justify-content:space-between;
        font-weight:800;
        font-size:14px;
      ">
        <span>TOTAL</span>
        <span>${formatNumber(total)} FCFA</span>
      </div>

      <div style="
        font-size:9px;
        color:#6B7280;
        margin-top:5px;
        text-align:right;
      ">
        ${moneyInWords(total)}
      </div>
    </div>
  `;
};

// ============================================================
// APPLICATION
// ============================================================

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  const [step, setStep] = useState<
    | 'home'
    | 'form'
    | 'review'
    | 'preview'
    | 'payment'
    | 'pending'
    | 'success'
    | 'admin_login'
    | 'admin_dashboard'
  >('home');

  const [selectedDoc, setSelectedDoc] =
    useState<DocumentConfig | null>(null);

  const [formStep, setFormStep] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isGeneratingContent, setIsGeneratingContent] =
    useState(false);

  const [isGeneratingPDF, setIsGeneratingPDF] =
    useState(false);

  const [generatedBody, setGeneratedBody] =
    useState<string>('');

  const [formData, setFormData] =
    useState<Record<string, string>>({});

  const [senderPhoneInput, setSenderPhoneInput] =
    useState('');

  const [transactionRefInput, setTransactionRefInput] =
    useState('');

  const [isSubmittingPayment, setIsSubmittingPayment] =
    useState(false);

  const [currentOrder, setCurrentOrder] =
    useState<Order | null>(null);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [adminPinInput, setAdminPinInput] =
    useState('');

  const [adminPinError, setAdminPinError] =
    useState(false);

  const documentRef =
    useRef<HTMLDivElement>(null);

  const sortedDocuments =
    Object.values(DOCUMENTS_CONFIG).sort(
      (a, b) => a.priceNumeric - b.priceNumeric
    );
  // ============================================================
  // COMMANDES SUPABASE
  // ============================================================

  const fetchSupabaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        const mappedOrders: Order[] = data.map(
          (item: any) => ({
            id: item.id,
            docTitle:
              item.doc_title || 'Document',
            price:
              `${item.amount || 0} FCFA`,
            clientPhone:
              item.sender_phone ||
              'Non renseigné',
            senderPhone:
              item.sender_phone,
            transactionRef:
              item.transaction_ref,
            status:
              item.status === 'completed'
                ? 'APPROVED'
                : 'PENDING',
            createdAt:
              new Date(
                item.created_at
              ).toLocaleTimeString(
                'fr-FR',
                {
                  hour: '2-digit',
                  minute: '2-digit'
                }
              ),
            formData:
              item.form_data || {},
            generatedBody:
              item.generated_body || ''
          })
        );

        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error(
        'Erreur Supabase:',
        err
      );
    }
  };

  useEffect(() => {
    fetchSupabaseOrders();
  }, [step]);

  // ============================================================
  // VÉRIFICATION AUTOMATIQUE DU PAIEMENT
  // ============================================================

useEffect(() => {
  let interval: NodeJS.Timeout;

  if (step === "pending" && currentOrder) {
    interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("id", currentOrder.id)
          .single();

        if (data && data.status === "completed") {
          setCurrentOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: "APPROVED",
                }
              : null
          );

          setStep("success");
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);
  }

  return () => clearInterval(interval);
}, [step, currentOrder]);


  // ============================================================
  // SÉLECTION DOCUMENT
  // ============================================================

  const handleSelectDoc = (
    doc: DocumentConfig
  ) => {
    setSelectedDoc(doc);
    setFormStep(1);
    setFormData({});
    setGeneratedBody('');
    setSenderPhoneInput('');
    setTransactionRefInput('');
    setStep('form');
    setIsMenuOpen(false);
  };

  // ============================================================
  // CHANGEMENT FORMULAIRE
  // ============================================================

  const handleInputChange = (
    fieldId: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // ============================================================
  // RETOUR
  // ============================================================

  const handleBack = () => {
    if (step === 'form') {
      if (formStep > 1) {
        setFormStep(
          formStep - 1
        );
      } else {
        setStep('home');
      }
    } else if (
      step === 'review'
    ) {
      setStep('form');
    } else if (
      step === 'preview'
    ) {
      setStep('review');
    } else if (
      step === 'payment'
    ) {
      setStep('preview');
    } else if (
      step === 'pending'
    ) {
      setStep('payment');
    } else if (
      step === 'success'
    ) {
      setStep('home');
    } else if (
      step === 'admin_login' ||
      step === 'admin_dashboard'
    ) {
      setStep('home');
    }
  };

  // ============================================================
  // GÉNÉRATION DU DOCUMENT
  // ============================================================

  const handleProcessDocument =
    async () => {
      setIsGeneratingContent(true);

      let content = '';

      const id =
        selectedDoc?.id;

      const reference =
        generateReference(
          id === 'cv'
            ? 'CV'
            : id === 'lettre'
            ? 'LM'
            : id === 'contrat_bail'
            ? 'BAIL'
            : id === 'quittance_loyer'
            ? 'QT'
            : id === 'recu_loyer'
            ? 'REC'
            : id === 'facture_simple'
            ? 'FAC'
            : id === 'facture_proforma'
            ? 'PRO'
            : id === 'bon_commande'
            ? 'BC'
            : 'DOC'
        );

      // ========================================================
      // CONTRAT DE BAIL
      // ========================================================

      if (
        id === 'contrat_bail'
      ) {
        const loyer =
          Number(
            formData.loyer_montant ||
              0
          );

        const caution =
          Number(
            formData.caution_montant ||
              0
          );

        content = `
          <div style="${documentStyles}">

            ${docHeader(
              'Contrat de bail',
              reference
            )}

            <div style="
              text-align:center;
              margin-bottom:22px;
            ">
              <div style="
                font-size:18px;
                font-weight:800;
                text-transform:uppercase;
                color:#111827;
              ">
                CONTRAT DE BAIL À USAGE D'HABITATION
              </div>

              <div style="
                font-size:10px;
                color:#6B7280;
                margin-top:5px;
              ">
                Contrat établi le ${todayFrench()}
              </div>
            </div>

            <p>
              <strong>ENTRE LES SOUSSIGNÉS :</strong>
            </p>

            ${sectionTitle(
              '1. Identification des parties'
            )}

            <p>
              <strong>Le Bailleur :</strong>
              ${escapeHtml(
                `${formData.bailleur_nom || ''} ${
                  formData.bailleur_prenom || ''
                }`
              )}
              ${formData.bailleur_phone
                ? `, téléphone : ${escapeHtml(
                    formData.bailleur_phone
                  )}`
                : ''}
              ${
                formData.bailleur_adresse
                  ? `, domicilié à : ${escapeHtml(
                      formData.bailleur_adresse
                    )}`
                  : ''
              }.
            </p>

            <p>
              <strong>Le Locataire :</strong>
              ${escapeHtml(
                `${formData.locataire_nom || ''} ${
                  formData.locataire_prenom || ''
                }`
              )}
              ${
                formData.locataire_phone
                  ? `, téléphone : ${escapeHtml(
                      formData.locataire_phone
                    )}`
                  : ''
              }.
            </p>

            ${sectionTitle(
              '2. Objet du bail'
            )}

            <p>
              Le Bailleur donne à bail au Locataire,
              qui accepte, un logement à usage
              d'habitation de type
              <strong>${escapeHtml(
                formData.logement_type ||
                  'logement'
              )}</strong>,
              situé à
              <strong>${escapeHtml(
                formData.logement_ville ||
                  ''
              )}</strong>.
            </p>

            ${sectionTitle(
              '3. Durée du bail'
            )}

            <p>
              Le présent bail prend effet à compter
              du <strong>${escapeHtml(
                formData.date_debut ||
                  ''
              )}</strong>.
              Sauf stipulation contraire entre les
              parties, il est conclu pour une durée
              d'un an, renouvelable conformément aux
              dispositions applicables et aux accords
              des parties.
            </p>

            ${sectionTitle(
              '4. Loyer et conditions financières'
            )}

            <p>
              Le loyer mensuel est fixé à
              <strong>${formatNumber(
                loyer
              )} FCFA</strong>,
              soit
              <strong>${moneyInWords(
                loyer
              )}</strong>.
            </p>

            <p>
              La caution indiquée par les parties
              s'élève à
              <strong>${formatNumber(
                caution
              )} FCFA</strong>.
            </p>

            ${sectionTitle(
              '5. Obligations du Locataire'
            )}

            <p>
              Le Locataire s'engage notamment à :
            </p>

            <ul>
              <li>payer le loyer conformément aux conditions convenues ;</li>
              <li>utiliser le logement conformément à sa destination d'habitation ;</li>
              <li>préserver les lieux et signaler rapidement toute dégradation importante ;</li>
              <li>respecter les règles normales de voisinage ;</li>
              <li>ne pas céder ou sous-louer le logement sans accord préalable lorsque celui-ci est requis.</li>
            </ul>

            ${sectionTitle(
              '6. Obligations du Bailleur'
            )}

            <p>
              Le Bailleur s'engage à permettre au
              Locataire une jouissance paisible du
              logement et à assumer les obligations
              qui lui incombent au titre du bail et
              des dispositions applicables.
            </p>

            ${sectionTitle(
              '7. Entretien et réparations'
            )}

            <p>
              Les parties conviennent que l'entretien
              courant et les réparations locatives
              incombant au Locataire sont à sa charge,
              tandis que les réparations relevant des
              obligations du Bailleur restent à la
              charge de celui-ci, sous réserve des
              responsabilités résultant d'une faute ou
              d'une dégradation imputable au Locataire.
            </p>

            ${sectionTitle(
              '8. Résiliation et fin du bail'
            )}

            <p>
              Toute résiliation ou fin anticipée du
              bail intervient conformément aux
              dispositions légales applicables et aux
              conditions convenues entre les parties.
              Les parties s'engagent à respecter les
              délais et formalités applicables.
            </p>

            ${sectionTitle(
              '9. Règlement des différends'
            )}

            <p>
              Les parties privilégieront dans un
              premier temps une résolution amiable de
              tout différend relatif à l'exécution du
              présent contrat. À défaut d'accord,
              les mécanismes et juridictions compétents
              pourront être saisis conformément aux
              règles applicables.
            </p>

            <div style="
              margin-top:20px;
              padding:10px;
              border:1px solid #D1D5DB;
              background:#F9FAFB;
              font-size:9px;
              color:#6B7280;
            ">
              Document généré à partir des informations
              fournies par l'utilisateur. Il est recommandé
              aux parties de vérifier les informations et,
              lorsque nécessaire, de faire relire le contrat
              par un professionnel compétent avant signature.
            </div>

            ${signatureBlock(
              'Le Bailleur',
              'Le Locataire'
            )}

          </div>
        `;
      }

      // ========================================================
      // QUITTANCE
      // ========================================================

      else if (
        id === 'quittance_loyer'
      ) {
        const montant =
          Number(
            formData.loyer_montant ||
              0
          );

        content = `
          <div style="${documentStyles}">

            ${docHeader(
              'Quittance de loyer',
              reference
            )}

            <div style="
              text-align:center;
              padding:12px;
              border:1px solid #D1D5DB;
              background:#F8FAFC;
              margin-bottom:22px;
            ">
              <div style="
                font-size:20px;
                font-weight:800;
                text-transform:uppercase;
              ">
                QUITTANCE DE LOYER
              </div>

              <div style="
                color:#6B7280;
                font-size:11px;
                margin-top:4px;
              ">
                Période : ${escapeHtml(
                  formData.periode || ''
                )}
              </div>
            </div>

            <p>
              Je soussigné(e)
              <strong>${escapeHtml(
                formData.bailleur_nom || ''
              )}</strong>
              ${
                formData.bailleur_phone
                  ? `(Tél. ${escapeHtml(
                      formData.bailleur_phone
                    )})`
                  : ''
              },
              bailleur / gestionnaire du logement
              situé à
              <strong>${escapeHtml(
                formData.logement_adresse ||
                  ''
              )}</strong>,
              reconnais avoir reçu de
              <strong>${escapeHtml(
                formData.locataire_nom || ''
              )}</strong>
              la somme de :
            </p>

            <div style="
              margin:24px 0;
              padding:18px;
              border:2px solid #4361EE;
              text-align:center;
              background:#F5F7FF;
            ">
              <div style="
                font-size:22px;
                font-weight:800;
                color:#111827;
              ">
                ${formatNumber(
                  montant
                )} FCFA
              </div>

              <div style="
                font-size:10px;
                color:#6B7280;
                margin-top:6px;
                text-transform:capitalize;
              ">
                ${moneyInWords(
                  montant
                )}
              </div>
            </div>

            <p>
              Cette somme correspond au paiement du
              loyer pour la période :
              <strong>${escapeHtml(
                formData.periode || ''
              )}</strong>.
            </p>

            <p>
              <strong>Mode de paiement :</strong>
              ${escapeHtml(
                formData.paiement_mode ||
                  ''
              )}
            </p>

            <p>
              <strong>Date du paiement :</strong>
              ${escapeHtml(
                formData.paiement_date ||
                  ''
              )}
            </p>

            <div style="
              margin-top:25px;
              padding:12px;
              border:1px solid #E5E7EB;
              background:#F9FAFB;
              font-size:10px;
            ">
              La présente quittance est délivrée à
              titre de justificatif du paiement
              mentionné ci-dessus.
            </div>

            <div style="
              text-align:right;
              margin-top:50px;
            ">
              <strong>Le Bailleur / Gestionnaire</strong>
              <div style="height:55px;"></div>
              <span style="
                font-size:10px;
                color:#6B7280;
              ">
                Signature / Cachet
              </span>
            </div>

          </div>
        `;
      }

      // ========================================================
      // REÇU LOYER
      // ========================================================

      else if (
        id === 'recu_loyer'
      ) {
        const montant =
          Number(
            formData.montant || 0
          );

        const reste =
          Number(
            formData.reste_a_payer ||
              0
          );

        content = `
          <div style="${documentStyles}">

            ${docHeader(
              'Reçu de paiement',
              reference
            )}

            <div style="
              text-align:center;
              margin-bottom:25px;
            ">
              <div style="
                font-size:19px;
                font-weight:800;
                text-transform:uppercase;
              ">
                REÇU DE PAIEMENT DE LOYER
              </div>
            </div>

            <p>
              Je soussigné(e)
              <strong>${escapeHtml(
                formData.receveur_nom || ''
              )}</strong>,
              reconnais avoir reçu de
              <strong>${escapeHtml(
                formData.payeur_nom || ''
              )}</strong>
              la somme de :
            </p>

            <div style="
              text-align:center;
              border:2px solid #111827;
              padding:18px;
              margin:22px 0;
            ">
              <div style="
                font-size:23px;
                font-weight:800;
              ">
                ${formatNumber(
                  montant
                )} FCFA
              </div>

              <div style="
                font-size:10px;
                color:#6B7280;
                margin-top:5px;
              ">
                ${moneyInWords(
                  montant
                )}
              </div>
            </div>

            <p>
              <strong>Motif :</strong>
              ${escapeHtml(
                formData.motif ||
                  'Paiement de loyer'
              )}
            </p>

            <p>
              <strong>Logement concerné :</strong>
              ${escapeHtml(
                formData.logement_adresse ||
                  ''
              )}
            </p>

            <div style="
              margin-top:20px;
              display:flex;
              justify-content:space-between;
              padding:14px;
              background:#F9FAFB;
              border:1px solid #E5E7EB;
            ">
              <div>
                <div style="
                  font-size:10px;
                  color:#6B7280;
                ">
                  Montant reçu
                </div>
                <strong>
                  ${formatNumber(
                    montant
                  )} FCFA
                </strong>
              </div>

              <div style="text-align:right;">
                <div style="
                  font-size:10px;
                  color:#6B7280;
                ">
                  Reste à payer
                </div>
                <strong>
                  ${formatNumber(
                    reste
                  )} FCFA
                </strong>
              </div>
            </div>

            ${signatureBlock(
              'Le Payeur',
              `Le Bénéficiaire : ${
                formData.receveur_nom ||
                ''
              }`
            )}

          </div>
        `;
      }

      // ========================================================
      // ATTESTATION
      // ========================================================

      else if (
        id === 'attestation_location'
      ) {
        const type =
          formData.attestation_type ||
          'Attestation';

        const isHebergement =
          type.toLowerCase().includes(
            'hébergement'
          );

        const isPaiement =
          type.toLowerCase().includes(
            'paiement'
          );

        let body = '';

        if (isHebergement) {
          body = `
            J'atteste sur l'honneur que
            <strong>${escapeHtml(
              formData.beneficiaire_nom ||
                ''
            )}</strong>
            est hébergé(e) à mon domicile situé à
            <strong>${escapeHtml(
              formData.declarant_adresse ||
                ''
            )}</strong>
            depuis le
            <strong>${escapeHtml(
              formData.date_debut ||
                ''
            )}</strong>.
          `;
        } else if (isPaiement) {
          body = `
            J'atteste que
            <strong>${escapeHtml(
              formData.beneficiaire_nom ||
                ''
            )}</strong>
            est concerné(e) par une relation
            locative avec moi depuis le
            <strong>${escapeHtml(
              formData.date_debut ||
                ''
            )}</strong>
            et que la présente attestation est
            établie à titre de justificatif.
          `;
        } else {
          body = `
            J'atteste que
            <strong>${escapeHtml(
              formData.beneficiaire_nom ||
                ''
            )}</strong>
            occupe / loue le logement situé à
            <strong>${escapeHtml(
              formData.declarant_adresse ||
                ''
            )}</strong>
            depuis le
            <strong>${escapeHtml(
              formData.date_debut ||
                ''
            )}</strong>.
          `;
        }

        content = `
          <div style="${documentStyles}">

            ${docHeader(
              'Attestation locative',
              reference
            )}

            <div style="
              text-align:center;
              margin:30px 0;
            ">
              <div style="
                font-size:19px;
                font-weight:800;
                text-transform:uppercase;
              ">
                ${escapeHtml(
                  type
                )}
              </div>

              <div style="
                width:80px;
                height:3px;
                background:#4361EE;
                margin:10px auto;
              "></div>
            </div>

            <p>
              Je soussigné(e)
              <strong>${escapeHtml(
                formData.declarant_nom ||
                  ''
              )}</strong>,
              demeurant à
              <strong>${escapeHtml(
                formData.declarant_adresse ||
                  ''
              )}</strong>,
              ${body}
            </p>

            <p style="
              margin-top:22px;
            ">
              La présente attestation est établie
              à la demande de l'intéressé(e) pour
              servir et valoir ce que de droit.
            </p>

            <div style="
              margin-top:50px;
              text-align:right;
            ">
              <div>
                Fait le ${todayFrench()}
              </div>

              <div style="
                margin-top:35px;
              ">
                <strong>Le Déclarant</strong>
              </div>

              <div style="height:55px;"></div>

              <div style="
                font-size:10px;
                color:#6B7280;
              ">
                Signature
              </div>
            </div>

          </div>
        `;
      }

      // ========================================================
      // REÇU DE VENTE
      // ========================================================

      else if (
        id === 'recu_vente'
      ) {
        const montant =
          Number(
            formData.montant_recu ||
              0
          );

        content = `
          <div style="${documentStyles}">

            ${docHeader(
              'Reçu de vente',
              reference
            )}

            <div style="
              display:flex;
              justify-content:space-between;
              gap:20px;
              margin-bottom:25px;
            ">

              <div>
                <div style="
                  font-size:10px;
                  color:#6B7280;
                  text-transform:uppercase;
                ">
                  Vendeur
                </div>

                <strong>
                  ${escapeHtml(
                    formData.vendeur_nom ||
                      ''
                  )}
                </strong>
              </div>

              <div style="text-align:right;">
                <div style="
                  font-size:10px;
                  color:#6B7280;
                  text-transform:uppercase;
                ">
                  Acheteur
                </div>

                <strong>
                  ${escapeHtml(
                    formData.acheteur_nom ||
                      ''
                  )}
                </strong>
              </div>

            </div>

            ${sectionTitle(
              'Articles / prestations'
            )}

            <div style="
              border:1px solid #D1D5DB;
              padding:15px;
              white-space:pre-wrap;
              background:#F9FAFB;
            ">
              ${escapeHtml(
                formData.articles_liste ||
                  ''
              )}
            </div>

            <div style="
              margin-top:25px;
              padding:16px;
              background:#111827;
              color:#fff;
              display:flex;
              justify-content:space-between;
              align-items:center;
            ">
              <strong>Total encaissé</strong>
              <strong style="font-size:17px;">
                ${formatNumber(
                  montant
                )} FCFA
              </strong>
            </div>

            <div style="
              text-align:right;
              margin-top:50px;
            ">
              <strong>Le Vendeur</strong>
              <div style="height:55px;"></div>
              <span style="
                font-size:10px;
                color:#6B7280;
              ">
                Signature
              </span>
            </div>

          </div>
        `;
      }

      // ========================================================
      // FACTURE SIMPLE
      // ========================================================

      else if (
        id === 'facture_simple'
      ) {
        const items =
          parseItems(
            formData.objets_factures ||
              ''
          );

        const total =
          items.reduce(
            (sum, item) =>
              sum + item.total,
            0
          );

        content = `
          <div style="${documentStyles}">

            ${docHeader(
              'Facture',
              reference
            )}

            <div style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:20px;
              margin-bottom:25px;
            ">

              <div style="
                border:1px solid #E5E7EB;
                padding:12px;
              ">
                <div style="
                  font-size:9px;
                  color:#6B7280;
                  text-transform:uppercase;
                ">
                  Émetteur
                </div>

                <strong>
                  ${escapeHtml(
                    formData.vendeur_nom ||
                      'Entreprise'
                  )}
                </strong>

                <div style="
                  font-size:10px;
                  margin-top:4px;
                ">
                  ${escapeHtml(
                    formData.vendeur_phone ||
                      ''
                  )}
                </div>
              </div>

              <div style="
                border:1px solid #E5E7EB;
                padding:12px;
              ">
                <div style="
                  font-size:9px;
                  color:#6B7280;
                  text-transform:uppercase;
                ">
                  Client
                </div>

                <strong>
                  ${escapeHtml(
                    formData.client_nom ||
                      ''
                  )}
                </strong>
              </div>

            </div>

            ${sectionTitle(
              'Détail de la facture'
            )}

            ${commercialTable(
              items,
              total
            )}

            <div style="
              margin-top:35px;
              font-size:10px;
              color:#6B7280;
            ">
              Facture générée le ${todayFrench()}.
            </div>

            <div style="
              text-align:right;
              margin-top:40px;
            ">
              <strong>La Direction</strong>
              <div style="height:50px;"></div>
              <span style="
                font-size:10px;
                color:#6B7280;
              ">
                Signature / Cachet
              </span>
            </div>

          </div>
        `;
      }

      // ========================================================
      // FACTURE PROFORMA
      // ========================================================

      else if (
        id === 'facture_proforma'
      ) {
        const items =
          parseItems(
            formData.objets_factures ||
              ''
          );

        const total =
          items.reduce(
            (sum, item) =>
              sum + item.total,
            0
          );

        content = `
          <div style="${documentStyles}">

            ${docHeader(
              'Facture proforma',
              reference
            )}

            <div style="
              text-align:center;
              margin-bottom:20px;
            ">
              <div style="
                font-size:20px;
                font-weight:800;
                text-transform:uppercase;
                color:#4361EE;
              ">
                FACTURE PROFORMA
              </div>

              <div style="
                font-size:10px;
                color:#6B7280;
                margin-top:5px;
              ">
                Offre commerciale
              </div>
            </div>

            <div style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:20px;
              margin-bottom:22px;
            ">

              <div style="
                border:1px solid #E5E7EB;
                padding:12px;
              ">
                <div style="
                  font-size:9px;
                  color:#6B7280;
                  text-transform:uppercase;
                ">
                  Prestataire
                </div>

                <strong>
                  ${escapeHtml(
                    formData.vendeur_nom ||
                      ''
                  )}
                </strong>
              </div>

              <div style="
                border:1px solid #E5E7EB;
                padding:12px;
              ">
                <div style="
                  font-size:9px;
                  color:#6B7280;
                  text-transform:uppercase;
                ">
                  Client
                </div>

                <strong>
                  ${escapeHtml(
                    formData.client_nom ||
                      ''
                  )}
                </strong>
              </div>

            </div>

            <div style="
              padding:10px 12px;
              background:#FFF7ED;
              border:1px solid #FED7AA;
              margin-bottom:20px;
              font-size:11px;
            ">
              <strong>Validité de l'offre :</strong>
              ${escapeHtml(
                formData.validite ||
                  '15 jours'
              )}
            </div>

            ${commercialTable(
              items,
              total
            )}

            <div style="
              margin-top:30px;
              padding:12px;
              border:1px solid #D1D5DB;
              background:#F9FAFB;
              font-size:10px;
            ">
              Cette facture proforma constitue une
              proposition commerciale et ne constitue
              pas, à elle seule, une preuve de paiement.
            </div>

            <div style="
              text-align:right;
              margin-top:40px;
            ">
              <strong>La Direction</strong>
              <div style="height:50px;"></div>
              <span style="
                font-size:10px;
                color:#6B7280;
              ">
                Signature / Cachet
              </span>
            </div>

          </div>
        `;
      }

      // ========================================================
      // BON DE COMMANDE
      // ========================================================

      else if (
        id === 'bon_commande'
      ) {
        const items =
          parseItems(
            formData.produits_commandes ||
              ''
          );

        content = `
          <div style="${documentStyles}">

            ${docHeader(
              'Bon de commande',
              reference
            )}

            <div style="
              text-align:center;
              margin-bottom:25px;
            ">
              <div style="
                font-size:20px;
                font-weight:800;
                text-transform:uppercase;
              ">
                BON DE COMMANDE
              </div>
            </div>

            <div style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:15px;
              margin-bottom:22px;
            ">

              <div style="
                border:1px solid #D1D5DB;
                padding:12px;
              ">
                <div style="
                  font-size:9px;
                  color:#6B7280;
                  text-transform:uppercase;
                ">
                  Acheteur
                </div>

                <strong>
                  ${escapeHtml(
                    formData.acheteur_nom ||
                      ''
                  )}
                </strong>
              </div>

              <div style="
                border:1px solid #D1D5DB;
                padding:12px;
              ">
                <div style="
                  font-size:9px;
                  color:#6B7280;
                  text-transform:uppercase;
                ">
                  Fournisseur
                </div>

                <strong>
                  ${escapeHtml(
                    formData.fournisseur_nom ||
                      ''
                  )}
                </strong>
              </div>

            </div>

            ${sectionTitle(
              'Lieu de livraison'
            )}

            <div style="
              padding:12px;
              background:#F9FAFB;
              border:1px solid #E5E7EB;
            ">
              ${escapeHtml(
                formData.livraison_adresse ||
                  ''
              )}
            </div>

            ${sectionTitle(
              'Produits commandés'
            )}

            ${
              items.length
                ? commercialTable(
                    items
                  )
                : `
                  <div style="
                    border:1px solid #D1D5DB;
                    padding:15px;
                    white-space:pre-wrap;
                  ">
                    ${escapeHtml(
                      formData.produits_commandes ||
                        ''
                    )}
                  </div>
                `
            }

            ${signatureBlock(
              'L’Acheteur',
              'Confirmation Fournisseur'
            )}

          </div>
        `;
      }

      // ========================================================
      // CV
      // ========================================================

      else if (
        id === 'cv'
      ) {
        content = `
          <div style="${documentStyles}">

            <div style="
              display:grid;
              grid-template-columns:2fr 1fr;
              gap:20px;
              border-bottom:4px solid #4361EE;
              padding-bottom:18px;
              margin-bottom:20px;
            ">

              <div>
                <div style="
                  font-size:25px;
                  font-weight:900;
                  text-transform:uppercase;
                  letter-spacing:.5px;
                  color:#111827;
                ">
                  ${escapeHtml(
                    formData.name ||
                      ''
                  )}
                </div>

                <div style="
                  font-size:14px;
                  color:#4361EE;
                  font-weight:700;
                  margin-top:5px;
                ">
                  ${escapeHtml(
                    formData.jobTitle ||
                      ''
                  )}
                </div>
              </div>

              <div style="
                text-align:right;
                font-size:10px;
                color:#4B5563;
              ">
                <div>
                  <strong>Téléphone</strong>
                </div>

                <div>
                  ${escapeHtml(
                    formData.phone ||
                      ''
                  )}
                </div>
              </div>

            </div>

            ${sectionTitle(
              'Profil professionnel'
            )}

            <p style="
              color:#374151;
            ">
              Professionnel orienté vers le poste de
              <strong>${escapeHtml(
                formData.jobTitle ||
                  ''
              )}</strong>.
              Le parcours présenté ci-dessous met en
              évidence les expériences et compétences
              communiquées par le candidat.
            </p>

            ${sectionTitle(
              'Expériences professionnelles'
            )}

            <div style="
              white-space:pre-wrap;
              line-height:1.7;
              color:#1F2937;
            ">
              ${escapeHtml(
                formData.experience ||
                  ''
              )}
            </div>

            ${
              formData.education
                ? `
                  ${sectionTitle(
                    'Formations & diplômes'
                  )}

                  <div style="
                    white-space:pre-wrap;
                    line-height:1.7;
                  ">
                    ${escapeHtml(
                      formData.education
                    )}
                  </div>
                `
                : ''
            }

            ${sectionTitle(
              'Compétences'
            )}

            <ul style="
              margin-top:5px;
              line-height:1.8;
            ">
              <li>Organisation et sens des responsabilités</li>
              <li>Communication professionnelle</li>
              <li>Capacité d'adaptation</li>
              <li>Travail en équipe</li>
            </ul>

            <div style="
              margin-top:30px;
              padding-top:10px;
              border-top:1px solid #E5E7EB;
              font-size:9px;
              color:#9CA3AF;
              text-align:right;
            ">
              CV généré par DocExpress — ${todayFrench()}
            </div>

          </div>
        `;
      }

      // ========================================================
      // LETTRE DE MOTIVATION
      // ========================================================

      else if (
        id === 'lettre'
      ) {
        content = `
          <div style="${documentStyles}">

            <div style="
              display:flex;
              justify-content:space-between;
              align-items:flex-start;
              margin-bottom:35px;
            ">

              <div>
                <strong style="
                  font-size:15px;
                  color:#111827;
                ">
                  ${escapeHtml(
                    formData.name ||
                      ''
                  )}
                </strong>

                <div style="
                  font-size:10px;
                  color:#4B5563;
                  margin-top:5px;
                ">
                  ${escapeHtml(
                    formData.phone ||
                      ''
                  )}
                </div>

                ${
                  formData.address
                    ? `
                      <div style="
                        font-size:10px;
                        color:#4B5563;
                      ">
                        ${escapeHtml(
                          formData.address
                        )}
                      </div>
                    `
                    : ''
                }
              </div>

              <div style="
                text-align:right;
                font-size:11px;
                color:#374151;
              ">
                <div>
                  À l'attention de
                </div>

                <strong>
                  ${escapeHtml(
                    formData.recipient ||
                      'Madame, Monsieur'
                  )}
                </strong>
              </div>

            </div>

            <div style="
              text-align:right;
              font-size:10px;
              color:#6B7280;
              margin-bottom:25px;
            ">
              ${todayFrench()}
            </div>

            <div style="
              font-size:13px;
              font-weight:800;
              margin-bottom:22px;
            ">
              Objet : Candidature au poste de
              ${escapeHtml(
                formData.jobTitle ||
                  ''
              )}
            </div>

            <p>
              Madame, Monsieur,
            </p>

            <p>
              Je vous adresse ma candidature pour le
              poste de
              <strong>${escapeHtml(
                formData.jobTitle ||
                  ''
              )}</strong>
              au sein de
              <strong>${escapeHtml(
                formData.recipient ||
                  'votre entreprise'
              )}</strong>.
              Cette démarche s'inscrit dans ma volonté
              de mettre mon parcours, mes compétences et
              mon engagement au service d'une structure
              dans laquelle je pourrai contribuer
              concrètement aux objectifs de l'équipe.
            </p>

            <p>
              ${escapeHtml(
                formData.motivation ||
                  ''
              )}
            </p>

            <p>
              Mon parcours se caractérise notamment par
              les expériences et qualités suivantes :
            </p>

            <div style="
              white-space:pre-wrap;
              padding-left:15px;
              border-left:3px solid #4361EE;
              margin:18px 0;
              color:#374151;
            ">
              ${escapeHtml(
                formData.experience ||
                  ''
              )}
            </div>

            <p>
              Sérieux(se), motivé(e) et disposé(e) à
              apprendre, je souhaite pouvoir échanger
              avec vous afin de vous présenter plus
              précisément ma candidature et la valeur que
              je pourrais apporter à votre structure.
            </p>

            <p>
              Je reste à votre disposition pour un
              entretien à votre convenance et vous prie
              d'agréer, Madame, Monsieur, l'expression
              de mes salutations distinguées.
            </p>

            <div style="
              text-align:right;
              margin-top:45px;
            ">
              <strong>
                ${escapeHtml(
                  formData.name ||
                    ''
                )}
              </strong>

              <div style="height:40px;"></div>

              <span style="
                font-size:10px;
                color:#6B7280;
              ">
                Signature
              </span>
            </div>

          </div>
        `;
      }

      // ========================================================
      // PACK EMPLOI
      // ========================================================

      else if (
        id === 'pack_emploi'
      ) {
        const cvReference =
          generateReference('CV');

        const letterReference =
          generateReference('LM');

        content = `
          <div style="${documentStyles}">

            <div style="
              text-align:center;
              padding-bottom:15px;
              border-bottom:3px solid #4361EE;
              margin-bottom:25px;
            ">
              <div style="
                font-size:22px;
                font-weight:900;
                color:#111827;
              ">
                PACK EMPLOI
              </div>

              <div style="
                color:#4361EE;
                font-size:12px;
                font-weight:700;
              ">
                CV PROFESSIONNEL + LETTRE DE MOTIVATION
              </div>
            </div>

            <div style="
              padding:12px;
              background:#F3F6FF;
              border:1px solid #DCE4FF;
              margin-bottom:30px;
            ">
              <strong>
                Candidat :
              </strong>
              ${escapeHtml(
                formData.name ||
                  ''
              )}
              <br/>
              <strong>
                Téléphone :
              </strong>
              ${escapeHtml(
                formData.phone ||
                  ''
              )}
              <br/>
              <strong>
                Poste :
              </strong>
              ${escapeHtml(
                formData.jobTitle ||
                  ''
              )}
            </div>

            ${sectionTitle(
              'PARTIE 1 — CV PROFESSIONNEL'
            )}

            <div style="
              font-size:21px;
              font-weight:900;
              text-transform:uppercase;
            ">
              ${escapeHtml(
                formData.name ||
                  ''
              )}
            </div>

            <div style="
              color:#4361EE;
              font-weight:700;
              margin:5px 0 15px;
            ">
              ${escapeHtml(
                formData.jobTitle ||
                  ''
              )}
            </div>

            <div style="
              font-size:10px;
              color:#4B5563;
              margin-bottom:20px;
            ">
              ${escapeHtml(
                formData.phone ||
                  ''
              )}
            </div>

            ${sectionTitle(
              'Expériences professionnelles'
            )}

            <div style="
              white-space:pre-wrap;
              line-height:1.7;
            ">
              ${escapeHtml(
                formData.experience ||
                  ''
              )}
            </div>

            <div style="
              margin-top:20px;
              font-size:9px;
              color:#9CA3AF;
            ">
              Référence CV : ${cvReference}
            </div>

            <div style="
              page-break-before:always;
              margin-top:25px;
            ">

              ${sectionTitle(
                'PARTIE 2 — LETTRE DE MOTIVATION'
              )}

              <div style="
                display:flex;
                justify-content:space-between;
                margin-bottom:30px;
              ">

                <div>
                  <strong>
                    ${escapeHtml(
                      formData.name ||
                        ''
                    )}
                  </strong>

                  <div>
                    ${escapeHtml(
                      formData.phone ||
                        ''
                    )}
                  </div>
                </div>

                <div style="text-align:right;">
                  À l'attention de
                  <br/>
                  <strong>
                    ${escapeHtml(
                      formData.recipient ||
                        ''
                    )}
                  </strong>
                </div>

              </div>

              <div style="
                text-align:right;
                font-size:10px;
                color:#6B7280;
                margin-bottom:25px;
              ">
                ${todayFrench()}
              </div>

              <strong>
                Objet : Candidature au poste de
                ${escapeHtml(
                  formData.jobTitle ||
                    ''
                )}
              </strong>

              <p style="margin-top:25px;">
                Madame, Monsieur,
              </p>

              <p>
                Je vous adresse ma candidature pour le
                poste de
                <strong>${escapeHtml(
                  formData.jobTitle ||
                    ''
                )}</strong>
                au sein de votre structure.
              </p>

              <p>
                Mon parcours m'a permis de développer
                les expériences et qualités suivantes :
              </p>

              <div style="
                white-space:pre-wrap;
                border-left:3px solid #4361EE;
                padding-left:15px;
              ">
                ${escapeHtml(
                  formData.experience ||
                    ''
                )}
              </div>

              <p>
                Je souhaite mettre ces acquis au service
                de votre entreprise et poursuivre mon
                développement professionnel au sein d'une
                équipe dynamique.
              </p>

              <p>
                Je reste à votre disposition pour un
                entretien et vous prie d'agréer, Madame,
                Monsieur, l'expression de mes salutations
                distinguées.
              </p>

              <div style="
                text-align:right;
                margin-top:45px;
              ">
                <strong>
                  ${escapeHtml(
                    formData.name ||
                      ''
                  )}
                </strong>
              </div>

              <div style="
                margin-top:20px;
                font-size:9px;
                color:#9CA3AF;
              ">
                Référence Lettre : ${letterReference}
              </div>

            </div>

          </div>
        `;
      }

      // ========================================================
      // PACK ENTREPRENEUR
      // ========================================================

      else if (
        id === 'pack_entrepreneur'
      ) {
        content = `
          <div style="${documentStyles}">

            ${docHeader(
              'Pack Entrepreneur',
              reference
            )}

            <div style="
              text-align:center;
              margin:20px 0 30px;
            ">
              <div style="
                font-size:21px;
                font-weight:900;
              ">
                PACK ENTREPRENEUR
              </div>

              <div style="
                color:#4361EE;
                font-weight:700;
                margin-top:4px;
              ">
                5 DOCUMENTS PROFESSIONNELS
              </div>
            </div>

            <div style="
              border:1px solid #D1D5DB;
              padding:15px;
              background:#F9FAFB;
              margin-bottom:25px;
            ">
              <strong>Entreprise :</strong>
              ${escapeHtml(
                formData.vendeur_nom ||
                  ''
              )}
              <br/>

              <strong>Téléphone :</strong>
              ${escapeHtml(
                formData.vendeur_phone ||
                  ''
              )}
            </div>

            ${sectionTitle(
              'Documents souhaités'
            )}

            <div style="
              white-space:pre-wrap;
              line-height:1.8;
              border-left:4px solid #4361EE;
              padding-left:15px;
            ">
              ${escapeHtml(
                formData.docs_selection ||
                  ''
              )}
            </div>

            <div style="
              margin-top:25px;
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:10px;
            ">

              ${[
                'Document commercial',
                'Document administratif',
                'Facture / Proforma',
                'Reçu / Bon',
                'Document personnalisé'
              ]
                .map(
                  (item, index) => `
                    <div style="
                      border:1px solid #E5E7EB;
                      padding:12px;
                      background:#FAFAFA;
                    ">
                      <strong>
                        ${index + 1}.
                      </strong>
                      ${item}
                    </div>
                  `
                )
                .join('')}

            </div>

            <div style="
              margin-top:25px;
              padding:12px;
              background:#FFF7ED;
              border:1px solid #FED7AA;
              font-size:10px;
            ">
              Les documents composant le pack seront
              préparés à partir des informations
              communiquées lors de la commande.
            </div>

          </div>
        `;
      }

      // ========================================================
      // DOCUMENT GÉNÉRIQUE
      // ========================================================

      else {
        content = `
          <div style="${documentStyles}">

            ${docHeader(
              selectedDoc?.title ||
                'Document',
              reference
            )}

            <div style="
              text-align:center;
              margin:25px 0;
            ">
              <div style="
                font-size:19px;
                font-weight:800;
                text-transform:uppercase;
              ">
                ${escapeHtml(
                  selectedDoc?.title ||
                    'DOCUMENT'
                )}
              </div>
            </div>

            ${Object.entries(
              formData
            )
              .map(
                ([key, value]) => `
                  <div style="
                    margin-bottom:13px;
                    padding-bottom:8px;
                    border-bottom:1px solid #E5E7EB;
                  ">
                    <div style="
                      font-size:9px;
                      color:#6B7280;
                      text-transform:uppercase;
                    ">
                      ${escapeHtml(
                        key.replace(
                          /_/g,
                          ' '
                        )
                      )}
                    </div>

                    <div style="
                      margin-top:3px;
                      white-space:pre-wrap;
                    ">
                      ${escapeHtml(
                        value
                      )}
                    </div>
                  </div>
                `
              )
              .join('')}

          </div>
        `;
      }

      setGeneratedBody(
        content
      );

      setStep('preview');

      setIsGeneratingContent(
        false
      );
    };

  // ============================================================
  // PAIEMENT — CONSERVÉ
  // ============================================================

  const handleInitiatePayment =
    async () => {
      if (!selectedDoc) return;

      if (
        !senderPhoneInput ||
        !transactionRefInput
      ) {
        alert(
          'Veuillez renseigner votre numéro expéditeur et la référence de transaction SMS.'
        );
        return;
      }

      setIsSubmittingPayment(
        true
      );

      try {
        const { data, error } =
          await supabase
            .from('orders')
            .insert([
              {
                order_number:
                  'CMD-' +
                  Date.now(),

                document_template_id:
                  selectedDoc.id,

                customer_name:
                  formData.nom ||
                  formData.fullName ||
                  'Client',

                customer_phone:
                  senderPhoneInput ||
                  formData.phone ||
                  '',

                amount:
                  selectedDoc.priceNumeric,

                payment_method:
                  'om_manual',

                sender_phone:
                  senderPhoneInput,

                transaction_ref:
                  transactionRefInput,

                status:
                  'pending_verification',

                doc_title:
                  selectedDoc.title,

                form_data:
                  formData,

                generated_body:
                  generatedBody
              }
            ])
            .select()
            .single();

        if (error) {
          throw error;
        }

        const newOrder: Order = {
          id: data.id,
          docTitle:
            selectedDoc.title,
          price:
            selectedDoc.price,
          clientPhone:
            senderPhoneInput,
          senderPhone:
            senderPhoneInput,
          transactionRef:
            transactionRefInput,
          status:
            'PENDING',
          createdAt:
            new Date().toLocaleTimeString(
              'fr-FR',
              {
                hour: '2-digit',
                minute: '2-digit'
              }
            ),
          formData,
          generatedBody
        };

        setCurrentOrder(
          newOrder
        );

        setStep('pending');
      } catch (err: any) {
        console.error(
          'Erreur Supabase :',
          err
        );

        alert(
          'Erreur Supabase : ' +
            (err?.message ||
              JSON.stringify(err))
        );
      } finally {
        setIsSubmittingPayment(
          false
        );
      }
    };

  // ============================================================
  // ADMIN
  // ============================================================

  const handleAdminLogin = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      adminPinInput ===
      '1234'
    ) {
      setAdminPinError(false);
      setStep(
        'admin_dashboard'
      );
    } else {
      setAdminPinError(true);
    }
  };

  const handleApproveOrder =
    async (
      orderId: string
    ) => {
      try {
        const { error } =
          await supabase
            .from('orders')
            .update({
              status:
                'completed'
            })
            .eq(
              'id',
              orderId
            );

        if (!error) {
          setOrders(
            prev =>
              prev.map(
                o =>
                  o.id ===
                  orderId
                    ? {
                        ...o,
                        status:
                          'APPROVED'
                      }
                    : o
              )
          );
        } else {
          alert(
            'Erreur lors de la validation sur Supabase.'
          );
        }
      } catch (err) {
        console.error(err);
      }
    };

  // ============================================================
  // PDF
  // ============================================================

 const generatePDF = async () => {
  const sourceHtml =
    currentOrder?.generatedBody || generatedBody;

  if (!sourceHtml) {
    alert(
      "Le document n’est pas disponible. Veuillez réessayer."
    );
    return;
  }

  if (
    !currentOrder ||
    currentOrder.status !== "APPROVED"
  ) {
    alert(
      "Le téléchargement sera disponible après validation de l’administrateur."
    );
    return;
  }

  setIsGeneratingPDF(true);

  let temporaryElement: HTMLDivElement | null = null;

  try {
    let element = documentRef.current;

    if (!element) {
      temporaryElement = document.createElement("div");

      temporaryElement.style.position = "fixed";
      temporaryElement.style.left = "-10000px";
      temporaryElement.style.top = "0";
      temporaryElement.style.width = "794px";
      temporaryElement.style.minHeight = "1123px";
      temporaryElement.style.backgroundColor = "#ffffff";
      temporaryElement.style.color = "#000000";
      temporaryElement.style.boxSizing = "border-box";
      temporaryElement.style.overflow = "visible";
      temporaryElement.innerHTML = sourceHtml;

      document.body.appendChild(temporaryElement);
      element = temporaryElement;
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: element.scrollWidth || 794,
      windowHeight: element.scrollHeight || 1123,
    });

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 8;
    const marginY = 8;
    const usableWidth = pageWidth - marginX * 2;
    const usableHeight = pageHeight - marginY * 2;

    const pxPerMm = canvas.width / usableWidth;
    const pageCanvasHeight = Math.floor(
      usableHeight * pxPerMm
    );

    let offsetY = 0;
    let pageIndex = 0;

    while (offsetY < canvas.height) {
      const sliceHeight = Math.min(
        pageCanvasHeight,
        canvas.height - offsetY
      );

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const ctx = pageCanvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Impossible de préparer la page PDF."
        );
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      );

      ctx.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      const image = pageCanvas.toDataURL(
        "image/png",
        1
      );

      const imageHeight = sliceHeight / pxPerMm;

      if (pageIndex > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        image,
        "PNG",
        marginX,
        marginY,
        usableWidth,
        imageHeight
      );

      offsetY += sliceHeight;
      pageIndex += 1;
    }

    const safeTitle = (
      currentOrder.docTitle ||
      selectedDoc?.title ||
      "Document"
    )
      .replace(/[^a-zA-Z0-9À-ÿ_-]/g, "-")
      .replace(/-+/g, "-");

    pdf.save(
      `${safeTitle}-DocExpress.pdf`
    );
  } catch (error) {
    console.error(
      "Erreur lors du téléchargement du PDF :",
      error
    );

    alert(
      "Impossible de générer le PDF. Veuillez réessayer."
    );
  } finally {
    if (
      temporaryElement &&
      temporaryElement.parentNode
    ) {
      temporaryElement.parentNode.removeChild(
        temporaryElement
      );
    }

    setIsGeneratingPDF(false);
  }
};


  // ============================================================
  // STYLE INPUTS
  // ============================================================

  const inputStyle: React.CSSProperties =
    {
      width: '100%',
      padding:
        '0.85rem 0.9rem',
      borderRadius: '10px',
      border:
        '1px solid #3A506B',
      backgroundColor:
        '#0B132B',
      color: '#FFFFFF',
      boxSizing:
        'border-box',
      fontFamily:
        'inherit',
      outline: 'none',
      transition:
        'border-color .2s ease, box-shadow .2s ease'
    };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="docexpress-app"
      style={{
        backgroundColor:
          '#0B132B',
        color: '#FFFFFF',
        minHeight:
          '100vh',
        fontFamily:
          'system-ui, sans-serif',
        position:
          'relative',
        display:
          'flex',
        flexDirection:
          'column',
        justifyContent:
          'space-between'
      }}
    >

      {/* ======================================================
          ANIMATIONS
      ====================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0B132B;
        }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        input:focus,
        textarea:focus,
        select:focus {
          border-color: #4CC9F0 !important;
          box-shadow: 0 0 0 3px rgba(76, 201, 240, 0.12);
        }

        ::placeholder {
          color: #9CA3AF;
          opacity: 1;
        }

        select option {
          background-color: #0B132B;
          color: #FFFFFF;
        }

        @keyframes pulseGlow {
          0% {
            box-shadow:
              0 0 15px rgba(67, 97, 238, 0.35);
          }

          50% {
            box-shadow:
              0 0 38px rgba(76, 201, 240, 0.65);
          }

          100% {
            box-shadow:
              0 0 15px rgba(67, 97, 238, 0.35);
          }
        }

        @keyframes floatLogo {
          0% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }

          100% {
            transform: translateY(0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes menuAppear {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes buttonPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(67,97,238,.35);
          }

          70% {
            box-shadow: 0 0 0 9px rgba(67,97,238,0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(67,97,238,0);
          }
        }

        .hero-logo-box {
          animation:
            pulseGlow 3s infinite ease-in-out,
            floatLogo 4s infinite ease-in-out;
        }

        .card-hover {
          transition:
            transform .25s ease,
            border-color .25s ease,
            box-shadow .25s ease,
            background-color .25s ease;
          animation:
            fadeUp .45s ease both;
        }

        .card-hover:hover {
          transform:
            translateY(-5px)
            scale(1.01);
          border-color:
            #4CC9F0 !important;
          box-shadow:
            0 14px 35px
            rgba(0,0,0,.22);
          background-color:
            #202B4D !important;
        }

        .doc-main-content {
          animation:
            fadeUp .35s ease both;
        }

        .mobile-menu {
          animation:
            menuAppear .25s ease both;
        }

        .primary-action {
          transition:
            transform .2s ease,
            box-shadow .2s ease,
            filter .2s ease;
        }

        .primary-action:hover {
          transform:
            translateY(-2px);
          filter:
            brightness(1.08);
          box-shadow:
            0 10px 25px
            rgba(67,97,238,.25);
        }

        .primary-action:active {
          transform:
            translateY(0);
        }

        .payment-action {
          animation:
            buttonPulse 2.5s infinite;
        }

        .document-preview {
          animation:
            fadeUp .4s ease both;
        }

        .step-card {
          animation:
            fadeUp .35s ease both;
        }

        @media (max-width: 520px) {
          .document-preview {
            padding: 1.2rem !important;
          }
        }

        @media print {
          body {
            background: white !important;
          }
        }

      `}</style>

      {/* ======================================================
          SPLASH
      ====================================================== */}

      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            onFinish={() =>
              setShowSplash(
                false
              )
            }
          />
        )}
      </AnimatePresence>

      <div>

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header
          style={{
            padding:
              '0.9rem 1.5rem',
            display:
              'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            borderBottom:
              '1px solid #1C2541',
            position:
              'sticky',
            top: 0,
            backgroundColor:
              'rgba(11,19,43,.95)',
            backdropFilter:
              'blur(10px)',
            zIndex: 100
          }}
        >

          <div
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap:
                '0.75rem',
              cursor:
                'pointer'
            }}
            onClick={() => {
              setStep(
                'home'
              );
              setIsMenuOpen(
                false
              );
            }}
          >
            <AppLogo
              size={34}
            />

            <span
              style={{
                fontSize:
                  '1.25rem',
                fontWeight:
                  'bold',
                letterSpacing:
                  '1px'
              }}
            >
              DOCEXPRESS
            </span>
          </div>

          <button
            onClick={() =>
              setIsMenuOpen(
                !isMenuOpen
              )
            }
            aria-label="Menu"
            style={{
              background:
                'none',
              border:
                'none',
              cursor:
                'pointer',
              padding:
                '8px',
              display:
                'flex',
              flexDirection:
                'column',
              justifyContent:
                'space-around',
              width:
                '32px',
              height:
                '32px',
              zIndex:
                101
            }}
          >

            <span
              style={{
                width:
                  '100%',
                height:
                  '3px',
                backgroundColor:
                  '#4CC9F0',
                borderRadius:
                  '2px',
                transition:
                  'all .3s ease',
                transform:
                  isMenuOpen
                    ? 'rotate(45deg) translate(6px,6px)'
                    : 'rotate(0)'
              }}
            />

            <span
              style={{
                width:
                  '100%',
                height:
                  '3px',
                backgroundColor:
                  '#4CC9F0',
                borderRadius:
                  '2px',
                transition:
                  'all .3s ease',
                opacity:
                  isMenuOpen
                    ? 0
                    : 1
              }}
            />

            <span
              style={{
                width:
                  '100%',
                height:
                  '3px',
                backgroundColor:
                  '#4CC9F0',
                borderRadius:
                  '2px',
                transition:
                  'all .3s ease',
                transform:
                  isMenuOpen
                    ? 'rotate(-45deg) translate(6px,-6px)'
                    : 'rotate(0)'
              }}
            />

          </button>
        </header>

        {/* ====================================================
            MENU
        ==================================================== */}

        {isMenuOpen && (
          <div
            className="mobile-menu"
            style={{
              position:
                'fixed',
              top:
                '60px',
              left: 0,
              width:
                '100vw',
              height:
                'calc(100vh - 60px)',
              backgroundColor:
                '#0B132B',
              zIndex:
                9999,
              padding:
                '1.5rem',
              display:
                'flex',
              flexDirection:
                'column',
              gap:
                '1.5rem',
              overflowY:
                'auto'
            }}
          >

            <button
              onClick={() => {
                setStep(
                  'home'
                );
                setIsMenuOpen(
                  false
                );
              }}
              style={{
                backgroundColor:
                  '#1C2541',
                color:
                  '#FFFFFF',
                border:
                  '1px solid #3A506B',
                padding:
                  '1rem',
                borderRadius:
                  '10px',
                fontWeight:
                  'bold',
                fontSize:
                  '1rem',
                textAlign:
                  'left',
                cursor:
                  'pointer'
              }}
            >
              🏠 Page d'accueil
            </button>

            <button
              onClick={() => {
                setStep(
                  'admin_login'
                );
                setIsMenuOpen(
                  false
                );
              }}
              style={{
                backgroundColor:
                  '#1C2541',
                color:
                  '#F72585',
                border:
                  '1px solid #F72585',
                padding:
                  '1rem',
                borderRadius:
                  '10px',
                fontWeight:
                  'bold',
                fontSize:
                  '1rem',
                textAlign:
                  'left',
                cursor:
                  'pointer'
              }}
            >
              🔒 Espace Administration
            </button>

            <div>

              <h3
                style={{
                  fontSize:
                    '.85rem',
                  color:
                    '#D1D5DB',
                  textTransform:
                    'uppercase',
                  marginBottom:
                    '.8rem',
                  letterSpacing:
                    '1px'
                }}
              >
                Tous les documents
              </h3>

              <div
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap:
                    '.6rem'
                }}
              >
                {sortedDocuments.map(
                  doc => (
                    <div
                      key={
                        doc.id
                      }
                      onClick={() =>
                        handleSelectDoc(
                          doc
                        )
                      }
                      className="card-hover"
                      style={{
                        backgroundColor:
                          '#1C2541',
                        padding:
                          '.9rem 1rem',
                        borderRadius:
                          '8px',
                        border:
                          '1px solid #3A506B',
                        cursor:
                          'pointer',
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize:
                            '.95rem',
                          fontWeight:
                            '500'
                        }}
                      >
                        {
                          doc.title
                        }
                      </span>

                      <span
                        style={{
                          fontSize:
                            '.85rem',
                          color:
                            '#4CC9F0',
                          fontWeight:
                            'bold'
                        }}
                      >
                        {
                          doc.price
                        }
                      </span>
                    </div>
                  )
                )}
              </div>

            </div>
          </div>
        )}

        {/* ====================================================
            MAIN
        ==================================================== */}

        <main
          className="doc-main-content"
          style={{
            maxWidth:
              '600px',
            margin:
              '0 auto',
            padding:
              '1.5rem'
          }}
        >

          {/* RETOUR */}

          {step !==
            'home' && (
            <div
              style={{
                marginBottom:
                  '1rem'
              }}
            >
              <button
                onClick={
                  handleBack
                }
                style={{
                  background:
                    'none',
                  border:
                    'none',
                  color:
                    '#4CC9F0',
                  fontSize:
                    '.9rem',
                  cursor:
                    'pointer',
                  padding: 0,
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap:
                    '.3rem',
                  fontWeight:
                    'bold'
                }}
              >
                ⬅️ Page précédente
              </button>
            </div>
          )}

          {/* ==================================================
              HOME
          ================================================== */}

      {step ===
  'home' && (
  <div
    style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '0 1rem 3rem',
      width: '100%',
      boxSizing: 'border-box'
    }}
  >
    {/* HERO */}
    <section
      style={{
        padding:
          '2.5rem 0 2rem',
        borderBottom:
          '1px solid rgba(255,255,255,.08)',
        marginBottom:
          '2.5rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '.75rem',
          marginBottom: '1.5rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#1C2541',
            border:
              '1px solid #3A506B',
            flexShrink: 0
          }}
        >
          <AppLogo size={34} />
        </div>
        <div>
          <div
            style={{
              fontSize: '.95rem',
              fontWeight: 700,
              letterSpacing: '-.2px'
            }}
          >
            DocExpress
          </div>
          <div
            style={{
              fontSize: '.72rem',
              color: '#94A3B8',
              marginTop: '2px'
            }}
          >
            Documents professionnels
          </div>
        </div>
      </div>
      <div
        style={{
          maxWidth: '720px'
        }}
      >
        <h1
          style={{
            fontSize:
              'clamp(2rem, 6vw, 3.6rem)',
            lineHeight: 1.05,
            letterSpacing:
              '-1.8px',
            margin:
              '0 0 1rem',
            fontWeight: 800
          }}
        >
          Vos documents.
          <br />
          <span
            style={{
              color: '#4CC9F0'
            }}
          >
            Simplement.
          </span>
        </h1>
        <p
          style={{
            color: '#A8B2C1',
            fontSize:
              '1rem',
            lineHeight: 1.6,
            maxWidth:
              '580px',
            margin: 0
          }}
        >
          Créez rapidement des documents
          professionnels adaptés à vos besoins,
          directement depuis votre téléphone.
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '.7rem',
          marginTop: '1.5rem'
        }}
      >
        <span
          style={{
            padding:
              '.5rem .8rem',
            borderRadius:
              '7px',
            backgroundColor:
              '#111B32',
            border:
              '1px solid #263653',
            color:
              '#CBD5E1',
            fontSize:
              '.75rem'
          }}
        >
          Emploi
        </span>
        <span
          style={{
            padding:
              '.5rem .8rem',
            borderRadius:
              '7px',
            backgroundColor:
              '#111B32',
            border:
              '1px solid #263653',
            color:
              '#CBD5E1',
            fontSize:
              '.75rem'
          }}
        >
          Immobilier
        </span>
        <span
          style={{
            padding:
              '.5rem .8rem',
            borderRadius:
              '7px',
            backgroundColor:
              '#111B32',
            border:
              '1px solid #263653',
            color:
              '#CBD5E1',
            fontSize:
              '.75rem'
          }}
        >
          Business
        </span>
      </div>
    </section>
    {/* INTRODUCTION */}
    <section
      style={{
        marginBottom:
          '1.5rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems:
            'flex-end',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <p
            style={{
              margin:
                '0 0 .35rem',
              color:
                '#4CC9F0',
              fontSize:
                '.72rem',
              fontWeight:
                700,
              textTransform:
                'uppercase',
              letterSpacing:
                '1.2px'
            }}
          >
            Catalogue
          </p>
          <h2
            style={{
              margin: 0,
              fontSize:
                '1.5rem',
              letterSpacing:
                '-.5px'
            }}
          >
            Choisissez votre document
          </h2>
        </div>
        <span
          style={{
            color:
              '#64748B',
            fontSize:
              '.8rem'
          }}
        >
          {sortedDocuments.length} documents disponibles
        </span>
      </div>
    </section>
    {/* DOCUMENTS */}
    <div
      style={{
        display:
          'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(260px, 1fr))',
        gap:
          '1rem'
      }}
    >
      {sortedDocuments.map(
        doc => (
          <div
            key={doc.id}
            className="card-hover"
            onClick={() =>
              handleSelectDoc(doc)
            }
            style={{
              backgroundColor:
                '#111A2E',
              border:
                '1px solid #263653',
              borderRadius:
                '14px',
              padding:
                '1.25rem',
              cursor:
                'pointer',
              position:
                'relative',
              transition:
                'border-color .2s ease, transform .2s ease, background-color .2s ease',
              minHeight:
                '190px',
              display:
                'flex',
              flexDirection:
                'column',
              justifyContent:
                'space-between',
              boxSizing:
                'border-box'
            }}
          >
            {doc.badge && (
              <span
                style={{
                  position:
                    'absolute',
                  top:
                    '14px',
                  right:
                    '14px',
                  backgroundColor:
                    'rgba(76,201,240,.1)',
                  color:
                    '#4CC9F0',
                  border:
                    '1px solid rgba(76,201,240,.25)',
                  fontSize:
                    '.6rem',
                  fontWeight:
                    700,
                  padding:
                    '4px 7px',
                  borderRadius:
                    '5px',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '.4px'
                }}
              >
                {doc.badge}
              </span>
            )}
            <div>
              <div
                style={{
                  fontSize:
                    '.68rem',
                  color:
                    '#64748B',
                  fontWeight:
                    700,
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '.8px',
                  marginBottom:
                    '.55rem',
                  paddingRight:
                    doc.badge
                      ? '75px'
                      : '0'
                }}
              >
                {doc.category}
              </div>
              <h3
                style={{
                  fontSize:
                    '1.05rem',
                  margin:
                    '0 0 .45rem',
                  lineHeight:
                    1.3,
                  fontWeight:
                    700
                }}
              >
                {doc.title}
              </h3>
              <p
                style={{
                  fontSize:
                    '.82rem',
                  color:
                    '#8E9AAF',
                  margin: 0,
                  lineHeight:
                    1.5
                }}
              >
                {doc.desc}
              </p>
            </div>
            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                marginTop:
                  '1.25rem',
                paddingTop:
                  '.9rem',
                borderTop:
                  '1px solid rgba(255,255,255,.06)'
              }}
            >
              <span
                style={{
                  fontSize:
                    '.95rem',
                  fontWeight:
                    700,
                  color:
                    '#FFFFFF'
                }}
              >
                {doc.price}
              </span>
              <span
                style={{
                  display:
                    'inline-flex',
                  alignItems:
                    'center',
                  gap:
                    '.35rem',
                  fontSize:
                    '.75rem',
                  fontWeight:
                    700,
                  color:
                    '#4CC9F0'
                }}
              >
                Créer
                <span
                  style={{
                    fontSize:
                      '.95rem'
                  }}
                >
                  →
                </span>
              </span>
            </div>
          </div>
        )
      )}
    </div>
    {/* FOOTER MESSAGE */}
    <div
      style={{
        marginTop:
          '2.5rem',
        padding:
          '1rem 0',
        borderTop:
          '1px solid rgba(255,255,255,.06)',
        textAlign:
          'center'
      }}
    >
      <p
        style={{
          margin: 0,
          color:
            '#64748B',
          fontSize:
            '.75rem'
        }}
      >
        Des documents simples, propres et prêts à être utilisés.
      </p>
    </div>
  </div>
)}=================================================
              FORMULAIRE
          ================================================== */}

          {step ===
            'form' &&
            selectedDoc && (
              <div
                className="step-card"
                style={{
                  backgroundColor:
                    '#1C2541',
                  border:
                    '1px solid #3A506B',
                  borderRadius:
                    '12px',
                  padding:
                    '1.5rem'
                }}
              >

                <div
                  style={{
                    marginBottom:
                      '1.5rem',
                    borderBottom:
                      '1px solid #3A506B',
                    paddingBottom:
                      '1rem'
                  }}
                >

                  <span
                    style={{
                      fontSize:
                        '.75rem',
                      color:
                        '#4CC9F0',
                      fontWeight:
                        'bold'
                    }}
                  >
                    ÉTAPE {formStep} SUR 3
                  </span>

                  <h2
                    style={{
                      fontSize:
                        '1.3rem',
                      margin:
                        '.2rem 0'
                    }}
                  >
                    {
                      selectedDoc.title
                    }
                  </h2>

                  <p
                    style={{
                      fontSize:
                        '.85rem',
                      color:
                        '#9CA3AF',
                      margin:
                        0
                    }}
                  >
                    Remplissez les informations
                    ci-dessous pour votre document.
                  </p>

                </div>

                <div
                  style={{
                    height:
                      '5px',
                    background:
                      '#0B132B',
                    borderRadius:
                      '10px',
                    overflow:
                      'hidden',
                    marginBottom:
                      '1.5rem'
                  }}
                >
                  <div
                    style={{
                      width:
                        `${(formStep / 3) * 100}%`,
                      height:
                        '100%',
                      background:
                        'linear-gradient(90deg,#4361EE,#4CC9F0)',
                      transition:
                        'width .35s ease'
                    }}
                  />
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault();

                    if (
                      formStep <
                      3
                    ) {
                      setFormStep(
                        formStep +
                          1
                      );
                    } else {
                      setStep(
                        'review'
                      );
                    }
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',
                      flexDirection:
                        'column',
                      gap:
                        '1.2rem'
                    }}
                  >
                    {selectedDoc.fields
                      .filter(
                        field =>
                          field.step ===
                          formStep
                      )
                      .map(
                        field => (
                          <div
                            key={
                              field.id
                            }
                          >

                            <label
                              style={{
                                display:
                                  'block',
                                fontSize:
                                  '.9rem',
                                marginBottom:
                                  '.4rem',
                                fontWeight:
                                  '500'
                              }}
                            >
                              {
                                field.label
                              }

                              {field.required && (
                                <span
                                  style={{
                                    color:
                                      '#F72585'
                                  }}
                                >
                                  {' '}
                                  *
                                </span>
                              )}
                            </label>

                            {field.type ===
                            'textarea' ? (
                              <textarea
                                required={
                                  field.required
                                }
                                placeholder={
                                  field.placeholder
                                }
                                value={
                                  formData[
                                    field.id
                                  ] ||
                                  ''
                                }
                                onChange={e =>
                                  handleInputChange(
                                    field.id,
                                    e.target
                                      .value
                                  )
                                }
                                rows={
                                  4
                                }
                                style={{
                                  ...inputStyle,
                                  resize:
                                    'vertical'
                                }}
                              />
                            ) : field.type ===
                              'select' ? (
                              <select
                                required={
                                  field.required
                                }
                                value={
                                  formData[
                                    field.id
                                  ] ||
                                  ''
                                }
                                onChange={e =>
                                  handleInputChange(
                                    field.id,
                                    e.target
                                      .value
                                  )
                                }
                                style={
                                  inputStyle
                                }
                              >
                                <option value="">
                                  -- Sélectionner --
                                </option>

                                {field.options?.map(
                                  (
                                    opt,
                                    i
                                  ) => (
                                    <option
                                      key={
                                        i
                                      }
                                      value={
                                        opt
                                      }
                                    >
                                      {
                                        opt
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            ) : (
                              <input
                                type={
                                  field.type
                                }
                                required={
                                  field.required
                                }
                                placeholder={
                                  field.placeholder
                                }
                                value={
                                  formData[
                                    field.id
                                  ] ||
                                  ''
                                }
                                onChange={e =>
                                  handleInputChange(
                                    field.id,
                                    e.target
                                      .value
                                  )
                                }
                                style={
                                  inputStyle
                                }
                              />
                            )}

                          </div>
                        )
                      )}
                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      marginTop:
                        '2rem',
                      gap:
                        '1rem'
                    }}
                  >

                    {formStep >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormStep(
                            formStep -
                              1
                          )
                        }
                        style={{
                          flex: 1,
                          padding:
                            '.8rem',
                          borderRadius:
                            '8px',
                          border:
                            '1px solid #3A506B',
                          backgroundColor:
                            'transparent',
                          color:
                            '#FFFFFF',
                          fontWeight:
                            'bold',
                          cursor:
                            'pointer'
                        }}
                      >
                        Précédent
                      </button>
                    )}

                    <button
                      type="submit"
                      className="primary-action"
                      style={{
                        flex: 1,
                        padding:
                          '.8rem',
                        borderRadius:
                          '8px',
                        border:
                          'none',
                        backgroundColor:
                          '#4361EE',
                        color:
                          '#FFFFFF',
                        fontWeight:
                          'bold',
                        cursor:
                          'pointer'
                      }}
                    >
                      {formStep ===
                      3
                        ? 'Vérifier les données ➔'
                        : 'Suivant ➔'}
                    </button>

                  </div>

                </form>
              </div>
            )}

          {/* ==================================================
              REVIEW
          ================================================== */}

          {step ===
            'review' &&
            selectedDoc && (
              <div
                className="step-card"
                style={{
                  backgroundColor:
                    '#1C2541',
                  border:
                    '1px solid #3A506B',
                  borderRadius:
                    '12px',
                  padding:
                    '1.5rem'
                }}
              >

                <h2
                  style={{
                    fontSize:
                      '1.3rem',
                    marginBottom:
                      '1rem'
                  }}
                >
                  Récapitulatif de votre saisie
                </h2>

                <p
                  style={{
                    fontSize:
                      '.85rem',
                    color:
                      '#9CA3AF',
                    marginBottom:
                      '1.5rem'
                  }}
                >
                  Vérifiez attentivement les
                  informations avant de générer
                  votre document.
                </p>

                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap:
                      '.8rem',
                    backgroundColor:
                      '#0B132B',
                    padding:
                      '1rem',
                    borderRadius:
                      '8px',
                    border:
                      '1px solid #3A506B',
                    marginBottom:
                      '1.5rem'
                  }}
                >

                  {selectedDoc.fields.map(
                    field => (
                      <div
                        key={
                          field.id
                        }
                        style={{
                          display:
                            'flex',
                          flexDirection:
                            'column',
                          borderBottom:
                            '1px solid rgba(255,255,255,.05)',
                          paddingBottom:
                            '.5rem'
                        }}
                      >

                        <span
                          style={{
                            fontSize:
                              '.75rem',
                            color:
                              '#4CC9F0'
                          }}
                        >
                          {
                            field.label
                          }
                        </span>

                        <span
                          style={{
                            fontSize:
                              '.95rem',
                            fontWeight:
                              '500',
                            wordBreak:
                              'break-word',
                            whiteSpace:
                              'pre-wrap'
                          }}
                        >
                          {formData[
                            field.id
                          ] || (
                            <i
                              style={{
                                color:
                                  '#6B7280'
                              }}
                            >
                              Non renseigné
                            </i>
                          )}
                        </span>

                      </div>
                    )
                  )}

                </div>

                <button
                  onClick={
                    handleProcessDocument
                  }
                  disabled={
                    isGeneratingContent
                  }
                  className="primary-action"
                  style={{
                    width:
                      '100%',
                    padding:
                      '.9rem',
                    borderRadius:
                      '8px',
                    border:
                      'none',
                    backgroundColor:
                      '#4361EE',
                    color:
                      '#FFFFFF',
                    fontWeight:
                      'bold',
                    cursor:
                      'pointer',
                    fontSize:
                      '1rem'
                  }}
                >
                  {isGeneratingContent
                    ? 'Génération en cours...'
                    : 'Générer l’aperçu du document ➔'}
                </button>

              </div>
            )}

          {/* ==================================================
              PREVIEW
          ================================================== */}

          {step ===
            'preview' &&
            selectedDoc && (
              <div>

                <div
                  style={{
                    backgroundColor:
                      '#1C2541',
                    border:
                      '1px solid #3A506B',
                    borderRadius:
                      '12px',
                    padding:
                      '1rem',
                    marginBottom:
                      '1.5rem'
                  }}
                >

                  <h2
                    style={{
                      fontSize:
                        '1.1rem',
                      margin:
                        '0 0 .5rem'
                    }}
                  >
                    📄 Aperçu de votre document
                  </h2>

                  <p
                    style={{
                      fontSize:
                        '.8rem',
                      color:
                        '#9CA3AF',
                      margin:
                        0,
                      lineHeight:
                        '1.5'
                    }}
                  >
                    Voici le rendu professionnel
                    de votre document. Vérifiez les
                    informations avant le paiement.
                  </p>

                </div>

                <div
                  ref={
                    documentRef
                  }
                  className="document-preview"
                  style={{
                    backgroundColor:
                      '#FFFFFF',
                    color:
                      '#111827',
                    padding:
                      '2.2rem',
                    borderRadius:
                      '4px',
                    boxShadow:
                      '0 15px 40px rgba(0,0,0,.45)',
                    marginBottom:
                      '1.5rem',
                    minHeight:
                      '500px',
                    overflow:
                      'hidden'
                  }}
                >

                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        generatedBody
                    }}
                  />

                </div>

                <button
                  onClick={() =>
                    setStep(
                      'payment'
                    )
                  }
                  className="primary-action payment-action"
                  style={{
                    width:
                      '100%',
                    padding:
                      '1rem',
                    borderRadius:
                      '10px',
                    border:
                      'none',
                    backgroundColor:
                      '#F72585',
                    color:
                      '#FFFFFF',
                    fontWeight:
                      'bold',
                    fontSize:
                      '1.05rem',
                    cursor:
                      'pointer'
                  }}
                >
                  Payer{' '}
                  {
                    selectedDoc.price
                  }{' '}
                  & Télécharger PDF ➔
                </button>

              </div>
            )}

          {/* ==================================================
              PAYMENT
          ================================================== */}

          {step ===
            'payment' &&
            selectedDoc && (
              <div
                className="step-card"
                style={{
                  backgroundColor:
                    '#1C2541',
                  border:
                    '1px solid #3A506B',
                  borderRadius:
                    '12px',
                  padding:
                    '1.5rem'
                }}
              >

                <h2
                  style={{
                    fontSize:
                      '1.3rem',
                    marginBottom:
                      '.5rem'
                  }}
                >
                  💳 Paiement Mobile Money
                </h2>

                <p
                  style={{
                    fontSize:
                      '.85rem',
                    color:
                      '#9CA3AF',
                    marginBottom:
                      '1.5rem'
                  }}
                >
                  Montant à régler :
                  {' '}
                  <strong
                    style={{
                      color:
                        '#4CC9F0',
                      fontSize:
                        '1.1rem'
                    }}
                  >
                    {
                      selectedDoc.price
                    }
                  </strong>
                </p>

                <div
                  style={{
                    backgroundColor:
                      '#0B132B',
                    border:
                      '1px solid #3A506B',
                    borderRadius:
                      '8px',
                    padding:
                      '1rem',
                    marginBottom:
                      '1.5rem'
                  }}
                >

                  <h3
                    style={{
                      fontSize:
                        '.95rem',
                      color:
                        '#4CC9F0',
                      marginTop:
                        0
                    }}
                  >
                    Consignes de paiement :
                  </h3>

                  <ol
                    style={{
                      fontSize:
                        '.85rem',
                      color:
                        '#D1D5DB',
                      paddingLeft:
                        '1.2rem',
                      margin:
                        0,
                      lineHeight:
                        '1.7'
                    }}
                  >
                    <li>
                      Effectuez un transfert
                      Orange Money ou MTN Mobile
                      Money au :
                      {' '}
                      <strong>
                        6XX XX XX XX
                      </strong>.
                    </li>

                    <li>
                      Inscrivez ci-dessous le
                      numéro utilisé et le TxID /
                      Référence reçu par SMS.
                    </li>

                    <li>
                      Cliquez sur
                      « Valider le paiement ».
                    </li>
                  </ol>

                </div>

                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap:
                      '1rem',
                    marginBottom:
                      '1.5rem'
                  }}
                >

                  <div>
                    <label
                      style={{
                        display:
                          'block',
                        fontSize:
                          '.85rem',
                        marginBottom:
                          '.3rem'
                      }}
                    >
                      Votre numéro de téléphone
                      (Expéditeur)
                    </label>

                    <input
                      type="text"
                      placeholder="Ex: 699000000"
                      value={
                        senderPhoneInput
                      }
                      onChange={e =>
                        setSenderPhoneInput(
                          e.target.value
                        )
                      }
                      style={
                        inputStyle
                      }
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display:
                          'block',
                        fontSize:
                          '.85rem',
                        marginBottom:
                          '.3rem'
                      }}
                    >
                      Référence de la transaction
                      (TxID SMS)
                    </label>

                    <input
                      type="text"
                      placeholder="Ex: MP260926.1124.A12345"
                      value={
                        transactionRefInput
                      }
                      onChange={e =>
                        setTransactionRefInput(
                          e.target.value
                        )
                      }
                      style={
                        inputStyle
                      }
                    />
                  </div>

                </div>

                <button
                  onClick={
                    handleInitiatePayment
                  }
                  disabled={
                    isSubmittingPayment
                  }
                  className="primary-action"
                  style={{
                    width:
                      '100%',
                    padding:
                      '.9rem',
                    borderRadius:
                      '8px',
                    border:
                      'none',
                    backgroundColor:
                      '#4CC9F0',
                    color:
                      '#0B132B',
                    fontWeight:
                      'bold',
                    fontSize:
                      '1rem',
                    cursor:
                      'pointer'
                  }}
                >
                  {isSubmittingPayment
                    ? 'Enregistrement...'
                    : 'Valider le paiement ➔'}
                </button>

              </div>
            )}

          {/* ==================================================
              PENDING
          ================================================== */}

          {step ===
            'pending' &&
            currentOrder && (
              <div
                className="step-card"
                style={{
                  backgroundColor:
                    '#1C2541',
                  border:
                    '1px solid #3A506B',
                  borderRadius:
                    '12px',
                  padding:
                    '2rem',
                  textAlign:
                    'center'
                }}
              >

                <div
                  style={{
                    fontSize:
                      '3rem',
                    marginBottom:
                      '1rem'
                  }}
                >
                  ⏳
                </div>

                <h2
                  style={{
                    fontSize:
                      '1.3rem',
                    marginBottom:
                      '.5rem'
                  }}
                >
                  Paiement en cours de vérification
                </h2>

                <p
                  style={{
                    fontSize:
                      '.9rem',
                    color:
                      '#9CA3AF',
                    marginBottom:
                      '1.5rem',
                    lineHeight:
                      '1.5'
                  }}
                >
                  Nous vérifions la réception de
                  votre paiement Mobile Money.
                  <br />
                  Dès confirmation, votre document
                  PDF officiel sera disponible.
                </p>

                <div
                  style={{
                    backgroundColor:
                      '#0B132B',
                    padding:
                      '1rem',
                    borderRadius:
                      '8px',
                    border:
                      '1px solid #3A506B',
                    textAlign:
                      'left',
                    fontSize:
                      '.85rem',
                    marginBottom:
                      '1.5rem',
                    lineHeight:
                      '1.7'
                  }}
                >

                  <div>
                    <strong>
                      Commande n° :
                    </strong>{' '}
                    {
                      currentOrder.id
                    }
                  </div>

                  <div>
                    <strong>
                      Document :
                    </strong>{' '}
                    {
                      currentOrder.docTitle
                    }
                  </div>

                  <div>
                    <strong>
                      Montant :
                    </strong>{' '}
                    {
                      currentOrder.price
                    }
                  </div>

                  <div>
                    <strong>
                      Référence :
                    </strong>{' '}
                    {
                      currentOrder.transactionRef
                    }
                  </div>

                </div>

                <div
                  style={{
                    fontSize:
                      '.8rem',
                    color:
                      '#4CC9F0'
                  }}
                >
                  🔄 Vérification automatique
                  toutes les 3 secondes...
                </div>

              </div>
            )}

          {/* ==================================================
              SUCCESS
          ================================================== */}

          {step ===
            'success' && (
            <div
              className="step-card"
              style={{
                backgroundColor:
                  '#1C2541',
                border:
                  '1px solid #3A506B',
                borderRadius:
                  '12px',
                padding:
                  '2rem',
                textAlign:
                  'center'
              }}
            >

              <div
                style={{
                  fontSize:
                    '3.5rem',
                  marginBottom:
                    '1rem'
                }}
              >
                🎉
              </div>

              <h2
                style={{
                  fontSize:
                    '1.4rem',
                  color:
                    '#4CC9F0',
                  marginBottom:
                    '.5rem'
                }}
              >
                Paiement Approuvé !
              </h2>

              <p
                style={{
                  fontSize:
                    '.9rem',
                  color:
                    '#D1D5DB',
                  marginBottom:
                    '1.5rem',
                  lineHeight:
                    '1.5'
                }}
              >
                Votre document est prêt et validé.
                Cliquez sur le bouton ci-dessous
                pour télécharger votre PDF.
              </p>

              <button
                onClick={
                  generatePDF
                }
                disabled={
                  isGeneratingPDF
                }
                className="primary-action"
                style={{
                  width:
                    '100%',
                  padding:
                    '1rem',
                  borderRadius:
                    '8px',
                  border:
                    'none',
                  backgroundColor:
                    '#4CC9F0',
                  color:
                    '#0B132B',
                  fontWeight:
                    'bold',
                  fontSize:
                    '1.05rem',
                  cursor:
                    'pointer',
                  marginBottom:
                    '1rem'
                }}
              >
                {isGeneratingPDF
                  ? 'Génération du PDF...'
                  : '📥 Télécharger mon PDF'}
              </button>

              <button
                onClick={() =>
                  setStep(
                    'home'
                  )
                }
                style={{
                  background:
                    'none',
                  border:
                    'none',
                  color:
                    '#9CA3AF',
                  fontSize:
                    '.85rem',
                  cursor:
                    'pointer',
                  textDecoration:
                    'underline'
                }}
              >
                Générer un autre document
              </button>

            </div>
          )}

          {/* ==================================================
              ADMIN LOGIN
          ================================================== */}

          {step ===
            'admin_login' && (
            <div
              className="step-card"
              style={{
                backgroundColor:
                  '#1C2541',
                border:
                  '1px solid #3A506B',
                borderRadius:
                  '12px',
                padding:
                  '1.5rem'
              }}
            >

              <h2
                style={{
                  fontSize:
                    '1.3rem',
                  marginBottom:
                    '1rem',
                  color:
                    '#F72585'
                }}
              >
                🔒 Espace Administration
              </h2>

              <form
                onSubmit={
                  handleAdminLogin
                }
              >

                <div
                  style={{
                    marginBottom:
                      '1rem'
                  }}
                >

                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '.85rem',
                      marginBottom:
                        '.4rem'
                    }}
                  >
                    Code PIN d'accès
                  </label>

                  <input
                    type="password"
                    placeholder="Entrez le PIN"
                    value={
                      adminPinInput
                    }
                    onChange={e =>
                      setAdminPinInput(
                        e.target.value
                      )
                    }
                    style={
                      inputStyle
                    }
                  />

                  {adminPinError && (
                    <p
                      style={{
                        color:
                          '#F72585',
                        fontSize:
                          '.8rem',
                        marginTop:
                          '.3rem'
                      }}
                    >
                      Code PIN incorrect.
                    </p>
                  )}

                </div>

                <button
                  type="submit"
                  className="primary-action"
                  style={{
                    width:
                      '100%',
                    padding:
                      '.8rem',
                    borderRadius:
                      '8px',
                    border:
                      'none',
                    backgroundColor:
                      '#F72585',
                    color:
                      '#FFFFFF',
                    fontWeight:
                      'bold',
                    cursor:
                      'pointer'
                  }}
                >
                  Se connecter ➔
                </button>

              </form>

            </div>
          )}

          {/* ==================================================
              ADMIN DASHBOARD
          ================================================== */}

          {step ===
            'admin_dashboard' && (
            <div>

              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                  marginBottom:
                    '1.5rem',
                  gap:
                    '1rem'
                }}
              >

                <h2
                  style={{
                    fontSize:
                      '1.2rem',
                    color:
                      '#F72585',
                    margin:
                      0
                  }}
                >
                  📊 Tableau de bord Admin
                </h2>

                <button
                  onClick={
                    fetchSupabaseOrders
                  }
                  style={{
                    padding:
                      '.4rem .8rem',
                    borderRadius:
                      '6px',
                    border:
                      '1px solid #3A506B',
                    backgroundColor:
                      '#1C2541',
                    color:
                      '#FFFFFF',
                    fontSize:
                      '.8rem',
                    cursor:
                      'pointer'
                  }}
                >
                  🔄 Actualiser
                </button>

              </div>

              <div
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap:
                    '1rem'
                }}
              >

                {orders.length ===
                0 ? (
                  <p
                    style={{
                      textAlign:
                        'center',
                      color:
                        '#9CA3AF'
                    }}
                  >
                    Aucune commande enregistrée.
                  </p>
                ) : (
                  orders.map(
                    order => (
                      <div
                        key={
                          order.id
                        }
                        className="card-hover"
                        style={{
                          backgroundColor:
                            '#1C2541',
                          border:
                            '1px solid #3A506B',
                          borderRadius:
                            '8px',
                          padding:
                            '1rem'
                        }}
                      >

                        <div
                          style={{
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            marginBottom:
                              '.5rem',
                            gap:
                              '.5rem'
                          }}
                        >

                          <span
                            style={{
                              fontSize:
                                '.85rem',
                              fontWeight:
                                'bold',
                              color:
                                '#4CC9F0'
                            }}
                          >
                            {
                              order.docTitle
                            }
                          </span>

                          <span
                            style={{
                              fontSize:
                                '.7rem',
                              padding:
                                '2px 6px',
                              borderRadius:
                                '4px',
                              fontWeight:
                                'bold',
                              backgroundColor:
                                order.status ===
                                'APPROVED'
                                  ? '#10B981'
                                  : '#F59E0B',
                              color:
                                '#FFFFFF'
                            }}
                          >
                            {
                              order.status
                            }
                          </span>

                        </div>

                        <div
                          style={{
                            fontSize:
                              '.8rem',
                            color:
                              '#D1D5DB',
                            lineHeight:
                              '1.6'
                          }}
                        >

                          <div>
                            <strong>
                              Client :
                            </strong>{' '}
                            {
                              order.clientPhone
                            }
                          </div>

                          <div>
                            <strong>
                              Montant :
                            </strong>{' '}
                            {
                              order.price
                            }
                          </div>

                          <div>
                            <strong>
                              Réf SMS :
                            </strong>{' '}
                            {
                              order.transactionRef ||
                              'N/A'
                            }
                          </div>

                          <div>
                            <strong>
                              Heure :
                            </strong>{' '}
                            {
                              order.createdAt
                            }
                          </div>

                        </div>

                        {order.status ===
                          'PENDING' && (
                          <button
                            onClick={() =>
                              handleApproveOrder(
                                order.id
                              )
                            }
                            style={{
                              marginTop:
                                '.8rem',
                              width:
                                '100%',
                              padding:
                                '.5rem',
                              borderRadius:
                                '6px',
                              border:
                                'none',
                              backgroundColor:
                                '#10B981',
                              color:
                                '#FFFFFF',
                              fontWeight:
                                'bold',
                              fontSize:
                                '.85rem',
                              cursor:
                                'pointer'
                            }}
                          >
                            ✓ Approuver la commande
                          </button>
                        )}

                      </div>
                    )
                  )
                )}

              </div>

            </div>
          )}

        </main>
      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer
        style={{
          padding:
            '1.5rem',
          textAlign:
            'center',
          borderTop:
            '1px solid #1C2541',
          marginTop:
            '2rem',
          fontSize:
            '.8rem',
          color:
            '#9CA3AF'
        }}
      >

        <p
          style={{
            margin:
              0
          }}
        >
          © 2026 DocExpress.
          Tous droits réservés.
        </p>

        <p
          style={{
            fontSize:
              '.65rem',
            color:
              '#4B5563',
            margin:
              '.3rem 0 0'
          }}
        >
          Développé avec soin par Désiré Atangana Atangana
        </p>

        <p
          style={{
            margin:
              '.3rem 0 0',
            fontSize:
              '.75rem'
          }}
        >
          Service sécurisé de génération administrative.
        </p>

      </footer>

    </div>
  );
}
