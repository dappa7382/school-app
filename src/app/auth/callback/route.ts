import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return redirect(next)
    }
  }

  // Return the user to an error page with instructions
  return redirect('/login?error=Could not authenticate user')
}
