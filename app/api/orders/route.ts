import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    const body = await req.json()
    
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
      // Retourne les détails complets de l'erreur Supabase pour un diagnostic précis
      return NextResponse.json(
        { 
          success: false, 
          error: `Supabase: ${error.message} | Code: ${error.code} | Details: ${error.details}` 
        }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, orderId: data.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
