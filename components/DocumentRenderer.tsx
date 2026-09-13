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
            <p style={{ margin: 0 }}>Autres frais : {data.autres_frais || 0} FCFA</p>
            <hr />
            <h3 style={{ margin: 0 }}>TOTAL ACQUITTÉ : {Number(data.loyer || 0) + Number(data.charges || 0) + Number(data.autres_frais || 0)} FCFA</h3>
          </div>
          <p>Pour le loyer et les charges du mois / période de : <strong>{data.mois_concerne} ({data.periode})</strong>.</p>
          <p>Paiement effectué le {data.date_paiement} par {data.mode_paiement} (Réf: {data.ref_transaction || 'N/A'}).</p>
          <p style={{ marginTop: '3rem', textAlign: 'right' }}><strong>Le Bailleur (Signature)</strong></p>
        </div>
      )}

      {/* 3. REÇU DE PAIEMENT DE LOYER */}
      {productId === 'recu_loyer' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '0.5rem' }}>
            <h2>REÇU DE PAIEMENT DE LOYER</h2>
            <div><strong>N° Reçu :</strong> {data.auto_num}</div>
          </div>
          <p style={{ marginTop: '1.5rem' }}>Reçu de M./Mme <strong>{data.locataire_nom}</strong> ({data.locataire_phone})</p>
          <p>La somme de : <strong>{data.montant_recu} FCFA</strong></p>
          <p>Motif : {data.motif} - Période : {data.periode}</p>
          <p>Logement : {data.logement_adresse}, {data.logement_quartier} ({data.logement_ville})</p>
          <p>Paiement du {data.date_paiement} via {data.mode_paiement} (Réf: {data.ref_transaction || 'N/A'}).</p>
          <p>Observations : {data.observations}</p>
          <p style={{ marginTop: '3rem' }}>Fait à {data.fait_a}, le {data.fait_le}</p>
        </div>
      )}

      {/* 4. ATTESTATION LIÉE À LA LOCATION */}
      {productId === 'attestation_location' && (
        <div>
          <h2 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '2rem' }}>{data.type_attestation}</h2>
          <p>Je soussigné(e) <strong>{data.emetteur_nom}</strong>, agissant en qualité de {data.emetteur_qualite}, demeurant au {data.emetteur_adresse} (Tél: {data.emetteur_phone}),</p>
          <p style={{ marginTop: '1.5rem' }}>Atteste par la présente que M./Mme <strong>{data.beneficiaire_nom}</strong> (Né(e) le : {data.beneficiaire_dob || 'N/A'}), demeurant au {data.beneficiaire_adresse},</p>
          <p style={{ marginTop: '1.5rem' }}>Occupe / a occupé le logement situé à : {data.logement_adresse}, Quartier {data.logement_quartier}, {data.logement_ville}, pour la période du {data.date_debut} au {data.date_fin}.</p>
          <p style={{ marginTop: '1.5rem' }}>Déclaration complémentaire : {data.declaration}</p>
          <p style={{ marginTop: '3rem', textAlign: 'right' }}>Fait à {data.fait_a}, le {data.fait_le}<br /><br /><strong>Signature</strong></p>
        </div>
      )}

      {/* 5. FACTURE SIMPLE & 6. FACTURE PROFORMA */}
      {(productId === 'facture' || productId === 'proforma') && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, color: '#111' }}>{data.vendeur_entreprise}</h1>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>{data.vendeur_adresse}, {data.vendeur_ville}<br />Tél/WA: {data.vendeur_phone} / {data.vendeur_whatsapp}<br />Email: {data.vendeur_email}<br />NIU: {data.vendeur_niu} | RCCM: {data.vendeur_rccm}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, color: productId === 'proforma' ? '#E63946' : '#000' }}>
                {productId === 'proforma' ? 'FACTURE PROFORMA' : 'FACTURE'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>N°: {data.facture_num}<br />Date: {data.facture_date}<br />Échéance/Validité: {data.facture_echeance}</p>
            </div>
          </div>
          <hr style={{ margin: '1.5rem 0' }} />
          <div style={{ backgroundColor: '#F8F9FA', padding: '1rem', borderRadius: '4px' }}>
            <strong>CLIENT :</strong> {data.client_nom}<br />
            Tél: {data.client_phone} | Email: {data.client_email}<br />
            Adresse: {data.client_adresse}
          </div>
          <p style={{ marginTop: '1rem' }}><strong>Objet :</strong> {data.facture_objet}</p>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#1C2541', color: '#FFF' }}>
                <th style={{ border: '1px solid #CCC', padding: '0.5rem', textAlign: 'left' }}>Désignation</th>
                <th style={{ border: '1px solid #CCC', padding: '0.8rem', textAlign: 'center' }}>Qté</th>
                <th style={{ border: '1px solid #CCC', padding: '0.8rem', textAlign: 'right' }}>P.U (FCFA)</th>
                <th style={{ border: '1px solid #CCC', padding: '0.8rem', textAlign: 'right' }}>Remise</th>
                <th style={{ border: '1px solid #CCC', padding: '0.8rem', textAlign: 'right' }}>Total (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((item: any, idx: number) => {
                const lineTotal = (Number(item.qte || 0) * Number(item.pu || 0)) - Number(item.remise || 0);
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #CCC', padding: '0.5rem' }}>{item.designation} {item.ref && `(Réf: ${item.ref})`}</td>
                    <td style={{ border: '1px solid #CCC', padding: '0.5rem', textAlign: 'center' }}>{item.qte}</td>
                    <td style={{ border: '1px solid #CCC', padding: '0.5rem', textAlign: 'right' }}>{item.pu}</td>
                    <td style={{ border: '1px solid #CCC', padding: '0.5rem', textAlign: 'right' }}>{item.remise || 0}</td>
                    <td style={{ border: '1px solid #CCC', padding: '0.5rem', textAlign: 'right' }}>{lineTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '250px', textAlign: 'right' }}>
              <p style={{ margin: '0.2rem 0' }}>Sous-total : {data.subtotal} FCFA</p>
              <p style={{ margin: '0.2rem 0' }}>Total Remises : {data.total_remise} FCFA</p>
              <h3 style={{ margin: '0.5rem 0', borderTop: '2px solid #000', paddingTop: '0.5rem' }}>TOTAL : {data.total_final} FCFA</h3>
            </div>
          </div>

          {productId === 'proforma' && (
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#555' }}>
              <p>Conditions de livraison: {data.livraison_conditions} | Délai: {data.livraison_delai}</p>
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <div>Paiement: {data.mode_paiement} ({data.conditions_paiement})</div>
            <div><strong>Cachet / Signature</strong></div>
          </div>
        </div>
      )}

      {/* 7. REÇU DE VENTE */}
      {productId === 'recu_vente' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '0.5rem' }}>
            <h2>REÇU DE VENTE</h2>
            <div><strong>N° :</strong> {data.auto_num}<br />Date: {data.date_vente}</div>
          </div>
          <p><strong>Vendeur :</strong> {data.vendeur_nom} ({data.vendeur_phone}) | {data.vendeur_adresse}</p>
          <p><strong>Acheteur :</strong> {data.acheteur_nom} ({data.acheteur_phone})</p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#EEE' }}>
                <th style={{ border: '1px solid #CCC', padding: '0.4rem' }}>Article</th>
                <th style={{ border: '1px solid #CCC', padding: '0.4rem' }}>Qté</th>
                <th style={{ border: '1px solid #CCC', padding: '0.4rem' }}>P.U</th>
                <th style={{ border: '1px solid #CCC', padding: '0.4rem' }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #CCC', padding: '0.4rem' }}>{item.produit}</td>
                  <td style={{ border: '1px solid #CCC', padding: '0.4rem', textAlign: 'center' }}>{item.qte}</td>
                  <td style={{ border: '1px solid #CCC', padding: '0.4rem', textAlign: 'right' }}>{item.pu}</td>
                  <td style={{ border: '1px solid #CCC', padding: '0.4rem', textAlign: 'right' }}>{Number(item.qte || 0) * Number(item.pu || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <p><strong>Total Général : {data.total_calcule} FCFA</strong></p>
            <p>Montant Reçu : {data.montant_recu} FCFA | Reste : {data.reste_a_payer} FCFA</p>
            <p>Réf Paiement ({data.mode_paiement}) : {data.ref_transaction}</p>
          </div>
          <p style={{ marginTop: '2rem' }}>Fait à {data.fait_a}. Notes: {data.observations}</p>
        </div>
      )}

      {/* 8. BON DE COMMANDE */}
      {productId === 'bon_commande' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '0.5rem' }}>
            <h2>BON DE COMMANDE</h2>
            <div><strong>N° BC :</strong> {data.auto_num}<br />Date : {data.date_bc}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <div><strong>ACHETEUR :</strong><br />{data.acheteur_nom}<br />{data.acheteur_adresse}<br />Tél: {data.acheteur_phone} | Email: {data.acheteur_email}</div>
            <div><strong>FOURNISSEUR :</strong><br />{data.fournisseur_nom}<br />{data.fournisseur_adresse}<br />Tél: {data.fournisseur_phone} | Email: {data.fournisseur_email}</div>
          </div>
          <p style={{ marginTop: '1rem' }}><strong>Livraison :</strong> {data.livraison_adresse}, {data.livraison_ville} (Date souhaitée: {data.livraison_date}) | Mode: {data.livraison_mode}</p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#1C2541', color: '#FFF' }}>
                <th style={{ border: '1px solid #CCC', padding: '0.5rem' }}>Désignation</th>
                <th style={{ border: '1px solid #CCC', padding: '0.5rem' }}>Qté</th>
                <th style={{ border: '1px solid #CCC', padding: '0.5rem' }}>P.U</th>
                <th style={{ border: '1px solid #CCC', padding: '0.5rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #CCC', padding: '0.5rem' }}>{item.designation} (Réf: {item.ref})</td>
                  <td style={{ border: '1px solid #CCC', padding: '0.5rem', textAlign: 'center' }}>{item.qte}</td>
                  <td style={{ border: '1px solid #CCC', padding: '0.5rem', textAlign: 'right' }}>{item.pu}</td>
                  <td style={{ border: '1px solid #CCC', padding: '0.5rem', textAlign: 'right' }}>{(Number(item.qte) * Number(item.pu)) - Number(item.remise || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <h3>TOTAL COMMANDE : {data.total_final} FCFA</h3>
            <p>Acompte : {data.acompte || 0} FCFA | Solde : {data.solde || data.total_final} FCFA</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
            <div>Visa Acheteur</div>
            <div>Acceptation Fournisseur</div>
          </div>
        </div>
      )}

      {/* 9. CV PROFESSIONNEL */}
      {productId === 'cv' && (
        <div>
          <div style={{ borderBottom: '3px solid #4361EE', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h1 style={{ margin: 0, color: '#1C2541', textTransform: 'uppercase' }}>{data.nom} {data.prenom}</h1>
            <h3 style={{ margin: '0.2rem 0', color: '#4361EE' }}>{data.poste_intitule} ({data.niveau_exp})</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
              {data.ville}, {data.adresse} | Tél/WA: {data.phone} / {data.whatsapp} | Email: {data.email}
              {data.linkedin && ` | LinkedIn: ${data.linkedin}`}
            </p>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <h4 style={{ backgroundColor: '#F0F2F5', padding: '0.3rem 0.5rem', margin: '0 0 0.5rem 0', color: '#1C2541' }}>PROFIL PROFESSIONNEL</h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{data.profil_resume}</p>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <h4 style={{ backgroundColor: '#F0F2F5', padding: '0.3rem 0.5rem', margin: '0 0 0.5rem 0', color: '#1C2541' }}>EXPÉRIENCES PROFESSIONNELLES</h4>
            {data.experiences?.map((exp: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '0.8rem' }}>
                <strong style={{ fontSize: '0.9rem' }}>{exp.poste}</strong> — <span>{exp.entreprise} ({exp.ville})</span>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>{exp.date_debut} à {exp.actuel ? 'Présent' : exp.date_fin}</div>
                <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>Missions: {exp.missions}</p>
                {exp.realisations && <p style={{ margin: 0, fontSize: '0.8rem', color: '#333' }}>Réalisations: {exp.realisations}</p>}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <h4 style={{ backgroundColor: '#F0F2F5', padding: '0.3rem 0.5rem', margin: '0 0 0.5rem 0', color: '#1C2541' }}>FORMATION</h4>
              {data.formations?.map((form: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <strong>{form.diplome}</strong> - {form.etablissement}<br />
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>{form.date_debut} - {form.date_fin}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ backgroundColor: '#F0F2F5', padding: '0.3rem 0.5rem', margin: '0 0 0.5rem 0', color: '#1C2541' }}>COMPÉTENCES & LANGUES</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                <strong>Compétences :</strong> {data.competences?.map((c: any) => `${c.nom} (${c.niveau})`).join(', ')}
              </p>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem' }}>
                <strong>Langues :</strong> {data.langues?.map((l: any) => `${l.langue} (${l.niveau})`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 10. LETTRE DE MOTIVATION */}
      {productId === 'lettre_motivation' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <strong>{data.candidat_nom} {data.candidat_prenom}</strong><br />
              {data.candidat_adresse}, {data.candidat_ville}<br />
              Tél: {data.candidat_phone} | Email: {data.candidat_email}
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>À l'attention de : {data.dest_nom_recruteur || 'Service des Recrutements'}</strong><br />
              {data.dest_fonction || 'Responsable RH'}<br />
              <strong>{data.dest_entreprise}</strong><br />
              {data.dest_ville}
            </div>
          </div>
          <p style={{ textAlign: 'right', marginBottom: '1.5rem' }}>Fait à {data.fait_a}, le {data.fait_le}</p>
          <p><strong>Objet : Candidature au poste de {data.poste_recherche} {data.offre_ref && `(Réf: ${data.offre_ref})`}</strong></p>
          <p style={{ marginTop: '1.5rem' }}>Madame, Monsieur,</p>
          <p style={{ textIndent: '1.5rem', textAlign: 'justify' }}>
            Titulaire d'une formation en {data.profil_formation} et fort de mon expérience en tant que {data.profil_experience}, c'est avec un grand enthousiasme que je vous adresse ma candidature pour le poste de {data.poste_recherche} au sein de {data.dest_entreprise}.
          </p>
          <p style={{ textIndent: '1.5rem', textAlign: 'justify' }}>
            Au cours de mon parcours, j'ai pu développer des compétences solides en {data.profil_competences}. {data.motivation_texte}
          </p>
          <p style={{ textIndent: '1.5rem', textAlign: 'justify' }}>
            Rejoindre votre entreprise représente pour moi une opportunité unique de {data.pourquoi_entreprise}. Ma rigueur et mon {data.profil_qualites} seront des atouts essentiels pour réussir dans ce rôle.
          </p>
          <p style={{ marginTop: '1.5rem' }}>Je reste à votre entière disposition pour un entretien individuel.</p>
          <p style={{ marginTop: '3rem', textAlign: 'right' }}><strong>{data.candidat_nom} {data.candidat_prenom}</strong></p>
        </div>
      )}

      {/* 11. PACK EMPLOI (Combinaison A4) */}
      {productId === 'pack_emploi' && (
        <div>
          <h2 style={{ textAlign: 'center', color: '#4361EE' }}>PACK EMPLOI — DOCUMENT 1/2 : CV</h2>
          <hr />
          {/* Appel interne modèle CV */}
          <DocumentRenderer productId="cv" data={data.cvData} isWatermarked={false} />
          <div style={{ pageBreakBefore: 'always', marginTop: '3rem', paddingTop: '2rem', borderTop: '2px dashed #000' }}>
            <h2 style={{ textAlign: 'center', color: '#4361EE' }}>PACK EMPLOI — DOCUMENT 2/2 : LETTRE DE MOTIVATION</h2>
            <hr />
            <DocumentRenderer productId="lettre_motivation" data={data.lettreData} isWatermarked={false} />
          </div>
        </div>
      )}

      {/* 12. PACK ENTREPRENEUR */}
      {productId === 'pack_entrepreneur' && (
        <div>
          <h2 style={{ textAlign: 'center', color: '#4361EE' }}>PACK ENTREPRENEUR ({data.selectedDocs?.length || 0} DOCUMENTS)</h2>
          <p><strong>ENTREPRISE :</strong> {data.company_info?.vendeur_entreprise} | NIU: {data.company_info?.vendeur_niu}</p>
          <hr />
          {data.documents?.map((doc: any, idx: number) => (
            <div key={idx} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #DDD' }}>
              <h3 style={{ color: '#1C2541' }}>Document #{idx + 1} : {doc.type.toUpperCase()}</h3>
              <DocumentRenderer productId={doc.type} data={{ ...data.company_info, ...doc.data }} isWatermarked={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
