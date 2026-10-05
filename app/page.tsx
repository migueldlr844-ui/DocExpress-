"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence } from "framer-motion";

import HeroText from "./components/HeroText";
import EditorialList from "./components/EditorialList";
import SplashScreen from "./components/SplashScreen";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://madkfwcxvhjznidszbhi.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNjIwNDMsImV4cCI6MjA3MzYzODAwNH0.4i4LqV6wA3YJ6P181O7I8w9Hk0";

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

interface FormField {
  id: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "select";
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
  status: "PENDING" | "APPROVED";
  createdAt: string;
  formData: Record<string, string>;
  generatedBody: string;
}

interface ParsedItem {
  quantity: number;
  description: string;
  unitPrice: number;
  total: number;
}

const DOCUMENTS_CONFIG: Record<
  string,
  DocumentConfig
> = {
  quittanceloyer: {
    id: "quittanceloyer",
    title: "Quittance de loyer",
    category: "IMMOBILIER",
    price: "500 FCFA",
    priceNumeric: 500,
    desc:
      "Attestation officielle de paiement intégral du loyer mensuel.",
    fields: [
      {
        id: "bailleurnom",
        label: "Nom complet du bailleur",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "bailleurphone",
        label: "Téléphone bailleur",
        type: "text",
        step: 1,
      },
      {
        id: "locatairenom",
        label: "Nom complet du locataire",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "logementadresse",
        label: "Adresse du logement",
        type: "text",
        placeholder: "Ex : Omnisports, Yaoundé",
        step: 2,
        required: true,
      },
      {
        id: "periode",
        label: "Période",
        type: "text",
        placeholder: "Ex : Mois de septembre 2026",
        step: 2,
        required: true,
      },
      {
        id: "loyermontant",
        label: "Montant du loyer FCFA",
        type: "number",
        step: 2,
        required: true,
      },
      {
        id: "paiementdate",
        label: "Date de paiement",
        type: "text",
        placeholder: "JJ/MM/AAAA",
        step: 3,
        required: true,
      },
      {
        id: "paiementmode",
        label: "Mode de paiement",
        type: "select",
        options: [
          "Espèces",
          "Orange Money",
          "MTN Mobile Money",
          "Virement bancaire",
        ],
        step: 3,
        required: true,
      },
    ],
  },

  reculoyer: {
    id: "reculoyer",
    title: "Reçu de paiement de loyer",
    category: "IMMOBILIER",
    price: "500 FCFA",
    priceNumeric: 500,
    desc:
      "Preuve de paiement partiel ou d’acompte sur le loyer.",
    fields: [
      {
        id: "receveurnom",
        label: "Nom du bénéficiaire ou bailleur",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "payeurnom",
        label: "Nom du payeur ou locataire",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "logementadresse",
        label: "Adresse du logement",
        type: "text",
        step: 2,
        required: true,
      },
      {
        id: "montant",
        label: "Montant perçu FCFA",
        type: "number",
        step: 2,
        required: true,
      },
      {
        id: "motif",
        label: "Motif du paiement",
        type: "text",
        placeholder: "Ex : Acompte loyer septembre",
        step: 2,
        required: true,
      },
      {
        id: "resteapayer",
        label: "Reste éventuel à payer FCFA",
        type: "number",
        step: 3,
      },
    ],
  },

  attestationlocation: {
    id: "attestationlocation",
    title: "Attestations locatives",
    category: "IMMOBILIER",
    price: "500 FCFA",
    priceNumeric: 500,
    desc:
      "Attestations d’hébergement, de location ou de paiement.",
    fields: [
      {
        id: "attestationtype",
        label: "Type d’attestation",
        type: "select",
        options: [
          "Attestation d’hébergement",
          "Attestation de location",
          "Attestation de paiement de loyer",
        ],
        step: 1,
        required: true,
      },
      {
        id: "declarantnom",
        label: "Nom complet du déclarant",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "declarantadresse",
        label: "Adresse du déclarant",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "beneficiairenom",
        label: "Nom complet du bénéficiaire",
        type: "text",
        step: 2,
        required: true,
      },
      {
        id: "datedebut",
        label: "Réside ou hébergé depuis le",
        type: "text",
        placeholder: "JJ/MM/AAAA",
        step: 2,
        required: true,
      },
    ],
  },

  recuvente: {
    id: "recuvente",
    title: "Reçu de vente",
    category: "BUSINESS",
    price: "500 FCFA",
    priceNumeric: 500,
    desc:
      "Justificatif de vente directe de produits ou services.",
    fields: [
      {
        id: "vendeurnom",
        label: "Nom du vendeur ou boutique",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "acheteurnom",
        label: "Nom de l’acheteur",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "articlesliste",
        label: "Désignation des articles achetés",
        type: "textarea",
        step: 2,
        required: true,
      },
      {
        id: "montantrecu",
        label: "Montant encaissé FCFA",
        type: "number",
        step: 3,
        required: true,
      },
    ],
  },

  lettre: {
    id: "lettre",
    title: "Lettre de motivation",
    category: "CARRIÈRE",
    price: "500 FCFA",
    priceNumeric: 500,
    badge: "POPULAIRE",
    desc:
      "Rédigée sur mesure et au format professionnel.",
    fields: [
      {
        id: "name",
        label: "Nom et prénom",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "phone",
        label: "Téléphone",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "address",
        label: "Ville et adresse",
        type: "text",
        step: 1,
      },
      {
        id: "jobTitle",
        label: "Poste recherché",
        type: "text",
        step: 2,
        required: true,
      },
      {
        id: "recipient",
        label: "Entreprise destinataire",
        type: "text",
        step: 2,
        required: true,
      },
      {
        id: "experience",
        label: "Vos points forts et parcours",
        type: "textarea",
        step: 3,
        required: true,
      },
      {
        id: "motivation",
        label: "Pourquoi ce poste ?",
        type: "textarea",
        step: 3,
        required: true,
      },
    ],
  },

  contratbail: {
    id: "contratbail",
    title: "Contrat de bail d’habitation",
    category: "IMMOBILIER",
    price: "1 000 FCFA",
    priceNumeric: 1000,
    desc:
      "Bail d’habitation complet structuré avec clauses d’occupation.",
    fields: [
      {
        id: "bailleurnom",
        label: "Nom du bailleur",
        type: "text",
        placeholder: "Ex : MBARGA",
        step: 1,
        required: true,
      },
      {
        id: "bailleurprenom",
        label: "Prénoms du bailleur",
        type: "text",
        placeholder: "Ex : Paul",
        step: 1,
        required: true,
      },
      {
        id: "bailleurphone",
        label: "Téléphone bailleur",
        type: "text",
        placeholder: "Ex : 6XX XX XX XX",
        step: 1,
        required: true,
      },
      {
        id: "bailleuradresse",
        label: "Adresse du bailleur",
        type: "text",
        step: 1,
      },
      {
        id: "locatairenom",
        label: "Nom du locataire",
        type: "text",
        placeholder: "Ex : KOUAM",
        step: 2,
        required: true,
      },
      {
        id: "locataireprenom",
        label: "Prénoms du locataire",
        type: "text",
        step: 2,
        required: true,
      },
      {
        id: "locatairephone",
        label: "Téléphone du locataire",
        type: "text",
        step: 2,
        required: true,
      },
      {
        id: "logementtype",
        label: "Type de logement",
        type: "select",
        options: [
          "Studio",
          "Appartement",
          "Chambre",
          "Maison ou villa",
        ],
        step: 3,
        required: true,
      },
      {
        id: "logementville",
        label: "Ville et quartier",
        type: "text",
        placeholder: "Ex : Yaoundé, Bastos",
        step: 3,
        required: true,
      },
      {
        id: "loyermontant",
        label: "Loyer mensuel FCFA",
        type: "number",
        placeholder: "Ex : 75000",
        step: 3,
        required: true,
      },
      {
        id: "cautionmontant",
        label: "Montant de la caution FCFA",
        type: "number",
        step: 3,
      },
      {
        id: "datedebut",
        label: "Date de début du bail",
        type: "text",
        placeholder: "JJ/MM/AAAA",
        step: 3,
        required: true,
      },
    ],
  },

  facturesimple: {
    id: "facturesimple",
    title: "Facture simple",
    category: "BUSINESS",
    price: "1 000 FCFA",
    priceNumeric: 1000,
    desc:
      "Facture commerciale claire avec tableau des prestations.",
    fields: [
      {
        id: "vendeurnom",
        label: "Nom commercial ou entreprise",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "vendeurphone",
        label: "Téléphone ou WhatsApp",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "clientnom",
        label: "Nom du client ou entreprise",
        type: "text",
        step: 2,
        required: true,
      },
      {
        id: "objetsfactures",
        label: "Détail des prestations ou articles",
        type: "textarea",
        placeholder:
          "Ex : 2x Conception logo 15000, 1x Impression bâche 20000",
        step: 3,
        required: true,
      },
    ],
  },

  factureproforma: {
    id: "factureproforma",
    title: "Facture proforma",
    category: "BUSINESS",
    price: "1 000 FCFA",
    priceNumeric: 1000,
    desc:
      "Devis et offre commerciale officielle avant prestation.",
    fields: [
      {
        id: "vendeurnom",
        label: "Nom de votre entreprise",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "clientnom",
        label: "Client destinataire",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "validite",
        label: "Validité de l’offre",
        type: "text",
        placeholder: "Ex : 15 jours",
        step: 2,
        required: true,
      },
      {
        id: "objetsfactures",
        label: "Services ou produits proposés",
        type: "textarea",
        placeholder:
          "Ex : 1x Maintenance informatique 50000",
        step: 3,
        required: true,
      },
    ],
  },

  boncommande: {
    id: "boncommande",
    title: "Bon de commande",
    category: "BUSINESS",
    price: "1 000 FCFA",
    priceNumeric: 1000,
    desc:
      "Ordre d’achat officiel adressé à un fournisseur.",
    fields: [
      {
        id: "acheteurnom",
        label: "Nom de votre entreprise",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "fournisseurnom",
        label: "Nom du fournisseur",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "produitscommandes",
        label: "Liste des produits commandés",
        type: "textarea",
        step: 2,
        required: true,
      },
      {
        id: "livraisonadresse",
        label: "Lieu de livraison souhaité",
        type: "text",
        step: 3,
        required: true,
      },
    ],
  },

  cv: {
    id: "cv",
    title: "CV professionnel",
    category: "CARRIÈRE",
    price: "1 000 FCFA",
    priceNumeric: 1000,
    badge: "POPULAIRE",
    desc:
      "Format moderne structuré pour le marché de l’emploi.",
    fields: [
      {
        id: "name",
        label: "Nom complet",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "phone",
        label: "Téléphone WhatsApp",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "jobTitle",
        label: "Poste visé",
        type: "text",
        placeholder: "Ex : Commercial terrain",
        step: 2,
        required: true,
      },
      {
        id: "experience",
        label:
          "Vos expériences, postes, entreprises et tâches",
        type: "textarea",
        step: 3,
        required: true,
      },
      {
        id: "education",
        label: "Formations et diplômes",
        type: "textarea",
        step: 3,
        required: true,
      },
    ],
  },

  packemploi: {
    id: "packemploi",
    title: "Pack Emploi CV + Lettre",
    category: "PACKS",
    price: "1 500 FCFA",
    priceNumeric: 1500,
    badge: "MEILLEURE OFFRE",
    desc:
      "Formulaire unique pour obtenir votre CV et votre lettre.",
    fields: [
      {
        id: "name",
        label: "Nom complet",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "phone",
        label: "Téléphone WhatsApp",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "jobTitle",
        label: "Poste recherché",
        type: "text",
        step: 2,
        required: true,
      },
      {
        id: "recipient",
        label: "Entreprise visée",
        type: "text",
        step: 2,
        required: true,
      },
      {
        id: "experience",
        label: "Parcours et expériences",
        type: "textarea",
        step: 3,
        required: true,
      },
    ],
  },

  packentrepreneur: {
    id: "packentrepreneur",
    title: "Pack Entrepreneur - 5 documents",
    category: "PACKS",
    price: "4 000 FCFA",
    priceNumeric: 4000,
    badge: "PRO",
    desc:
      "5 documents administratifs ou commerciaux pour votre entreprise.",
    fields: [
      {
        id: "vendeurnom",
        label: "Nom de votre entreprise",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "vendeurphone",
        label: "Téléphone professionnel ou WhatsApp",
        type: "text",
        step: 1,
        required: true,
      },
      {
        id: "docsselection",
        label: "Précisez les 5 documents souhaités",
        type: "textarea",
        step: 2,
        required: true,
      },
    ],
  },
};

