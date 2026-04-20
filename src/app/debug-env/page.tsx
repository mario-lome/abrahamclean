// src/app/debug-env/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugEnvPage() {
  const [info, setInfo] = useState<string>('Test en cours...')

  useEffect(() => {
    const check = async () => {
      try {
        // 1. Vérifier les variables d'environnement
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const keyStart = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...'
        
        // 2. Tester une requête authentifiée via le client Supabase
        const { data, error } = await supabase
          .from('pricing_rules')
          .select('service_type')
          .limit(1)
        
        if (error) throw error
        
        setInfo(`✅ SUCCESS !
🌐 URL: ${url}
🔑 Clé: ${keyStart}
📦 Données: ${JSON.stringify(data, null, 2)}

🎉 Ton app peut communiquer avec Supabase !`)
      } catch (e: any) {
        setInfo(`❌ ERROR: ${e.message}

💡 Solutions:
1. Désactive Bitwarden / extensions de sécurité
2. Vérifie que .env.local est à la racine du projet
3. Redémarre le serveur après modif de .env.local
4. Teste en navigation privée (sans extensions)`)
      }
    }
    check()
  }, [])

  return (
    <pre className="p-6 font-mono text-sm whitespace-pre-wrap bg-gray-900 text-green-400 min-h-screen">
      {info}
    </pre>
  )
}