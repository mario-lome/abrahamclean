// src/app/caisse/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Order = {
  id: string
  code: string
  status: string
  estimated_amount: number
  created_at: string
  profiles?: { full_name: string | null; phone: string | null }
}

export default function CaissePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
  const loadOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    // ✅ Ligne corrigée ici :
    const { data: fetchedOrders, error } = await supabase
      .from('orders')
      .select(`*, profiles:profiles(full_name, phone)`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) console.error('Erreur chargement:', error)
    else setOrders(fetchedOrders || [])
    setLoading(false)
  }
  loadOrders()
}, [router])

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    
    if (error) alert('Erreur: ' + error.message)
    else {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="bg-white shadow-sm p-4 mb-4 rounded-xl">
        <h1 className="text-xl font-bold text-gray-800">🏪 Caisse - AbrahamClean</h1>
      </header>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center text-gray-500">Aucune commande.</div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono font-bold text-blue-700">{order.code}</p>
                  <p className="text-sm text-gray-600">
                    {order.profiles?.full_name || 'Client'} • {order.profiles?.phone || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'created' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'ready' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100'
                  }`}>
                    {order.status}
                  </span>
                  <p className="font-bold mt-1">{order.estimated_amount} FCFA</p>
                </div>
              </div>
              
              {order.status === 'created' && (
                <button onClick={() => updateStatus(order.id, 'paid')}
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm">
                  → Marquer comme payée
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}