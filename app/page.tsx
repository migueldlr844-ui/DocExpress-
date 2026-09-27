'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import DocumentRenderer from '@/components/DocumentRenderer';

// Initialisation du client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Catalogue des documents DocExpress
const DOCUMENTS_LIST = [
  { id: 'quittance', title: 'Quittance de loyer', price: 500 },
  { id: 'contrat_bail', title: 'Contrat de bail commercial / d’habitation', price: 1500 },
  { id: 'facture', title: 'Facture / Proforma', price: 500 },
  { id: 'recu_vente', title: 'Reçu de vente de véhicule / bien', price: 1000 },
  { id: 'cv_express', title: 'Mise en page CV Professionnel', price: 1000 },
];

export default function Home() {
  const [selectedDoc, setSelectedDoc] = useState(DOCUMENTS_LIST[0]);
  const [step, setStep] = useState<'SELECT' | 'FORM' | 'PREVIEW' | 'PAYMENT' | 'VERIFICATION' | 'PAID'>('SELECT');
  const [formData, setFormData] = useState({ nom: '', telephone: '', ville: 'Yaoundé' });
  const [orderId, setOrderId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Génération d'un numéro de commande lisible (ex: CMD-1790458)
  const generateOrderNumber = () => `CMD-${Math.floor(1000000 + Math.random() * 9000000)}`;

  // 1. Soumission du formulaire -> Adapté aux colonnes requises de Supabase
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderNumber = generateOrderNumber();

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        amount: selectedDoc.price,
        status: 'PENDING',
        document_template_id: selectedDoc.id,
        customer_name: formData.nom,
        customer_phone: formData.telephone,
        form_data: {
          ...formData,
          document_title: selectedDoc.title,
          document_id: selectedDoc.id,
        },
      })
      .select()
      .single();

    if (error) {
      alert('Erreur lors de la création de la commande : ' + error.message);
      return;
    }

    setOrderId(data.id);
    setStep('PREVIEW');
  };

  // 2. Envoi de la preuve de paiement dans le Bucket payment-proofs
  const handleUploadProof = async () => {
    if (!file || !orderId) return alert('Veuillez sélectionner la capture d’écran ou la photo du reçu OM/MTN.');

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${orderId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      return alert('Erreur lors de l’envoi de la preuve : ' + uploadError.message);
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_proof_url: filePath,
        status: 'PAYMENT_VERIFICATION',
      })
      .eq('id', orderId);

    setUploading(false);

    if (updateError) {
      return alert('Erreur lors de la mise à jour de la commande.');
    }

    setStep('VERIFICATION');
  };

  // 3. Vérification automatique du statut de paiement
  useEffect(() => {
    if (step !== 'VERIFICATION' || !orderId) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (data && data.status === 'PAID') {
        setStep('PAID');
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, orderId]);

  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '0 auto',
        padding: '20px 15px',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '100px',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8', letterSpacing: '1px', margin: 0 }}>
          DOCEXPRESS
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
          Génération Instantanée de Documents Conformes
        </p>
      </header>

      {/* SÉLECTION DU DOCUMENT */}
      {step === 'SELECT' && (
        <div>
          <h2 style={{ fontSize: '16px', marginBottom: '15px', color: '#cbd5e1' }}>Sélectionnez un document :</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DOCUMENTS_LIST.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setStep('FORM');
                }}
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  padding: '16px',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: '600', fontSize: '15px' }}>{doc.title}</span>
                <span style={{ background: '#0284c7', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  {doc.price} FCFA
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORMULAIRE CLIENT */}
      {step === 'FORM' && (
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button
            type="button"
            onClick={() => setStep('SELECT')}
            style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontSize: '13px' }}
          >
            ← Choisir un autre document
          </button>

          <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 5px 0', color: '#f8fafc' }}>{selectedDoc.title}</h2>
            <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '15px' }}>
              Tarif : {selectedDoc.price} FCFA
            </span>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Nom et Prénom complet</label>
            <input
              placeholder="Ex: Jean Paul"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '5px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Numéro de téléphone</label>
            <input
              placeholder="Ex: 6XXXXXXXX"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '5px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Ville de résidence</label>
            <input
              placeholder="Ex: Yaoundé"
              value={formData.ville}
              onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '5px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '14px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            Générer l'aperçu
          </button>
        </form>
      )}

      {/* APERÇU FILIGRANÉ */}
      {step === 'PREVIEW' && (
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Vérification du rendu :</h3>
          <DocumentRenderer docType={selectedDoc.title} formData={formData} isWatermarked={true} />
          <button
            onClick={() => setStep('PAYMENT')}
            style={{
              marginTop: '15px',
              width: '100%',
              padding: '14px',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Procéder au paiement ({selectedDoc.price} FCFA)
          </button>
        </div>
      )}

      {/* PAIEMENT & CAPTURE */}
      {step === 'PAYMENT' && (
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Paiement Mobile Money</h3>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            Envoyez <strong style={{ color: '#38bdf8' }}>{selectedDoc.price} FCFA</strong> au numéro ci-dessous :
          </p>

          <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', margin: '15px 0', fontSize: '15px', border: '1px solid #334155' }}>
            <p style={{ margin: '5px 0' }}>🟠 <strong>Orange Money / MTN :</strong> 655 06 93 96</p>
            <p style={{ margin: '5px 0', fontSize: '12px', color: '#94a3b8' }}>Nom du compte : Atangana Desire</p>
          </div>

          <hr style={{ borderColor: '#334155', margin: '20px 0' }} />

          <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📷 Joindre la capture du reçu</h4>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ marginBottom: '15px', display: 'block', width: '100%', fontSize: '13px' }}
          />

          <button
            onClick={handleUploadProof}
            disabled={uploading || !file}
            style={{
              width: '100%',
              padding: '14px',
              background: uploading || !file ? '#475569' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: uploading || !file ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? 'Envoi en cours...' : 'Valider mon paiement'}
          </button>
        </div>
      )}

      {/* ATTENTE VÉRIFICATION */}
      {step === 'VERIFICATION' && (
        <div style={{ textAlign: 'center', background: '#1e293b', padding: '30px 20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>⏳</div>
          <h3 style={{ color: '#f59e0b', margin: '0 0 10px 0' }}>Paiement en cours de vérification</h3>
          <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
            Votre reçu a été transmitted. Le statut sera validé sous peu.
          </p>
        </div>
      )}

      {/* DOCUMENT FINAL SANS FILIGRANE */}
      {step === 'PAID' && (
        <div>
          <div style={{ textAlign: 'center', background: '#064e3b', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h3 style={{ color: '#34d399', margin: 0 }}>Paiement Confirmé !</h3>
            <p style={{ fontSize: '13px', color: '#ecfdf5', margin: '5px 0 0 0' }}>Votre document officiel est prêt.</p>
          </div>

          <DocumentRenderer docType={selectedDoc.title} formData={formData} isWatermarked={false} />

          <button
            onClick={() => window.print()}
            style={{
              marginTop: '15px',
              width: '100%',
              padding: '14px',
              background: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            📥 Imprimer / Télécharger le document PDF
          </button>
        </div>
      )}
    </div>
  );
}
