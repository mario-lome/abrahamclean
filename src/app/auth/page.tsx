'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // 🔑 Génère un email technique invisible pour Supabase
  const toDummyEmail = (p: string) => `${p.replace(/\s+/g, '').replace(/\+/g, '')}@abrahamclean.app`

  // Vérifie session existante
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.push('/dashboard')
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const cleanPhone = phone.replace(/\s+/g, '').replace(/\+/g, '')
      const dummyEmail = toDummyEmail(cleanPhone)

      if (isLogin) {
        // Connexion avec email fantôme + mot de passe
        const { error } = await supabase.auth.signInWithPassword({ 
          email: dummyEmail, 
          password 
        })
        if (error) throw error
      } else {
        // Inscription
        const { error } = await supabase.auth.signUp({
          email: dummyEmail,
          password,
          options: {
            data: { full_name: fullName, phone: cleanPhone }, // Stocké dans user_metadata
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        })
        if (error) throw error
        
        // Connexion automatique après inscription (confirmation email désactivée)
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: dummyEmail, password })
        if (loginError) throw loginError
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      // Messages d'erreur adaptés
      if (err.message?.includes('Invalid login credentials')) {
        setError('Numéro ou code PIN incorrect')
      } else if (err.message?.includes('already registered')) {
        setError('Ce numéro est déjà inscrit. Connectez-vous.')
      } else {
        setError(err.message || 'Une erreur est survenue')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">🧼 AbrahamClean</h1>
          <p className="text-gray-500 mt-1">{isLogin ? 'Bon retour !' : 'Crée ton compte'}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input required type="text" placeholder="Nom complet" value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          )}
          <input required type="tel" placeholder="📞 Numéro de téléphone (ex: 07 07 07 07 07)" value={phone} 
            onChange={e => setPhone(e.target.value)} autoComplete="tel"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          <input required type="password" placeholder="🔒 Code PIN (min 6 caractères)" value={password} 
            onChange={e => setPassword(e.target.value)} autoComplete={isLogin ? "current-password" : "new-password"}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          
          <button type="submit" disabled={loading} 
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError('') }} 
            className="text-blue-600 hover:underline font-medium">
            {isLogin ? "Pas de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
          </button>
        </p>
      </div>
    </div>
  )
}