const escapeHtml = (
  value: unknown
): string => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatNumber = (
  value: unknown
): string => {
  const number = Number(
    String(value ?? "").replace(/\D/g, "")
  );

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("fr-FR").format(
    number
  );
};

const todayFrench = (): string => {
  return new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const generateReference = (
  prefix: string
): string => {
  const date = new Date();

  const stamp =
    String(date.getFullYear()).slice(-2) +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");

  const random =
    Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${stamp}-${random}`;
};

const numberToWordsUnder1000 = (
  n: number
): string => {
  const units = [
    "zéro",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
  ];

  const tens = [
    "",
    "",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
  ];

  if (n < 17) {
    return units[n];
  }

  if (n < 20) {
    return `dix-${units[n - 10]}`;
  }

  if (n < 70) {
    const t = Math.floor(n / 10);
    const r = n % 10;

    if (r === 0) {
      return tens[t];
    }

    if (r === 1) {
      return `${tens[t]} et un`;
    }

    return `${tens[t]}-${units[r]}`;
  }

  if (n < 80) {
    if (n === 71) {
      return "soixante et onze";
    }

    return `soixante-${numberToWordsUnder1000(
      n - 60
    )}`;
  }

  if (n < 100) {
    if (n === 80) {
      return "quatre-vingts";
    }

    return `quatre-vingt-${numberToWordsUnder1000(
      n - 80
    )}`;
  }

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  let result =
    hundreds === 1
      ? "cent"
      : `${units[hundreds]} cent`;

  if (remainder === 0 && hundreds > 1) {
    result += "s";
  }

  if (remainder !== 0) {
    result += ` ${numberToWordsUnder1000(
      remainder
    )}`;
  }

  return result;
};

const numberToWords = (
  value: unknown
): string => {
  const n = Math.floor(
    Number(
      String(value ?? "").replace(/\D/g, "")
    )
  );

  if (!Number.isFinite(n)) {
    return "zéro";
  }

  if (n < 1000) {
    return numberToWordsUnder1000(n);
  }

  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;

    let result =
      thousands === 1
        ? "mille"
        : `${numberToWordsUnder1000(
            thousands
          )} mille`;

    if (remainder !== 0) {
      result += ` ${numberToWordsUnder1000(
        remainder
      )}`;
    }

    return result;
  }

  if (n < 1000000000) {
    const millions = Math.floor(n / 1000000);
    const remainder = n % 1000000;

    let result =
      millions === 1
        ? "un million"
        : `${numberToWords(millions)} millions`;

    if (remainder !== 0) {
      result += ` ${numberToWords(remainder)}`;
    }

    return result;
  }

  const billions = Math.floor(n / 1000000000);
  const remainder = n % 1000000000;

  let result =
    billions === 1
      ? "un milliard"
      : `${numberToWords(billions)} milliards`;

  if (remainder !== 0) {
    result += ` ${numberToWords(remainder)}`;
  }

  return result;
};

const moneyInWords = (
  value: unknown
): string => {
  return `${numberToWords(value)} francs CFA`;
};

const parseItems = (
  raw: string
): ParsedItem[] => {
  if (!raw || !raw.trim()) {
    return [];
  }

  return raw
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let quantity = 1;
      let description = line;
      let unitPrice = 0;

      const quantityMatch = line.match(
        /^(\d+)\s*[xX*]\s*(.*?)(?:\s+(\d[\d\s]*))?$/
      );

      if (quantityMatch) {
        quantity =
          Number(quantityMatch[1]) || 1;
        description = quantityMatch[2].trim();
        unitPrice = Number(
          (quantityMatch[3] || "").replace(
            /\s/g,
            ""
          )
        );
      } else {
        const pipeMatch = line.match(
          /^(.*?)\s*\|\s*(\d+)\s*\|\s*([\d\s]+)$/
        );

        if (pipeMatch) {
          description = pipeMatch[1].trim();
          quantity =
            Number(pipeMatch[2]) || 1;
          unitPrice = Number(
            pipeMatch[3].replace(/\s/g, "")
          );
        } else {
          const dashMatch = line.match(
            /^(.*?)\s*-\s*([\d\s]+)$/
          );

          if (dashMatch) {
            description = dashMatch[1].trim();
            unitPrice = Number(
              dashMatch[2].replace(/\s/g, "")
            );
          }
        }
      }

      return {
        quantity,
        description,
        unitPrice,
        total: quantity * unitPrice,
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
): string => {
  return `
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
};

const sectionTitle = (
  title: string
): string => {
  return `
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
};

const signatureBlock = (
  left: string,
  right: string
): string => {
  return `
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
        <div style="
          font-size:11px;
          color:#6B7280;
        ">
          Signature
        </div>
      </div>

      <div style="text-align:center;">
        <strong>${escapeHtml(right)}</strong>
        <div style="height:55px;"></div>
        <div style="
          font-size:11px;
          color:#6B7280;
        ">
          Signature
        </div>
      </div>
    </div>
  `;
};

const commercialTable = (
  items: ParsedItem[],
  totalOverride?: number
): string => {
  const validItems = items.length
    ? items
    : [
        {
          quantity: 1,
          description: "Prestation ou article",
          unitPrice: 0,
          total: 0,
        },
      ];

  const calculatedTotal = validItems.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const total =
    typeof totalOverride === "number"
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
          ">
            Désignation
          </th>

          <th style="
            background:#111827;
            color:#fff;
            padding:9px;
            border:1px solid #111827;
            text-align:center;
            width:55px;
          ">
            Qté
          </th>

          <th style="
            background:#111827;
            color:#fff;
            padding:9px;
            border:1px solid #111827;
            text-align:right;
            width:100px;
          ">
            Prix unit.
          </th>

          <th style="
            background:#111827;
            color:#fff;
            padding:9px;
            border:1px solid #111827;
            text-align:right;
            width:110px;
          ">
            Total
          </th>
        </tr>
      </thead>

      <tbody>
        ${validItems
          .map(
            (item) => `
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
                  ${
                    item.unitPrice
                      ? `${formatNumber(
                          item.unitPrice
                        )} FCFA`
                      : "-"
                  }
                </td>

                <td style="
                  padding:9px;
                  border:1px solid #D1D5DB;
                  text-align:right;
                  font-weight:700;
                ">
                  ${
                    item.total
                      ? `${formatNumber(
                          item.total
                        )} FCFA`
                      : "-"
                  }
                </td>
              </tr>
            `
          )
          .join("")}
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

export default function Home() {
  const [showSplash, setShowSplash] =
    useState(true);

  const [step, setStep] = useState<
    | "home"
    | "form"
    | "review"
    | "preview"
    | "payment"
    | "pending"
    | "success"
    | "adminlogin"
    | "admindashboard"
  >("home");

  const [selectedDoc, setSelectedDoc] =
    useState<DocumentConfig | null>(null);

  const [formStep, setFormStep] =
    useState(1);

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const [
    isGeneratingContent,
    setIsGeneratingContent,
  ] = useState(false);

  const [
    isGeneratingPDF,
    setIsGeneratingPDF,
  ] = useState(false);

  const [
    generatedBody,
    setGeneratedBody,
  ] = useState("");

  const [
    formData,
    setFormData,
  ] = useState<Record<string, string>>({});

  const [
    senderPhoneInput,
    setSenderPhoneInput,
  ] = useState("");

  const [
    transactionRefInput,
    setTransactionRefInput,
  ] = useState("");

  const [
    isSubmittingPayment,
    setIsSubmittingPayment,
  ] = useState(false);

  const [
    currentOrder,
    setCurrentOrder,
  ] = useState<Order | null>(null);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [
    adminPinInput,
    setAdminPinInput,
  ] = useState("");

  const [
    adminPinError,
    setAdminPinError,
  ] = useState(false);

  const documentRef =
    useRef<HTMLDivElement>(null);

  const sortedDocuments = Object.values(
    DOCUMENTS_CONFIG
  ).sort(
    (a, b) =>
      a.priceNumeric - b.priceNumeric
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const fetchSupabaseOrders =
    async (): Promise<void> => {
      try {
        const { data, error } =
          await supabase
            .from("orders")
            .select("*")
            .order("created_at", {
              ascending: false,
            });

        if (error) {
          console.error(
            "Erreur Supabase :",
            error
          );
          return;
        }

        if (data) {
          const mappedOrders: Order[] =
            data.map((item: any) => ({
              id: item.id,
              docTitle:
                item.doctitle ||
                "Document",
              price: `${formatNumber(
                item.amount || 0
              )} FCFA`,
              clientPhone:
                item.senderphone ||
                "Non renseigné",
              senderPhone:
                item.senderphone,
              transactionRef:
                item.transactionref,
              status:
                item.status === "completed"
                  ? "APPROVED"
                  : "PENDING",
              createdAt: item.created_at
                ? new Date(
                    item.created_at
                  ).toLocaleTimeString(
                    "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "",
              formData:
                item.formdata || {},
              generatedBody:
                item.generatedbody || "",
            }));

          setOrders(mappedOrders);
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des commandes :",
          error
        );
      }
    };

  useEffect(() => {
    fetchSupabaseOrders();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (
      step === "pending" &&
      currentOrder
    ) {
      interval = setInterval(async () => {
        try {
          const { data, error } =
            await supabase
              .from("orders")
              .select("*")
              .eq("id", currentOrder.id)
              .single();

          if (error) {
            console.error(
              "Erreur de vérification :",
              error
            );
            return;
          }

          if (
            data &&
            data.status === "completed"
          ) {
            setCurrentOrder((previous) =>
              previous
                ? {
                    ...previous,
                    status: "APPROVED",
                  }
                : null
            );

            setStep("success");
          }
        } catch (error) {
          console.error(
            "Erreur de vérification automatique :",
            error
          );
        }
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [step, currentOrder]);

  const handleSelectDoc = (
    doc: DocumentConfig
  ): void => {
    setSelectedDoc(doc);
    setFormStep(1);
    setFormData({});
    setGeneratedBody("");
    setSenderPhoneInput("");
    setTransactionRefInput("");
    setStep("form");
    setIsMenuOpen(false);
  };

  const handleInputChange = (
    fieldId: string,
    value: string
  ): void => {
    setFormData((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  };

  const handleBack = (): void => {
    if (step === "form") {
      if (formStep > 1) {
        setFormStep((previous) => previous - 1);
      } else {
        setStep("home");
      }
    } else if (step === "review") {
      setStep("form");
    } else if (step === "preview") {
      setStep("review");
    } else if (step === "payment") {
      setStep("preview");
    } else if (step === "pending") {
      setStep("payment");
    } else if (step === "success") {
      setStep("home");
    } else if (step === "adminlogin") {
      setStep("home");
    }
  };

  const handleProcessDocument =
    async (): Promise<void> => {
      if (!selectedDoc) {
        return;
      }

      setIsGeneratingContent(true);

      try {
        const id = selectedDoc.id;

        const reference = generateReference(
          id === "cv"
            ? "CV"
            : id === "lettre"
            ? "LM"
            : id === "contratbail"
            ? "BAIL"
            : id === "quittanceloyer"
            ? "QT"
            : id === "reculoyer"
            ? "REC"
            : id === "facturesimple"
            ? "FAC"
            : id === "factureproforma"
            ? "PRO"
            : id === "boncommande"
            ? "BC"
            : "DOC"
        );

        let content = "";

        if (id === "contratbail") {
          const loyer = Number(
            formData.loyermontant || 0
          );

          const caution = Number(
            formData.cautionmontant || 0
          );

          content = `
            <div style="${documentStyles}">
              ${docHeader(
                "Contrat de bail",
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
                  CONTRAT DE BAIL À USAGE D’HABITATION
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
                <strong>ENTRE LES SOUSSIGNÉS</strong>
              </p>

              ${sectionTitle(
                "1. Identification des parties"
              )}

              <p>
                <strong>Le Bailleur</strong> :
                ${escapeHtml(
                  formData.bailleurnom
                )}
                ${escapeHtml(
                  formData.bailleurprenom
                )}
                ${
                  formData.bailleurphone
                    ? `, téléphone :
                      ${escapeHtml(
                        formData.bailleurphone
                      )}`
                    : ""
                }
                ${
                  formData.bailleuradresse
                    ? `, domicilié à :
                      ${escapeHtml(
                        formData.bailleuradresse
                      )}`
                    : ""
                }.
              </p>

              <p>
                <strong>Le Locataire</strong> :
                ${escapeHtml(
                  formData.locatairenom
                )}
                ${escapeHtml(
                  formData.locataireprenom
                )}
                ${
                  formData.locatairephone
                    ? `, téléphone :
                      ${escapeHtml(
                        formData.locatairephone
                      )}`
                    : ""
                }.
              </p>

              ${sectionTitle("2. Objet du bail")}

              <p>
                Le Bailleur donne à bail au Locataire,
                qui accepte, un logement à usage
                d’habitation de type
                <strong>
                  ${escapeHtml(
                    formData.logementtype
                  )}
                </strong>,
                situé à
                <strong>
                  ${escapeHtml(
                    formData.logementville
                  )}
                </strong>.
              </p>

              ${sectionTitle("3. Durée du bail")}

              <p>
                Le présent bail prend effet à compter du
                <strong>
                  ${escapeHtml(
                    formData.datedebut
                  )}
                </strong>.
                Sauf stipulation contraire entre les
                parties, il est conclu pour une durée
                d’un an, renouvelable conformément aux
                dispositions applicables et aux accords
                des parties.
              </p>

              ${sectionTitle(
                "4. Loyer et conditions financières"
              )}

              <p>
                Le loyer mensuel est fixé à
                <strong>
                  ${formatNumber(loyer)} FCFA
                </strong>,
                soit
                <strong>
                  ${moneyInWords(loyer)}
                </strong>.
              </p>

              <p>
                La caution indiquée par les parties
                s’élève à
                <strong>
                  ${formatNumber(caution)} FCFA
                </strong>.
              </p>

              ${sectionTitle(
                "5. Obligations du Locataire"
              )}

              <p>
                Le Locataire s’engage notamment à :
              </p>

              <ul>
                <li>
                  payer le loyer conformément aux
                  conditions convenues ;
                </li>
                <li>
                  utiliser le logement conformément à
                  sa destination d’habitation ;
                </li>
                <li>
                  préserver les lieux et signaler
                  rapidement toute dégradation importante ;
                </li>
                <li>
                  respecter les règles normales de
                  voisinage ;
                </li>
                <li>
                  ne pas céder ou sous-louer le logement
                  sans accord préalable lorsque celui-ci
                  est requis.
                </li>
              </ul>

              ${sectionTitle(
                "6. Obligations du Bailleur"
              )}

              <p>
                Le Bailleur s’engage à permettre au
                Locataire une jouissance paisible du
                logement et à assumer les obligations
                qui lui incombent au titre du bail et
                des dispositions applicables.
              </p>

              ${sectionTitle(
                "7. Entretien et réparations"
              )}

              <p>
                Les parties conviennent que l’entretien
                courant et les réparations locatives
                incombant au Locataire sont à sa charge,
                tandis que les réparations relevant des
                obligations du Bailleur restent à la
                charge de celui-ci, sous réserve des
                responsabilités résultant d’une faute ou
                d’une dégradation imputable au Locataire.
              </p>

              ${sectionTitle(
                "8. Résiliation et fin du bail"
              )}

              <p>
                Toute résiliation ou fin anticipée du
                bail intervient conformément aux
                dispositions légales applicables et aux
                conditions convenues entre les parties.
                Les parties s’engagent à respecter les
                délais et formalités applicables.
              </p>

              ${sectionTitle(
                "9. Règlement des différends"
              )}

              <p>
                Les parties privilégieront dans un
                premier temps une résolution amiable de
                tout différend relatif à l’exécution du
                présent contrat. À défaut d’accord, les
                mécanismes et juridictions compétents
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
                fournies par l’utilisateur. Il est
                recommandé aux parties de vérifier les
                informations et, lorsque nécessaire, de
                faire relire le contrat par un
                professionnel compétent avant signature.
              </div>

              ${signatureBlock(
                "Le Bailleur",
                "Le Locataire"
              )}
            </div>
          `;
        } else if (id === "quittanceloyer") {
          const montant = Number(
            formData.loyermontant || 0
          );

          content = `
            <div style="${documentStyles}">
              ${docHeader(
                "Quittance de loyer",
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
                  Période :
                  ${escapeHtml(
                    formData.periode
                  )}
                </div>
              </div>

              <p>
                Je soussigné
                <strong>
                  ${escapeHtml(
                    formData.bailleurnom
                  )}
                </strong>
                ${
                  formData.bailleurphone
                    ? `, tél. ${escapeHtml(
                        formData.bailleurphone
                      )}`
                    : ""
                },
                bailleur ou gestionnaire du logement
                situé à
                <strong>
                  ${escapeHtml(
                    formData.logementadresse
                  )}
                </strong>,
                reconnais avoir reçu de
                <strong>
                  ${escapeHtml(
                    formData.locatairenom
                  )}
                </strong>
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
                  ${formatNumber(montant)} FCFA
                </div>

                <div style="
                  font-size:10px;
                  color:#6B7280;
                  margin-top:6px;
                  text-transform:capitalize;
                ">
                  ${moneyInWords(montant)}
                </div>
              </div>

              <p>
                Cette somme correspond au paiement du
                loyer pour la période
                <strong>
                  ${escapeHtml(
                    formData.periode
                  )}
                </strong>.
              </p>

              <p>
                <strong>Mode de paiement :</strong>
                ${escapeHtml(
                  formData.paiementmode
                )}
              </p>

              <p>
                <strong>Date du paiement :</strong>
                ${escapeHtml(
                  formData.paiementdate
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
                <strong>
                  Le Bailleur ou Gestionnaire
                </strong>

                <div style="height:55px;"></div>

                <span style="
                  font-size:10px;
                  color:#6B7280;
                ">
                  Signature et cachet
                </span>
              </div>
            </div>
          `;
        } else if (id === "reculoyer") {
          const montant = Number(
            formData.montant || 0
          );

          const reste = Number(
            formData.resteapayer || 0
          );

          content = `
            <div style="${documentStyles}">
              ${docHeader(
                "Reçu de paiement",
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
                Je soussigné
                <strong>
                  ${escapeHtml(
                    formData.receveurnom
                  )}
                </strong>,
                reconnais avoir reçu de
                <strong>
                  ${escapeHtml(
                    formData.payeurnom
                  )}
                </strong>
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
                  ${formatNumber(montant)} FCFA
                </div>

                <div style="
                  font-size:10px;
                  color:#6B7280;
                  margin-top:5px;
                ">
                  ${moneyInWords(montant)}
                </div>
              </div>

              <p>
                <strong>Motif :</strong>
                ${escapeHtml(
                  formData.motif
                )}
              </p>

              <p>
                <strong>Logement concerné :</strong>
                ${escapeHtml(
                  formData.logementadresse
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
                    ${formatNumber(montant)} FCFA
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
                    ${formatNumber(reste)} FCFA
                  </strong>
                </div>
              </div>

              ${signatureBlock(
                "Le Payeur",
                "Le Bénéficiaire"
              )}
            </div>
          `;
        } else if (
          id === "attestationlocation"
        ) {
          const type =
            formData.attestationtype ||
            "Attestation";

          const isHebergement =
            type
              .toLowerCase()
              .includes("hébergement");

          const isPaiement =
            type
              .toLowerCase()
              .includes("paiement");

          let body = "";

          if (isHebergement) {
            body = `
              J’atteste sur l’honneur que
              <strong>
                ${escapeHtml(
                  formData.beneficiairenom
                )}
              </strong>
              est hébergé à mon domicile situé à
              <strong>
                ${escapeHtml(
                  formData.declarantadresse
                )}
              </strong>
              depuis le
              <strong>
                ${escapeHtml(
                  formData.datedebut
                )}
              </strong>.
            `;
          } else if (isPaiement) {
            body = `
              J’atteste que
              <strong>
                ${escapeHtml(
                  formData.beneficiairenom
                )}
              </strong>
              est concerné par une relation locative
              avec moi depuis le
              <strong>
                ${escapeHtml(
                  formData.datedebut
                )}
              </strong>
              et que la présente attestation est
              établie à titre de justificatif.
            `;
          } else {
            body = `
              J’atteste que
              <strong>
                ${escapeHtml(
                  formData.beneficiairenom
                )}
              </strong>
              occupe ou loue le logement situé à
              <strong>
                ${escapeHtml(
                  formData.declarantadresse
                )}
              </strong>
              depuis le
              <strong>
                ${escapeHtml(
                  formData.datedebut
                )}
              </strong>.
            `;
          }

          content = `
            <div style="${documentStyles}">
              ${docHeader(
                "Attestation locative",
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
                  ${escapeHtml(type)}
                </div>

                <div style="
                  width:80px;
                  height:3px;
                  background:#4361EE;
                  margin:10px auto;
                "></div>
              </div>

              <p>
                Je soussigné
                <strong>
                  ${escapeHtml(
                    formData.declarantnom
                  )}
                </strong>,
                demeurant à
                <strong>
                  ${escapeHtml(
                    formData.declarantadresse
                  )}
                </strong>,
                ${body}
              </p>

              <p style="margin-top:22px;">
                La présente attestation est établie à
                la demande de l’intéressé pour servir
                et valoir ce que de droit.
              </p>

              <div style="
                margin-top:50px;
                text-align:right;
              ">
                Fait le ${todayFrench()}

                <div style="margin-top:35px;">
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
        } else if (id === "recuvente") {
          const montant = Number(
            formData.montantrecu || 0
          );

          content = `
            <div style="${documentStyles}">
              ${docHeader(
                "Reçu de vente",
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
                      formData.vendeurnom
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
                      formData.acheteurnom
                    )}
                  </strong>
                </div>
              </div>

              ${sectionTitle(
                "Articles ou prestations"
              )}

              <div style="
                border:1px solid #D1D5DB;
                padding:15px;
                white-space:pre-wrap;
                background:#F9FAFB;
              ">
                ${escapeHtml(
                  formData.articlesliste
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
                  ${formatNumber(montant)} FCFA
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
        } else if (id === "facturesimple") {
          const items = parseItems(
            formData.objetsfactures || ""
          );

          const total = items.reduce(
            (sum, item) => sum + item.total,
            0
          );

          content = `
            <div style="${documentStyles}">
              ${docHeader(
                "Facture",
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
                      formData.vendeurnom
                    )}
                  </strong>

                  <div style="
                    font-size:10px;
                    margin-top:4px;
                  ">
                    ${escapeHtml(
                      formData.vendeurphone
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
                      formData.clientnom
                    )}
                  </strong>
                </div>
              </div>

              ${sectionTitle(
                "Détail de la facture"
              )}

              ${commercialTable(items, total)}

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
                  Signature et cachet
                </span>
              </div>
            </div>
          `;
        } else if (
          id === "factureproforma"
        ) {
          const items = parseItems(
            formData.objetsfactures || ""
          );

          const total = items.reduce(
            (sum, item) => sum + item.total,
            0
          );

          content = `
            <div style="${documentStyles}">
              ${docHeader(
                "Facture proforma",
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
                      formData.vendeurnom
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
                      formData.clientnom
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
                <strong>
                  Validité de l’offre :
                </strong>
                ${escapeHtml(
                  formData.validite ||
                    "15 jours"
                )}
              </div>

              ${commercialTable(items, total)}

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
                  Signature et cachet
                </span>
              </div>
            </div>
          `;
        } else if (id === "boncommande") {
          const items = parseItems(
            formData.produitscommandes || ""
          );

          content = `
            <div style="${documentStyles}">
              ${docHeader(
                "Bon de commande",
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
                      formData.acheteurnom
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
                      formData.fournisseurnom
                    )}
                  </strong>
                </div>
              </div>

              ${sectionTitle(
                "Lieu de livraison"
              )}

              <div style="
                padding:12px;
                background:#F9FAFB;
                border:1px solid #E5E7EB;
              ">
                ${escapeHtml(
                  formData.livraisonadresse
                )}
              </div>

              ${sectionTitle(
                "Produits commandés"
              )}

              ${
                items.length
                  ? commercialTable(items)
                  : `
                    <div style="
                      border:1px solid #D1D5DB;
                      padding:15px;
                      white-space:pre-wrap;
                    ">
                      ${escapeHtml(
                        formData.produitscommandes
                      )}
                    </div>
                  `
              }

              ${signatureBlock(
                "L’Acheteur",
                "Confirmation fournisseur"
              )}
            </div>
          `;
        } else if (id === "cv") {
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
                      formData.name
                    )}
                  </div>

                  <div style="
                    font-size:14px;
                    color:#4361EE;
                    font-weight:700;
                    margin-top:5px;
                  ">
                    ${escapeHtml(
                      formData.jobTitle
                    )}
                  </div>
                </div>

                <div style="
                  text-align:right;
                  font-size:10px;
                  color:#4B5563;
                ">
                  <strong>Téléphone</strong>

                  <div>
                    ${escapeHtml(
                      formData.phone
                    )}
                  </div>
                </div>
              </div>

              ${sectionTitle(
                "Profil professionnel"
              )}

              <p style="color:#374151;">
                Professionnel orienté vers le poste de
                <strong>
                  ${escapeHtml(
                    formData.jobTitle
                  )}
                </strong>.
                Le parcours présenté ci-dessous met en
                évidence les expériences et compétences
                communiquées par le candidat.
              </p>

              ${sectionTitle("Expériences")}

              <div style="
                white-space:pre-wrap;
                border:1px solid #E5E7EB;
                padding:12px;
                background:#F9FAFB;
              ">
                ${escapeHtml(
                  formData.experience
                )}
              </div>

              ${sectionTitle(
                "Formations et diplômes"
              )}

              <div style="
                white-space:pre-wrap;
                border:1px solid #E5E7EB;
                padding:12px;
                background:#F9FAFB;
              ">
                ${escapeHtml(
                  formData.education
                )}
              </div>
            </div>
          `;
        } else if (id === "lettre") {
          content = `
            <div style="${documentStyles}">
              ${docHeader(
                "Lettre de motivation",
                reference
              )}

              <div style="
                text-align:right;
                margin-bottom:35px;
              ">
                ${escapeHtml(
                  formData.address
                )}
                <br />
                ${todayFrench()}
              </div>

              <p>
                À l’attention de
                <strong>
                  ${escapeHtml(
                    formData.recipient
                  )}
                </strong>
              </p>

              <p>
                <strong>
                  Objet : Candidature au poste de
                  ${escapeHtml(
                    formData.jobTitle
                  )}
                </strong>
              </p>

              <p>
                Madame, Monsieur,
              </p>

              <p>
                Je vous adresse ma candidature pour le
                poste de
                <strong>
                  ${escapeHtml(
                    formData.jobTitle
                  )}
                </strong>
                au sein de votre entreprise.
              </p>

              <p style="white-space:pre-wrap;">
                ${escapeHtml(
                  formData.experience
                )}
              </p>

              <p style="white-space:pre-wrap;">
                ${escapeHtml(
                  formData.motivation
                )}
              </p>

              <p>
                Je serais heureux de pouvoir vous
                rencontrer afin de vous présenter plus
                précisément ma motivation et l’intérêt de
                ma candidature.
              </p>

              <p>
                Dans l’attente de votre réponse, je vous
                prie d’agréer, Madame, Monsieur,
                l’expression de mes salutations
                distinguées.
              </p>

              <div style="
                margin-top:50px;
                text-align:right;
              ">
                <strong>
                  ${escapeHtml(
                    formData.name
                  )}
                </strong>

                <div>
                  ${escapeHtml(
                    formData.phone
                  )}
                </div>
              </div>
            </div>
          `;
        } else {
          content = `
            <div style="${documentStyles}">
              ${docHeader(
                selectedDoc.title,
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
                    selectedDoc.title
                  )}
                </div>
              </div>

              ${selectedDoc.fields
                .map(
                  (field) => `
                    <div style="
                      margin-bottom:12px;
                      padding:10px;
                      border-bottom:1px solid #E5E7EB;
                    ">
                      <strong>
                        ${escapeHtml(
                          field.label
                        )} :
                      </strong>

                      <span style="
                        white-space:pre-wrap;
                      ">
                        ${escapeHtml(
                          formData[field.id] ||
                            "Non renseigné"
                        )}
                      </span>
                    </div>
                  `
                )
                .join("")}
            </div>
          `;
        }

        setGeneratedBody(content);
        setStep("review");
      } catch (error) {
        console.error(
          "Erreur lors de la génération :",
          error
        );

        alert(
          "Impossible de générer le document."
        );
      } finally {
        setIsGeneratingContent(false);
      }
    };

  const handleSubmitPayment =
    async (): Promise<void> => {
      if (!selectedDoc) {
        return;
      }

      if (!senderPhoneInput.trim()) {
        alert(
          "Veuillez renseigner le numéro utilisé pour le paiement."
        );
        return;
      }

      if (!transactionRefInput.trim()) {
        alert(
          "Veuillez renseigner la référence ou le TxID du paiement."
        );
        return;
      }

      setIsSubmittingPayment(true);

      try {
        const { data, error } =
          await supabase
            .from("orders")
            .insert({
              documentid: selectedDoc.id,
              customername:
                formData.nom ||
                formData.fullName ||
                "Client",
              customerphone:
                senderPhoneInput,
              amount:
                selectedDoc.priceNumeric,
              paymentmethod: "om_manual",
              senderphone:
                senderPhoneInput,
              transactionref:
                transactionRefInput,
              status: "pending_verification",
              doctitle: selectedDoc.title,
              form formData,
              generatedbody: generatedBody,
            })
            .select()
            .single();

        if (error) {
          throw error;
        }

        const newOrder: Order = {
          id: data.id,
          docTitle:
            data.doctitle ||
            selectedDoc.title,
          price: `${formatNumber(
            data.amount ||
              selectedDoc.priceNumeric
          )} FCFA`,
          clientPhone:
            data.senderphone ||
            senderPhoneInput,
          senderPhone:
            data.senderphone ||
            senderPhoneInput,
          transactionRef:
            data.transactionref ||
            transactionRefInput,
          status: "PENDING",
          createdAt: new Date()
            .toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          formData:
            data.formdata || formData,
          generatedBody:
            data.generatedbody ||
            generatedBody,
        };

        setCurrentOrder(newOrder);
        setOrders((previous) => [
          newOrder,
          ...previous,
        ]);
        setStep("pending");
      } catch (error: any) {
        console.error(
          "Erreur lors de la soumission du paiement :",
          error
        );

        alert(
          error?.message ||
            "Impossible d’enregistrer le paiement."
        );
      } finally {
        setIsSubmittingPayment(false);
      }
    };

  const handleAdminLogin = (
    event: React.FormEvent
  ): void => {
    event.preventDefault();

    if (adminPinInput === "1234") {
      setAdminPinError(false);
      setStep("admindashboard");
    } else {
      setAdminPinError(true);
    }
  };

  const handleApproveOrder = async (
    orderId: string
  ): Promise<void> => {
    try {
      const { error } =
        await supabase
          .from("orders")
          .update({
            status: "completed",
          })
          .eq("id", orderId);

      if (error) {
        console.error(
          "Erreur Supabase lors de la validation :",
          error
        );

        alert(
          "Erreur lors de la validation sur Supabase."
        );

        return;
      }

      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: "APPROVED",
              }
            : order
        )
      );

      setCurrentOrder((previous) =>
        previous?.id === orderId
          ? {
              ...previous,
              status: "APPROVED",
            }
          : previous
      );

      await fetchSupabaseOrders();
    } catch (error) {
      console.error(
        "Erreur lors de la validation :",
        error
      );

      alert(
        "Une erreur est survenue pendant la validation."
      );
    }
  };

  const generatePDF = async (): Promise<void> => {
    const sourceHtml =
      currentOrder?.generatedBody ||
      generatedBody;

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

    let temporaryElement:
      | HTMLDivElement
      | null = null;

    try {
      let element = documentRef.current;

      if (!element) {
        temporaryElement =
          document.createElement("div");

        temporaryElement.style.position =
          "fixed";
        temporaryElement.style.left =
          "-10000px";
        temporaryElement.style.top = "0";
        temporaryElement.style.width =
          "794px";
        temporaryElement.style.minHeight =
          "1123px";
        temporaryElement.style.backgroundColor =
          "#ffffff";
        temporaryElement.style.color =
          "#000000";
        temporaryElement.style.boxSizing =
          "border-box";
        temporaryElement.style.overflow =
          "visible";
        temporaryElement.innerHTML =
          sourceHtml;

        document.body.appendChild(
          temporaryElement
        );

        element = temporaryElement;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });

      const canvas = await html2canvas(
        element,
        {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth:
            element.scrollWidth || 794,
          windowHeight:
            element.scrollHeight || 1123,
        }
      );

      const pdf = new jsPDF(
        "p",
        "mm",
        "a4"
      );

      const pageWidth = 210;
      const pageHeight = 297;
      const marginX = 8;
      const marginY = 8;
      const usableWidth =
        pageWidth - marginX * 2;
      const usableHeight =
        pageHeight - marginY * 2;

      const pxPerMm =
        canvas.width / usableWidth;

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

        const pageCanvas =
          document.createElement("canvas");

        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const context =
          pageCanvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Impossible de préparer la page PDF."
          );
        }

        context.fillStyle = "#ffffff";

        context.fillRect(
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

        context.drawImage(
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

        const image =
          pageCanvas.toDataURL(
            "image/png",
            1
          );

        const imageHeight =
          sliceHeight / pxPerMm;

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
        .replace(
          /[^a-zA-Z0-9À-ÿ_-]/g,
          "-"
        )
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.85rem 0.9rem",
    borderRadius: 10,
    border: "1px solid #3A506B",
    backgroundColor: "#0B132B",
    color: "#FFFFFF",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
    transition:
      "border-color .2s ease, box-shadow .2s ease",
  };

  const primaryButtonStyle:
    React.CSSProperties = {
      width: "100%",
      padding: "1rem",
      borderRadius: 8,
      border: "none",
      backgroundColor: "#4CC9F0",
      color: "#0B132B",
      fontWeight: "bold",
      fontSize: "1rem",
      cursor: "pointer",
    };

  const renderForm = (): React.ReactNode => {
    if (!selectedDoc) {
      return null;
    }

    const fields = selectedDoc.fields.filter(
      (field) => field.step === formStep
    );

    const maxStep = Math.max(
      ...selectedDoc.fields.map(
        (field) => field.step
      )
    );

    const isLastStep =
      formStep >= maxStep;

    const canContinue = fields
      .filter((field) => field.required)
      .every(
        (field) =>
          String(
            formData[field.id] || ""
          ).trim().length > 0
      );

    return (
      <div
        style={{
          maxWidth: 760,
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            background: "transparent",
            border: "none",
            color: "#4CC9F0",
            cursor: "pointer",
            marginBottom: "1.5rem",
          }}
        >
          ← Retour
        </button>

        <h2
          style={{
            fontSize: "1.6rem",
            marginBottom: ".5rem",
          }}
        >
          {selectedDoc.title}
        </h2>

        <p
          style={{
            color: "#9CA3AF",
            marginBottom: "1.5rem",
          }}
        >
          Remplissez les informations ci-dessous
          pour votre document.
        </p>

        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: "1.5rem",
          }}
        >
          {Array.from(
            { length: maxStep },
            (_, index) => index + 1
          ).map((number) => (
            <div
              key={number}
              style={{
                height: 5,
                flex: 1,
                borderRadius: 4,
                backgroundColor:
                  number <= formStep
                    ? "#4CC9F0"
                    : "#1C2541",
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          {fields.map((field) => (
            <label
              key={field.id}
              style={{
                display: "grid",
                gap: ".45rem",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: ".9rem",
                }}
              >
                {field.label}
                {field.required ? " *" : ""}
              </span>

              {field.type === "textarea" ? (
                <textarea
                  value={
                    formData[field.id] || ""
                  }
                  onChange={(event) =>
                    handleInputChange(
                      field.id,
                      event.target.value
                    )
                  }
                  placeholder={field.placeholder}
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              ) : field.type === "select" ? (
                <select
                  value={
                    formData[field.id] || ""
                  }
                  onChange={(event) =>
                    handleInputChange(
                      field.id,
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Sélectionnez une option
                  </option>

                  {field.options?.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={
                    formData[field.id] || ""
                  }
                  onChange={(event) =>
                    handleInputChange(
                      field.id,
                      event.target.value
                    )
                  }
                  placeholder={field.placeholder}
                  style={inputStyle}
                />
              )}
            </label>
          ))}
        </div>

        <button
          type="button"
          disabled={!canContinue}
          onClick={() => {
            if (!canContinue) {
              return;
            }

            if (isLastStep) {
              setStep("review");
            } else {
              setFormStep(
                (previous) => previous + 1
              );
            }
          }}
          style={{
            ...primaryButtonStyle,
            marginTop: "1.5rem",
            opacity: canContinue ? 1 : 0.5,
            cursor: canContinue
              ? "pointer"
              : "not-allowed",
          }}
        >
          {isLastStep
            ? "Vérifier les informations"
            : "Continuer"}
        </button>
      </div>
    );
  };

  const renderReview = (): React.ReactNode => {
    if (!selectedDoc) {
      return null;
    }

    return (
      <div
        style={{
          maxWidth: 760,
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            background: "transparent",
            border: "none",
            color: "#4CC9F0",
            cursor: "pointer",
            marginBottom: "1.5rem",
          }}
        >
          ← Modifier
        </button>

        <h2
          style={{
            fontSize: "1.5rem",
            marginBottom: ".5rem",
          }}
        >
          Récapitulatif de votre saisie
        </h2>

        <p
          style={{
            color: "#9CA3AF",
            marginBottom: "1.5rem",
          }}
        >
          Vérifiez attentivement les informations
          avant de générer votre document.
        </p>

        <div
          style={{
            backgroundColor: "#1C2541",
            border: "1px solid #3A506B",
            borderRadius: 10,
            padding: "1rem",
          }}
        >
          {selectedDoc.fields.map((field) => (
            <div
              key={field.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1fr) minmax(0, 1.4fr)",
                gap: "1rem",
                padding: ".75rem 0",
                borderBottom:
                  "1px solid #3A506B",
              }}
            >
              <strong
                style={{
                  fontSize: ".85rem",
                }}
              >
                {field.label}
              </strong>

              <span
                style={{
                  color: "#D1D5DB",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {formData[field.id] ||
                  "Non renseigné"}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleProcessDocument}
          disabled={isGeneratingContent}
          style={{
            ...primaryButtonStyle,
            marginTop: "1.5rem",
            opacity: isGeneratingContent
              ? 0.7
              : 1,
          }}
        >
          {isGeneratingContent
            ? "Génération en cours..."
            : "Générer mon document"}
        </button>
      </div>
    );
  };

  const renderPreview = (): React.ReactNode => {
    if (!generatedBody) {
      return null;
    }

    return (
      <div
        style={{
          maxWidth: 850,
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            background: "transparent",
            border: "none",
            color: "#4CC9F0",
            cursor: "pointer",
            marginBottom: "1.5rem",
          }}
        >
          ← Retour
        </button>

        <h2
          style={{
            fontSize: "1.5rem",
            marginBottom: ".5rem",
          }}
        >
          📄 Aperçu de votre document
        </h2>

        <p
          style={{
            color: "#9CA3AF",
            marginBottom: "1.5rem",
          }}
        >
          Voici le rendu professionnel de votre
          document. Vérifiez les informations avant
          le paiement.
        </p>

        <div
          ref={documentRef}
          style={{
            backgroundColor: "#FFFFFF",
            color: "#111827",
            borderRadius: 8,
            padding: "28px",
            overflowX: "auto",
          }}
          dangerouslySetInnerHTML={{
            __html: generatedBody,
          }}
        />

        <button
          type="button"
          onClick={() => setStep("payment")}
          style={{
            ...primaryButtonStyle,
            marginTop: "1.5rem",
          }}
        >
          Continuer vers le paiement
        </button>
      </div>
    );
  };

  const renderPayment = (): React.ReactNode => {
    if (!selectedDoc) {
      return null;
    }

    return (
      <div
        style={{
          maxWidth: 650,
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            background: "transparent",
            border: "none",
            color: "#4CC9F0",
            cursor: "pointer",
            marginBottom: "1.5rem",
          }}
        >
          ← Retour
        </button>

        <h2
          style={{
            fontSize: "1.5rem",
            marginBottom: ".5rem",
          }}
        >
          💳 Paiement Mobile Money
        </h2>

        <p
          style={{
            color: "#D1D5DB",
            fontSize: "1.1rem",
          }}
        >
          Montant à régler :{" "}
          <strong>{selectedDoc.price}</strong>
        </p>

        <div
          style={{
            backgroundColor: "#1C2541",
            border: "1px solid #3A506B",
            borderRadius: 10,
            padding: "1rem",
            margin: "1.5rem 0",
            lineHeight: 1.7,
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Consignes de paiement :
          </h3>

          <ol
            style={{
              paddingLeft: "1.2rem",
              marginBottom: 0,
            }}
          >
            <li>
              Effectuez un transfert Orange Money
              ou MTN Mobile Money au :
              <strong> 6XX XX XX XX</strong>.
            </li>

            <li>
              Inscrivez ci-dessous le numéro
              utilisé et le TxID ou la référence
              reçu par SMS.
            </li>

            <li>
              Cliquez sur « Valider le paiement ».
            </li>
          </ol>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          <label
            style={{
              display: "grid",
              gap: ".45rem",
            }}
          >
            <span>
              Numéro utilisé pour le paiement
            </span>

            <input
              value={senderPhoneInput}
              onChange={(event) =>
                setSenderPhoneInput(
                  event.target.value
                )
              }
              placeholder="Ex : 6XX XX XX XX"
              style={inputStyle}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: ".45rem",
            }}
          >
            <span>
              TxID ou référence du paiement
            </span>

            <input
              value={transactionRefInput}
              onChange={(event) =>
                setTransactionRefInput(
                  event.target.value
                )
              }
              placeholder="Référence reçue par SMS"
              style={inputStyle}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleSubmitPayment}
          disabled={isSubmittingPayment}
          style={{
            ...primaryButtonStyle,
            marginTop: "1.5rem",
            opacity: isSubmittingPayment
              ? 0.7
              : 1,
          }}
        >
          {isSubmittingPayment
            ? "Enregistrement..."
            : "Valider le paiement"}
        </button>
      </div>
    );
  };

  const renderPending = (): React.ReactNode => {
    if (!currentOrder) {
      return null;
    }

    return (
      <div
        style={{
          maxWidth: 650,
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            marginBottom: ".75rem",
          }}
        >
          Paiement en cours de vérification
        </h2>

        <p
          style={{
            color: "#9CA3AF",
            lineHeight: 1.6,
          }}
        >
          Nous vérifions la réception de votre
          paiement Mobile Money.
          <br />
          Dès confirmation, votre document PDF
          officiel sera disponible.
        </p>

        <div
          style={{
            backgroundColor: "#0B132B",
            padding: "1rem",
            borderRadius: 8,
            border: "1px solid #3A506B",
            textAlign: "left",
            fontSize: ".85rem",
            marginTop: "1.5rem",
            lineHeight: 1.7,
          }}
        >
          <div>
            <strong>Commande n° :</strong>{" "}
            {currentOrder.id}
          </div>

          <div>
            <strong>Document :</strong>{" "}
            {currentOrder.docTitle}
          </div>

          <div>
            <strong>Montant :</strong>{" "}
            {currentOrder.price}
          </div>

          <div>
            <strong>Référence :</strong>{" "}
            {currentOrder.transactionRef}
          </div>
        </div>
      </div>
    );
  };

  const renderSuccess = (): React.ReactNode => {
    if (!currentOrder) {
      return null;
    }

    return (
      <div
        style={{
          maxWidth: 650,
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            marginBottom: ".75rem",
            color: "#10B981",
          }}
        >
          Paiement approuvé !
        </h2>

        <p
          style={{
            color: "#D1D5DB",
            lineHeight: 1.6,
          }}
        >
          Votre document est prêt et validé.
          Cliquez sur le bouton ci-dessous pour
          télécharger votre PDF.
        </p>

        {currentOrder.status ===
          "APPROVED" && (
          <button
            type="button"
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            style={{
              ...primaryButtonStyle,
              marginTop: "1.5rem",
              opacity: isGeneratingPDF
                ? 0.7
                : 1,
              cursor: isGeneratingPDF
                ? "not-allowed"
                : "pointer",
            }}
          >
            {isGeneratingPDF
              ? "Génération du PDF..."
              : "Télécharger mon PDF"}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setCurrentOrder(null);
            setSelectedDoc(null);
            setGeneratedBody("");
            setFormData({});
            setStep("home");
          }}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: 8,
            border:
              "1px solid #3A506B",
            backgroundColor: "transparent",
            color: "#FFFFFF",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            marginTop: "1rem",
          }}
        >
          Retour à l’accueil
        </button>
      </div>
    );
  };

  const renderAdminLogin =
    (): React.ReactNode => {
      return (
        <div
          style={{
            maxWidth: 450,
            width: "100%",
            margin: "0 auto",
            padding: "2rem 1rem",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            style={{
              background: "transparent",
              border: "none",
              color: "#4CC9F0",
              cursor: "pointer",
              marginBottom: "1.5rem",
            }}
          >
            ← Retour
          </button>

          <h2
            style={{
              fontSize: "1.5rem",
              marginBottom: ".5rem",
            }}
          >
            🔒 Espace Administration
          </h2>

          <p
            style={{
              color: "#9CA3AF",
              marginBottom: "1.5rem",
            }}
          >
            Entrez votre code administrateur.
          </p>

          <form onSubmit={handleAdminLogin}>
            <label
              style={{
                display: "grid",
                gap: ".45rem",
              }}
            >
              <span>Code PIN</span>

              <input
                type="password"
                value={adminPinInput}
                onChange={(event) =>
                  setAdminPinInput(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </label>

            {adminPinError && (
              <p
                style={{
                  color: "#F87171",
                  fontSize: ".85rem",
                }}
              >
                Code administrateur incorrect.
              </p>
            )}

            <button
              type="submit"
              style={{
                ...primaryButtonStyle,
                marginTop: "1rem",
              }}
            >
              Se connecter
            </button>
          </form>
        </div>
      );
    };

  const renderAdminDashboard =
    (): React.ReactNode => {
      return (
        <div
          style={{
            maxWidth: 900,
            width: "100%",
            margin: "0 auto",
            padding: "2rem 1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  margin: 0,
                }}
              >
                📊 Tableau de bord Admin
              </h2>

              <p
                style={{
                  color: "#9CA3AF",
                  marginBottom: 0,
                }}
              >
                Gérez les commandes et validez les
                paiements.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep("home")}
              style={{
                border:
                  "1px solid #3A506B",
                background: "transparent",
                color: "#FFFFFF",
                padding: ".65rem .8rem",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Quitter
            </button>
          </div>

          {orders.length === 0 ? (
            <div
              style={{
                backgroundColor: "#1C2541",
                border: "1px solid #3A506B",
                borderRadius: 8,
                padding: "1rem",
                color: "#9CA3AF",
              }}
            >
              Aucune commande enregistrée.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: ".75rem",
              }}
            >
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: "#1C2541",
                    border: "1px solid #3A506B",
                    borderRadius: 8,
                    padding: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "flex-start",
                      gap: ".75rem",
                      marginBottom: ".75rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: ".95rem",
                        fontWeight: "bold",
                        color: "#4CC9F0",
                      }}
                    >
                      {order.docTitle}
                    </span>

                    <span
                      style={{
                        fontSize: ".7rem",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: "bold",
                        backgroundColor:
                          order.status ===
                          "APPROVED"
                            ? "#10B981"
                            : "#F59E0B",
                        color: "#FFFFFF",
                      }}
                    >
                      {order.status ===
                      "APPROVED"
                        ? "APPROUVÉ"
                        : "EN ATTENTE"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: ".85rem",
                      color: "#D1D5DB",
                      lineHeight: 1.7,
                    }}
                  >
                    <div>
                      <strong>Client :</strong>{" "}
                      {order.clientPhone}
                    </div>

                    <div>
                      <strong>Montant :</strong>{" "}
                      {order.price}
                    </div>

                    <div>
                      <strong>Réf. SMS :</strong>{" "}
                      {order.transactionRef ||
                        "N/A"}
                    </div>

                    <div>
                      <strong>Heure :</strong>{" "}
                      {order.createdAt}
                    </div>
                  </div>

                  {order.status ===
                    "PENDING" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleApproveOrder(
                          order.id
                        )
                      }
                      style={{
                        marginTop: ".8rem",
                        width: "100%",
                        padding: ".7rem",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor:
                          "#10B981",
                        color: "#FFFFFF",
                        fontWeight: "bold",
                        fontSize: ".85rem",
                        cursor: "pointer",
                      }}
                    >
                      Approuver la commande
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

  const renderHome = (): React.ReactNode => {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "1.4rem",
                fontWeight: 900,
                letterSpacing: 1,
              }}
            >
              DOCEXPRESS
            </div>

            <div
              style={{
                fontSize: ".7rem",
                color: "#9CA3AF",
                letterSpacing: 1,
              }}
            >
              GÉNÉRATION DOCUMENTAIRE
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setStep("adminlogin")
            }
            style={{
              border:
                "1px solid #3A506B",
              background: "transparent",
              color: "#D1D5DB",
              padding: ".55rem .7rem",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: ".8rem",
            }}
          >
            Administration
          </button>
        </div>

        <HeroText />

        <div
          style={{
            marginTop: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(1.8rem, 5vw, 3rem)",
              marginBottom: ".6rem",
            }}
          >
            Créez vos documents officiels
            simplement
          </h1>

          <p
            style={{
              maxWidth: 650,
              color: "#9CA3AF",
              lineHeight: 1.6,
            }}
          >
            Générez rapidement des documents
            administratifs, commerciaux et
            professionnels adaptés à vos besoins.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {sortedDocuments.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() =>
                handleSelectDoc(doc)
              }
              style={{
                textAlign: "left",
                backgroundColor: "#1C2541",
                border: "1px solid #3A506B",
                borderRadius: 10,
                padding: "1rem",
                color: "#FFFFFF",
                cursor: "pointer",
                minHeight: 190,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: ".5rem",
                  marginBottom: ".8rem",
                }}
              >
                <span
                  style={{
                    fontSize: ".7rem",
                    color: "#4CC9F0",
                    fontWeight: 800,
                  }}
                >
                  {doc.category}
                </span>

                {doc.badge && (
                  <span
                    style={{
                      fontSize: ".65rem",
                      backgroundColor: "#F72585",
                      color: "#FFFFFF",
                      borderRadius: 4,
                      padding: "2px 5px",
                      fontWeight: 800,
                    }}
                  >
                    {doc.badge}
                  </span>
                )}
              </div>

              <h3
                style={{
                  margin: "0 0 .6rem",
                  fontSize: "1.05rem",
                }}
              >
                {doc.title}
              </h3>

              <p
                style={{
                  color: "#D1D5DB",
                  fontSize: ".85rem",
                  lineHeight: 1.5,
                  minHeight: 50,
                }}
              >
                {doc.desc}
              </p>

              <strong
                style={{
                  color: "#4CC9F0",
                  fontSize: "1rem",
                }}
              >
                {doc.price}
              </strong>
            </button>
          ))}
        </div>

        <EditorialList />
      </div>
    );
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div
      className="docexpress-app"
      style={{
        backgroundColor: "#0B132B",
        color: "#FFFFFF",
        minHeight: "100vh",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #0B132B;
        }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        button:focus-visible,
        input:focus-visible,
        textarea:focus-visible,
        select:focus-visible {
          outline: 2px solid #4CC9F0;
          outline-offset: 2px;
        }
      `}</style>

      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          {step === "home" && renderHome()}
          {step === "form" && renderForm()}
          {step === "review" && renderReview()}
          {step === "preview" && renderPreview()}
          {step === "payment" && renderPayment()}
          {step === "pending" && renderPending()}
          {step === "success" && renderSuccess()}
          {step === "adminlogin" &&
            renderAdminLogin()}
          {step === "admindashboard" &&
            renderAdminDashboard()}
        </AnimatePresence>
      </main>

      <footer
        style={{
          padding: "1.5rem",
          textAlign: "center",
          borderTop: "1px solid #1C2541",
          marginTop: "2rem",
          fontSize: ".8rem",
          color: "#9CA3AF",
        }}
      >
        <p style={{ margin: 0 }}>
          © 2026 DocExpress. Tous droits réservés.
        </p>

        <p
          style={{
            fontSize: ".65rem",
            color: "#4B5563",
            margin: ".3rem 0 0",
          }}
        >
          Développé avec soin par Désir Atangana
          Atangana
        </p>

        <p
          style={{
            margin: ".3rem 0 0",
            fontSize: ".75rem",
          }}
        >
          Service sécurisé de génération
          administrative.
        </p>
      </footer>
    </div>
  );
}
