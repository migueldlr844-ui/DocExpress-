'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// --- CONFIGURATION SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- LISTE DES DOCUMENTS DISPONIBLES ---
const DOCUMENTS_LIST = [
  { id: 'facture', title: 'Facture / Devis Pro', price: '1 000 FCFA', icon: '📄' },
  { id: 'contrat_bail', title: 'Contrat de Bail Habitation', price: '2 000 FCFA', icon: '🏠' },
  { id: 'attestation_travail', title: 'Attestation de Travail', price: '1 500 FCFA', icon: '💼' },
  { id: 'recu_paiement', title: 'Reçu de Paiement', price: '1 000 FCFA', icon: '🧾' },
]

export default function ClientHomePage() {
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    details: '',
  })
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoc || !formData.nom || !formData.telephone) {
      alert('Veuillez remplir tous les champs obligatoires.')
      return
    }

    setLoading(true)
    let proofUrl = ''

    try {
      // Upload de la preuve de paiement si présente
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, proofFile)

        if (uploadError) throw uploadError
        proofUrl = uploadData.path
      }

      // Enregistrement de la commande dans Supabase
      const { error: insertError } = await supabase.from('orders').insert([
        {
          customer_name: formData.nom,
          customer_phone: formData.telephone,
          document_template_id: selectedDoc.id,
          status: 'PENDING',
          payment_proof_url: proofUrl,
          form_data: {
            ...formData,
            document_title: selectedDoc.title,
          },
        },
      ])

      if (insertError) throw insertError

      setSuccess(true)
    } catch (err: any) {
      alert('Erreur lors de la commande : ' + (err.message || 'Problème réseau'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#ffffff', minHeight: '100vh', padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        {/* EN-TÊTE */}
        <header style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', margin: 0 }}>
            DOCEXPRESS
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Génération rapide de vos documents administratifs
          </p>
        </header>

        {success ? (
          /* MESSAGE DE SUCCÈS */
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #10b981', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#34d399', marginBottom: '8px' }}>
              Commande transmise avec succès !
            </h2>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
              Votre demande a bien été envoyée. L'administrateur va vérifier votre paiement et valider votre document très rapidement.
            </p>
            <button
              onClick={() => {
                setSuccess(false)
                setSelectedDoc(null)
                setFormData({ nom: '', telephone: '', details: '' })
                setProofFile(null)
              }}
              style={{ marginTop: '20px', width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Commander un autre document
            </button>
          </div>
        ) : !selectedDoc ? (
          /* SÉLECTION DU DOCUMENT */
          <div>
            <h2 style={{ fontSize: '15px', color: '#cbd5e1', marginBottom: '12px', fontWeight: 'bold' }}>
              Choisissez le document à générer :
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {DOCUMENTS_LIST.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  style={{
                    backgroundColor: '#1e293b',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{doc.icon}</span>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffffff' }}>{doc.title}</div>
                      <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px' }}>Tarif : {doc.price}</div>
                    </div>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '18px' }}>➔</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* FORMULAIRE & PAIEMENT */
          <form onSubmit={handleSubmitOrder} style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              style={{ backgroundColor: 'transparent', color: '#38bdf8', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '16px', fontSize: '13px' }}
            >
              ⬅️ Changer de document
            </button>

            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
              Formulaire : {selectedDoc.title}
            </h2>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Nom complet *</label>
              <input
                type="text"
                name="nom"
                required
                value={formData.nom}
                onChange={handleInputChange}
                placeholder="Ex: Jean Dupont"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#ffffff', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Numéro de Téléphone / WhatsApp *</label>
              <input
                type="tel"
                name="telephone"
                required
                value={formData.telephone}
                onChange={handleInputChange}
                placeholder="Ex: 6XXXXXXXX"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#ffffff', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Détails / Informations à inclure</label>
              <textarea
                name="details"
                rows={3}
                value={formData.details}
                onChange={handleInputChange}
                placeholder="Précisez les montants, dates ou informations spécifiques..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#ffffff', boxSizing: 'border-box' }}
              />
            </div>

            {/* CONSIGNES DE PAIEMENT */}
            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #0284c7', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>💳 Paiement Mobile Money ({selectedDoc.price})</div>
              <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>
                Effectuez le dépôt/transfert vers le numéro Orange Money ou MTN Mobile Money, puis joignez la capture d'écran du reçu ci-dessous.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Capture du reçu de paiement</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#ffffff', fontSize: '12px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer la commande'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
