export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'select';
  placeholder?: string;
  options?: string[];
  step: number;
  required?: boolean;
}

export interface DocumentConfig {
  id: string;
  title: string;
  category: string;
  price: string;
  badge?: string;
  desc: string;
  type: 'REDACTION_IA' | 'STRUCTURATION_ADMIN' | 'CALCUL_STRUCTURE';
  fields: FormField[];
}

export const DOCUMENTS_CONFIG: Record<string, DocumentConfig> = {
  // 1. CONTRAT DE BAIL D'HABITATION
  contrat_bail: {
    id: 'contrat_bail',
    title: 'Contrat de bail d’habitation',
    category: 'IMMOBILIER',
    price: '1 000 FCFA',
    desc: 'Bail d’habitation complet sécurisé avec clauses d’occupation et caution.',
    type: 'STRUCTURATION_ADMIN',
    fields: [
      // Bailleur
      { id: 'bailleur_nom', label: 'Nom du bailleur', type: 'text', placeholder: 'Ex: MBARGA', step: 1, required: true },
      { id: 'bailleur_prenom', label: 'Prénom(s) du bailleur', type: 'text', placeholder: 'Ex: Paul', step: 1, required: true },
      { id: 'bailleur_phone', label: 'Téléphone bailleur', type: 'text', placeholder: 'Ex: 6XX XX XX XX', step: 1, required: true },
      { id: 'bailleur_adresse', label: 'Adresse bailleur', type: 'text', placeholder: 'Ex: Yaoundé', step: 1 },
      { id: 'bailleur_piece_type', label: 'Type de pièce', type: 'select', options: ['CNI', 'Passeport', 'Carte de séjour'], step: 1 },
      { id: 'bailleur_piece_num', label: 'Numéro de la pièce', type: 'text', step: 1 },
      // Locataire
      { id: 'locataire_nom', label: 'Nom du locataire', type: 'text', placeholder: 'Ex: KOUAM', step: 2, required: true },
      { id: 'locataire_prenom', label: 'Prénom(s) du locataire', type: 'text', placeholder: 'Ex: Jean', step: 2, required: true },
      { id: 'locataire_phone', label: 'Téléphone locataire', type: 'text', step: 2, required: true },
      { id: 'locataire_profession', label: 'Profession du locataire', type: 'text', step: 2 },
      // Logement
      { id: 'logement_type', label: 'Type de logement', type: 'select', options: ['Studio', 'Appartement', 'Chambre', 'Maison villa'], step: 3, required: true },
      { id: 'logement_ville', label: 'Ville', type: 'text', placeholder: 'Ex: Yaoundé', step: 3, required: true },
      { id: 'logement_quartier', label: 'Quartier / Adresse', type: 'text', placeholder: 'Ex: Bastos', step: 3, required: true },
      { id: 'logement_pieces', label: 'Nombre de pièces', type: 'number', placeholder: 'Ex: 3', step: 3 },
      // Conditions financières
      { id: 'loyer_montant', label: 'Loyer mensuel (FCFA)', type: 'number', placeholder: 'Ex: 75000', step: 3, required: true },
      { id: 'caution_montant', label: 'Montant de la caution (FCFA)', type: 'number', placeholder: 'Ex: 150000', step: 3 },
      { id: 'date_debut', label: 'Date de début du bail', type: 'text', placeholder: 'JJ/MM/AAAA', step: 3, required: true },
      { id: 'clauses_particulieres', label: 'Clauses particulières (optionnel)', type: 'textarea', placeholder: 'Ex: Animaux non autorisés...', step: 3 }
    ]
  },

  // 2. QUITTANCE DE LOYER
  quittance_loyer: {
    id: 'quittance_loyer',
    title: 'Quittance de loyer',
    category: 'IMMOBILIER',
    price: '500 FCFA',
    desc: 'Attestation officielle de paiement intégral du loyer mensuel.',
    type: 'STRUCTURATION_ADMIN',
    fields: [
      { id: 'bailleur_nom', label: 'Nom complet du bailleur', type: 'text', step: 1, required: true },
      { id: 'bailleur_phone', label: 'Téléphone bailleur', type: 'text', step: 1 },
      { id: 'locataire_nom', label: 'Nom complet du locataire', type: 'text', step: 1, required: true },
      { id: 'logement_adresse', label: 'Adresse du logement', type: 'text', placeholder: 'Ex: Omnisports, Yaoundé', step: 2, required: true },
      { id: 'periode', label: 'Période / Mois concerné', type: 'text', placeholder: 'Ex: Mois de Septembre 2026', step: 2, required: true },
      { id: 'loyer_montant', label: 'Montant du loyer (FCFA)', type: 'number', step: 2, required: true },
      { id: 'charges_montant', label: 'Charges (FCFA)', type: 'number', placeholder: 'Ex: 5000', step: 2 },
      { id: 'paiement_date', label: 'Date de paiement', type: 'text', placeholder: 'JJ/MM/AAAA', step: 3, required: true },
      { id: 'paiement_mode', label: 'Mode de paiement', type: 'select', options: ['Espèces', 'Orange Money', 'MTN Mobile Money', 'Virement bancaire'], step: 3, required: true }
    ]
  },

  // 3. REÇU DE PAIEMENT DE LOYER
  recu_loyer: {
    id: 'recu_loyer',
    title: 'Reçu de paiement de loyer',
    category: 'IMMOBILIER',
    price: '500 FCFA',
    desc: 'Preuve de paiement partiel ou d’acompte sur le loyer.',
    type: 'STRUCTURATION_ADMIN',
    fields: [
      { id: 'receveur_nom', label: 'Nom du bénéficiaire (Bailleur)', type: 'text', step: 1, required: true },
      { id: 'payeur_nom', label: 'Nom du payeur (Locataire)', type: 'text', step: 1, required: true },
      { id: 'logement_adresse', label: 'Adresse du logement', type: 'text', step: 2, required: true },
      { id: 'montant', label: 'Montant perçu (FCFA)', type: 'number', step: 2, required: true },
      { id: 'motif', label: 'Motif du paiement', type: 'text', placeholder: 'Ex: Acompte loyer Septembre', step: 2, required: true },
      { id: 'reste_a_payer', label: 'Reste éventuel à payer (FCFA)', type: 'number', placeholder: 'Ex: 20000', step: 3 },
      { id: 'paiement_mode', label: 'Mode de règlement', type: 'select', options: ['Espèces', 'Mobile Money', 'Virement'], step: 3 }
    ]
  },

  // 4. ATTESTATIONS LIÉES À LA LOCATION
  attestation_location: {
    id: 'attestation_location',
    title: 'Attestations locatives',
    category: 'IMMOBILIER',
    price: '500 FCFA',
    desc: 'Attestations d’hébergement, de location ou de paiement.',
    type: 'REDACTION_IA',
    fields: [
      { id: 'attestation_type', label: 'Type d’attestation', type: 'select', options: ['Attestation d’hébergement', 'Attestation de location', 'Attestation de paiement de loyer'], step: 1, required: true },
      { id: 'declarant_nom', label: 'Nom complet du déclarant', type: 'text', step: 1, required: true },
      { id: 'declarant_adresse', label: 'Adresse du déclarant', type: 'text', step: 1, required: true },
      { id: 'beneficiaire_nom', label: 'Nom complet du bénéficiaire', type: 'text', step: 2, required: true },
      { id: 'date_debut', label: 'Réside / Hébergé depuis le', type: 'text', placeholder: 'JJ/MM/AAAA', step: 2, required: true },
      { id: 'notes_libres', label: 'Informations complémentaires', type: 'textarea', step: 3 }
    ]
  },

  // 5. FACTURE SIMPLE
  facture_simple: {
    id: 'facture_simple',
    title: 'Facture simple',
    category: 'BUSINESS',
    price: '1 000 FCFA',
    desc: 'Facture commerciale claire avec calculs automatiques des totaux.',
    type: 'CALCUL_STRUCTURE',
    fields: [
      { id: 'vendeur_nom', label: 'Nom commercial / Entreprise', type: 'text', step: 1, required: true },
      { id: 'vendeur_phone', label: 'Téléphone / WhatsApp', type: 'text', step: 1, required: true },
      { id: 'vendeur_adresse', label: 'Adresse & Ville', type: 'text', step: 1 },
      { id: 'client_nom', label: 'Nom du client / Entreprise', type: 'text', step: 2, required: true },
      { id: 'client_phone', label: 'Téléphone du client', type: 'text', step: 2 },
      { id: 'objets_factures', label: 'Détail des prestations ou articles', type: 'textarea', placeholder: 'Ex: 2x Conception Logo (15000), 1x Impression Bâche (20000)', step: 3, required: true }
    ]
  },

  // 6. FACTURE PROFORMA
  facture_proforma: {
    id: 'facture_proforma',
    title: 'Facture proforma',
    category: 'BUSINESS',
    price: '1 000 FCFA',
    desc: 'Devis et offre commerciale officielle avant prestation.',
    type: 'CALCUL_STRUCTURE',
    fields: [
      { id: 'vendeur_nom', label: 'Nom de votre entreprise', type: 'text', step: 1, required: true },
      { id: 'client_nom', label: 'Client destinataire', type: 'text', step: 1, required: true },
      { id: 'validite', label: 'Validité de l’offre', type: 'text', placeholder: 'Ex: 15 jours', step: 2, required: true },
      { id: 'delai_livraison', label: 'Délai de livraison', type: 'text', placeholder: 'Ex: 48 heures', step: 2 },
      { id: 'objets_factures', label: 'Services ou produits proposés', type: 'textarea', placeholder: 'Ex: 1x Maintenance informatique (50000)', step: 3, required: true }
    ]
  },

  // 7. REÇU DE VENTE
  recu_vente: {
    id: 'recu_vente',
    title: 'Reçu de vente',
    category: 'BUSINESS',
    price: '500 FCFA',
    desc: 'Justificatif de vente directe de produits ou services.',
    type: 'CALCUL_STRUCTURE',
    fields: [
      { id: 'vendeur_nom', label: 'Nom du vendeur / Boutique', type: 'text', step: 1, required: true },
      { id: 'acheteur_nom', label: 'Nom de l’acheteur', type: 'text', step: 1, required: true },
      { id: 'articles_liste', label: 'Désignation des articles achetés', type: 'textarea', placeholder: 'Ex: 1x Paire de chaussures Nike (35000)', step: 2, required: true },
      { id: 'montant_recu', label: 'Montant encaissé (FCFA)', type: 'number', step: 3, required: true },
      { id: 'paiement_mode', label: 'Mode de règlement', type: 'select', options: ['Espèces', 'Orange Money', 'MTN Mobile Money'], step: 3 }
    ]
  },

  // 8. BON DE COMMANDE
  bon_commande: {
    id: 'bon_commande',
    title: 'Bon de commande',
    category: 'BUSINESS',
    price: '1 000 FCFA',
    desc: 'Ordre d’achat officiel adressé à un fournisseur.',
    type: 'CALCUL_STRUCTURE',
    fields: [
      { id: 'acheteur_nom', label: 'Nom de votre entreprise', type: 'text', step: 1, required: true },
      { id: 'fournisseur_nom', label: 'Nom du fournisseur', type: 'text', step: 1, required: true },
      { id: 'produits_commandes', label: 'Liste des produits commandés', type: 'textarea', placeholder: 'Ex: 50x Rames de papier A4 (2500/u)', step: 2, required: true },
      { id: 'livraison_adresse', label: 'Lieu de livraison souhaité', type: 'text', step: 3, required: true },
      { id: 'conditions_paiement', label: 'Conditions de paiement', type: 'text', placeholder: 'Ex: 50% à la commande, solde à la livraison', step: 3 }
    ]
  },

  // 9. CV PROFESSIONNEL
  cv: {
    id: 'cv',
    title: 'CV professionnel',
    category: 'CARRIÈRE',
    price: '1 000 FCFA',
    badge: 'POPULAIRE',
    desc: 'Rédigé, restructuré et optimisé avec un vocabulaire métier d’impact.',
    type: 'REDACTION_IA',
    fields: [
      { id: 'name', label: 'Nom complet', type: 'text', step: 1, required: true },
      { id: 'phone', label: 'Téléphone & WhatsApp', type: 'text', step: 1, required: true },
      { id: 'email', label: 'Email', type: 'email', step: 1 },
      { id: 'address', label: 'Ville & Quartier', type: 'text', step: 1, required: true },
      { id: 'jobTitle', label: 'Poste visé', type: 'text', placeholder: 'Ex: Commercial terrain', step: 2, required: true },
      { id: 'profile_pitch', label: 'Présentez-vous en quelques mots', type: 'textarea', placeholder: 'Ex: J’ai 3 ans d’expérience dans la vente de services...', step: 2, required: true },
      { id: 'experience', label: 'Vos expériences (Postes, entreprises, tâches)', type: 'textarea', placeholder: 'Ex: Commercial chez Canal+ (2023-2025): vente d’abonnements...', step: 3, required: true },
      { id: 'education', label: 'Formations & Diplômes', type: 'textarea', placeholder: 'Ex: Licence en Marketing, Université de Yaoundé II', step: 3 },
      { id: 'skills', label: 'Compétences clés', type: 'textarea', placeholder: 'Ex: Négociation, prospection, gestion de caisse', step: 3 }
    ]
  },

  // 10. LETTRE DE MOTIVATION
  lettre: {
    id: 'lettre',
    title: 'Lettre de motivation',
    category: 'CARRIÈRE',
    price: '500 FCFA',
    badge: 'POPULAIRE',
    desc: 'Lettre persuasive rédigée sur mesure au format A4 parfait.',
    type: 'REDACTION_IA',
    fields: [
      { id: 'name', label: 'Nom & Prénom', type: 'text', step: 1, required: true },
      { id: 'phone', label: 'Téléphone', type: 'text', step: 1, required: true },
      { id: 'address', label: 'Ville / Adresse', type: 'text', step: 1 },
      { id: 'jobTitle', label: 'Poste recherché', type: 'text', step: 2, required: true },
      { id: 'recipient', label: 'Entreprise / Destinataire', type: 'text', step: 2, required: true },
      { id: 'experience', label: 'Vos points forts & Parcours', type: 'textarea', step: 3, required: true },
      { id: 'motivation', label: 'Pourquoi postulez-vous à ce poste ?', type: 'textarea', step: 3, required: true }
    ]
  },

  // 11. PACK EMPLOI
  pack_emploi: {
    id: 'pack_emploi',
    title: 'Pack Emploi (CV + Lettre)',
    category: 'PACKS',
    price: '1 500 FCFA',
    badge: 'MEILLEURE OFFRE',
    desc: 'Un seul formulaire unique pour obtenir votre CV et votre Lettre sur mesure.',
    type: 'REDACTION_IA',
    fields: [
      { id: 'name', label: 'Nom complet', type: 'text', step: 1, required: true },
      { id: 'phone', label: 'Téléphone & WhatsApp', type: 'text', step: 1, required: true },
      { id: 'address', label: 'Ville', type: 'text', step: 1 },
      { id: 'jobTitle', label: 'Poste recherché', type: 'text', step: 2, required: true },
      { id: 'recipient', label: 'Entreprise visée', type: 'text', step: 2, required: true },
      { id: 'experience', label: 'Parcours & Expériences', type: 'textarea', step: 3, required: true },
      { id: 'education', label: 'Diplômes & Formations', type: 'textarea', step: 3 },
      { id: 'motivation', label: 'Motivations clés', type: 'textarea', step: 3, required: true }
    ]
  },

  // 12. PACK ENTREPRENEUR
  pack_entrepreneur: {
    id: 'pack_entrepreneur',
    title: 'Pack Entrepreneur (5 documents)',
    category: 'PACKS',
    price: '4 000 FCFA',
    badge: 'PRO',
    desc: 'Sélectionnez 5 documents administratifs ou commerciaux pour votre entreprise.',
    type: 'CALCUL_STRUCTURE',
    fields: [
      { id: 'vendeur_nom', label: 'Nom de votre entreprise', type: 'text', step: 1, required: true },
      { id: 'vendeur_phone', label: 'Téléphone pro / WhatsApp', type: 'text', step: 1, required: true },
      { id: 'vendeur_adresse', label: 'Adresse physique / Ville', type: 'text', step: 1, required: true },
      { id: 'fisc_id', label: 'Identifiant Fiscal / NIU (optionnel)', type: 'text', step: 1 },
      { id: 'docs_selection', label: 'Précisez les 5 documents souhaités', type: 'textarea', placeholder: 'Ex: 1x Facture simple, 1x Proforma, 1x Reçu de vente, 1x Bon de commande, 1x Quittance', step: 2, required: true },
      { id: 'details_activite', label: 'Détails ou produits habituellement vendus', type: 'textarea', step: 3 }
    ]
  }
};
