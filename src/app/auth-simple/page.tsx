// src/app/auth-simple/page.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthSimplePage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('Inscription en cours...')
    
    // Méthode ultra-simple : on laisse Supabase gérer le redirect
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })
    
    if (error) {
      setMsg(`❌ Erreur: ${error.message}`)
    } else {
      setMsg('✅ Compte créé ! Redirection...')
      // Forcer la redirection même sans confirmation email
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleSignUp} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">🧼 AbrahamClean - Inscription Simplifiée</h1>
        {msg && <p className={`p-3 rounded ${msg.startsWith('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</p>}
        <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded" />
        <input required type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded" />
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700">S'inscrire</button>
        <p className="text-center text-sm text-gray-500">
          <a href="/auth" className="text-blue-600 hover:underline">← Retour à l'inscription normale</a>
        </p>
      </form>
    </div>
  )
}