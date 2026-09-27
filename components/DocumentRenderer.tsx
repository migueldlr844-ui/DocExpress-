'use client';

interface DocumentProps {
  docType: string;
  formData: {
    nom: string;
    telephone: string;
    ville: string;
  };
  isWatermarked?: boolean;
}

export default function DocumentRenderer({ docType, formData, isWatermarked = false }: DocumentProps) {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      style={{
        position: 'relative',
        background: '#ffffff',
        color: '#0f172a',
        padding: '30px 20px',
        borderRadius: '8px',
        fontFamily: "'Times New Roman', serif",
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        margin: '15px 0',
        overflow: 'hidden',
      }}
    >
      {/* FILIGRANE SPÉCIMEN SI PAS ENCORE PAYÉ */}
      {isWatermarked && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'rgba(220, 38, 38, 0.3)',
            width: '100%',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            border: '3px dashed rgba(220, 38, 38, 0.3)',
            padding: '10px 0',
            zIndex: 10,
          }}
        >
          SPÉCIMEN — DOCEXPRESS
        </div>
      )}

      {/* EN-TÊTE DU DOCUMENT */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
          {docType}
        </h2>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
          Document Officiel — Fait à {formData.ville || 'Yaoundé'}, le {currentDate}
        </p>
      </div>

      {/* RENDER EN FONCTION DU DOCUMENT SÉLECTIONNÉ */}

      {/* 1. QUITTANCE DE LOYER */}
      {docType.toLowerCase().includes('quittance') && (
        <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
          <p>
            Je soussigné(e), bailleur / gestionnaire du bien immobilier, atteste par la présente avoir reçu de :
          </p>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #0284c7', margin: '15px 0' }}>
            <p style={{ margin: '2px 0' }}><strong>Nom & Prénom :</strong> {formData.nom || '___________________'}</p>
            <p style={{ margin: '2px 0' }}><strong>Téléphone :</strong> {formData.telephone || '___________________'}</p>
            <p style={{ margin: '2px 0' }}><strong>Ville :</strong> {formData.ville || 'Yaoundé'}</p>
          </div>
          <p>
            La somme totale convenue au titre du règlement du loyer et des charges locatives relatives à la période en cours.
          </p>
        </div>
      )}

      {/* 2. CONTRAT DE BAIL */}
      {docType.toLowerCase().includes('bail') && (
        <div style={{ fontSize: '13px', lineHeight: '1.7' }}>
          <h4 style={{ textDecoration: 'underline', marginBottom: '5px' }}>ARTICLE 1 : DÉSIGNATION DES PARTIES</h4>
          <p style={{ margin: '3px 0' }}><strong>Preneur (Locataire) :</strong> M./Mme {formData.nom || '___________________'}, résidant à {formData.ville || 'Yaoundé'} (Tél: {formData.telephone || '______'}).</p>

          <h4 style={{ textDecoration: 'underline', marginTop: '12px', marginBottom: '5px' }}>ARTICLE 2 : OBJET DU CONTRAT</h4>
          <p style={{ margin: '3px 0' }}>
            Le bailleur cède l'usage du bien immobilier situé dans la ville de {formData.ville || 'Yaoundé'} selon les termes convenus.
          </p>

          <h4 style={{ textDecoration: 'underline', marginTop: '12px', marginBottom: '5px' }}>ARTICLE 3 : ENGAGEMENT DU PRENEUR</h4>
          <p style={{ margin: '3px 0' }}>
            Le locataire s'engage à payer le loyer aux dates prévues et à conserver le logement en bon état d'usage.
          </p>
        </div>
      )}

      {/* 3. TOUS LES AUTRES DOCUMENTS (Facture, Reçu, CV...) */}
      {!docType.toLowerCase().includes('quittance') && !docType.toLowerCase().includes('bail') && (
        <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
          <p><strong>Bénéficiaire :</strong> {formData.nom}</p>
          <p><strong>Contact :</strong> {formData.telephone}</p>
          <p><strong>Ville :</strong> {formData.ville}</p>
          <p style={{ marginTop: '15px' }}>
            Attestation délivrée pour servir et valoir ce que de droit dans le cadre de la prestation : <strong>{docType}</strong>.
          </p>
        </div>
      )}

      {/* SIGNATURE & CACHET */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '35px', paddingTop: '15px', borderTop: '1px solid #cbd5e1', fontSize: '12px' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Le Client / Preneur :</p>
          <p style={{ color: '#94a3b8', marginTop: '25px' }}>Signature</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>DocExpress / Sceau :</p>
          <div style={{ width: '70px', height: '32px', border: '1px dashed #0284c7', margin: '8px 0 0 auto', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#0284c7' }}>
            CONFORME
          </div>
        </div>
      </div>
    </div>
  );
}
