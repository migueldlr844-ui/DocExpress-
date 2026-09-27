'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialisation du client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Catalogue des documents disponibles sur DocExpress
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
  const [formData, setFormData] = useState({ nom: '', telephone: '', ville: 'Yaoundé', details: '' });
  const [orderId, setOrderId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 1. Soumission du formulaire -> Création de la commande dans Supabase
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('orders')
      .insert({
        document_type: selectedDoc.title,
        amount: selectedDoc.price,
        form_data: formData,
        status: 'PENDING',
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

  // 2. Envoi de la preuve de paiement dans le Bucket Supabase
  const handleUploadProof = async () => {
    if (!file || !orderId) return alert('Veuillez sélectionner la capture d’écran ou la photo du reçu OM/MTN.');

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${orderId}.${fileExt}`;

    // Upload de l'image dans le bucket payment-proofs
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      return alert('Erreur lors de l’envoi du reçu : ' + uploadError.message);
    }

    // Mise à jour du statut de la commande dans la table
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

  // 3. Vérification automatique du statut du paiement toutes les 3 secondes
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
      {/* EN-TÊTE DOCEXPRESS */}
      <header style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8', letterSpacing: '1px', margin: 0 }}>
          DOCEXPRESS
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
          Génération Instantanée de Documents Conformes
        </p>
      </header>

      {/* ÉTAPE 0 : SÉLECTION DU DOCUMENT */}
      {step === 'SELECT' && (
        <div>
          <h2 style={{ fontSize: '16px', marginBottom: '15px', color: '#cbd5e1' }}>Sélectionnez un document à générer :</h2>
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
                  transition: 'border 0.2s',
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

      {/* ÉTAPE 1 : FORMULAIRE CLIENT */}
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
              placeholder="Ex: Paul Biya"
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

      {/* ÉTAPE 2 : APERÇU FILIGRANÉ */}
      {step === 'PREVIEW' && (
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Vérification des informations :</h3>

          <div
            style={{
              position: 'relative',
              border: '2px dashed #475569',
              padding: '25px',
              background: '#0f172a',
              borderRadius: '8px',
              overflow: 'hidden',
              minHeight: '160px',
            }}
          >
            {/* FILIGRANE SPÉCIMEN */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-25deg)',
                fontSize: '18px',
                fontWeight: '900',
                color: 'rgba(239, 68, 68, 0.45)',
                width: '100%',
                textAlign: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              SPÉCIMEN — NON VALABLE POUR UTILISATION
            </div>

            <p style={{ margin: '6px 0' }}><strong>Document :</strong> {selectedDoc.title}</p>
            <p style={{ margin: '6px 0' }}><strong>Nom :</strong> {formData.nom}</p>
            <p style={{ margin: '6px 0' }}><strong>Téléphone :</strong> {formData.telephone}</p>
            <p style={{ margin: '6px 0' }}><strong>Ville :</strong> {formData.ville}</p>
          </div>

          <button
            onClick={() => setStep('PAYMENT')}
            style={{
              marginTop: '20px',
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

      {/* ÉTAPE 3 : CONSIGNES DE PAIEMENT OM/MTN & UPLOAD REÇU */}
      {step === 'PAYMENT' && (
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Instructions de paiement Mobile Money</h3>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            Effectuez le dépôt exact de <strong style={{ color: '#38bdf8' }}>{selectedDoc.price} FCFA</strong> vers le numéro ci-dessous :
          </p>

          <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', margin: '15px 0', fontSize: '15px', border: '1px solid #334155' }}>
            <p style={{ margin: '5px 0' }}>🟠 <strong>Orange Money / MTN :</strong> 655 06 93 96</p>
            <p style={{ margin: '5px 0', fontSize: '12px', color: '#94a3b8' }}>Nom au compte : (Atangana Desire)</p>
          </div>

          <hr style={{ borderColor: '#334155', margin: '20px 0' }} />

          <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📷 Transmettre la capture du transfert</h4>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
            Prenez une capture d'écran du SMS de confirmation OM/MTN et déposez-la ici :
          </p>

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

      {/* ÉTAPE 4 : ATTENTE VÉRIFICATION */}
      {step === 'VERIFICATION' && (
        <div style={{ textAlign: 'center', background: '#1e293b', padding: '30px 20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>⏳</div>
          <h3 style={{ color: '#f59e0b', margin: '0 0 10px 0' }}>Paiement en cours de validation</h3>
          <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
            Votre reçu a été transmis à notre équipe. La validation est en cours, cette page se mettra à jour automatiquement dès confirmation.
          </p>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '20px' }}>
            ID Référence : {orderId}
          </p>
        </div>
      )}

      {/* ÉTAPE 5 : DÉBLOCAGE ET TÉLÉCHARGEMENT PROPRE */}
      {step === 'PAID' && (
        <div style={{ textAlign: 'center', background: '#064e3b', padding: '30px 20px', borderRadius: '8px', border: '1px solid #059669' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
          <h3 style={{ color: '#34d399', margin: '0 0 10px 0' }}>Paiement Confirmé !</h3>
          <p style={{ fontSize: '14px', color: '#ecfdf5', marginBottom: '20px' }}>
            Votre document officiel sans filigrane est prêt.
          </p>

          <button
            onClick={() => window.print()}
            style={{
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
            📥 Télécharger / Imprimer mon document PDF
          </button>
        </div>
      )}
    </div>
  );
}
