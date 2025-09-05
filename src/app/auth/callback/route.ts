import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'
import { createUserEncryptionKey } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user has an encryption key, create one if they don't
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if encryption key exists
        const { data: existingKey } = await supabase
          .from('user_encryption_keys')
          .select('user_id')
          .eq('user_id', user.id)
          .single()

        // If no key exists, create one
        if (!existingKey) {
          try {
            await createUserEncryptionKey(user.id)
          } catch (keyError) {
            console.error('Failed to create encryption key during callback:', keyError)
          }
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
