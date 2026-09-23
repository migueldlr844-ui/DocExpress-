import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("SUPABASE CONFIG ERROR: URL ou Key manquante")
      return NextResponse.json(
        { success: false, error: 'Configuration Supabase manquante dans les variables d\'environnement' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    const body = await req.json()
    
    // Log sécurisé des données reçues sans informations ultra-sensibles
    console.log("DONNÉES REÇUES POUR COMMANDE :", {
      documentType: body?.documentType,
      hasFormData: Boolean(body?.formData),
      documentTemplateId: body?.documentTemplateId
    })

    // Génération d'un numéro de commande si non fourni
    const generatedOrderNumber = body.orderNumber || `ORD-${Date.now()}`

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          document_type: body.documentType,
          form_data: body.formData,
          status: 'PENDING_PAYMENT',
          order_number: generatedOrderNumber,
          document_template_id: body.documentTemplateId || null,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      // Log serveur détaillé pour Vercel / Terminal
      console.error("SUPABASE ERROR:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      })

      // Retourne le détail complet à la page web pour affichage direct
      return NextResponse.json(
        { 
          success: false, 
          error: `Code: ${error.code} | Message: ${error.message} | Details: ${error.details || 'Aucun'} | Hint: ${error.hint || 'Aucun'}` 
        }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, orderId: data.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    console.error("ERREUR SERVEUR CATCH :", err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
