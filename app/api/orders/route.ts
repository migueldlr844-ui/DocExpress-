import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          document_type: body.documentType,
          form_data: body.formData,
          status: 'PENDING_PAYMENT',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, orderId: data.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
