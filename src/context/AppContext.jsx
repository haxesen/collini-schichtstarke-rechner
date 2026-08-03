import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const AppContext = createContext();

export const DEFAULT_MAINTENANCE_TASKS = [
  // Chemie-Bäder
  { id: '2432', name: 'Kupferbad', action: 'Nur Analyse', status: 'pending', time: 30, type: 'chemical' },
  { id: '2453', name: 'Zinnbad', action: 'Nur Analyse', status: 'pending', time: 48, type: 'chemical' },
  { id: '2408', name: 'Abkochentfettung Stahl', action: 'Neuansatz', status: 'pending', time: 240, type: 'chemical' },
  { id: '2410', name: 'Abkochentfettung ZnDG', action: 'Neuansatz', status: 'pending', time: 240, type: 'chemical' },
  { id: '2421', name: 'El. Entfettung Stahl', action: 'Neuansatz', status: 'pending', time: 210, type: 'chemical' },
  { id: '2422', name: 'El. Entfettung ZnDG', action: 'Neuansatz', status: 'pending', time: 210, type: 'chemical' },
  { id: '2433', name: 'Ni-Strike', action: 'Nur Analyse', status: 'pending', time: 30, type: 'chemical' },
  { id: '2437', name: 'NiP', action: 'Analyse & Korrektur', status: 'pending', time: 90, type: 'chemical' },
  { id: '2439', name: 'NiP', action: 'Analyse & Korrektur', status: 'pending', time: 90, type: 'chemical' },
  { id: '2442', name: 'NiP', action: 'Analyse & Korrektur', status: 'pending', time: 90, type: 'chemical' },
  { id: '2444', name: 'NiP', action: 'Analyse & Korrektur', status: 'pending', time: 90, type: 'chemical' },
  { id: '2447', name: 'NiP-PTFE', action: 'Neuansatz', status: 'pending', time: 150, type: 'chemical' },
  { id: '2448', name: 'NiP-PTFE', action: 'Neuansatz', status: 'pending', time: 150, type: 'chemical' },
  { id: '2407', name: 'Gestellbeize Salpetersäure', action: 'Neuansatz', status: 'pending', time: 180, type: 'chemical' },
  { id: '2415', name: 'Salzsäure', action: 'Neuansatz', status: 'pending', time: 120, type: 'chemical' },
  { id: '2417', name: 'Dekapierung ZnDG', action: 'Neuansatz', status: 'pending', time: 120, type: 'chemical' },
  { id: '2426', name: 'Salzsäure', action: 'Neuansatz', status: 'pending', time: 120, type: 'chemical' },
  { id: '2452', name: 'Dekapierung Schwefelsäure', action: 'Nur Analyse', status: 'pending', time: 30, type: 'chemical' },
  // Spülbäder
  { id: '2405', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2412', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2413', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2414', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2418', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2419', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2420', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2423', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2424', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2425', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2427', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2429', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2430', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2431', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2434', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2435', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2436', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2441', name: 'Sparspüle NiP', action: 'Ablassen', status: 'pending', time: 30, type: 'water' },
  { id: '2446', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2449', name: 'Duschposition', action: 'Ablassen', status: 'pending', time: 24, type: 'water' },
  { id: '2450', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2451', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2454', name: 'Duschposition', action: 'Ablassen', status: 'pending', time: 24, type: 'water' },
  { id: '2455', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2456', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2457', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2458', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2459', name: 'Spüle', action: 'Ablassen', status: 'pending', time: 18, type: 'water' },
  { id: '2460', name: 'Heisspüle', action: 'Ablassen', status: 'pending', time: 30, type: 'water' },
  // Extra Tasks
  { id: 'E1', name: 'Ni-Strike Anoden', action: 'Tausch', status: 'pending', time: 60, type: 'extra' },
  { id: 'E2', name: 'Zinn Anoden', action: 'Tausch', status: 'pending', time: 60, type: 'extra' },
  { id: 'E3', name: 'Cu-Bad', action: 'Anoden befüllen', status: 'pending', time: 45, type: 'extra' },
  { id: 'E4', name: 'Schienen', action: 'Reinigen', status: 'pending', time: 120, type: 'extra', startPos: '2400', endPos: '2482' },
];

export const AppProvider = ({ children }) => {
  const [lang] = useState('de');
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('hub');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [selectedLine, setSelectedLine] = useState(() => {
    // Check URL parameters first (useful for public displays)
    const hash = window.location.hash;
    if (hash.includes('line=')) {
      const line = hash.split('line=')[1];
      if (line) return line;
    }
    // Always start with Machine Selector by default on fresh load
    return null;
  });
  const [machines, setMachines] = useState([]);
  const [activeInfos, setActiveInfos] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });
  const [moduleOrder, setModuleOrder] = useState(['wtAblauf', 'calculator', 'logbook', 'checklist', 'info_wall', 'prodPlan', 'wartungsplaner']);

  // Wartungsplaner State (Session Persistence)
  const [maintenanceStaffCount, setMaintenanceStaffCount] = useState(() => {
    const saved = localStorage.getItem('collini_maintenance_staff');
    return saved ? parseInt(saved) : 3;
  });

  const [maintenanceTasks, setMaintenanceTasks] = useState(() => {
    const saved = localStorage.getItem('collini_maintenance_tasks');
    if (saved) return JSON.parse(saved);
    return DEFAULT_MAINTENANCE_TASKS;
  });

  const saveMaintenanceLog = async () => {
    setIsLoading(true);
    try {
      const { supabase } = await import('../supabase');
      const now = new Date();
      const hours = now.getHours();
      const prodDay = new Date(now);
      if (hours < 6) prodDay.setDate(prodDay.getDate() - 1);
      
      const doneCount = maintenanceTasks.filter(t => t.status === 'done').length;
      const totalEffort = maintenanceTasks
        .filter(t => t.status !== 'done')
        .reduce((sum, t) => sum + t.time, 0);

      const { error } = await supabase
        .from('collini_maintenance_logs')
        .insert({
          machine_line: selectedLine || 'KS-24',
          staff_count: maintenanceStaffCount,
          total_tasks: maintenanceTasks.length,
          completed_tasks: doneCount,
          duration_min: Math.round(totalEffort / maintenanceStaffCount),
          tasks_data: maintenanceTasks,
          production_day: prodDay.toISOString().split('T')[0]
        });

      if (error) throw error;
      
      // Reset tasks after successful save
      setMaintenanceTasks(DEFAULT_MAINTENANCE_TASKS);
      return true;
    } catch (err) {
      console.error('Error saving maintenance log:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('collini_maintenance_tasks', JSON.stringify(maintenanceTasks));
  }, [maintenanceTasks]);

  useEffect(() => {
    localStorage.setItem('collini_maintenance_staff', maintenanceStaffCount.toString());
  }, [maintenanceStaffCount]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchMachines = async () => {
    setIsLoading(true);
    try {
      const { supabase } = await import('../supabase');
      const { data } = await supabase
        .from('collini_machines')
        .select('*')
        .order('name', { ascending: true });
      if (data) setMachines(data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveInfos = async () => {
    let lineToFetch = selectedLine;
    if (!lineToFetch) {
       const hash = window.location.hash;
       if (hash.includes('line=')) lineToFetch = hash.split('line=')[1];
    }

    if (!lineToFetch) {
      setActiveInfos([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const { supabase } = await import('../supabase');
      const { data } = await supabase
        .from('collini_info_wall')
        .select('*')
        .eq('machine_line', lineToFetch)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (data) setActiveInfos(data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const { supabase } = await import('../supabase');
      const { data } = await supabase
        .from('collini_logbook_config')
        .select('*')
        .filter('type', 'in', '("mech","operator")')
        .order('label', { ascending: true });
      if (data) setStaff(data);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchModuleOrder = async () => {
    try {
      const { supabase } = await import('../supabase');
      const { data } = await supabase
        .from('collini_logbook_config')
        .select('*')
        .eq('type', 'hub_order')
        .maybeSingle();
      
      if (data && data.value) {
        setModuleOrder(data.value.split(','));
      }
    } catch (err) {
      console.error('Error fetching module order:', err);
    }
  };

  const updateModuleOrder = async (newOrder) => {
    setModuleOrder(newOrder);
    try {
      const { supabase } = await import('../supabase');
      const { data: existing } = await supabase
        .from('collini_logbook_config')
        .select('id')
        .eq('type', 'hub_order')
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from('collini_logbook_config')
          .update({ value: newOrder.join(',') })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('collini_logbook_config')
          .insert({ type: 'hub_order', value: newOrder.join(','), label: 'Hub Module Order' });
      }
    } catch (err) {
      console.error('Error updating module order:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchMachines(), fetchStaff(), fetchModuleOrder()]);
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedLine) {
      fetchActiveInfos();
      localStorage.setItem('collini_selected_line', selectedLine);
    }
  }, [selectedLine]);

  useEffect(() => {
    let channel;

    const setupSubscription = async () => {
      if (!selectedLine) return;
      const { supabase: sb } = await import('../supabase');
      
      channel = sb
        .channel('global_ticker_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'collini_info_wall',
          filter: `machine_line=eq.${selectedLine}`
        }, () => {
          fetchActiveInfos();
        })
        .subscribe();
    };
    
    setupSubscription();

    return () => {
      if (channel) {
        import('../supabase').then(m => m.supabase.removeChannel(channel));
      }
    };
  }, [selectedLine]);

  const t = translations['de'];

  const askConfirm = (message, onConfirm) => {
    setConfirmModal({ show: true, message, onConfirm });
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [autoScale, setAutoScale] = useState(() => {
    const saved = localStorage.getItem('collini_auto_scale');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleAutoScale = () => {
    setAutoScale(prev => {
      const next = !prev;
      localStorage.setItem('collini_auto_scale', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AppContext.Provider value={{ 
      lang,
      isAdmin, setIsAdmin, 
      view, setView, 
      t,
      showAdminLogin, setShowAdminLogin,
      showManager, setShowManager,
      activeInfos, fetchActiveInfos,
      staff, fetchStaff,
      selectedLine, setSelectedLine,
      machines, fetchMachines,
      isLoading, setIsLoading,
      isOffline,
      confirmModal, setConfirmModal, askConfirm,
      moduleOrder, updateModuleOrder,
      maintenanceTasks, setMaintenanceTasks,
      maintenanceStaffCount, setMaintenanceStaffCount,
      saveMaintenanceLog,
      isMobile,
      autoScale, setAutoScale, toggleAutoScale
    }}>

      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
