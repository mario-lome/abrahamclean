'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Stats = {
  totalOrders: number
  todayOrders: number
  byStatus: Record<string, number>
  revenue: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [priceNormal, setPriceNormal] = useState(1500)
  const [priceUrgent, setPriceUrgent] = useState(2500)
  const router = useRouter()

  useEffect(() => {
    const loadStats = async () => {
      const {  { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      // Stats de base
      const {  total } = await supabase.from('orders').select('*', { count: 'exact', head: true })
      
      const today = new Date().toISOString().slice(0, 10)
      const {  todayCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
      
      const {  byStatus } = await supabase
        .from('orders')
        .select('status')
        .not('status', 'eq', 'cancelled')
      
      const statusCounts: Record<string, number> = {}
      byStatus?.forEach((o: any) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
      })

      // Revenu estimé (commandes payées ou plus)
      const {  paidOrders } = await supabase
        .from('orders')
        .select('estimated_amount')
        .in('status', ['paid', 'processing', 'ready', 'retrieved'])
      
      const revenue = paidOrders?.reduce((sum: number, o: any) => sum + (o.estimated_amount || 0), 0) || 0

      // Tarifs actuels
      const {  pricing } = await supabase.from('pricing_rules').select('service_type, price_per_unit')
      pricing?.forEach((p: any) => {
        if (p.service_type === 'normal') setPriceNormal(p.price_per_unit)
        if (p.service_type === 'urgent') setPriceUrgent(p.price_per_unit)
      })

      setStats({
        totalOrders: total || 0,
        todayOrders: todayCount || 0,
        byStatus: statusCounts,
        revenue
      })
      setLoading(false)
    }
    loadStats()
  }, [router])

  // Mettre à jour un tarif
  const updatePrice = async (serviceType: 'normal' | 'urgent', price: number) => {
    try {
      const { error } = await supabase
        .from('pricing_rules')
        .update({ price_per_unit: price })
        .eq('service_type', serviceType)
      if (error) throw error
      alert('✅ Tarif mis à jour')
    } catch (err: any) {
      alert('❌ Erreur : ' + err.message)
    }
  }

  // Export CSV
  const exportCSV = async () => {
    const {  orders } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:profiles(full_name, phone, email)
      `)
      .order('created_at', { ascending: false })
    
    if (!orders?.length) { alert('Aucune donnée à exporter'); return }
    
    const headers = ['Code', 'Client', 'Téléphone', 'Service', 'Quantité', 'Montant', 'Statut', 'Date']
    const rows = orders.map(o => [
      o.code,
      o.profiles?.full_name || '-',
      o.profiles?.phone || '-',
      o.service_type,
      o.quantity,
      o.estimated_amount,
      o.status,
      new Date(o.created_at).toLocaleString('fr-FR')
    ])
    
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `abrahamclean_export_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">📊 Admin - AbrahamClean</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/caisse')} className="text-sm text-gray-600 hover:text-blue-600">🏪 Caisse</button>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Déconnexion</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Cartes stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Total commandes</p>
            <p className="text-2xl font-bold">{stats?.totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Aujourd'hui</p>
            <p className="text-2xl font-bold">{stats?.todayOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.byStatus?.created || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Revenu estimé</p>
            <p className="text-2xl font-bold text-green-600">{stats?.revenue?.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>

        {/* Gestion des tarifs */}
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">💰 Gestion des tarifs d'estimation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">🐢 Service Normal</p>
                <p className="text-sm text-gray-500">24-48h</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={priceNormal} onChange={e => setPriceNormal(parseInt(e.target.value) || 0)} 
                  className="w-24 p-2 border rounded text-right" />
                <button onClick={() => updatePrice('normal', priceNormal)} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Mettre à jour</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">🚀 Service Urgent</p>
                <p className="text-sm text-gray-500">24h</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={priceUrgent} onChange={e => setPriceUrgent(parseInt(e.target.value) || 0)} 
                  className="w-24 p-2 border rounded text-right" />
                <button onClick={() => updatePrice('urgent', priceUrgent)} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Mettre à jour</button>
              </div>
            </div>
          </div>
        </section>

        {/* Export */}
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">📥 Export des données</h2>
          <p className="text-sm text-gray-600 mb-4">Télécharge toutes les commandes au format CSV pour analyse ou sauvegarde.</p>
          <button onClick={exportCSV} 
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition">
            📊 Exporter en CSV
          </button>
        </section>

        {/* Répartition par statut */}
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">📈 Répartition par statut</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
              <div key={status} className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-gray-600">{STATUS_LABELS[status] || status}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  created: 'Créées',
  paid: 'Payées',
  processing: 'En traitement',
  ready: 'Prêtes',
  retrieved: 'Récupérées',
  cancelled: 'Annulées'
}