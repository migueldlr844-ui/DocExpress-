'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  FileText, CheckCircle, Clock, ShieldCheck, Download, Eye, 
  Send, RefreshCw, AlertCircle, Copy, ArrowLeft, Plus, Trash2, Edit3, Lock
} from 'lucide-react';

// ==========================================
// 1. INITIALISATION SUPABASE (SÉCURISÉE & CONFORME NEXT.JS)
// ==========================================
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_SUPABASE_URL || 
  'https://placeholder.supabase.co';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_SUPABASE_ANON_KEY || 
  'placeholder-key';

// Utilisation de 'const' simple (sans export) pour éviter les erreurs de build Next.js
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// 2. CONFIGURATION & TYPES
// ==========================================
const OM_NUMBER = "655069396"; // Numéro de réception des paiements
const ADMIN_PASSCODE = "1234"; // Code d'accès au panneau d'administration

type Step = 'home' | 'form' | 'review' | 'preview' | 'payment' | 'pending' | 'success' | 'admin';

interface DocumentType {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  isPack?: boolean;
}

const DOCUMENTS_CATALOG: DocumentType[] = [
  { id: 'quittance', title: 'Quittance de Loyer', category: 'Immobilier', price: 500, description: 'Preuve de paiement de loyer officielle et conforme.' },
  { id: 'recu_vente', title: 'Reçu de Vente / Achat', category: 'Commerce', price: 500, description: 'Attestation de transaction commerciale entre particuliers ou pro.' },
  { id: 'contrat_bail', title: 'Contrat de Bail d\'Habitation', category: 'Immobilier', price: 1500, description: 'Contrat complet régissant la location d\'un logement.' },
  { id: 'facture_proforma', title: 'Facture Pro Forma / Prestation', category: 'Commerce', price: 1000, description: 'Devis ou facture formelle pour services et ventes.' },
  { id: 'cv_pro', title: 'Curriculum Vitae (CV) Pro', category: 'Emploi', price: 1000, description: 'CV moderne, structuré et valorisant votre parcours.' },
  { id: 'lettre_motivation', title: 'Lettre de Motivation', category: 'Emploi', price: 1000, description: 'Lettre personnalisée et percutante pour vos candidatures.' },
  { id: 'pack_locatif', title: 'Pack Immobilier (Bail + Quittance)', category: 'Packs', price: 1800, description: 'Le combo complet pour bailleurs et locataires.', isPack: true },
  { id: 'pack_emploi', title: 'Pack Emploi (CV + Lettre)', category: 'Packs', price: 1800, description: 'Dossier de candidature complet prêt à l\'envoi.', isPack: true },
];

