// config/documents.ts
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email';
  placeholder?: string;
  step: number; // 1: Expéditeur/Base, 2: Destinataire/Contexte, 3: Détails/Motivation
  required?: boolean;
}

export interface DocumentConfig {
  id: string;
  title: string;
  category: string;
  price: string;
  badge?: string;
  desc: string;
  fields: FormField[];
}

export const DOCUMENTS_CONFIG: Record<string, DocumentConfig> = {
  lettre: {
    id: 'lettre',
    title: 'Lettre de motivation',
    category: 'CARRIÈRE',
    price: '500 FCFA',
    badge: 'POPULAIRE',
    desc: 'Rédigée sur mesure et au format professionnel par notre moteur IA.',
    fields: [
      // Étape 1 : Candidat
      { id: 'name', label: 'Nom & Prénom', type: 'text', placeholder: 'Ex: ATANGANA DESIRE', step: 1, required: true },
      { id: 'phone', label: 'Téléphone', type: 'text', placeholder: 'Ex: 6XX XX XX XX', step: 1, required: true },
      { id: 'email', label: 'Email', type: 'email', placeholder: 'Ex: contact@exemple.com', step: 1 },
      { id: 'address', label: 'Ville / Ville d’habitation', type: 'text', placeholder: 'Ex: Yaoundé, Cameroun', step: 1 },
      
      // Étape 2 : Destinataire & Offre
      { id: 'jobTitle', label: 'Poste recherché', type: 'text', placeholder: 'Ex: Chargé d’affaires', step: 2, required: true },
      { id: 'recipient', label: 'Nom de l’entreprise / Destinataire', type: 'text', placeholder: 'Ex: AFRIBIZ', step: 2, required: true },
      { id: 'recipientAddress', label: 'Ville de l’entreprise', type: 'text', placeholder: 'Ex: Douala', step: 2 },
      
      // Étape 3 : Parcours & Motivation
      { id: 'education', label: 'Formation / Niveau d’études', type: 'text', placeholder: 'Ex: Master en Banque & Finance', step: 3 },
      { id: 'experience', label: 'Expériences & Postes précédents', type: 'textarea', placeholder: 'Ex: 3 ans chez XYZ en gestion du portefeuille clients...', step: 3 },
      { id: 'skills', label: 'Compétences & Qualités clés', type: 'textarea', placeholder: 'Ex: Négociation, analyse financière, rigueur...', step: 3 },
      { id: 'motivation', label: 'Pourquoi ce poste / cette entreprise ?', type: 'textarea', placeholder: 'Ex: Attiré par le leadership d’AFRIBIZ et la gestion des comptes stratégiques...', step: 3 },
    ]
  },
  cv: {
    id: 'cv',
    title: 'CV professionnel',
    category: 'CARRIÈRE',
    price: '1 000 FCFA',
    badge: 'POPULAIRE',
    desc: 'Format moderne optimisé pour le marché.',
    fields: [
      { id: 'name', label: 'Nom complet', type: 'text', step: 1 },
      { id: 'phone', label: 'Téléphone', type: 'text', step: 1 },
      { id: 'jobTitle', label: 'Titre du profil', type: 'text', step: 2 },
      { id: 'experience', label: 'Description de vos expériences', type: 'textarea', step: 3 },
    ]
  }
};
