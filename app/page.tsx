cat > /home/claude/docexpress/app/page.tsx << 'ENDOFFILE'
'use client';

import React, { useState, useEffect, useMemo } from 'react';

// =========================================================
// DOCEXPRESS — Page unique (expérience visiteur)
// =========================================================
// Ce fichier gère tout le parcours visible par le visiteur :
// accueil -> formulaire -> vérification -> aperçu -> commande
// -> paiement -> attente -> suivi/téléchargement.
//
// IMPORTANT — Pourquoi ce fichier ne "triche" pas :
// Contrairement à un prototype 100% local, ce composant ne calcule
// JAMAIS le prix final, ne génère JAMAIS le PDF, et ne valide JAMAIS
// un paiement lui-même. Il se contente d'appeler les routes API
// serveur (/api/documents, /api/orders, /api/payments/report,
// /api/orders/[reference]) qui, elles, vivent uniquement sur le
// serveur et sont les seules autorisées à écrire en base de données
// ou à produire le document final. Un visiteur qui inspecte ou modifie
// ce fichier dans son navigateur ne peut donc pas obtenir le PDF
// sans un vrai paiement confirmé par l'administrateur.
//
// Fichiers serveur nécessaires (déjà fournis séparément) :
//   app/api/documents/route.ts
//   app/api/orders/route.ts
//   app/api/orders/[reference]/route.ts
//   app/api/payments/report/route.ts
//   app/api/payments/settings/route.ts
//   app/api/downloads/[token]/route.ts
//   lib/**, middleware.ts, database/migrations/**

// --- TYPES ---
interface SelectOption {
  value: string;
  label: string;
}

interface RepeatableColumn {
  name: string;
  label: string;
  type: 'text' | 'number';
}

interface FormFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'phone' | 'email' | 'date' | 'textarea' | 'select' | 'checkbox' | 'repeatable';
  placeholder?: string;
  required: boolean;
  order: number;
  help?: string;
  options?: SelectOption[];
  columns?: RepeatableColumn[];
  min?: number;
  max?: number;
}

interface DocumentTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  schema: { fields: FormFieldDefinition[] };
}

interface PaymentSettings {
  orange_money_number: string | null;
  orange_money_account_name: string | null;
  mtn_momo_number: string | null;
  mtn_momo_account_name: string | null;
  whatsapp_number: string | null;
}

type Step =
  | 'splash'
  | 'home'
  | 'form'
  | 'review'
  | 'preview'
  | 'checkout'
  | 'payment'
  | 'pending'
  | 'success';

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  immobilier: { label: 'Immobilier', emoji: '🏠' },
  emploi: { label: 'Emploi', emoji: '💼' },
  commerce: { label: 'Commerce', emoji: '🧾' },
  administratif: { label: 'Administratif', emoji: '📄' },
};

function formatPrice(amount: number, currency = 'FCFA'): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
}

