// src/app/admin/page.tsx - VERSION MINIMALE GARANTIE
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0, revenue: 0 });
  const [pricing, setPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      // 1. Session
      const sessionResult = await supabase.auth.getSession();
      if (sessionResult.error || !sessionResult.data.session) {
        router.push('/auth');
        return;
      }

      // 2. Stats commandes (sans destructuration complexe)
      const ordersResult = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const totalOrders = ordersResult.count || 0;

      const todayResult = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]);
      const todayOrders = todayResult.count || 0;

      const pendingResult = await supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['created', 'paid', 'processing']);
      const pending = pendingResult.count || 0;

      const revenueResult = await supabase.from('orders').select('estimated_amount').eq('status', 'paid');
      const revenueList = revenueResult.data || [];
      const totalRevenue = revenueList.reduce((sum: number, o: any) => sum + (o.estimated_amount || 0), 0);

      // 3. Tarifs
      const pricingResult = await supabase.from('pricing_rules').select('*');
      const pricingList = pricingResult.data || [];

      setStats({ total: totalOrders, today: todayOrders, pending, revenue: totalRevenue });
      setPricing(pricingList);
      setLoading(false);
    };
    loadData();
  }, [router]);

  const updatePrice = async (serviceType: string, price: number) => {
    const { error } = await supabase.from('pricing_rules').update({ price_per_unit: price }).eq('service_type', serviceType);
    if (error) alert('Erreur: ' + error.message);
    else {
      alert('✅ Tarif mis à jour');
      const result = await supabase.from('pricing_rules').select('*');
      setPricing(result.data || []);
    }
  };

  const exportCSV = () => {
    const headers = ['Code', 'Client', 'Téléphone', 'Service', 'Quantité', 'Montant', 'Statut', 'Date'];
    const rows = [headers.join(',')];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abrahamclean-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">⚙️ Admin - AbrahamClean</h1>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/auth'); }} className="text-sm text-red-600 hover:underline">Déconnexion</button>
      </header>
      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center"><p className="text-2xl font-bold text-blue-600">{stats.total}</p><p className="text-sm text-gray-500">Total commandes</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center"><p className="text-2xl font-bold text-green-600">{stats.today}</p><p className="text-sm text-gray-500">Aujourd'hui</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center"><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p><p className="text-sm text-gray-500">En attente</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center"><p className="text-2xl font-bold text-purple-600">{stats.revenue.toLocaleString('fr-FR')} FCFA</p><p className="text-sm text-gray-500">Revenu estimé</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4">💰 Gestion des tarifs</h2>
          <div className="space-y-3">
            {pricing.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div><p className="font-medium">{p.service_type === 'normal' ? '🐢 Normal' : '🚀 Urgent'}</p><p className="text-sm text-gray-500">{p.price_per_unit} FCFA / unité</p></div>
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={p.price_per_unit} className="w-20 p-2 border rounded text-right" onBlur={e => updatePrice(p.service_type, parseInt(e.target.value) || p.price_per_unit)} />
                  <span className="text-sm text-gray-400">FCFA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <button onClick={exportCSV} className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition">📊 Exporter les commandes en CSV</button>
        </div>
      </main>
    </div>
  );
}