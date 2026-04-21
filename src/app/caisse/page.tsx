'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CaissePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const { data: fetchedOrders, error } = await supabase
        .from('orders')
        .select('*, profiles(full_name, phone)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) console.error('Erreur:', error.message);
      else setOrders(fetchedOrders || []);
      setLoading(false);
    };
    loadOrders();
  }, [router]);

  const markAsPaid = async (id: string) => {
    const { error } = await supabase.from('orders').update({ status: 'paid' }).eq('id', id);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'paid' } : o));
    }
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-xl font-bold mb-4">🏪 Caisse</h1>
      {orders.length === 0 ? (
        <p>Aucune commande.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white p-4 rounded shadow">
              <p className="font-bold">{order.code}</p>
              <p>{order.profiles?.full_name || 'Client'} - {order.estimated_amount} FCFA</p>
              <p className="text-sm text-gray-500">Statut: {order.status}</p>
              {order.status === 'created' && (
                <button onClick={() => markAsPaid(order.id)} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded">
                  Marquer payée
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}