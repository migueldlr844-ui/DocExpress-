'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  FileText, CheckCircle, Download, Clock, ShieldCheck, 
  ArrowLeft, CreditCard, Lock, RefreshCw, Send, AlertCircle
} from 'lucide-react';

// Initialisation sécurisée pour éviter les erreurs lors du build sur Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interfaces de données
interface DocumentTemplate {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  fields: { name: string; label: string; type: string; placeholder: string; required?: boolean }[];
}

interface Order {
  id: string;
  doc_title: string;
  user_phone: string;
  transaction_ref: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  form_data: Record<string, string>;
  created_at?: string;
}

// Catalogue des modèles administratifs
const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'attestation-honneur',
    title: 'Attestation sur l’honneur',
    category: 'Administratif',
    price: 1000,
    description: 'Déclaration officielle certifiant l’exactitude de faits ou d’une situation personnelle.',
    fields: [
      { name: 'nom', label: 'Nom complet', type: 'text', placeholder: 'Ex: Jean Dupont', required: true },
      { name: 'adresse', label: 'Adresse de résidence', type: 'text', placeholder: 'Ex: Yaoundé, Bastos', required: true },
      { name: 'cni', label: 'Numéro de CNI / Passeport', type: 'text', placeholder: 'Ex: 123456789', required: true },
      { name: 'motif', label: 'Objet de l’attestation', type: 'textarea', placeholder: 'Ex: Déclaration de non-emploi...', required: true },
    ]
  },
  {
    id: 'contrat-bail',
    title: 'Contrat de Bail d’Habitation',
    category: 'Immobilier',
    price: 2500,
    description: 'Bail type conforme pour la location d’un logement (bailleur et locataire).',
    fields: [
      { name: 'bailleur', label: 'Nom du Bailleur (Propriétaire)', type: 'text', placeholder: 'Ex: Paul Atangana', required: true },
      { name: 'locataire', label: 'Nom du Locataire', type: 'text', placeholder: 'Ex: Alice Mbida', required: true },
      { name: 'adresse_bien', label: 'Adresse du bien loué', type: 'text', placeholder: 'Ex: Douala, Akwa', required: true },
      { name: 'loyer', label: 'Montant du loyer mensuel (FCFA)', type: 'number', placeholder: 'Ex: 75000', required: true },
      { name: 'duree', label: 'Durée du contrat (en mois/années)', type: 'text', placeholder: 'Ex: 1 an renouvelable', required: true }
    ]
  },
  {
    id: 'demande-emploi',
    title: 'Lettre de Demande d’Emploi',
    category: 'Professionnel',
    price: 1500,
    description: 'Lettre de motivation professionnelle adaptée à une candidature formelle.',
    fields: [
      { name: 'candidat', label: 'Votre Nom Complet', type: 'text', placeholder: 'Ex: Desire Atangana', required: true },
      { name: 'poste', label: 'Intitulé du poste visé', type: 'text', placeholder: 'Ex: Responsable Commercial', required: true },
      { name: 'entreprise', label: 'Nom de l’entreprise cible', type: 'text', placeholder: 'Ex: Société ABC', required: true },
      { name: 'competences', label: 'Points forts / Expériences clés', type: 'textarea', placeholder: 'Ex: 5 ans d’expérience en gestion de réseau...', required: true }
    ]
  }
];

