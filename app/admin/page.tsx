'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialisation du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Order {
  id: string
  created_at: string
  full_name: string
  phone: string
  document_type: string
  status: string
  receipt_url?: string
  amount?: number
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Charger les commandes
  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors du chargement des commandes :', error)
    } else if (data) {
      setOrders(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Valider le paiement d'une commande
  const handleValidatePayment = async (orderId: string) => {
    setUpdatingId(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'PAID' })
      .eq('id', orderId)

    if (error) {
      alert('Erreur lors de la validation du paiement : ' + error.message)
    } else {
      // Mettre à jour la liste locale
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: 'PAID' } : order
        )
      )
    }
    setUpdatingId(null)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">DOCEXPRESS — Administration</h1>
            <p className="text-sm text-slate-400">Gestion et validation des paiements Mobile Money</p>
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            🔄 Rafraîchir
          </button>
        </div>

        {/* Liste des commandes */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Chargement des commandes...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Aucune commande trouvée.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isPaid = order.status === 'PAID'
              return (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg text-white">{order.full_name || 'Client Inconnu'}</span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isPaid ? 'PAYÉ' : 'EN ATTENTE DE VÉRIFICATION'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400">
                      Téléphone : <span className="text-slate-200">{order.phone || 'Non renseigné'}</span> | Type :{' '}
                      <span className="text-slate-200">{order.document_type || 'Document'}</span>
                    </p>

                    <p className="text-xs text-slate-500">
                      ID : {order.id} • {new Date(order.created_at).toLocaleString('fr-FR')}
                    </p>

                    {order.receipt_url && (
                      <a
                        href={order.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs text-blue-400 underline mt-1 hover:text-blue-300"
                      >
                        📎 Voir la preuve de paiement (Reçu)
                      </a>
                    )}
                  </div>

                  {/* Bouton d'action */}
                  <div>
                    {!isPaid ? (
                      <button
                        onClick={() => handleValidatePayment(order.id)}
                        disabled={updatingId === order.id}
                        className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow transition disabled:opacity-50"
                      >
                        {updatingId === order.id ? 'Validation...' : '✅ Valider le paiement'}
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-800/40">
                        Paiement confirmé
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
