'use client';

import React from 'react';

// --- HELPER: CONVERSION CHIFFRES EN LETTRES (FR) ---
function numberToFrenchWords(n: number): string {
  if (isNaN(n) || n === null || n === undefined) return '';
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

  if (n === 0) return 'zéro';
  if (n < 0) return 'moins ' + numberToFrenchWords(Math.abs(n));

  let words = '';

  if (Math.floor(n / 1000000) > 0) {
    words += numberToFrenchWords(Math.floor(n / 1000000)) + ' million' + (Math.floor(n / 1000000) > 1 ? 's ' : ' ');
    n %= 1000000;
  }
  if (Math.floor(n / 1000) > 0) {
    const thousands = Math.floor(n / 1000);
    words += (thousands === 1 ? 'mille ' : numberToFrenchWords(thousands) + ' mille ');
    n %= 1000;
  }
  if (Math.floor(n / 100) > 0) {
    const hundreds = Math.floor(n / 100);
    words += (hundreds === 1 ? 'cent ' : units[hundreds] + ' cent' + (n % 100 === 0 ? 's ' : ' '));
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) {
      words += units[n];
    } else {
      const tenVal = Math.floor(n / 10);
      const unitVal = n % 10;
      if (tenVal === 7 || tenVal === 9) {
        words += tens[tenVal - 1] + (unitVal === 1 ? '-et-onze' : '-' + units[10 + unitVal]);
      } else {
        words += tens[tenVal] + (unitVal === 1 ? '-et-un' : (unitVal > 0 ? '-' + units[unitVal] : ''));
      }
    }
  }
  return words.trim();
}

// --- INTERFACE COMPLÈTE & FLEXIBLE DES DONNÉES ---
export interface DocumentFormData {
  // Informations Personnelles / Candidat / Contact
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  ville?: string;

  // Emploi / Stage
  posteRecherche?: string;
  entreprise?: string;
  villeEntreprise?: string;
  referenceOffre?: string;
  diplome?: string;
  etablissement?: string;
  anneeDiplome?: string;
  filiere?: string;
  niveauEtudes?: string;
  matriculeEtudiant?: string;
  anneesExperience?: string | number;
  experiences?: Array<{
    poste?: string;
    entreprise?: string;
    duree?: string;
    description?: string;
  }>;
  missionsPrincipales?: string;
  competencesKeys?: string; // séparées par virgule ou saut de ligne
  logicielsOutils?: string;
  langues?: string;
  qualitesPro?: string;
  motivationPrincipale?: string;
  disponibilite?: string;
  profilResume?: string;
  certifications?: string;
  centresInteret?: string;
  referencesPros?: string;

  // Immobilier
  nomBailleur?: string;
  adresseBailleur?: string;
  telephoneBailleur?: string;
  nomLocataire?: string;
  adresseLocataire?: string;
  telephoneLocataire?: string;
  adresseBien?: string;
  typeLogement?: string; // Appartement, Villa, Studio, etc.
  nombrePieces?: string | number;
  equipementsBien?: string;
  montantLoyer?: number | string;
  montantCharges?: number | string;
  montantCaution?: number | string;
  avanceMois?: number | string;
  dateDebutBail?: string;
  periodeConcernee?: string; // ex: Septembre 2026
  modePaiement?: string; // Mobile Money, Espèces, Virement

  // Commerce
  nomVendeurFournisseur?: string;
  adresseVendeur?: string;
  telephoneVendeur?: string;
  emailVendeur?: string;
  registreCommerceVendeur?: string;
  nomClientAcheteur?: string;
  adresseClient?: string;
  telephoneClient?: string;
  articles?: Array<{
    designation: string;
    quantite: number;
    prixUnitaire: number;
  }>;
  remisePourcentage?: number;
  taxePourcentage?: number;
  fraisLivraison?: number;
  validiteOffreDays?: string | number;
  delaiLivraison?: string;
  conditionsPaiement?: string;
  observationsCommerciales?: string;