export default function DocExpressApp() {
  const [step, setStep] = useState<'catalog' | 'form' | 'review' | 'payment' | 'pending' | 'success' | 'admin'>('catalog');
  const [selectedDoc, setSelectedDoc] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [userPhone, setUserPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [adminPin, setAdminPin] = useState('');

  const documentRef = useRef<HTMLDivElement>(null);

  // Écoute de la validation administrative en temps réel via Supabase
  useEffect(() => {
    if (step === 'pending' && currentOrder?.id) {
      const channel = supabase
        .channel(`order-${currentOrder.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${currentOrder.id}`
          },
          (payload) => {
            const updated = payload.new as Order;
            if (updated.status === 'APPROVED') {
              setCurrentOrder(updated);
              setStep('success');
            } else if (updated.status === 'REJECTED') {
              alert('Paiement non confirmé. Veuillez vérifier la référence SMS.');
              setStep('payment');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [step, currentOrder?.id]);

  const handleSelectDoc = (doc: DocumentTemplate) => {
    setSelectedDoc(doc);
    setFormData({});
    setStep('form');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('review');
  };

  // Traitement et sauvegarde de la commande dans Supabase
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !userPhone || !transactionRef) return;

    setLoading(true);

    const newOrderData = {
      doc_title: selectedDoc.title,
      user_phone: userPhone,
      transaction_ref: transactionRef.trim(),
      amount: selectedDoc.price,
      status: 'PENDING',
      form_data: formData
    };

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrderData])
        .select()
        .single();

      if (error) {
        console.error('Erreur Supabase:', error);
        alert(`Erreur d'enregistrement : ${error.message}`);
        setLoading(false);
        return;
      }

      setCurrentOrder(data as Order);
      setStep('pending');
    } catch (err: any) {
      console.error('Erreur:', err);
      alert('Vérifiez votre connexion internet puis réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // Téléchargement du document au format PDF
  const generatePDF = async () => {
    if (!documentRef.current) return;
    setIsGeneratingPDF(true);

    try {
      const element = documentRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${selectedDoc?.title || currentOrder?.doc_title || 'Document'}_DocExpress.pdf`);
    } catch (error) {
      console.error('Erreur PDF:', error);
      alert('Une erreur est survenue lors de la création du PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Gestion du tableau de bord d'administration
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrdersList(data as Order[]);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'APPROVED' | 'REJECTED') => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (!error) {
      fetchOrders();
    } else {
      alert(`Erreur de mise à jour : ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Navigation principale */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setStep('catalog')}>
            <FileText className="h-7 w-7 text-amber-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              DocExpress
            </span>
          </div>
          <button 
            onClick={() => setStep('admin')}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded border border-slate-800"
          >
            Espace Admin
          </button>
        </div>
      </header>

      {/* Vues de l'application */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        
        {/* Étape 1 : Catalogue */}
        {step === 'catalog' && (
          <div>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold sm:text-4xl mb-3">Vos documents administratifs en quelques clics</h1>
              <p className="text-slate-400">Sélectionnez un modèle, complétez le formulaire, payez et téléchargez votre PDF.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {DOCUMENT_TEMPLATES.map((doc) => (
                <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition">
                  <div>
                    <span className="text-xs font-semibold uppercase text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded">
                      {doc.category}
                    </span>
                    <h3 className="text-lg font-bold mt-4 mb-2">{doc.title}</h3>
                    <p className="text-sm text-slate-400 mb-6">{doc.description}</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold mb-4">{doc.price.toLocaleString()} FCFA</div>
                    <button
                      onClick={() => handleSelectDoc(doc)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg transition"
                    >
                      Commander
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Étape 2 : Saisie des données */}
        {step === 'form' && selectedDoc && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto">
            <button onClick={() => setStep('catalog')} className="flex items-center text-sm text-slate-400 hover:text-white mb-6">
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour au catalogue
            </button>
            <h2 className="text-2xl font-bold mb-2">{selectedDoc.title}</h2>
            <p className="text-slate-400 text-sm mb-6">Renseignez les informations demandées.</p>
            
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {selectedDoc.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1.5">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-amber-500 outline-none"
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-amber-500 outline-none"
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-lg transition"
              >
                Vérifier l’aperçu
              </button>
            </form>
          </div>
        )}

        {/* Étape 3 : Aperçu avec Filigrane Spécimen */}
        {step === 'review' && selectedDoc && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setStep('form')} className="flex items-center text-sm text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-1" /> Modifier les informations
              </button>
              <button
                onClick={() => setStep('payment')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition"
              >
                Procéder au paiement ({selectedDoc.price.toLocaleString()} FCFA)
              </button>
            </div>

            <div className="bg-white text-slate-950 p-8 rounded-xl shadow-2xl relative overflow-hidden min-h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-6xl font-black text-slate-200/50 -rotate-45 tracking-widest uppercase">
                  SPÉCIMEN
                </span>
              </div>
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold uppercase">{selectedDoc.title}</h2>
                <span className="text-xs text-slate-500">DocExpress Document Officiel</span>
              </div>
              <div className="space-y-4 text-sm leading-relaxed">
                {Object.entries(formData).map(([key, val]) => (
                  <p key={key}>
                    <strong className="capitalize">{key.replace('_', ' ')} :</strong> {val}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Étape 4 : Paiement Orange Money */}
        {step === 'payment' && selectedDoc && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <CreditCard className="mr-2 text-amber-500" /> Paiement Orange Money
            </h2>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 text-sm space-y-2">
              <p className="text-slate-400">Effectuez le transfert manuel vers le numéro :</p>
              <p className="text-lg font-mono font-bold text-amber-500">#150*1*1*655069396*#{selectedDoc.price}#</p>
              <p className="text-xs text-slate-500">Montant à régler : {selectedDoc.price.toLocaleString()} FCFA</p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5">Votre numéro expéditeur Orange Money</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 655069396"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-amber-500 outline-none"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5">Référence de Transaction SMS</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PP223434.5421.A12436"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-amber-500 outline-none"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-lg transition flex items-center justify-center"
              >
                {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : 'Valider ma commande'}
              </button>
            </form>
          </div>
        )}

        {/* Étape 5 : Attente de validation */}
        {step === 'pending' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-md mx-auto space-y-4">
            <Clock className="h-12 w-12 text-amber-500 mx-auto animate-pulse" />
            <h2 className="text-2xl font-bold">Vérification du paiement...</h2>
            <p className="text-sm text-slate-400">
              Votre demande est enregistrée. Dès que le transfert Orange Money est vérifié, le téléchargement sera débloqué automatiquement.
            </p>
            <div className="text-xs text-slate-500 bg-slate-950 p-3 rounded">
              Référence SMS : <span className="font-mono text-slate-300">{transactionRef}</span>
            </div>
          </div>
        )}

        {/* Étape 6 : Téléchargement PDF */}
        {step === 'success' && (
          <div className="space-y-6">
            <div className="bg-emerald-950/40 border border-emerald-800 p-4 rounded-xl flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-emerald-400">Paiement Validé !</h3>
                  <p className="text-xs text-slate-300">Votre document officiel est prêt.</p>
                </div>
              </div>
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-lg flex items-center text-sm transition"
              >
                {isGeneratingPDF ? <RefreshCw className="animate-spin h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Télécharger le PDF
              </button>
            </div>

            <div ref={documentRef} className="bg-white text-slate-950 p-10 rounded-xl shadow-2xl min-h-[600px]">
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold uppercase">{selectedDoc?.title || currentOrder?.doc_title}</h1>
                <span className="text-xs text-slate-500">DocExpress - Document Officiel</span>
              </div>
              <div className="space-y-4 text-sm leading-relaxed">
                {currentOrder?.form_data && Object.entries(currentOrder.form_data).map(([key, val]) => (
                  <p key={key}>
                    <strong className="capitalize">{key.replace('_', ' ')} :</strong> {val}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Étape 7 : Espace Administration */}
        {step === 'admin' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Tableau de Bord Administrateur</h2>
              <button onClick={() => setStep('catalog')} className="text-xs text-slate-400 hover:text-white">Fermer</button>
            </div>

            {adminPin !== '1234' ? (
              <div className="max-w-xs mx-auto space-y-4 py-8">
                <input
                  type="password"
                  placeholder="Code PIN Admin (ex: 1234)"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-center text-sm outline-none"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                />
                <button
                  onClick={fetchOrders}
                  className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded text-sm"
                >
                  Accéder
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-slate-200">
                    <tr>
                      <th className="p-3">Document</th>
                      <th className="p-3">Téléphone</th>
                      <th className="p-3">Réf. SMS</th>
                      <th className="p-3">Montant</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.map((ord) => (
                      <tr key={ord.id} className="border-b border-slate-800">
                        <td className="p-3 font-medium text-slate-200">{ord.doc_title}</td>
                        <td className="p-3">{ord.user_phone}</td>
                        <td className="p-3 font-mono text-amber-500">{ord.transaction_ref}</td>
                        <td className="p-3">{ord.amount} FCFA</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            ord.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                            ord.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3 space-x-2">
                          {ord.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => updateOrderStatus(ord.id, 'APPROVED')}
                                className="bg-emerald-500 text-slate-950 text-xs px-2.5 py-1 rounded font-bold"
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => updateOrderStatus(ord.id, 'REJECTED')}
                                className="bg-red-500/20 text-red-400 text-xs px-2.5 py-1 rounded"
                              >
                                Rejeter
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 text-center py-4 text-xs text-slate-500">
        © 2026 DocExpress. Tous droits réservés. Développé avec soin par Désiré Atangana.
      </footer>
    </div>
  );
}
