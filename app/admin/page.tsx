'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement:', error)
    } else if (data) {
      setOrders(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleValidatePayment = async (orderId: string) => {
    setUpdatingId(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'PAID' })
      .eq('id', orderId)

    if (error) {
      alert('Erreur lors de la validation : ' + error.message)
    } else {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: 'PAID' } : order
        )
      )
    }
    setUpdatingId(null)
  }

  // Fonction pour récupérer l'URL publique de la capture d'écran
  const getProofImageUrl = (filePath?: string) => {
    if (!filePath) return null
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath
    }
    const { data } = supabase.storage.from('payment-proofs').getPublicUrl(filePath)
    return data?.publicUrl || null
  }

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#ffffff', minHeight: '100vh', padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', margin: 0 }}>DOCEXPRESS Admin</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>Validation des paiements</p>
          </div>
          <button
            onClick={fetchOrders}
            style={{ backgroundColor: '#1e293b', color: '#ffffff', border: '1px solid #475569', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
          >
            🔄 Rafraîchir
          </button>
        </div>

        {/* Liste des commandes */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>Chargement...</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>Aucune commande trouvée.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order) => {
              const isPaid = order.status === 'PAID'
              
              // Données client
              const clientName = order.customer_name || order.full_name || order.form_data?.nom || 'Client Inconnu'
              const clientPhone = order.customer_phone || order.phone || order.form_data?.telephone || 'Non renseigné'
              const docTitle = order.form_data?.document_title || order.document_template_id || 'Document'
              
              // Récupération de l'image de preuve
              const proofPath = order.payment_proof_url || order.receipt_url
              const imageUrl = getProofImageUrl(proofPath)

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#ffffff' }}>{clientName}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: isPaid ? '#34d399' : '#fbbf24',
                        border: isPaid ? '1px solid #059669' : '1px solid #d97706'
                      }}
                    >
                      {isPaid ? 'PAYÉ' : 'EN ATTENTE'}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                    <p style={{ margin: '2px 0' }}>📞 <strong>Tél :</strong> {clientPhone}</p>
                    <p style={{ margin: '2px 0' }}>📄 <strong>Document :</strong> {docTitle}</p>
                    <p style={{ margin: '2px 0', fontSize: '11px', color: '#64748b' }}>
                      🕒 {new Date(order.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>

                  {/* AFFICHAGE DIRECT DE LA CAPTURE D'ÉCRAN */}
                  {imageUrl ? (
                    <div style={{ marginTop: '8px' }}>
                      <p style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold', marginBottom: '6px' }}>
                        📷 Capture du reçu reçu :
                      </p>
                      <a href={imageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={imageUrl}
                          alt="Preuve de paiement"
                          style={{
                            width: '100%',
                            maxHeight: '300px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            border: '1px solid #475569',
                            backgroundColor: '#0f172a'
                          }}
                        />
                      </a>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#ef4444', fontStyle: 'italic' }}>
                      ⚠️ Aucune capture d'écran jointe pour cette commande.
                    </p>
                  )}

                  {!isPaid ? (
                    <button
                      onClick={() => handleValidatePayment(order.id)}
                      disabled={updatingId === order.id}
                      style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      {updatingId === order.id ? 'Validation...' : '✅ Valider le paiement'}
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#34d399', fontWeight: 'bold', marginTop: '4px' }}>
                      ✓ Paiement confirmé
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