  // Étudiants (Demandes Administratives)
  typeDemandeEtudiante?: string; // 'stage', 'inscription', 'notes', 'attestation', 'recommandation', 'report', 'autre'
  destinataireAdministratif?: string; // ex: Monsieur le Doyen
  motifDemande?: string;
}

interface DocumentProps {
  docType: string;
  formData: DocumentFormData;
  isWatermarked?: boolean;
}

export default function DocumentRenderer({ docType, formData, isWatermarked = false }: DocumentProps) {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const normalizedDocType = docType.toLowerCase().trim();
  const candidateName = [formData.prenom, formData.nom].filter(Boolean).join(' ') || formData.nom || 'Candidat';

  // Helper pour vérifier si un champ est valide
  const hasValue = (val: any) => val !== undefined && val !== null && String(val).trim() !== '';

  // Nettoyage des tableaux
  const articlesList = (formData.articles && formData.articles.length > 0) ? formData.articles : [
    { designation: 'Prestation / Produit principal', quantite: 1, prixUnitaire: Number(formData.montantLoyer) || 100000 }
  ];

  // Calculs Financiers Sécurisés
  const totalHT = articlesList.reduce((acc, item) => acc + (Number(item.quantite || 0) * Number(item.prixUnitaire || 0)), 0);
  const remiseAmount = formData.remisePourcentage ? (totalHT * Number(formData.remisePourcentage)) / 100 : 0;
  const subTotalAfterRemise = totalHT - remiseAmount;
  const taxeAmount = formData.taxePourcentage ? (subTotalAfterRemise * Number(formData.taxePourcentage)) / 100 : 0;
  const shippingAmount = Number(formData.fraisLivraison || 0);
  const totalTTC = subTotalAfterRemise + taxeAmount + shippingAmount;

  return (
    <div
      style={{
        position: 'relative',
        background: '#ffffff',
        color: '#0f172a',
        padding: '40px 35px',
        borderRadius: '4px',
        fontFamily: "'Liberation Serif', 'Times New Roman', Georgia, serif",
        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        margin: '15px auto',
        maxWidth: '850px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        lineHeight: '1.6',
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
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'rgba(220, 38, 38, 0.25)',
            width: '120%',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            border: '4px dashed rgba(220, 38, 38, 0.25)',
            padding: '15px 0',
            zIndex: 10,
            letterSpacing: '4px',
          }}
        >
          SPÉCIMEN — DOCEXPRESS
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. EMPLOI : LETTRE DE MOTIVATION                                         */}
      {/* ========================================================================= */}
      {(normalizedDocType.includes('lettre de motivation') || normalizedDocType === 'lettre_motivation') && (
        <div style={{ fontSize: '13px', color: '#1e293b' }}>
          {/* Bloc Coordonnées Expéditeur & Destinataire */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
            <div style={{ width: '48%' }}>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>{candidateName}</p>
              {hasValue(formData.adresse) && <p style={{ margin: '0' }}>{formData.adresse}</p>}
              <p style={{ margin: '0' }}>{formData.ville || 'Yaoundé'}</p>
              <p style={{ margin: '0' }}>Tél : {formData.telephone || 'Non renseigné'}</p>
              {hasValue(formData.email) && <p style={{ margin: '0' }}>Email : {formData.email}</p>}
            </div>
            <div style={{ width: '45%', textAlign: 'right', marginTop: '20px' }}>
              {hasValue(formData.entreprise) && (
                <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '14px' }}>À l'attention de l'entreprise {formData.entreprise}</p>
              )}
              {hasValue(formData.villeEntreprise) && <p style={{ margin: '0' }}>{formData.villeEntreprise}</p>}
            </div>
          </div>

          {/* Lieu et Date */}
          <p style={{ textAlign: 'right', marginBottom: '25px', fontStyle: 'italic' }}>
            {formData.ville || 'Yaoundé'}, le {currentDate}
          </p>

          {/* Objet */}
          <div style={{ background: '#f8fafc', padding: '8px 12px', borderLeft: '3px solid #0f172a', marginBottom: '25px' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              Objet : Candidature au poste de {formData.posteRecherche || 'Cadre Professionnel'}
              {hasValue(formData.referenceOffre) ? ` (Réf : ${formData.referenceOffre})` : ' — Candidature Spontanée'}
            </p>
          </div>

          {/* Formule d'appel */}
          <p style={{ marginBottom: '15px' }}>Madame, Monsieur,</p>

          {/* Introduction Adaptative */}
          <p style={{ textAlign: 'justify', marginBottom: '14px', textIndent: '20px' }}>
            {hasValue(formData.referenceOffre)
              ? `C'est avec un grand intérêt que j'ai pris connaissance de votre offre d'emploi concernant le poste de ${formData.posteRecherche || 'ce poste'}. Convaincu(e) que mon profil répond aux exigences de vos activités au sein de ${formData.entreprise || "votre structure"}, je vous adresse par la présente ma candidature.`
              : `Par la présente, je me permets de vous soumettre ma candidature spontanée pour un poste de ${formData.posteRecherche || 'professionnel au sein de votre organisation'}. Très attentivement l'évolution des activités de ${formData.entreprise || 'votre entreprise'}, je souhaite y apporter mes compétences et mon dynamisme.`}
          </p>

          {/* Paragraphe Formation & Parcours */}
          <p style={{ textAlign: 'justify', marginBottom: '14px', textIndent: '20px' }}>
            {hasValue(formData.diplome)
              ? `Titulaire d'un(e) ${formData.diplome}${hasValue(formData.etablissement) ? ` délivré(e) par ${formData.etablissement}` : ''}${hasValue(formData.anneeDiplome) ? ` en ${formData.anneeDiplome}` : ''}, j'ai acquis des bases solides en ${formData.filiere || 'mon domaine d\'expertise'}. `
              : `Au cours de mon parcours académique et professionnel, j'ai développé une solide expertise opérationnelle. `}
            {Number(formData.anneesExperience) > 0
              ? `Fort(e) de plus de ${formData.anneesExperience} année(s) d'expérience pratique sur le terrain, j'ai appris à maîtriser les exigences complexes associées à la gestion des missions de ce secteur.`
              : `Désireux(se) d'investir pleinement mon potentiel et mes compétences théoriques, je suis prêt(e) à relever les défis quotidiens de cette fonction.`}
          </p>

          {/* Paragraphe Expériences & Missions (Si renseignées) */}
          {(hasValue(formData.missionsPrincipales) || (formData.experiences && formData.experiences.length > 0)) && (
            <p style={{ textAlign: 'justify', marginBottom: '14px', textIndent: '20px' }}>
              {formData.experiences && formData.experiences.length > 0 && formData.experiences[0].poste
                ? `Lors de mon expérience en tant que ${formData.experiences[0].poste}${hasValue(formData.experiences[0].entreprise) ? ` chez ${formData.experiences[0].entreprise}` : ''}, `
                : `Dans le cadre de mes fonctions précédentes, `}
              {hasValue(formData.missionsPrincipales)
                ? `j'ai exercé des responsabilités directes telles que : ${formData.missionsPrincipales}. `
                : `j'ai mené à bien des projets clés garantissant la qualité, le respect des délais et la satisfaction des objectifs visés. `}
              {hasValue(formData.logicielsOutils) && `Pour ce faire, je maîtrise parfaitement les outils indispensables tels que : ${formData.logicielsOutils}.`}
            </p>
          )}

          {/* Paragraphe Qualités & Adéquation */}
          <p style={{ textAlign: 'justify', marginBottom: '14px', textIndent: '20px' }}>
            {hasValue(formData.qualitesPro)
              ? `Reconnu(e) pour mon ${formData.qualitesPro}, `
              : `Rigoureux(se), autonome et doté(e) d'un excellent sens relationnel, `}
            {hasValue(formData.motivationPrincipale)
              ? formData.motivationPrincipale
              : `je souhaite mettre ma réactivité et mon professionnalisme au service du développement de vos activités.`}
            {hasValue(formData.disponibilite) && ` Je suis opérationnel(le) et disponible à compter du : ${formData.disponibilite}.`}
          </p>

          {/* Conclusion & Entretien */}
          <p style={{ textAlign: 'justify', marginBottom: '20px', textIndent: '20px' }}>
            Restant à votre entière disposition pour tout entretien à la date de votre convenance afin de vous exposer de vive voix la motivation de mon engagement, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.
          </p>

          {/* Signature */}
          <div style={{ textAlign: 'right', marginTop: '35px', paddingRight: '20px' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{candidateName}</p>
            <p style={{ margin: '2px 0 0 0', fontStyle: 'italic', color: '#64748b', fontSize: '11px' }}>Signature</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EMPLOI : CV PROFESSIONNEL                                             */}
      {/* ========================================================================= */}
      {(normalizedDocType.includes('cv') || normalizedDocType === 'cv_professionnel') && (
        <div style={{ fontSize: '12px', color: '#0f172a' }}>
          {/* En-tête CV */}
          <div style={{ borderBottom: '3px solid #0f172a', paddingBottom: '12px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{candidateName}</h1>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb', margin: 0 }}>{formData.posteRecherche || 'TITRE PROFESSIONNEL'}</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
              <p style={{ margin: '1px 0' }}>📍 {formData.ville || 'Yaoundé'}{hasValue(formData.adresse) ? `, ${formData.adresse}` : ''}</p>
              <p style={{ margin: '1px 0' }}>📞 {formData.telephone || 'Non renseigné'}</p>
              {hasValue(formData.email) && <p style={{ margin: '1px 0' }}>✉️ {formData.email}</p>}
            </div>
          </div>

          {/* Profil Professionnel */}
          {hasValue(formData.profilResume) && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '6px', color: '#0f172a' }}>PROFIL PROFESSIONNEL</h3>
              <p style={{ margin: 0, textAlign: 'justify', color: '#334155' }}>{formData.profilResume}</p>
            </div>
          )}

          {/* Expériences Professionnelles */}
          {((formData.experiences && formData.experiences.length > 0) || hasValue(formData.missionsPrincipales)) && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '8px', color: '#0f172a' }}>EXPÉRIENCES PROFESSIONNELLES</h3>
              {formData.experiences && formData.experiences.length > 0 ? (
                formData.experiences.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>{exp.poste || 'Poste occupé'} — {exp.entreprise || 'Entreprise'}</span>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>{exp.duree || 'Période'}</span>
                    </div>
                    {hasValue(exp.description) && <p style={{ margin: '2px 0 0 0', color: '#334155' }}>• {exp.description}</p>}
                  </div>
                ))
              ) : (
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{formData.posteRecherche || 'Poste occupé'} {hasValue(formData.entreprise) ? `— ${formData.entreprise}` : ''}</p>
                  {hasValue(formData.missionsPrincipales) && <p style={{ margin: '3px 0 0 0', color: '#334155' }}>• {formData.missionsPrincipales}</p>}
                </div>
              )}
            </div>
          )}

          {/* Formations & Diplômes */}
          {hasValue(formData.diplome) && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '6px', color: '#0f172a' }}>FORMATION & DIPLÔMES</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>{formData.diplome} {hasValue(formData.filiere) ? `in ${formData.filiere}` : ''}</span>
                <span style={{ color: '#64748b' }}>{formData.anneeDiplome || ''}</span>
              </div>
              {hasValue(formData.etablissement) && <p style={{ margin: '1px 0 0 0', color: '#475569', fontStyle: 'italic' }}>{formData.etablissement}</p>}
            </div>
          )}

          {/* Compétences & Outils */}
          {(hasValue(formData.competencesKeys) || hasValue(formData.logicielsOutils)) && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '6px', color: '#0f172a' }}>COMPÉTENCES & LOGICIELS</h3>
              {hasValue(formData.competencesKeys) && <p style={{ margin: '2px 0' }}><strong>Savoir-faire :</strong> {formData.competencesKeys}</p>}
              {hasValue(formData.logicielsOutils) && <p style={{ margin: '2px 0' }}><strong>Outils & Logiciels :</strong> {formData.logicielsOutils}</p>}
            </div>
          )}

          {/* Langues & Divers (Masqué si vide) */}
          {(hasValue(formData.langues) || hasValue(formData.certifications) || hasValue(formData.centresInteret)) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
              {hasValue(formData.langues) && (
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '4px' }}>LANGUES</h3>
                  <p style={{ margin: 0 }}>{formData.langues}</p>
                </div>
              )}
              {hasValue(formData.certifications) && (
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '4px' }}>CERTIFICATIONS</h3>
                  <p style={{ margin: 0 }}>{formData.certifications}</p>
                </div>
              )}
              {hasValue(formData.centresInteret) && (
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '4px' }}>CENTRES D'INTÉRÊT</h3>
                  <p style={{ margin: 0 }}>{formData.centresInteret}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. IMMOBILIER : CONTRAT DE BAIL                                           */}
      {/* ========================================================================= */}
      {(normalizedDocType.includes('bail') || normalizedDocType === 'contrat_bail') && (
        <div style={{ fontSize: '12px', color: '#0f172a', textAlign: 'justify' }}>
          <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>
            CONTRAT DE BAIL À USAGE D'HABITATION
          </h2>

          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>ENTRE LES SOUSSIGNÉS :</p>
          <p style={{ margin: '0 0 10px 15px' }}>
            <strong>1. Le Bailleur :</strong> {formData.nomBailleur || '___________________'}, résidant à {formData.adresseBailleur || formData.ville || 'Yaoundé'} (Tél: {formData.telephoneBailleur || '______'}).
          </p>
          <p style={{ margin: '0 0 15px 15px' }}>
            <strong>2. Le Preneur (Locataire) :</strong> M./Mme {formData.nomLocataire || candidateName}, résidant à {formData.adresseLocataire || formData.ville || 'Yaoundé'} (Tél: {formData.telephoneLocataire || formData.telephone || '______'}).
          </p>

          <p style={{ marginBottom: '15px' }}>Il a été convenu et arrêté ce qui suit :</p>

          <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #0f172a', paddingBottom: '2px', marginTop: '12px', marginBottom: '6px' }}>ARTICLE 1 : OBJET ET DÉSIGNATION DU BIEN</h4>
          <p style={{ margin: '0 0 10px 0' }}>
            Le Bailleur donne à bail à loyer au Preneur, qui accepte, le bien immobilier de type <strong>{formData.typeLogement || 'Logement d\'habitation'}</strong>{hasValue(formData.nombrePieces) ? ` composé de ${formData.nombrePieces} pièce(s)` : ''}, situé à l'adresse suivante : <strong>{formData.adresseBien || formData.ville || 'Yaoundé'}</strong>.
            {hasValue(formData.equipementsBien) && ` Le bien comprend notamment les équipements suivants : ${formData.equipementsBien}.`}
          </p>

          <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #0f172a', paddingBottom: '2px', marginTop: '12px', marginBottom: '6px' }}>ARTICLE 2 : DURÉE DU CONTRAT ET PRISE D'EFFET</h4>
          <p style={{ margin: '0 0 10px 0' }}>
            Le présent contrat est conclu pour une durée ferme prenant effet le <strong>{formData.dateDebutBail || currentDate}</strong>. Il se renouvelable par tacite reconduction sauf préavis signifié par l'une des parties par écrit.
          </p>

          <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #0f172a', paddingBottom: '2px', marginTop: '12px', marginBottom: '6px' }}>ARTICLE 3 : CONDITIONS FINANCIÈRES ET DISPOSITIONS DE PAIEMENT</h4>
          <p style={{ margin: '0 0 4px 0' }}>
            Le présent bail est consenti et accepté moyennant un loyer mensuel de <strong>{formData.montantLoyer ? Number(formData.montantLoyer).toLocaleString('fr-FR') : '________'} FCFA</strong>.
          </p>
          {hasValue(formData.montantCaution) && (
            <p style={{ margin: '0 0 4px 0' }}>
              Un dépôt de garantie (caution) d'un montant de <strong>{Number(formData.montantCaution).toLocaleString('fr-FR')} FCFA</strong> est versé ce jour à titre de sûreté.
            </p>
          )}
          <p style={{ margin: '0 0 10px 0' }}>
            Le loyer est payable d'avance le 1er de chaque mois auprès du bailleur par {formData.modePaiement || 'Mobile Money ou Espèces'}.
          </p>

          <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #0f172a', paddingBottom: '2px', marginTop: '12px', marginBottom: '6px' }}>ARTICLE 4 : OBLIGATIONS DES PARTIES & ÉTAT DES LIEUX</h4>
          <p style={{ margin: '0 0 10px 0' }}>
            Le Preneur s'engage à user paisiblement du logement selon sa destination d'habitation exclusive, sans sous-louer sans accord préalable, et à réaliser l'entretien courant. Un état des lieux contradictoire sera établi lors de la remise des clés.
          </p>

          <div style={{ marginTop: '20px', fontStyle: 'italic', fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
            * Modèle généré à partir des informations fournies par les parties. Une vérification juridique est recommandée pour des conditions particulières.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. IMMOBILIER : QUITTANCE DE LOYER                                       */}
      {/* ========================================================================= */}
      {(normalizedDocType.includes('quittance') || normalizedDocType === 'quittance_loyer') && (
        <div style={{ fontSize: '13px', color: '#0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '8px', marginBottom: '18px' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>BAILLEUR : {formData.nomBailleur || 'Le Bailleur'}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>Tél : {formData.telephoneBailleur || '______'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#0284c7' }}>QUITTANCE N° QL-{Math.floor(1000 + Math.random() * 9000)}</p>
              <p style={{ margin: 0, fontSize: '11px' }}>Date : {currentDate}</p>
            </div>
          </div>

          <p>Je soussigné(e), <strong>{formData.nomBailleur || 'le Bailleur'}</strong>, propriétaire du logement donné en location, atteste avoir reçu de :</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '5px 0 15px 15px', color: '#0f172a' }}>M./Mme {formData.nomLocataire || candidateName}</p>

          <p>La somme globale de :</p>
          <div style={{ background: '#f0f9ff', padding: '10px 15px', borderRadius: '4px', borderLeft: '4px solid #0284c7', margin: '10px 0 15px 0' }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0369a1' }}>
              {Number(formData.montantLoyer || 0).toLocaleString('fr-FR')} FCFA
              {hasValue(formData.montantLoyer) && <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#0f172a' }}> ({numberToFrenchWords(Number(formData.montantLoyer))} Francs CFA)</span>}
            </p>
          </div>

          <p>Au titre du règlement du loyer et des charges pour le bien situé à : <strong>{formData.adresseBien || formData.ville || 'Yaoundé'}</strong> pour la période de : <strong>{formData.periodeConcernee || 'Mois en cours'}</strong>.</p>
          <p style={{ marginTop: '10px' }}>Mode de règlement : <strong>{formData.modePaiement || 'Mobile Money / Espèces'}</strong>.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. COMMERCE : FACTURE / PROFORMA / REÇU / BON DE COMMANDE                */}
      {/* ========================================================================= */}
      {(normalizedDocType.includes('facture') || normalizedDocType.includes('proforma') || normalizedDocType.includes('recu') || normalizedDocType.includes('commande')) && (
        <div style={{ fontSize: '12px', color: '#0f172a' }}>
          {/* En-tête Commercial */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ width: '50%' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{formData.nomVendeurFournisseur || 'DOCEXPRESS SERVICES'}</h3>
              {hasValue(formData.adresseVendeur) && <p style={{ margin: 0 }}>{formData.adresseVendeur}</p>}
              <p style={{ margin: 0 }}>Tél : {formData.telephoneVendeur || formData.telephone || 'Non renseigné'}</p>
              {hasValue(formData.emailVendeur) && <p style={{ margin: 0 }}>Email : {formData.emailVendeur}</p>}
            </div>
            <div style={{ width: '45%', textAlign: 'right', background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#0f172a', textTransform: 'uppercase' }}>{docType}</h2>
              <p style={{ margin: '1px 0' }}><strong>N° :</strong> {docType.substring(0, 3).toUpperCase()}-{Math.floor(10000 + Math.random() * 90000)}</p>
              <p style={{ margin: '1px 0' }}><strong>Date :</strong> {currentDate}</p>
              {hasValue(formData.validiteOffreDays) && <p style={{ margin: '1px 0' }}><strong>Validité :</strong> {formData.validiteOffreDays} jours</p>}
            </div>
          </div>

          {/* Client */}
          <div style={{ marginBottom: '20px', borderLeft: '3px solid #0f172a', paddingLeft: '10px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', fontSize: '10px' }}>CLIENT / DESTINATAIRE</p>
            <p style={{ margin: '2px 0 0 0', fontWeight: 'bold', fontSize: '13px' }}>{formData.nomClientAcheteur || candidateName}</p>
            {hasValue(formData.adresseClient) && <p style={{ margin: 0 }}>Adresse : {formData.adresseClient}</p>}
            <p style={{ margin: 0 }}>Tél : {formData.telephoneClient || formData.telephone || 'Non renseigné'}</p>
          </div>

          {/* Tableau des Articles */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Désignation / Prestation</th>
                <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Qté</th>
                <th style={{ padding: '8px', textAlign: 'right', width: '110px' }}>P.U (FCFA)</th>
                <th style={{ padding: '8px', textAlign: 'right', width: '120px' }}>Total (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {articlesList.map((item, idx) => {
                const lineTotal = Number(item.quantite || 0) * Number(item.prixUnitaire || 0);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '8px' }}>{item.designation}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantite}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{Number(item.prixUnitaire || 0).toLocaleString('fr-FR')}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{lineTotal.toLocaleString('fr-FR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Calculs Totaux */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '55%', fontSize: '11px', fontStyle: 'italic', color: '#475569' }}>
              <p style={{ margin: '0 0 4px 0' }}><strong>Montant en lettres :</strong></p>
              <p style={{ margin: 0, textTransform: 'capitalize', color: '#0f172a', fontWeight: 'bold' }}>
                {numberToFrenchWords(totalTTC)} Francs CFA
              </p>
              {hasValue(formData.conditionsPaiement) && <p style={{ marginTop: '8px' }}><strong>Modalités :</strong> {formData.conditionsPaiement}</p>}
            </div>

            <div style={{ width: '40%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Sous-total HT :</span>
                <span>{totalHT.toLocaleString('fr-FR')} FCFA</span>
              </div>
              {remiseAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#dc2626' }}>
                  <span>Remise ({formData.remisePourcentage}%) :</span>
                  <span>- {remiseAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
              {taxeAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span>Taxes ({formData.taxePourcentage}%) :</span>
                  <span>+ {taxeAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
              {shippingAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span>Frais annexes :</span>
                  <span>+ {shippingAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '2px solid #0f172a', marginTop: '4px', fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>
                <span>TOTAL GENERAL :</span>
                <span>{totalTTC.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ÉTUDIANTS : DEMANDES ADMINISTRATIVES                                   */}
      {/* ========================================================================= */}
      {(normalizedDocType.includes('etudiant') || normalizedDocType.includes('stage') || normalizedDocType.includes('notes') || normalizedDocType.includes('attestation') || normalizedDocType.includes('recommandation')) && (
        <div style={{ fontSize: '13px', color: '#0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{candidateName}</p>
              {hasValue(formData.etablissement) && <p style={{ margin: 0 }}>Établissement : {formData.etablissement}</p>}
              {hasValue(formData.filiere) && <p style={{ margin: 0 }}>Filière : {formData.filiere} {hasValue(formData.niveauEtudes) ? `(${formData.niveauEtudes})` : ''}</p>}
              {hasValue(formData.matriculeEtudiant) && <p style={{ margin: 0 }}>Matricule : {formData.matriculeEtudiant}</p>}
              <p style={{ margin: 0 }}>Tél : {formData.telephone || '______'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>À l'attention de :</p>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>{formData.destinataireAdministratif || 'Monsieur le Doyen / Le Directeur'}</p>
              <p style={{ margin: 0 }}>{formData.etablissement || 'L\'Établissement'}</p>
            </div>
          </div>

          <p style={{ textAlign: 'right', marginBottom: '20px', fontStyle: 'italic' }}>
            {formData.ville || 'Yaoundé'}, le {currentDate}
          </p>

          <div style={{ background: '#f8fafc', padding: '8px 12px', borderLeft: '3px solid #0f172a', marginBottom: '20px' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Objet : {docType}</p>
          </div>

          <p style={{ marginBottom: '12px' }}>Monsieur le Directeur / Doyen,</p>

          <p style={{ textAlign: 'justify', textIndent: '20px', marginBottom: '12px' }}>
            J'ai l'honneur de venir très respectueusement par la présente solliciter auprès de votre haute bienveillance l'établissement de mon document administratif concernant : <strong>{docType}</strong>.
          </p>

          <p style={{ textAlign: 'justify', textIndent: '20px', marginBottom: '12px' }}>
            Actuellement inscrit(e) au sein de votre établissement académique{hasValue(formData.filiere) ? ` en ${formData.filiere}` : ''}{hasValue(formData.matriculeEtudiant) ? ` sous le matricule ${formData.matriculeEtudiant}` : ''}, cette démarche s'inscrit dans le cadre de : {formData.motifDemande || 'la constitution de mon dossier administratif et académique personnel'}.
          </p>

          <p style={{ textAlign: 'justify', textIndent: '20px', marginBottom: '20px' }}>
            En vous remerciant par avance pour la diligence réservée à ma demande, je vous prie d'agréer, Monsieur le Directeur, l'expression de ma considération distinguée.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTRES DOCUMENTS (FALLBACK STRUCTURÉ PRO)                                 */}
      {/* ========================================================================= */}
      {!normalizedDocType.includes('lettre de motivation') &&
       !normalizedDocType.includes('cv') &&
       !normalizedDocType.includes('bail') &&
       !normalizedDocType.includes('quittance') &&
       !normalizedDocType.includes('facture') &&
       !normalizedDocType.includes('proforma') &&
       !normalizedDocType.includes('recu') &&
       !normalizedDocType.includes('commande') &&
       !normalizedDocType.includes('etudiant') &&
       !normalizedDocType.includes('stage') &&
       !normalizedDocType.includes('notes') &&
       !normalizedDocType.includes('attestation') && (
        <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
          <p><strong>Bénéficiaire / Demandeur :</strong> {candidateName}</p>
          <p><strong>Contact :</strong> {formData.telephone || 'Non renseigné'}</p>
          <p><strong>Localisation :</strong> {formData.ville || 'Yaoundé'}</p>
          <p style={{ marginTop: '15px', textAlign: 'justify' }}>
            Le présent document est établi officiellement pour servir et valoir ce que de droit dans le cadre de l'acte administratif ou commercial : <strong>{docType}</strong>.
          </p>
        </div>
      )}

      {/* SIGNATURE & CACHET (COMMUN À TOUS LES DOCUMENTS) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '35px', paddingTop: '15px', borderTop: '1px solid #cbd5e1', fontSize: '11px', pageBreakInside: 'avoid' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Le Mandataire / Client :</p>
          <p style={{ color: '#64748b', marginTop: '25px', fontStyle: 'italic' }}>Signature & Mentions</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>DocExpress Certification :</p>
          <div style={{ width: '85px', height: '35px', border: '1px dashed #0284c7', margin: '6px 0 0 auto', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#0284c7', background: '#f0f9ff' }}>
            <span style={{ fontWeight: 'bold' }}>CONFORME</span>
            <span style={{ fontSize: '7px' }}>VERIFIED DOC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
