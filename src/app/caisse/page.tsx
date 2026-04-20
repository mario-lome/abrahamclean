// ... début du fichier identique ...

  useEffect(() => {
    const loadOrders = async () => {
      // 🔑 CORRECTION : noter "data:" avant la deuxième accolade
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      let query = supabase
        .from('orders')
        .select(`*, profiles:profiles(full_name, phone)`)
        .order('created_at', { ascending: false })

      if (filter !== 'all') query = query.eq('status', filter)
      
      // 🔑 CORRECTION : noter "data:" avant fetchedOrders
      const { data: fetchedOrders, error } = await query
      if (error) console.error('Erreur chargement commandes:', error)
      else setOrders(fetchedOrders || [])
      setLoading(false)
    }
    loadOrders()
  }, [filter, router])

// ... reste du fichier identique ...