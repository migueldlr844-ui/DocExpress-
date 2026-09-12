// components/DocumentRenderer.tsx

import React from 'react';

interface Props {
  productId: string;
  data: any;
  isWatermarked: boolean;
}

export const DocumentRenderer: React.FC<Props> = ({ productId, data, isWatermarked }) => {
  return (
    <div style={{
      width: '100%',
      backgroundColor: '#FFFFFF',
      color: '#000000',
      padding: '2.5rem',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      fontSize: '0.9rem',
      lineHeight: '1.5',
      minHeight: '800px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }}>
      {/* FILIGRANE SPÉCIMEN */}
      {isWatermarked && (
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '5%',
          width: '90%',
          transform: 'rotate(-30deg)',
          fontSize: '2.2rem',
          fontWeight: '900',
          color: 'rgba(230, 57, 70, 0.22)',
          textAlign: 'center',
          border: '4px dashed rgba(230, 57, 70, 0.22)',
          padding: '1rem',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 10
        }}>
          SPÉCIMEN — NON VALABLE POUR UTILISATION
        </div>
      )}

      {/* AVERTISSEMENT JURIDIQUE EN PIED DE PAGE */}
      <div style={{
        position: 'absolute',
        bottom: '0.8rem',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '0.65rem',
        color: '#777',
        borderTop: '1px solid #eee',
        paddingTop: '0.4rem'
      }}>
        Modèle généré à partir des informations fournies par l'utilisateur via DocExpress. Ce document constitue un modèle indicatif et doit être adapté à la situation concernée.
      </div>

      {/* 1. CONTRAT DE BAIL D'HABITATION */}
      {productId === 'bail' && (
        <div>
          <h2 style={{ textAlign: 'center', textTransform: 'uppercase', borderBottom: '2px solid #000', paddingBottom: '0.5rem' }}>
            CONTRAT DE BAIL À USAGE D’HABITATION
          </h2>
          <p><strong>1. BAILLEUR :</strong> {data.bailleur_nom} | Tél: {data.bailleur_phone} | Adresse: {data.bailleur_adresse} | Prof: {data.bailleur_profession} | {data.bailleur_type_id}: {data.bailleur_num_id}</p>
          <p><strong>2. LOCATAIRE :</strong> {data.locataire_nom} | Tél: {data.locataire_phone} | Adresse: {data.locataire_adresse} | Prof: {data.locataire_profession} | {data.locataire_type_id}: {data.locataire_num_id}</p>
          <p><strong>3. DÉSIGNATION DE L'IMMEUBLE :</strong> {data.logement_type} situé à {data.logement_adresse}, Quartier {data.logement_quartier}, {data.logement_ville}. {data.logement_pieces} pièces, Étage: {data.logement_etage}. Description: {data.logement_desc}</p>
          <p><strong>4. CONDITIONS FINANCIÈRES :</strong> Loyer mensuel: <strong>{data.loyer_montant} FCFA</strong> | Charges: {data.loyer_charges || 0} FCFA | Caution: {data.loyer_caution} FCFA | Avance: {data.loyer_avance} FCFA.</p>
          <p>Paiement par {data.loyer_mode} au plus tard le {data.loyer_jour_paiement} de chaque mois.</p>
          <p><strong>5. DURÉE :</strong> Prise d'effet le {data.duree_debut} pour une durée de {data.duree_mois} mois (Fin: {data.duree_fin || 'N/A'}).</p>
          <p><strong>6. OBSERVATIONS & CLÉS :</strong> {data.keys_count} clés remises. État des lieux: {data.etat_lieux}. {data.observations}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
            <div>Fait à {data.fait_a}, le {data.fait_le}<br /><br /><strong>Le Bailleur</strong></div>
            <div><br /><br /><strong>Le Locataire</strong></div>
          </div>
        </div>
      )}

      {/* 2. QUITTANCE DE LOYER */}
      {productId === 'quittance' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '0.5rem' }}>
            <h2>QUITTANCE DE LOYER</h2>
            <div style={{ textAlign: 'right' }}>
              <strong>N° Quittance :</strong> {data.auto_num}<br />
              <strong>Date d'émission :</strong> {data.auto_date}
            </div>
          </div>
          <p style={{ marginTop: '1.5rem' }}>Je soussigné(e) <strong>{data.bailleur_nom}</strong> ({data.bailleur_phone}), bailleur du logement situé à {data.logement_adresse}, {data.logement_quartier} - {data.logement_ville}, reconnaît avoir reçu de M./Mme <strong>{data.locataire_nom}</strong> la somme de :</p>
          <div style={{ backgroundColor: '#F8F9FA', padding: '1rem', border: '1px solid #DDD', margin: '1rem 0' }}>
            <p style={{ margin: 0 }}>Loyer : {data.loyer} FCFA</p>
            <p style={{ margin: 0 }}>Charges : {data.charges || 0} FCFA</p>
            <p style={{ margin: 0, fontWeight: 'bold', borderTop: '1px solid #CCC', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              TOTAL REÇU : {Number(data.loyer || 0) + Number(data.charges || 0)} FCFA
            </p>
          </div>
          <p>Au titre du paiement du loyer et des charges pour la période du <strong>{data.periode_debut}</strong> au <strong>{data.periode_fin}</strong>.</p>
          <p>Mode de paiement : {data.mode_paiement}</p>
          <div style={{ textAlign: 'right', marginTop: '3rem' }}>
            Fait à {data.fait_a}, le {data.fait_le}<br /><br />
            <strong>Le Bailleur</strong>
          </div>
        </div>
      )}
    </div>
  );
};