// =========================================================
// COMPOSANT PRINCIPAL
// =========================================================
export default function Home() {
  const [step, setStep] = useState<Step>('splash');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<number>(0);
  const [orderStatus, setOrderStatus] = useState<string>('PENDING_PAYMENT');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Splash screen : affiché une fois par session ---
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('docexpress_splash_shown');
    if (alreadyShown) {
      setStep('home');
      return;
    }
    const timer = setTimeout(() => {
      sessionStorage.setItem('docexpress_splash_shown', '1');
      setStep('home');
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // --- Chargement des documents depuis le serveur (jamais en dur) ---
  useEffect(() => {
    fetch('/api/documents')
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setIsLoadingTemplates(false));
  }, []);

  // --- Chargement de la config de paiement au moment du paiement ---
  useEffect(() => {
    if (step === 'payment' && !paymentSettings) {
      fetch('/api/payments/settings')
        .then((res) => res.json())
        .then(setPaymentSettings)
        .catch(() => setPaymentSettings(null));
    }
  }, [step, paymentSettings]);

  // --- Polling du statut de commande tant qu'on attend la validation admin ---
  useEffect(() => {
    if (step !== 'pending' || !orderNumber) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (!res.ok) return;
        const data = await res.json();
        setOrderStatus(data.status);

        if (['PDF_GENERATED', 'COMPLETED'].includes(data.status)) {
          setStep('success');
        }
      } catch {
        // on retentera au prochain intervalle
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [step, orderNumber]);

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.price - b.price),
    [templates]
  );

  function handleSelectTemplate(template: DocumentTemplate) {
    setSelectedTemplate(template);
    setFormData({});
    setErrors({});
    setSubmitError(null);
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateField(name: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleGoToReview() {
    if (!selectedTemplate) return;
    const validationErrors = validateFormData(selectedTemplate.schema.fields, formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Création de la commande : le PRIX et la RÉFÉRENCE sont
  // entièrement recalculés côté serveur. Ce composant ne fait que
  // transmettre les données saisies. ---
  async function handleCreateOrder() {
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          formData,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setSubmitError(result.message ?? 'Une erreur est survenue. Veuillez réessayer.');
        setIsSubmitting(false);
        return;
      }

      setOrderNumber(result.orderNumber);
      setOrderAmount(computeDisplayAmount(selectedTemplate, formData));
      setStep('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSubmitError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Signalement de paiement : ne fait JAMAIS passer la commande
  // à PAID. Cela crée seulement une demande de vérification, que
  // seul l'administrateur authentifié peut confirmer côté serveur. ---
  async function handleReportPayment(method: 'orange_money' | 'mtn_momo', paymentPhone: string) {
    if (!orderNumber || !selectedTemplate) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/payments/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, paymentMethod: method, paymentPhone }),
      });

      const result = await res.json();

      if (!res.ok) {
        setSubmitError(result.message ?? 'Une erreur est survenue. Veuillez réessayer.');
        setIsSubmitting(false);
        return;
      }

      if (paymentSettings?.whatsapp_number) {
        const message = buildWhatsAppMessage({
          documentName: selectedTemplate.name,
          amount: orderAmount,
          currency: selectedTemplate.currency,
          orderNumber,
          paymentPhone,
        });
        const url = `https://wa.me/${paymentSettings.whatsapp_number.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }

      setOrderStatus('PAYMENT_VERIFICATION');
      setStep('pending');
    } catch {
      setSubmitError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Une fois le document prêt, on récupère l'URL de téléchargement
  // signée (générée par le serveur, jamais devinable) ---
  useEffect(() => {
    if (step === 'success' && orderNumber && !downloadUrl) {
      fetch(`/api/orders/${orderNumber}/download-url`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.downloadUrl) setDownloadUrl(data.downloadUrl);
        })
        .catch(() => {});
    }
  }, [step, orderNumber, downloadUrl]);

  function handleReset() {
    setSelectedTemplate(null);
    setFormData({});
    setErrors({});
    setOrderNumber(null);
    setOrderAmount(0);
    setOrderStatus('PENDING_PAYMENT');
    setDownloadUrl(null);
    setSubmitError(null);
    setStep('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-ink-900 text-white">
      {step === 'splash' && <SplashScreen />}

      {step !== 'splash' && (
        <>
          <TopHeader onHome={handleReset} />

          <main className="mx-auto max-w-xl px-4 py-6">
            {step === 'home' && (
              <HomeView
                templates={sortedTemplates}
                isLoading={isLoadingTemplates}
                onSelect={handleSelectTemplate}
              />
            )}

            {step === 'form' && selectedTemplate && (
              <FormView
                template={selectedTemplate}
                formData={formData}
                errors={errors}
                onChange={updateField}
                onBack={() => setStep('home')}
                onNext={handleGoToReview}
              />
            )}

            {step === 'review' && selectedTemplate && (
              <ReviewView
                template={selectedTemplate}
                formData={formData}
                onEdit={() => setStep('form')}
                onConfirm={() => setStep('preview')}
              />
            )}

            {step === 'preview' && selectedTemplate && (
              <PreviewView
                template={selectedTemplate}
                formData={formData}
                isSubmitting={isSubmitting}
                submitError={submitError}
                onBack={() => setStep('review')}
                onConfirmOrder={handleCreateOrder}
              />
            )}

            {step === 'checkout' && selectedTemplate && orderNumber && (
              <CheckoutView
                template={selectedTemplate}
                orderNumber={orderNumber}
                amount={orderAmount}
                onNext={() => setStep('payment')}
              />
            )}

            {step === 'payment' && selectedTemplate && orderNumber && (
              <PaymentView
                documentName={selectedTemplate.name}
                orderNumber={orderNumber}
                amount={orderAmount}
                currency={selectedTemplate.currency}
                settings={paymentSettings}
                isSubmitting={isSubmitting}
                submitError={submitError}
                onConfirmPayment={handleReportPayment}
              />
            )}

            {step === 'pending' && orderNumber && selectedTemplate && (
              <PendingView
                orderNumber={orderNumber}
                documentName={selectedTemplate.name}
                amount={orderAmount}
                currency={selectedTemplate.currency}
                status={orderStatus}
              />
            )}

            {step === 'success' && orderNumber && (
              <SuccessView
                orderNumber={orderNumber}
                downloadUrl={downloadUrl}
                onReset={handleReset}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

// =========================================================
// VALIDATION (miroir de la validation serveur, pour un retour
// immédiat à l'utilisateur — la validation qui compte reste celle
// faite dans app/api/orders/route.ts, jamais celle-ci seule)
// =========================================================
function validateFormData(
  fields: FormFieldDefinition[],
  data: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = data[field.name];
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);

    if (field.required && isEmpty) {
      errors[field.name] = `${field.label} est obligatoire.`;
      continue;
    }
    if (isEmpty) continue;

    if (field.type === 'phone' && typeof value === 'string') {
      const digits = value.replace(/[^\d]/g, '');
      const valid = /^6\d{8}$/.test(digits) || /^2376\d{8}$/.test(digits);
      if (!valid) errors[field.name] = `${field.label} doit être un numéro camerounais valide.`;
    }

    if (field.type === 'email' && typeof value === 'string') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.name] = `${field.label} doit être une adresse email valide.`;
      }
    }

    if (field.type === 'number' && Number.isNaN(Number(value))) {
      errors[field.name] = `${field.label} doit être un nombre.`;
    }

    if (field.type === 'repeatable') {
      const rows = value as Record<string, unknown>[];
      if (!Array.isArray(rows) || rows.length === 0) {
        errors[field.name] = `${field.label} : ajoutez au moins une ligne.`;
      }
    }
  }

  return errors;
}

// Estimation d'affichage uniquement (le montant réel facturé est
// celui renvoyé/stocké côté serveur lors de la création de commande).
function computeDisplayAmount(
  template: DocumentTemplate,
  formData: Record<string, unknown>
): number {
  const lignes = formData.lignes;
  if (!Array.isArray(lignes)) return template.price;

  let total = 0;
  for (const row of lignes as Record<string, unknown>[]) {
    const qty = Number(row.quantite ?? 0);
    const price = Number(row.prix_unitaire ?? 0);
    if (!Number.isNaN(qty) && !Number.isNaN(price)) total += qty * price;
  }
  const remise = Number(formData.remise ?? 0);
  return Math.max(0, total - (Number.isNaN(remise) ? 0 : remise));
}

function buildWhatsAppMessage(params: {
  documentName: string;
  amount: number;
  currency: string;
  orderNumber: string;
  paymentPhone: string;
}): string {
  return [
    'Bonjour DocExpress 👋',
    "Je viens d'effectuer un paiement.",
    `📄 Document : ${params.documentName}`,
    `💰 Montant : ${params.amount.toLocaleString('fr-FR')} ${params.currency}`,
    `📌 Référence : ${params.orderNumber}`,
    '📱 Numéro utilisé pour le paiement :',
    params.paymentPhone,
    'Merci de vérifier mon paiement.',
  ].join('\n');
}

// =========================================================
// SOUS-COMPOSANTS D'AFFICHAGE
// =========================================================

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-ink-900 px-8 text-center">
      <div className="text-3xl font-black tracking-wider text-brand-500 drop-shadow-[0_0_20px_rgba(76,201,240,0.4)]">
        DOCEXPRESS
      </div>
      <p className="mt-3 text-lg font-light tracking-wide text-ink-400">Bienvenue</p>
      <div className="mt-8 h-10 w-10 animate-spin rounded-full border-4 border-ink-800 border-t-brand-500" />
    </div>
  );
}

function TopHeader({ onHome }: { onHome: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-900/95 px-4 py-3 backdrop-blur">
      <button onClick={onHome} className="text-xl font-bold tracking-wide text-brand-500">
        DocExpress
      </button>
    </header>
  );
}

function HomeView({
  templates,
  isLoading,
  onSelect,
}: {
  templates: DocumentTemplate[];
  isLoading: boolean;
  onSelect: (t: DocumentTemplate) => void;
}) {
  return (
    <div>
      <section className="py-6 text-center">
        <h1 className="text-2xl font-extrabold leading-tight text-white">
          Vos documents professionnels en quelques minutes
        </h1>
        <p className="mt-3 text-sm text-ink-400">
          Choisissez votre document, renseignez vos informations, payez
          localement et recevez votre PDF.
        </p>
      </section>

      <h2 className="mb-3 text-base font-bold text-white">🔥 Choisissez votre document</h2>

      {isLoading && <p className="text-sm text-ink-400">Chargement des documents...</p>}
      {!isLoading && templates.length === 0 && (
        <p className="text-sm text-ink-400">
          Aucun document disponible pour le moment. Revenez bientôt.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {templates.map((doc) => {
          const cat = CATEGORY_LABELS[doc.category] ?? { label: doc.category, emoji: '📄' };
          return (
            <button
              key={doc.id}
              onClick={() => onSelect(doc)}
              className="rounded-2xl border border-ink-700 bg-ink-800 p-4 text-left active:scale-[0.99]"
            >
              <span className="text-xs font-bold text-brand-500">
                {cat.emoji} {cat.label.toUpperCase()}
              </span>
              <h3 className="mt-1 text-base font-semibold text-white">{doc.name}</h3>
              <p className="mt-1 text-sm text-ink-400">{doc.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-white">{formatPrice(doc.price, doc.currency)}</span>
                <span className="text-sm font-bold text-brand-500">Créer →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgressBar({ label, stepIndex, totalSteps }: { label: string; stepIndex: number; totalSteps: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs text-ink-400">
        <span>{label}</span>
        <span>Étape {stepIndex + 1} sur {totalSteps}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}

const FLOW_STEPS = ['form', 'review', 'preview', 'checkout', 'payment'];

function FormView({
  template,
  formData,
  errors,
  onChange,
  onBack,
  onNext,
}: {
  template: DocumentTemplate;
  formData: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (name: string, value: unknown) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const sortedFields = [...template.schema.fields].sort((a, b) => a.order - b.order);

  return (
    <div>
      <ProgressBar label="Vos informations" stepIndex={0} totalSteps={FLOW_STEPS.length} />

      <div className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
        <h2 className="mb-1 text-base font-bold text-white">{template.name}</h2>
        <p className="mb-4 text-sm text-ink-400">{template.description}</p>

        <div className="space-y-4">
          {sortedFields.map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={formData[field.name]}
              error={errors[field.name]}
              onChange={(v) => onChange(field.name, v)}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border border-ink-700 py-3 text-sm font-semibold text-white"
          >
            Retour
          </button>
          <button
            onClick={onNext}
            className="flex-[2] rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white active:bg-brand-600"
          >
            Vérifier mes informations →
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FormFieldDefinition;
  value: unknown;
  error?: string;
  onChange: (v: unknown) => void;
}) {
  const baseClass =
    'w-full rounded-xl border px-4 py-3 text-base bg-ink-900 text-white placeholder:text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ' +
    (error ? 'border-red-500' : 'border-ink-700');

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white">
        {field.label}
        {field.required && <span className="text-accent-500"> *</span>}
      </label>

      {field.type === 'textarea' && (
        <textarea
          className={baseClass}
          rows={4}
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'select' && (
        <select
          className={baseClass}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>Sélectionnez...</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {field.type === 'checkbox' && (
        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-ink-700"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          Oui
        </label>
      )}

      {field.type === 'repeatable' && (
        <RepeatableInput
          columns={field.columns ?? []}
          value={(value as Record<string, unknown>[]) ?? []}
          onChange={onChange}
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          inputMode="numeric"
          className={baseClass}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      )}

      {field.type === 'phone' && (
        <input
          type="tel"
          inputMode="tel"
          className={baseClass}
          placeholder={field.placeholder ?? '6XXXXXXXX'}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'email' && (
        <input
          type="email"
          className={baseClass}
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'date' && (
        <input
          type="date"
          className={baseClass}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'text' && (
        <input
          type="text"
          className={baseClass}
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function RepeatableInput({
  columns,
  value,
  onChange,
}: {
  columns: RepeatableColumn[];
  value: Record<string, unknown>[];
  onChange: (rows: Record<string, unknown>[]) => void;
}) {
  function addRow() {
    const empty: Record<string, unknown> = {};
    for (const col of columns) empty[col.name] = '';
    onChange([...value, empty]);
  }
  function removeRow(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function updateCell(i: number, colName: string, cellValue: unknown) {
    onChange(value.map((row, idx) => (idx === i ? { ...row, [colName]: cellValue } : row)));
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink-700 bg-ink-900 p-3">
      {value.length === 0 && <p className="text-sm text-ink-400">Aucune ligne ajoutée.</p>}
      {value.map((row, i) => (
        <div key={i} className="space-y-2 rounded-lg bg-ink-800 p-3">
          {columns.map((col) => (
            <div key={col.name}>
              <label className="mb-1 block text-xs font-medium text-ink-400">{col.label}</label>
              <input
                type={col.type === 'number' ? 'number' : 'text'}
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                value={(row[col.name] as string) ?? ''}
                onChange={(e) =>
                  updateCell(
                    i,
                    col.name,
                    col.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                  )
                }
              />
            </div>
          ))}
          <button onClick={() => removeRow(i)} className="text-xs font-medium text-red-400">
            Supprimer cette ligne
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="w-full rounded-lg border border-dashed border-brand-500 py-2 text-sm font-medium text-brand-500"
      >
        + Ajouter une ligne
      </button>
    </div>
  );
}

function ReviewView({
  template,
  formData,
  onEdit,
  onConfirm,
}: {
  template: DocumentTemplate;
  formData: Record<string, unknown>;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  const sortedFields = [...template.schema.fields].sort((a, b) => a.order - b.order);

  return (
    <div>
      <ProgressBar label="Vérification" stepIndex={1} totalSteps={FLOW_STEPS.length} />

      <div className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
        <h2 className="mb-4 text-base font-semibold text-brand-500">🔍 Vérifiez vos informations</h2>

        <div className="space-y-3 rounded-xl bg-ink-900 p-4">
          {sortedFields.map((field) => {
            const value = formData[field.name];
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
              return null;
            }
            return (
              <div key={field.name} className="border-b border-ink-800 pb-2">
                <span className="block text-xs text-ink-400">{field.label}</span>
                <span className="text-sm font-medium text-white">
                  {field.type === 'repeatable'
                    ? `${(value as unknown[]).length} ligne(s)`
                    : field.type === 'checkbox'
                    ? (value ? 'Oui' : 'Non')
                    : String(value)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onEdit} className="flex-1 rounded-xl border border-ink-700 py-3 text-sm font-semibold text-white">
            ✏ Modifier
          </button>
          <button onClick={onConfirm} className="flex-[2] rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white active:bg-brand-600">
            🚀 Voir l&apos;aperçu →
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewView({
  template,
  formData,
  isSubmitting,
  submitError,
  onBack,
  onConfirmOrder,
}: {
  template: DocumentTemplate;
  formData: Record<string, unknown>;
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onConfirmOrder: () => void;
}) {
  const sortedFields = [...template.schema.fields].sort((a, b) => a.order - b.order);
  const displayAmount = computeDisplayAmount(template, formData);

  return (
    <div>
      <ProgressBar label="Aperçu & commande" stepIndex={2} totalSteps={FLOW_STEPS.length} />

      {/* Document "papier" volontairement clair, même en thème sombre */}
      <div className="relative overflow-hidden rounded-2xl border border-ink-700 bg-white text-gray-900 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 flex flex-wrap content-around items-center justify-center gap-8 overflow-hidden opacity-[0.15]"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="rotate-[-30deg] whitespace-nowrap text-4xl font-black text-red-600">
              SPÉCIMEN
            </span>
          ))}
        </div>

        <div className="relative z-0 p-6">
          <p className="text-xs uppercase tracking-wide text-gray-400">Aperçu du document</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900">{template.name}</h2>

          <dl className="mt-4 space-y-3">
            {sortedFields.map((field) => {
              const value = formData[field.name];
              if (value === undefined || value === null || value === '') return null;

              if (field.type === 'repeatable' && Array.isArray(value)) {
                return (
                  <div key={field.name}>
                    <dt className="text-xs font-medium text-gray-500">{field.label}</dt>
                    <dd className="mt-1 overflow-hidden rounded-lg border border-gray-100">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            {(field.columns ?? []).map((col) => (
                              <th key={col.name} className="p-2 text-left font-medium text-gray-600">{col.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(value as Record<string, unknown>[]).map((row, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              {(field.columns ?? []).map((col) => (
                                <td key={col.name} className="p-2 text-gray-800">{String(row[col.name] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </dd>
                  </div>
                );
              }

              return (
                <div key={field.name} className="flex justify-between gap-4 text-sm">
                  <dt className="text-gray-500">{field.label}</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {field.type === 'checkbox' ? (value ? 'Oui' : 'Non') : String(value)}
                  </dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <span className="text-sm text-gray-500">Prix</span>
            <span className="text-lg font-bold text-brand-700">
              {formatPrice(displayAmount, template.currency)}
            </span>
          </div>
        </div>
      </div>

      {submitError && <p className="mt-4 text-sm text-red-400">{submitError}</p>}

      <div className="mt-5 space-y-3">
        <button
          onClick={onConfirmOrder}
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-500 py-4 text-base font-semibold text-white shadow-sm active:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? 'Création de la commande...' : `Commander pour ${formatPrice(displayAmount, template.currency)}`}
        </button>
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-ink-700 py-4 text-base font-medium text-white"
        >
          Modifier mes informations
        </button>
      </div>
    </div>
  );
}

function CheckoutView({
  template,
  orderNumber,
  amount,
  onNext,
}: {
  template: DocumentTemplate;
  orderNumber: string;
  amount: number;
  onNext: () => void;
}) {
  return (
    <div>
      <ProgressBar label="Récapitulatif" stepIndex={3} totalSteps={FLOW_STEPS.length} />

      <h1 className="mb-4 text-xl font-bold text-white">Récapitulatif de votre commande</h1>

      <div className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
        <div className="flex justify-between text-sm">
          <span className="text-ink-400">Document</span>
          <span className="font-medium text-white">{template.name}</span>
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-ink-400">Référence</span>
          <span className="font-mono font-medium text-white">{orderNumber}</span>
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-ink-400">Statut</span>
          <span className="font-medium text-brand-500">En attente de paiement</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-ink-700 pt-4">
          <span className="font-semibold text-white">Total</span>
          <span className="text-lg font-bold text-brand-500">{formatPrice(amount, template.currency)}</span>
        </div>
      </div>

      <button
        onClick={onNext}
        className="mt-6 block w-full rounded-xl bg-brand-500 py-4 text-center text-base font-semibold text-white shadow-sm active:bg-brand-600"
      >
        Procéder au paiement
      </button>
    </div>
  );
}

function PaymentView({
  documentName,
  orderNumber,
  amount,
  currency,
  settings,
  isSubmitting,
  submitError,
  onConfirmPayment,
}: {
  documentName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  settings: PaymentSettings | null;
  isSubmitting: boolean;
  submitError: string | null;
  onConfirmPayment: (method: 'orange_money' | 'mtn_momo', paymentPhone: string) => void;
}) {
  const [hasPaid, setHasPaid] = useState(false);
  const [method, setMethod] = useState<'orange_money' | 'mtn_momo'>('orange_money');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function handleConfirm() {
    if (!paymentPhone.trim()) {
      setLocalError('Veuillez indiquer le numéro utilisé pour le paiement.');
      return;
    }
    setLocalError(null);
    onConfirmPayment(method, paymentPhone);
  }

  return (
    <div>
      <ProgressBar label="Paiement" stepIndex={4} totalSteps={FLOW_STEPS.length} />

      <div className="space-y-6">
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
          <h2 className="font-semibold text-white">Finaliser votre commande</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-400">Document</span>
              <span className="font-medium text-white">{documentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Montant</span>
              <span className="font-medium text-brand-500">{formatPrice(amount, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Référence</span>
              <span className="font-mono font-medium text-white">{orderNumber}</span>
            </div>
          </div>
        </div>

        {!hasPaid ? (
          <>
            <div className="space-y-3">
              {settings?.orange_money_number && (
                <div className="rounded-2xl bg-ink-900 p-4" style={{ borderLeft: '4px solid #FF7900' }}>
                  <p className="text-sm font-bold" style={{ color: '#FF7900' }}>🟠 Orange Money</p>
                  <p className="mt-1 text-xl font-bold tracking-wide text-white">{settings.orange_money_number}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    Nom du compte : {settings.orange_money_account_name ?? 'À configurer'}
                  </p>
                </div>
              )}
              {settings?.mtn_momo_number && (
                <div className="rounded-2xl bg-ink-900 p-4" style={{ borderLeft: '4px solid #FFCC00' }}>
                  <p className="text-sm font-bold" style={{ color: '#FFCC00' }}>🟡 MTN Mobile Money</p>
                  <p className="mt-1 text-xl font-bold tracking-wide text-white">{settings.mtn_momo_number}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    Nom du compte : {settings.mtn_momo_account_name ?? 'À configurer'}
                  </p>
                </div>
              )}
              {settings && !settings.orange_money_number && !settings.mtn_momo_number && (
                <p className="rounded-xl bg-accent-500/10 p-4 text-sm text-accent-500">
                  Aucun moyen de paiement n&apos;est configuré pour le moment. Contactez-nous sur WhatsApp.
                </p>
              )}
            </div>

            <button
              onClick={() => setHasPaid(true)}
              className="w-full rounded-xl bg-brand-500 py-4 text-base font-semibold text-white shadow-sm active:bg-brand-600"
            >
              J&apos;ai effectué le paiement
            </button>
          </>
        ) : (
          <div className="space-y-4 rounded-2xl border border-ink-700 bg-ink-800 p-5">
            <h3 className="font-semibold text-white">Confirmez votre paiement</h3>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white">Méthode utilisée</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMethod('orange_money')}
                  className={
                    'flex-1 rounded-xl border py-3 text-sm font-medium ' +
                    (method === 'orange_money' ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-ink-700 text-ink-400')
                  }
                >
                  Orange Money
                </button>
                <button
                  onClick={() => setMethod('mtn_momo')}
                  className={
                    'flex-1 rounded-xl border py-3 text-sm font-medium ' +
                    (method === 'mtn_momo' ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-ink-700 text-ink-400')
                  }
                >
                  MTN MoMo
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white">
                Numéro utilisé pour le paiement
              </label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="6XXXXXXXX"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-base text-white placeholder:text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {(localError || submitError) && (
              <p className="text-sm text-red-400">{localError ?? submitError}</p>
            )}

            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-success-500 py-4 text-base font-semibold text-white shadow-sm disabled:opacity-60"
            >
              💬 {isSubmitting ? 'Envoi...' : 'Confirmer sur WhatsApp'}
            </button>

            <p className="text-center text-xs text-ink-400">
              Cela ouvrira WhatsApp avec un message prérempli. Notre équipe
              vérifiera votre paiement avant de vous donner accès au document.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'En attente de paiement',
  PAYMENT_REPORTED: 'Paiement signalé',
  PAYMENT_VERIFICATION: 'Votre paiement est en cours de vérification.',
  PAID: 'Paiement confirmé — préparation de votre document...',
  PAYMENT_REJECTED: "Votre paiement n'a pas encore pu être confirmé. Veuillez nous contacter sur WhatsApp.",
  PDF_GENERATED: 'Votre document est prêt.',
  COMPLETED: 'Votre document est prêt.',
  CANCELLED: 'Cette commande a été annulée.',
  EXPIRED: 'Cette commande a expiré.',
};

function PendingView({
  orderNumber,
  documentName,
  amount,
  currency,
  status,
}: {
  orderNumber: string;
  documentName: string;
  amount: number;
  currency: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 text-center">
      <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-ink-900 border-t-brand-500" />

      <h2 className="text-lg font-bold text-brand-500">Vérification du paiement en cours...</h2>
      <p className="mt-2 text-sm text-ink-400">
        Votre demande a bien été transmise. Cette page se mettra à jour
        automatiquement dès que votre paiement sera confirmé par notre équipe.
      </p>

      <div className="mt-5 rounded-xl bg-ink-900 p-4 text-left text-sm">
        <p className="text-ink-400">
          Référence : <span className="font-mono font-medium text-white">{orderNumber}</span>
        </p>
        <p className="mt-1 text-ink-400">
          Document : <span className="font-medium text-white">{documentName}</span>
        </p>
        <p className="mt-1 text-ink-400">
          Montant : <span className="font-medium text-brand-500">{formatPrice(amount, currency)}</span>
        </p>
        <p className="mt-2 text-xs text-ink-400">{STATUS_LABELS[status] ?? status}</p>
      </div>
    </div>
  );
}

function SuccessView({
  orderNumber,
  downloadUrl,
  onReset,
}: {
  orderNumber: string;
  downloadUrl: string | null;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 text-center">
      <div className="text-4xl">🎉</div>
      <h2 className="mt-2 text-lg font-bold text-success-500">Paiement confirmé !</h2>
      <p className="mt-2 text-sm text-ink-400">
        Votre document est prêt. Référence : <span className="font-mono text-white">{orderNumber}</span>
      </p>

      {downloadUrl ? (
        <a
          href={downloadUrl}
          className="mt-6 block w-full rounded-xl bg-brand-500 py-4 text-center text-base font-semibold text-white shadow-sm active:bg-brand-600"
        >
          ⬇ Télécharger mon document
        </a>
      ) : (
        <p className="mt-6 text-sm text-ink-400">Préparation du lien de téléchargement...</p>
      )}

      <button
        onClick={onReset}
        className="mt-4 w-full rounded-xl border border-ink-700 py-3 text-sm font-medium text-white"
      >
        🏠 Créer un autre document
      </button>
    </div>
  );
}
ENDOFFILE
echo "Fichier écrit"
