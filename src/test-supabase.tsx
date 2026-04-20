// src/test-supabase.tsx (fichier temporaire de test)
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
  const [status, setStatus] = useState('Testing...')

  useEffect(() => {
    const test = async () => {
      try {
        // Test 1 : connexion basique
        const {  error: authError } = await supabase.auth.getSession()
        if (authError) throw authError
        
        // Test 2 : lecture des tarifs (table publique)
        const {  pricing, error: pricingError } = await supabase
          .from('pricing_rules')
          .select('*')
        
        if (pricingError) throw pricingError
        
        setStatus(`✅ OK ! Tarifs chargés : ${pricing?.length} règle(s)`)
      } catch (err: any) {
        setStatus(`❌ Erreur : ${err.message || 'Inconnue'}`)
        console.error('Supabase test error:', err)
      }
    }
    test()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-xl font-bold mb-4">🔧 Test Supabase</h1>
        <p className={`p-3 rounded ${status.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {status}
        </p>
        <details className="mt-4 text-xs text-gray-500">
          <summary>URL configurée</summary>
          <code className="block mt-2 bg-gray-100 p-2 rounded">
            {process.env.NEXT_PUBLIC_SUPABASE_URL}
          </code>
        </details>
      </div>
    </div>
  )
}