// ==========================================
// 3. COMPOSANT PRINCIPAL
// ==========================================
export default function DocExpressApp() {
  const [step, setStep] = useState<Step>('home');
  const [selectedDoc, setSelectedDoc] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // Paiement & Commande
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Administration
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  // Charger les commandes en attente si l'admin est connecté
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchPendingOrders();
    }
  }, [isAdminAuthenticated]);

  // Écouter le changement de statut de la commande en cours
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'pending' && currentOrder?.id) {
      interval = setInterval(async () => {
        const { data } = await supabase
          .from('orders')
          .select('status')
          .eq('id', currentOrder.id)
          .single();

        if (data && data.status === 'completed') {
          setStep('success');
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [step, currentOrder]);

  const fetchPendingOrders = async () => {
    setIsLoadingOrders(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending_verification')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPendingOrders(data);
    }
    setIsLoadingOrders(false);
  };

  const handleSelectDoc = (doc: DocumentType) => {
    setSelectedDoc(doc);
    setFormData({});
    setStep('form');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Soumission du paiement Orange Money
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone || !transactionRef) {
      alert("Veuillez remplir le numéro expéditeur et la référence SMS.");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedBody = renderDocumentBody();

      const newOrder = {
        amount: selectedDoc?.price || 500,
        payment_method: 'om_manual',
        sender_phone: senderPhone,
        transaction_ref: transactionRef,
        status: 'pending_verification',
        doc_title: selectedDoc?.title || 'Document',
        form_data: formData,
        generated_body: generatedBody
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (error) throw error;

      setCurrentOrder(data);
      setStep('pending');
    } catch (err: any) {
      alert("Erreur lors de la validation du paiement : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation d'une commande par l'Admin
  const handleApproveOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId);

    if (!error) {
      fetchPendingOrders();
    } else {
      alert("Erreur lors de la validation");
    }
  };

  // Génération du PDF
  const generatePDF = async () => {
    if (!documentRef.current) return;
    setIsGeneratingPDF(true);

    try {
      const element = documentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${selectedDoc?.title || currentOrder?.docTitle || 'Document'}_DocExpress.pdf`);
    } catch (error) {
      console.error('Erreur lors du téléchargement :', error);
      alert('Une erreur est survenue lors de la création du fichier PDF. Veuillez réespayer.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ==========================================
  // 4. RENDU DES FORMULAIRES DYNAMIQUES
  // ==========================================
  const renderFormFields = () => {
    if (!selectedDoc) return null;

    switch (selectedDoc.id) {
      case 'quittance':
        return (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Nom du Bailleur (Propriétaire)</label><input type="text" name="bailleurName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Nom du Locataire</label><input type="text" name="locataireName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Adresse du Logement</label><input type="text" name="adresse" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm font-medium mb-1">Montant du Loyer (FCFA)</label><input type="number" name="montant" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
              <div><label className="block text-sm font-medium mb-1">Mois Payé</label><input type="text" name="mois" placeholder="Ex: Octobre 2026" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Date du Paiement</label><input type="date" name="datePaiement" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
          </div>
        );

      case 'recu_vente':
        return (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Nom du Vendeur</label><input type="text" name="vendeurName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Nom de l'Acheteur</label><input type="text" name="acheteurName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Objet / Article Vendu</label><input type="text" name="article" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Montant Total (FCFA)</label><input type="number" name="montant" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Date de la Transaction</label><input type="date" name="dateTransaction" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
          </div>
        );

      case 'contrat_bail':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Parties</h4>
            <div><label className="block text-sm font-medium mb-1">Nom Complet du Bailleur</label><input type="text" name="bailleurName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Nom Complet du Locataire</label><input type="text" name="locataireName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <h4 className="font-semibold text-gray-700 pt-2">Conditions de Location</h4>
            <div><label className="block text-sm font-medium mb-1">Adresse du Bien</label><input type="text" name="adresse" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm font-medium mb-1">Loyer Mensuel (FCFA)</label><input type="number" name="montantLoyer" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
              <div><label className="block text-sm font-medium mb-1">Dépôt de Garantie (Avance)</label><input type="number" name="garantie" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Date de Début du Bail</label><input type="date" name="dateDebut" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
          </div>
        );

      case 'facture_proforma':
        return (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Nom de votre Entreprise / Prestataire</label><input type="text" name="entreprise" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Nom du Client</label><input type="text" name="clientName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Description des Prestations / Produits</label><textarea name="descriptionServices" onChange={handleInputChange} className="w-full p-2 border rounded h-20" required></textarea></div>
            <div><label className="block text-sm font-medium mb-1">Montant Total HT/TTC (FCFA)</label><input type="number" name="montantTotal" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Date d'Émission</label><input type="date" name="dateEmission" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
          </div>
        );

      case 'cv_pro':
        return (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Nom & Prénom</label><input type="text" name="fullName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Titre du Poste Visé</label><input type="text" name="jobTitle" placeholder="Ex: Commercial Clientèle" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm font-medium mb-1">Téléphone</label><input type="text" name="phone" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" name="email" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Profil / Résumé Professionnel</label><textarea name="summary" onChange={handleInputChange} className="w-full p-2 border rounded h-20" required></textarea></div>
            <div><label className="block text-sm font-medium mb-1">Expériences Professionnelles (Principales)</label><textarea name="experiences" onChange={handleInputChange} className="w-full p-2 border rounded h-24" placeholder="Poste - Entreprise - Période - Missions" required></textarea></div>
            <div><label className="block text-sm font-medium mb-1">Diplômes & Formations</label><textarea name="education" onChange={handleInputChange} className="w-full p-2 border rounded h-20" required></textarea></div>
            <div><label className="block text-sm font-medium mb-1">Compétences Clés</label><input type="text" name="skills" placeholder="Séparées par des virgules" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
          </div>
        );

      case 'lettre_motivation':
        return (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Vos Nom & Prénom</label><input type="text" name="candidateName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Nom de l'Entreprise Cible</label><input type="text" name="companyName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Intitulé du Poste</label><input type="text" name="targetPost" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
            <div><label className="block text-sm font-medium mb-1">Pourquoi vous postulez ? (Points Forts)</label><textarea name="reasons" onChange={handleInputChange} className="w-full p-2 border rounded h-24" required></textarea></div>
          </div>
        );

      case 'pack_locatif':
      case 'pack_emploi':
        return (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">Ce pack regroupe 2 documents. Remplissez les informations ci-dessous qui serviront à générer vos 2 documents instantanément.</p>
            <div className="mt-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nom Complet</label><input type="text" name="fullName" onChange={handleInputChange} className="w-full p-2 border rounded" required /></div>
              <div><label className="block text-sm font-medium mb-1">Détails Personnalisés</label><textarea name="packDetails" onChange={handleInputChange} className="w-full p-2 border rounded h-24" placeholder="Saisissez les détails de votre demande..." required></textarea></div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ==========================================
  // 5. RENDU DU DOCUMENT GÉNÉRÉ
  // ==========================================
  const renderDocumentBody = () => {
    const data = currentOrder?.form_data || formData;
    const docId = selectedDoc?.id || 'doc';

    return (
      <div className="p-8 bg-white text-gray-900 border font-serif max-w-2xl mx-auto shadow-sm" ref={documentRef}>
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-blue-900">
            {selectedDoc?.title || currentOrder?.docTitle || 'DOCUMENT OFFICIEL'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">Généré via DocExpress le {new Date().toLocaleDateString()}</p>
        </div>

        {docId === 'quittance' && (
          <div className="space-y-4 text-sm leading-relaxed">
            <p>Je soussigné(e), <strong>{data.bailleurName || '________________'}</strong>, propriétaire du logement situé à l'adresse suivante :</p>
            <p className="italic bg-gray-50 p-2 border-l-2 border-blue-600">{data.adresse || '________________'}</p>
            <p>Reconnais avoir reçu de M./Mme <strong>{data.locataireName || '________________'}</strong> la somme de :</p>
            <p className="text-lg font-bold text-center my-2">{data.montant ? `${Number(data.montant).toLocaleString()} FCFA` : '_________ FCFA'}</p>
            <p>au titre du paiement du loyer et des charges pour le mois de : <strong>{data.mois || '________________'}</strong>.</p>
            <div className="pt-8 flex justify-between items-end">
              <div><p className="text-xs text-gray-400">Date : {data.datePaiement || new Date().toLocaleDateString()}</p></div>
              <div className="text-center">
                <p className="font-semibold">Signature du Bailleur</p>
                <div className="h-16 w-32 border-b border-dashed border-gray-400 mt-2"></div>
              </div>
            </div>
          </div>
        )}

        {docId === 'recu_vente' && (
          <div className="space-y-4 text-sm leading-relaxed">
            <p>Je soussigné(e), <strong>{data.vendeurName || '________________'}</strong> (Vendeur), certifie avoir reçu de <strong>{data.acheteurName || '________________'}</strong> (Acheteur), la somme de :</p>
            <p className="text-xl font-bold text-center text-green-700 bg-green-50 p-3 rounded">{data.montant ? `${Number(data.montant).toLocaleString()} FCFA` : '_________ FCFA'}</p>
            <p>En règlement de l'achat du bien/service désigné ci-après :</p>
            <p className="p-3 bg-gray-50 border rounded">{data.article || '________________'}</p>
            <p>Fait pour servir et valoir ce que de droit.</p>
            <div className="pt-8 flex justify-between items-end">
              <div><p className="text-xs text-gray-400">Date : {data.dateTransaction || new Date().toLocaleDateString()}</p></div>
              <div className="text-center">
                <p className="font-semibold">Signature du Vendeur</p>
                <div className="h-16 w-32 border-b border-dashed border-gray-400 mt-2"></div>
              </div>
            </div>
          </div>
        )}

        {docId === 'cv_pro' && (
          <div className="font-sans space-y-4 text-sm">
            <div className="border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">{data.fullName || 'NOM PRENOM'}</h2>
              <p className="text-blue-600 font-semibold">{data.jobTitle || 'TITRE DU POSTE'}</p>
              <p className="text-xs text-gray-500 mt-1">{data.phone} | {data.email}</p>
            </div>
            <div>
              <h3 className="font-bold border-b pb-1 text-gray-700 uppercase text-xs tracking-wider">Profil</h3>
              <p className="mt-1 text-gray-600">{data.summary}</p>
            </div>
            <div>
              <h3 className="font-bold border-b pb-1 text-gray-700 uppercase text-xs tracking-wider">Expériences Professionnelles</h3>
              <p className="mt-1 whitespace-pre-line text-gray-600">{data.experiences}</p>
            </div>
            <div>
              <h3 className="font-bold border-b pb-1 text-gray-700 uppercase text-xs tracking-wider">Formation & Diplômes</h3>
              <p className="mt-1 whitespace-pre-line text-gray-600">{data.education}</p>
            </div>
            <div>
              <h3 className="font-bold border-b pb-1 text-gray-700 uppercase text-xs tracking-wider">Compétences</h3>
              <p className="mt-1 text-gray-600">{data.skills}</p>
            </div>
          </div>
        )}

        {!['quittance', 'recu_vente', 'cv_pro'].includes(docId) && (
          <div className="space-y-4 text-sm">
            <p className="font-semibold">Détails enregistrés :</p>
            <pre className="bg-gray-50 p-4 border rounded text-xs whitespace-pre-wrap font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-12 pt-4 border-t text-center text-[10px] text-gray-400">
          Document sécurisé généré par DocExpress — Tous droits réservés
        </div>
      </div>
    );
  };

  // ==========================================
  // 6. RENDU DE L'APPLICATION (VUES)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col font-sans">
      {/* Navbar Header */}
      <header className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setStep('home')}
          >
            <FileText className="h-6 w-6 text-orange-400" />
            <span className="text-xl font-bold tracking-tight">DocExpress</span>
          </div>
          <button 
            onClick={() => setStep('admin')}
            className="text-xs bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded-full flex items-center gap-1 border border-blue-700 transition"
          >
            <Lock className="h-3 w-3" /> Espace Admin
          </button>
        </div>
      </header>

      {/* Corps principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">

        {/* VUE 1 : CATALOGUE / ACCUEIL */}
        {step === 'home' && (
          <div>
            <div className="text-center my-8">
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Vos documents administratifs en quelques clics</h1>
              <p className="mt-2 text-gray-600 text-sm sm:text-base">Sélectionnez le modèle, remplissez les informations et téléchargez votre document prêt à l'emploi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOCUMENTS_CATALOG.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between ${doc.isPack ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${doc.isPack ? 'bg-orange-100 text-orange-800' : 'bg-blue-50 text-blue-700'}`}>
                        {doc.category}
                      </span>
                      <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{doc.price} FCFA</span>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-1">{doc.title}</h3>
                    <p className="text-xs text-gray-500 mb-4">{doc.description}</p>
                  </div>

                  <button
                    onClick={() => handleSelectDoc(doc)}
                    className="w-full mt-2 bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 rounded-lg text-sm transition flex items-center justify-center gap-2"
                  >
                    Créer ce document
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VUE 2 : FORMULAIRE */}
        {step === 'form' && selectedDoc && (
          <div className="max-w-xl mx-auto bg-white p-6 rounded-xl border shadow-sm">
            <button 
              onClick={() => setStep('home')}
              className="flex items-center text-xs text-gray-500 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="h-3 w-3 mr-1" /> Retour aux modèles
            </button>

            <h2 className="text-xl font-bold mb-1">{selectedDoc.title}</h2>
            <p className="text-xs text-gray-500 mb-6">Veuillez renseigner les champs ci-dessous avec précision.</p>

            <form onSubmit={(e) => { e.preventDefault(); setStep('review'); }}>
              {renderFormFields()}

              <button
                type="submit"
                className="w-full mt-6 bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg text-sm transition"
              >
                Vérifier l'aperçu
              </button>
            </form>
          </div>
        )}

        {/* VUE 3 : VERIFICATION (REVIEW) */}
        {step === 'review' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
              <h2 className="text-xl font-bold mb-2">Vérification des informations</h2>
              <p className="text-xs text-gray-500 mb-4">Voici un aperçu visuel du document tel qu'il sera généré.</p>
              
              <div className="border rounded-lg overflow-hidden my-4 bg-gray-100 p-2">
                {renderDocumentBody()}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('form')}
                  className="w-1/2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm transition"
                >
                  Modifier les infos
                </button>
                <button
                  onClick={() => setStep('payment')}
                  className="w-1/2 bg-orange-600 hover:bg-orange-500 text-white font-medium py-2.5 rounded-lg text-sm transition"
                >
                  Procéder au Paiement ({selectedDoc?.price} FCFA)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VUE 4 : PAIEMENT */}
        {step === 'payment' && selectedDoc && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-xl border shadow-sm">
            <button 
              onClick={() => setStep('review')}
              className="flex items-center text-xs text-gray-500 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="h-3 w-3 mr-1" /> Retour
            </button>

            <h2 className="text-xl font-bold mb-1">Paiement Orange Money</h2>
            <p className="text-xs text-gray-500 mb-4">Effectuez le transfert manuel puis collez la référence SMS ci-dessous.</p>

            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6 text-sm">
              <p className="font-semibold text-orange-900 mb-1">Instructions de paiement :</p>
              <ol className="list-decimal list-inside text-xs text-orange-800 space-y-1">
                <li>Composez le code Orange Money sur votre téléphone.</li>
                <li>Effectuez un transfert de <strong>{selectedDoc.price} FCFA</strong> au numéro :</li>
                <li className="font-mono text-base font-bold my-1 text-black text-center bg-white p-1 rounded border border-orange-300">
                  {OM_NUMBER}
                </li>
                <li>Copiez la référence/ID de la transaction reçue par SMS.</li>
              </ol>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Votre Numéro de Téléphone (Expéditeur)</label>
                <input 
                  type="text" 
                  value={senderPhone} 
                  onChange={(e) => setSenderPhone(e.target.value)} 
                  placeholder="Ex: 6XXXXXXXX" 
                  className="w-full p-2.5 border rounded-lg text-sm" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Référence / TxID du SMS Orange Money</label>
                <input 
                  type="text" 
                  value={transactionRef} 
                  onChange={(e) => setTransactionRef(e.target.value)} 
                  placeholder="Ex: PP260915.1234.A12345" 
                  className="w-full p-2.5 border rounded-lg text-sm font-mono" 
                  required 
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-700 hover:bg-green-600 text-white font-medium py-3 rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Valider et envoyer
              </button>
            </form>
          </div>
        )}

        {/* VUE 5 : ATTENTE (PENDING) */}
        {step === 'pending' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl border shadow-sm text-center">
            <Clock className="h-12 w-12 text-orange-500 mx-auto animate-pulse mb-4" />
            <h2 className="text-xl font-bold mb-2">Vérification du paiement en cours</h2>
            <p className="text-xs text-gray-600 mb-6">
              Votre transaction (Ref: <span className="font-mono font-semibold">{transactionRef}</span>) a été transmise. 
              Dès validation par l'administrateur, votre document sera prêt au téléchargement.
            </p>
            <div className="p-3 bg-gray-50 rounded-lg border text-xs text-gray-500 flex items-center justify-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
              Vérification automatique en cours...
            </div>
          </div>
        )}

        {/* VUE 6 : SUCCÈS & TÉLÉCHARGEMENT */}
        {step === 'success' && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border shadow-sm text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <h2 className="text-2xl font-bold mb-1">Paiement Confirmé !</h2>
            <p className="text-xs text-gray-500 mb-6">Votre document a été validé. Vous pouvez maintenant le télécharger au format PDF.</p>

            <div className="border rounded-lg overflow-hidden my-4 bg-gray-50 p-4">
              {renderDocumentBody()}
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="bg-blue-900 hover:bg-blue-800 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition flex items-center gap-2"
              >
                {isGeneratingPDF ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Télécharger en PDF
              </button>
            </div>
          </div>
        )}

        {/* VUE 7 : ESPACE ADMIN */}
        {step === 'admin' && (
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl border shadow-sm">
            <button 
              onClick={() => setStep('home')}
              className="flex items-center text-xs text-gray-500 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="h-3 w-3 mr-1" /> Retour au site
            </button>

            <h2 className="text-xl font-bold mb-4">Panneau d'Administration</h2>

            {!isAdminAuthenticated ? (
              <div className="max-w-xs mx-auto space-y-3 my-8">
                <label className="block text-xs font-medium text-center">Entrez le code secret Admin</label>
                <input 
                  type="password" 
                  value={adminCodeInput} 
                  onChange={(e) => setAdminCodeInput(e.target.value)} 
                  className="w-full p-2 border rounded text-center font-mono text-lg" 
                />
                <button 
                  onClick={() => {
                    if (adminCodeInput === ADMIN_PASSCODE) {
                      setIsAdminAuthenticated(true);
                    } else {
                      alert("Code incorrect");
                    }
                  }}
                  className="w-full bg-blue-900 text-white py-2 rounded text-sm font-medium"
                >
                  Se connecter
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-sm">Commandes en attente de validation ({pendingOrders.length})</h3>
                  <button onClick={fetchPendingOrders} className="text-xs text-blue-600 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Actualiser
                  </button>
                </div>

                {isLoadingOrders ? (
                  <p className="text-xs text-center py-8 text-gray-400">Chargement...</p>
                ) : pendingOrders.length === 0 ? (
                  <p className="text-xs text-center py-8 text-gray-400">Aucune commande en attente.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingOrders.map((order) => (
                      <div key={order.id} className="border p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-gray-50">
                        <div>
                          <p className="font-bold text-sm">{order.doc_title} ({order.amount} FCFA)</p>
                          <p className="text-xs text-gray-600 mt-0.5">Expéditeur: <span className="font-semibold">{order.sender_phone}</span></p>
                          <p className="text-xs text-gray-600">Réf SMS: <span className="font-mono bg-yellow-100 px-1 rounded">{order.transaction_ref}</span></p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                        </div>

                        <button 
                          onClick={() => handleApproveOrder(order.id)}
                          className="bg-green-700 hover:bg-green-600 text-white text-xs px-4 py-2 rounded font-medium flex items-center gap-1 self-end md:self-center"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Valider le paiement
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} DocExpress. Service de génération de documents administratifs.</p>
      </footer>
    </div>
  );
}
