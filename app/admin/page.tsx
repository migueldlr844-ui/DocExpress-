'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// --- CONFIGURATION ---
const ADMIN_PASSWORD = 'admin123'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [passwordInput, setPasswordInput] = useState<string>('')
  const [passwordError, setPasswordError] = useState<boolean>(false)

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  useEffect(() => {
    const savedAuth = localStorage.getItem('doc_express_admin_auth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    const cleanInput = passwordInput.trim().toLowerCase()
    const cleanTarget = ADMIN_PASSWORD.trim().toLowerCase()

    if (cleanInput === cleanTarget) {
      setIsAuthenticated(true)
      localStorage.setItem('doc_express_admin_auth', 'true')
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('doc_express_admin_auth')
    setPasswordInput('')
  }

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
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated])

  // =========================================================
  // VALIDATION DU PAIEMENT
  // Le statut utilisé ici est "completed", comme dans
  // app/page.tsx
  // =========================================================
  const handleValidatePayment = async (orderId: string) => {
    setUpdatingId(orderId)

    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)

    if (error) {
      alert('Erreur lors de la validation : ' + error.message)
    } else {
      // Mise à jour immédiate de la liste locale
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: 'completed' }
            : order
        )
      )

      // Mise à jour immédiate de la commande sélectionnée
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({
          ...prev,
          status: 'completed'
        }))
      }
    }

    setUpdatingId(null)
  }

  const getProofImageUrl = (filePath?: string) => {
    if (!filePath) return null

    if (
      filePath.startsWith('http://') ||
      filePath.startsWith('https://')
    ) {
      return filePath
    }

    const { data } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filePath)

    return data?.publicUrl || null
  }

  return (
    <>
      <style>{`
        @keyframes adminFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes adminPopIn {
          0% {
            opacity: 0;
            transform: scale(0.94);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes adminGlow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
          }

          50% {
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
          }
        }

        @keyframes adminShake {
          0%, 100% {
            transform: translateX(0);
          }

          20%, 60% {
            transform: translateX(-6px);
          }

          40%, 80% {
            transform: translateX(6px);
          }
        }

        .anim-fade {
          animation: adminFadeIn 0.35s ease-out forwards;
        }

        .anim-pop {
          animation: adminPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .anim-glow {
          animation: adminGlow 3s infinite ease-in-out;
        }

        .anim-shake {
          animation: adminShake 0.3s ease-in-out;
        }

        .admin-card {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .admin-card:hover {
          transform: translateY(-2px);
          border-color: #38bdf8 !important;
        }
      `}</style>

      {!isAuthenticated ? (
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: 'sans-serif'
          }}
        >
          <form
            onSubmit={handleLogin}
            className={`anim-pop anim-glow ${
              passwordError ? 'anim-shake' : ''
            }`}
            style={{
              backgroundColor: '#1e293b',
              padding: '28px',
              borderRadius: '16px',
              border: '1px solid #334155',
              width: '100%',
              maxWidth: '360px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '36px',
                marginBottom: '8px'
              }}
            >
              🔐
            </div>

            <h1
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#38bdf8',
                marginBottom: '8px'
              }}
            >
              Espace Administrateur
            </h1>

            <p
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                marginBottom: '20px'
              }}
            >
              Entrez votre mot de passe pour continuer.
            </p>

            <input
              type="text"
              placeholder="Mot de passe"
              autoCapitalize="none"
              autoCorrect="off"
              value={passwordInput}
              onChange={(e) =>
                setPasswordInput(e.target.value)
              }
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '14px',
                marginBottom: '12px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />

            {passwordError && (
              <p
                style={{
                  color: '#ef4444',
                  fontSize: '12px',
                  marginBottom: '12px',
                  fontWeight: 'bold'
                }}
              >
                Mot de passe incorrect !
              </p>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Se connecter
            </button>
          </form>
        </div>
      ) : selectedOrder ? (
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            minHeight: '100vh',
            padding: '16px',
            fontFamily: 'sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              margin: '0 auto'
            }}
            className="anim-fade"
          >
            <button
              onClick={() => setSelectedOrder(null)}
              style={{
                backgroundColor: '#334155',
                color: '#ffffff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ⬅️ Retour à la liste
            </button>

            <div
              style={{
                backgroundColor: '#1e293b',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
              className="anim-pop"
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    margin: 0,
                    color: '#ffffff'
                  }}
                >
                  Détail de la commande
                </h2>

                <span
                  style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    backgroundColor:
                      selectedOrder.status === 'completed'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                    color:
                      selectedOrder.status === 'completed'
                        ? '#34d399'
                        : '#fbbf24',
                    border:
                      selectedOrder.status === 'completed'
                        ? '1px solid #059669'
                        : '1px solid #d97706'
                  }}
                >
                  {selectedOrder.status === 'completed'
                    ? 'PAYÉ'
                    : 'EN ATTENTE'}
                </span>
              </div>

              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#cbd5e1'
                }}
              >
                <p style={{ margin: '4px 0' }}>
                  👤 <strong>Client :</strong>{' '}
                  {selectedOrder.customer_name ||
                    selectedOrder.full_name ||
                    selectedOrder.form_data?.nom ||
                    'Client Inconnu'}
                </p>

                <p style={{ margin: '4px 0' }}>
                  📞 <strong>Téléphone :</strong>{' '}
                  {selectedOrder.customer_phone ||
                    selectedOrder.phone ||
                    selectedOrder.form_data?.telephone ||
                    'Non renseigné'}
                </p>

                <p style={{ margin: '4px 0' }}>
                  📄 <strong>Document :</strong>{' '}
                  {selectedOrder.form_data?.document_title ||
                    selectedOrder.document_template_id ||
                    'Document'}
                </p>

                <p
                  style={{
                    margin: '4px 0',
                    fontSize: '12px',
                    color: '#64748b'
                  }}
                >
                  🕒 Date :{' '}
                  {new Date(
                    selectedOrder.created_at
                  ).toLocaleString('fr-FR')}
                </p>

                <p
                  style={{
                    margin: '4px 0',
                    fontSize: '10px',
                    color: '#475569'
                  }}
                >
                  ID : {selectedOrder.id}
                </p>
              </div>

              {getProofImageUrl(
                selectedOrder.payment_proof_url ||
                  selectedOrder.receipt_url
              ) ? (
                <div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#38bdf8',
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}
                  >
                    📷 Capture du reçu Mobile Money :
                  </p>

                  <a
                    href={
                      getProofImageUrl(
                        selectedOrder.payment_proof_url ||
                          selectedOrder.receipt_url
                      )!
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={
                        getProofImageUrl(
                          selectedOrder.payment_proof_url ||
                            selectedOrder.receipt_url
                        )!
                      }
                      alt="Preuve de paiement"
                      style={{
                        width: '100%',
                        maxHeight: '450px',
                        objectFit: 'contain',
                        borderRadius: '12px',
                        border: '1px solid #475569',
                        backgroundColor: '#0f172a'
                      }}
                    />
                  </a>
                </div>
              ) : (
                <p
                  style={{
                    fontSize: '13px',
                    color: '#ef4444',
                    fontStyle: 'italic'
                  }}
                >
                  ⚠️ Aucune capture d'écran jointe.
                </p>
              )}

              {selectedOrder.status !== 'completed' ? (
                <button
                  onClick={() =>
                    handleValidatePayment(
                      selectedOrder.id
                    )
                  }
                  disabled={
                    updatingId === selectedOrder.id
                  }
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    cursor: 'pointer',
                    marginTop: '12px'
                  }}
                >
                  {updatingId === selectedOrder.id
                    ? 'Validation en cours...'
                    : '✅ Valider le paiement'}
                </button>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#34d399',
                    fontWeight: 'bold',
                    padding: '10px',
                    backgroundColor:
                      'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px'
                  }}
                >
                  ✓ Paiement confirmé
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            minHeight: '100vh',
            padding: '16px',
            fontFamily: 'sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              margin: '0 auto'
            }}
            className="anim-fade"
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid #334155',
                paddingBottom: '12px'
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#38bdf8',
                    margin: 0
                  }}
                >
                  DOCEXPRESS Admin
                </h1>

                <p
                  style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    margin: '4px 0 0 0'
                  }}
                >
                  Liste des commandes
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <button
                  onClick={fetchOrders}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    border: '1px solid #475569',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🔄
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: '#7f1d1d',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Déconnexion
                </button>
              </div>
            </div>

            {loading ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#94a3b8',
                  marginTop: '40px'
                }}
              >
                Chargement des commandes...
              </p>
            ) : orders.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#94a3b8',
                  marginTop: '40px'
                }}
              >
                Aucune commande trouvée.
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {orders.map((order) => {
                  const isPaid =
                    order.status === 'completed'

                  const clientName =
                    order.customer_name ||
                    order.full_name ||
                    order.form_data?.nom ||
                    'Client Inconnu'

                  const clientPhone =
                    order.customer_phone ||
                    order.phone ||
                    order.form_data?.telephone ||
                    'Non renseigné'

                  return (
                    <div
                      key={order.id}
                      onClick={() =>
                        setSelectedOrder(order)
                      }
                      className="admin-card anim-fade"
                      style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #334155',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 'bold',
                            fontSize: '15px',
                            color: '#ffffff',
                            marginBottom: '4px'
                          }}
                        >
                          {clientName}
                        </div>

                        <div
                          style={{
                            fontSize: '12px',
                            color: '#94a3b8'
                          }}
                        >
                          📞 {clientPhone}
                        </div>

                        <div
                          style={{
                            fontSize: '11px',
                            color: '#64748b',
                            marginTop: '2px'
                          }}
                        >
                          🕒{' '}
                          {new Date(
                            order.created_at
                          ).toLocaleString('fr-FR')}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '6px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            backgroundColor: isPaid
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                            color: isPaid
                              ? '#34d399'
                              : '#fbbf24',
                            border: isPaid
                              ? '1px solid #059669'
                              : '1px solid #d97706'
                          }}
                        >
                          {isPaid
                            ? 'PAYÉ'
                            : 'EN ATTENTE'}
                        </span>

                        <span
                          style={{
                            fontSize: '12px',
                            color: '#38bdf8'
                          }}
                        >
                          Voir 🔍
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
