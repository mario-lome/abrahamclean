'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Types
type Order = {
  id: string
  code: string
  service_type: 'normal' | 'urgent'
  quantity: number
  estimated_amount: number
  status: string
  created_at: string
}

type PricingRule = {
  service_type: string
  price_per_unit: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [pricing, setPricing] = useState<Record<string, number>>({})
  
  // Formulaire
  const [serviceType, setServiceType] = useState<'normal' | 'urgent'>('normal')
  const [quantity, setQuantity] = useState(1)
  const [pickupDate, setPickupDate] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup')
  const [showReceipt, setShowReceipt] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      // 1. Vérifier session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      setUser(session.user)

      // 2. Charger tarifs
      const { data: pricingRules } = await supabase
        .from('pricing_rules')
        .select('service_type, price_per_unit')
        .eq('is_active', true)
      if (pricingRules) {
        const map: Record<string, number> = {}
        pricingRules.forEach((r: PricingRule) => map[r.service_type] = r.price_per_unit)
        setPricing(map)
      }

      // 3. Charger commandes utilisateur
      const { data: userOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      if (userOrders) setOrders(userOrders)
    }
    loadData()
  }, [router])

  // Calcul montant estimé
  const estimatedAmount = (pricing[serviceType] || 0) * quantity

  // Générer code unique : PRES-ABR-XXXXX
  const generateCode = () => {
    const random = Math.floor(10000 + Math.random() * 90000)
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
    return `PRES-ABR-${random}-${date}`
  }

  // Créer commande
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const code = generateCode()
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          service_type: serviceType,
          quantity,
          estimated_amount: estimatedAmount,
          code,
          pickup_date: pickupDate || undefined,
          delivery_mode: deliveryMode,
          status: 'created'
        })
        .select()
        .single()

      if (error) throw error
      setShowReceipt(newOrder)
      setOrders([newOrder, ...orders])
    } catch (err: any) {
      alert('❌ Erreur : ' + (err.message || 'Impossible de créer la commande'))
    } finally {
      setLoading(false)
    }
  }

  // Déconnexion
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // Formatage
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('fr-FR')
  const formatAmount = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`

  if (!user) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🧼 AbrahamClean</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">👤 {user.user_metadata?.full_name || user.email}</span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Déconnexion</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Formulaire de commande */}
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">📦 Nouvelle commande</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de service</label>
              <select value={serviceType} onChange={e => setServiceType(e.target.value as any)} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="normal">🐢 Normal (24-48h) - {pricing.normal || 1500} FCFA/unité</option>
                <option value="urgent">🚀 Urgent (24h) - {pricing.urgent || 2500} FCFA/unité</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité (pièces ou kg)</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de ramassage</label>
              <input type="datetime-local" value={pickupDate} onChange={e => setPickupDate(e.target.value)} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de récupération</label>
              <select value={deliveryMode} onChange={e => setDeliveryMode(e.target.value as any)} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="pickup">🏪 À récupérer au pressing</option>
                <option value="delivery">🚚 Livraison (optionnel)</option>
              </select>
            </div>

            <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Montant estimatif :</p>
              <p className="text-2xl font-bold text-blue-700">{formatAmount(estimatedAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">* Ajusté en caisse si nécessaire</p>
            </div>

            <button type="submit" disabled={loading} 
              className="md:col-span-2 bg-green-600 text-white p-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50">
              {loading ? 'Création...' : '✅ Créer la commande'}
            </button>
          </form>
        </section>

        {/* Reçu modal */}
        {showReceipt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowReceipt(null)}>
            <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🎫</div>
                <h3 className="text-xl font-bold">Commande confirmée !</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Code :</span>
                  <span className="font-mono font-bold text-lg text-blue-700">{showReceipt.code}</span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Service :</span><span>{showReceipt.service_type === 'urgent' ? '🚀 Urgent' : '🐢 Normal'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Quantité :</span><span>{showReceipt.quantity}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Montant estimé :</span><span className="font-bold">{formatAmount(showReceipt.estimated_amount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Statut :</span><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">🟡 Créée</span></div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
                <p>📍 Présente ce code au pressing pour paiement et dépôt.</p>
                <p className="mt-2 font-medium">📞 Contact : +225 XX XX XX XX</p>
              </div>

              <button onClick={() => { setShowReceipt(null); window.print() }} 
                className="mt-4 w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition">
                🖨️ Imprimer / Enregistrer le reçu
              </button>
            </div>
          </div>
        )}

        {/* Historique des commandes */}
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">📋 Mes commandes</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune commande pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono font-bold text-blue-700">{order.code}</p>
                      <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'created' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'created' && '🟡 Créée'}
                      {order.status === 'paid' && '🔵 Payée'}
                      {order.status === 'processing' && '🟣 En traitement'}
                      {order.status === 'ready' && '🟢 Prête'}
                      {order.status === 'retrieved' && '⚫ Récupérée'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {order.service_type === 'urgent' ? '🚀' : '🐢'} {order.quantity} unités • {formatAmount(order.estimated_amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}