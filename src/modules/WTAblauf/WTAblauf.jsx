// WTAblauf Module - Refreshed Dependencies
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Target, 
  Layers, 
  AlertCircle, 
  FileText, 
  Printer, 
  Clock, 
  CheckCircle2, 
  Database,
  BarChart3,
  Calendar,
  LayoutDashboard,
  Loader2,
  Info,
  X
} from 'lucide-react';
import { supabase } from '../../supabase';
import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, getISOWeek, setISOWeek, getYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { useApp } from '../../context/AppContext';

const WTAblauf = () => {
  const { t, setView, selectedLine, isMobile } = useApp();
  
  // Production Day Logic: If before 6:00 AM, logically it's still "yesterday's" production day
  const getProductionDate = (date = new Date()) => {
    const d = new Date(date);
    if (d.getHours() < 6) {
      d.setDate(d.getDate() - 1);
    }
    return d;
  };

  const [mode, setMode] = useState('tracking'); 
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingLines, setSavingLines] = useState({});
  const updateTimeoutRef = useRef({});
  const [data, setData] = useState({});
  const [weeklyData, setWeeklyData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getProductionDate());
  const [showKWPicker, setShowKWPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => getYear(selectedDate));
  const activeKWRef = useRef(null);

  useEffect(() => {
    if (showKWPicker) {
      setTimeout(() => {
        activeKWRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    }
  }, [showKWPicker, pickerYear]);

  const handleSelectKW = (kwNum) => {
    const baseDate = new Date(pickerYear, 0, 4);
    const targetDate = setISOWeek(baseDate, kwNum);
    setSelectedDate(targetDate);
    setShowKWPicker(false);
  };
  const [shiftMode, setShiftMode] = useState(() => {
    return localStorage.getItem('collini_wt_shift_mode') || '8h';
  });

  // Auto-detect current shift based on hour and mode
  const getCurrentShift = (mode = shiftMode) => {
    const hour = new Date().getHours();
    if (mode === '12h') {
      if (hour >= 6 && hour < 18) return '1. Schicht (12h)';
      return '2. Schicht (12h)';
    } else {
      if (hour >= 6 && hour < 14) return '1. Schicht';
      if (hour >= 14 && hour < 22) return '2. Schicht';
      return '3. Schicht';
    }
  };

  const [activeShift, setActiveShift] = useState(() => getCurrentShift(shiftMode));
  const [, setTick] = useState(0);

  const changeShiftMode = (newMode) => {
    setShiftMode(newMode);
    localStorage.setItem('collini_wt_shift_mode', newMode);
    setActiveShift(getCurrentShift(newMode));
  };

  // Update playhead every minute
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const shifts = shiftMode === '12h' ? {
    '1. Schicht (12h)': [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    '2. Schicht (12h)': [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5]
  } : {
    '1. Schicht': [6, 7, 8, 9, 10, 11, 12, 13],
    '2. Schicht': [14, 15, 16, 17, 18, 19, 20, 21],
    '3. Schicht': [22, 23, 0, 1, 2, 3, 4, 5]
  };

  const getLineFromHour = (h) => ((h - 6 + 24) % 24) + 1;

  const isHourPassed = (hour) => {
    const prodDateStr = format(getProductionDate(selectedDate), 'yyyy-MM-dd');
    const todayProdDateStr = format(getProductionDate(new Date()), 'yyyy-MM-dd');

    if (prodDateStr < todayProdDateStr) return true;
    if (prodDateStr > todayProdDateStr) return false;

    const currentHour = new Date().getHours();
    const hourOffset = (hour - 6 + 24) % 24;
    const currentOffset = (currentHour - 6 + 24) % 24;

    return hourOffset < currentOffset;
  };

  const isCurrentHour = (hour) => {
    const prodDateStr = format(getProductionDate(selectedDate), 'yyyy-MM-dd');
    const todayProdDateStr = format(getProductionDate(new Date()), 'yyyy-MM-dd');
    if (prodDateStr !== todayProdDateStr) return false;

    return hour === new Date().getHours();
  };

  const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

  const handleCountChange = (line, field, value) => {
    let finalValue;
    if (field === 'remark') {
      finalValue = value;
    } else if (field === 'quality_ok') {
      finalValue = Boolean(value);
    } else if (field === 'target_count') {
      const strVal = String(value).replace(',', '.');
      finalValue = strVal === '' || isNaN(parseFloat(strVal)) ? 0 : parseFloat(strVal);
    } else {
      finalValue = parseInt(value, 10) || 0;
    }
    
    // Find the specific date for this row
    const currentRow = counts.find(c => c.line === line) || { count: 0, magazin_count: 0, quality_ok: true, remark: '' };
    const dateStr = currentRow?.created_at || format(selectedDate, 'yyyy-MM-dd');

    // LOGIC RULE: Magazin cannot be greater than WT IST (only for numeric fields)
    if (field === 'magazin_count' && typeof finalValue === 'number' && finalValue > currentRow.count) {
      finalValue = currentRow.count;
    }
    
    setCounts(prev => {
      const exists = prev.some(c => c.line === line);
      if (!exists) {
        return [...prev, { line, count: 0, target_count: 0, magazin_count: 0, quality_ok: true, remark: '', created_at: dateStr, [field]: finalValue }];
      }
      
      return prev.map(c => {
        if (c.line === line) {
          const updated = { ...c, [field]: finalValue };
          // Enforce rule: if count was reduced, magazin must follow
          if (field === 'count' && typeof updated.magazin_count === 'number' && updated.magazin_count > (updated.count || 0)) {
            updated.magazin_count = updated.count;
          }
          return updated;
        }
        return c;
      });
    });

    const timeoutKey = `${line}-${field}`;
    if (updateTimeoutRef.current[timeoutKey]) {
      clearTimeout(updateTimeoutRef.current[timeoutKey]);
    }

    setSavingLines(prev => ({ ...prev, [timeoutKey]: 'saving' }));

    updateTimeoutRef.current[timeoutKey] = setTimeout(async () => {
      try {
        const { data: updatedData, error: updateError } = await supabase
          .from('wt_tracking')
          .update({ [field]: finalValue })
          .eq('line', line)
          .eq('created_at', dateStr)
          .select();

        if (updateError) throw updateError;

        // If no rows were updated, we need to insert
        if (!updatedData || updatedData.length === 0) {
          const { error: insertError } = await supabase
            .from('wt_tracking')
            .insert([{ 
              line, 
              created_at: dateStr, 
              [field]: finalValue,
              target_count: field === 'target_count' ? finalValue : 0,
              count: field === 'count' ? finalValue : 0,
              magazin_count: field === 'magazin_count' ? finalValue : 0,
              quality_ok: field === 'quality_ok' ? finalValue : true,
              remark: field === 'remark' ? finalValue : ''
            }]);
          if (insertError) throw insertError;
        }
        
        setSavingLines(prev => ({ ...prev, [timeoutKey]: 'saved' }));
        setTimeout(() => {
          setSavingLines(prev => {
            const newState = { ...prev };
            delete newState[timeoutKey];
            return newState;
          });
        }, 800);
      } catch (err) {
        console.error('Save error:', err);
        setSavingLines(prev => ({ ...prev, [timeoutKey]: 'error' }));
      }
    }, 1000);
  };

  const fetchDailyData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      let { data: dbData, error } = await supabase
        .from('wt_tracking')
        .select('*')
        .eq('created_at', dateStr);

      if (error) throw error;

      if (!dbData || dbData.length < 24) {
        const existingLines = dbData ? dbData.map(d => Number(d.line)) : [];
        const missingRows = Array.from({ length: 24 }, (_, i) => i + 1)
          .filter(line => !existingLines.includes(line))
          .map(line => ({
            line: line,
            count: 0,
            target_count: 0,
            magazin_count: 0,
            quality_ok: true,
            created_at: dateStr
          }));
        
        if (missingRows.length > 0) {
          const { error: insertError } = await supabase
            .from('wt_tracking')
            .insert(missingRows);
            
          if (!insertError) {
            // Fetch again to get the complete dataset
            const { data: completeData } = await supabase.from('wt_tracking').select('*').eq('created_at', dateStr);
            if (completeData) dbData = completeData;
          }
        }
      }
      
      if (dbData) {
        const parsedData = dbData.map(d => ({ 
          ...d, 
          line: Number(d.line),
          target_count: d.target_count != null ? Number(d.target_count) : 0,
          count: Number(d.count || 0),
          magazin_count: Number(d.magazin_count || 0),
          quality_ok: d.quality_ok !== false
        }));
        setCounts(parsedData.sort((a, b) => a.line - b.line));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [selectedDate]);

  const fetchWeeklyData = useCallback(async () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const dateRange = eachDayOfInterval({ start, end });
    
    try {
      const { data: dbData, error } = await supabase
        .from('wt_tracking')
        .select('*')
        .gte('created_at', format(start, 'yyyy-MM-dd'))
        .lte('created_at', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const aggregated = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        // Supabase returns timestamps like "2026-05-13T00:00:00", so we use startsWith
        const dayRecords = dbData.filter(r => r.created_at && r.created_at.startsWith(dateStr));
        const rawZiel = dayRecords.reduce((sum, r) => sum + (Number(r.target_count) || 0), 0);
        return {
          date: dateStr,
          displayDate: format(date, 'dd.MM.'),
          dayName: format(date, 'EEEE', { locale: de }),
          ist: dayRecords.reduce((sum, r) => sum + (r.count || 0), 0),
          ziel: round2(rawZiel),
          magazin: dayRecords.reduce((sum, r) => sum + (r.magazin_count || 0), 0)
        };
      });

      setWeeklyData(aggregated);
    } catch (err) {
      console.error('Error fetching weekly data:', err);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDailyData(true);
    fetchWeeklyData();

    const channel = supabase
      .channel('wt_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wt_tracking' }, (payload) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        if (payload.new.created_at === dateStr) {
          const newLine = Number(payload.new.line);
          const timeoutKey = `${newLine}-count`;
          const targetKey = `${newLine}-target_count`;
          
          if (!updateTimeoutRef.current[timeoutKey] && !updateTimeoutRef.current[targetKey]) {
            setCounts(prev => prev.map(c => 
              c.line === newLine ? { ...payload.new, line: newLine } : c
            ));
          }
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchDailyData, fetchWeeklyData, selectedDate]);

  const getShiftTotals = (shiftName) => {
    const hours = shifts[shiftName] || [];
    let targetSum = 0;
    let countSum = 0;
    let magazinSum = 0;
    let nokCount = 0;

    hours.forEach((h) => {
      const line = getLineFromHour(h);
      const row = counts.find(c => c.line === line);
      if (row) {
        targetSum += Number(row.target_count || 0);
        countSum += Number(row.count || 0);
        magazinSum += Number(row.magazin_count || 0);
        if (row.quality_ok === false) nokCount++;
      }
    });

    const target = round2(targetSum);
    const count = round2(countSum);
    const magazin = round2(magazinSum);
    const eff = target > 0 ? Math.round((count / target) * 100) : 0;

    return { target, count, magazin, eff, nokCount };
  };

  const handleExportPDF = () => { window.print(); };

  const handleExportCSV = () => {
    const headers = ['Stunde', 'Ziel', 'Ist', 'Magazin', 'Qualität', 'Differenz', 'Bemerkung'];
    const rows = counts.map(c => {
      const start = (c.line - 1 + 6) % 24;
      const end = (start + 1) % 24;
      const hourStr = `${start.toString().padStart(2, '0')}:00-${end.toString().padStart(2, '0')}:00`;

      return [
        hourStr,
        round2(c.target_count),
        c.count,
        c.magazin_count,
        c.quality_ok !== false ? 'i.O.' : 'n.i.O.',
        round2(c.count - c.target_count),
        `"${(c.remark || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `WT_Ablauf_${format(selectedDate, 'yyyy-MM-dd')}_${selectedLine || 'KS24'}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStats = () => {
    // Calculate shift totals first for absolute consistency
    const shiftData = Object.entries(shifts).map(([name]) => {
      const totals = getShiftTotals(name);
      return { name, ist: totals.count, ziel: totals.target, magazin: totals.magazin, eff: totals.eff };
    });

    const totalIst = shiftData.reduce((sum, s) => sum + s.ist, 0);
    const totalZiel = round2(shiftData.reduce((sum, s) => sum + s.ziel, 0));
    const totalMagazin = shiftData.reduce((sum, s) => sum + s.magazin, 0);
    
    const dailyEfficiency = totalZiel > 0 ? Math.round((totalIst / totalZiel) * 100) : 0;

    const weeklyTotalIst = weeklyData.reduce((sum, d) => sum + (d.date === format(selectedDate, 'yyyy-MM-dd') ? totalIst : d.ist), 0);
    const weeklyTotalZiel = weeklyData.reduce((sum, d) => sum + (d.date === format(selectedDate, 'yyyy-MM-dd') ? totalZiel : d.ziel), 0);
    const weeklyTotalMagazin = weeklyData.reduce((sum, d) => sum + (d.date === format(selectedDate, 'yyyy-MM-dd') ? totalMagazin : d.magazin), 0);
    const weeklyEfficiency = weeklyTotalZiel > 0 ? Math.round((weeklyTotalIst / weeklyTotalZiel) * 100) : 0;

    const dashArray = 440;
    const dashOffset = dashArray - (dashArray * dailyEfficiency) / 100;

    return (
      <div className="stats-container animate-fade-in">
        <div className="daily-stats-grid">
          <div className="daily-hero-card">
            <div className="gauge-section">
              <div className="gauge-container">
                <svg width="160" height="160">
                  <circle className="gauge-bg" cx="80" cy="80" r="70" />
                  <circle 
                    className="gauge-fill" 
                    cx="80" cy="80" r="70" 
                    style={{ 
                      strokeDasharray: dashArray, 
                      strokeDashoffset: dashOffset,
                      stroke: dailyEfficiency >= 100 ? '#2ecc71' : 'var(--accent-cyan)'
                    }} 
                  />
                </svg>
                <div className="gauge-content">
                  <span className="percent">{dailyEfficiency}%</span>
                  <span className="label">ZIEL</span>
                </div>
              </div>
            </div>

            <div className="stats-info-section">
              <div className="hero-header">
                <Target className="text-accent" size={24} />
                <h3>Tagesübersicht</h3>
              </div>
              <div className="hero-values">
                <div className="hero-group">
                  <div className="val-box">
                    <span className="val-label">IST WT</span>
                    <span className="val-number">{totalIst}</span>
                  </div>
                  <div className="val-separator">/</div>
                  <div className="val-box">
                    <span className="val-label">ZIEL WT</span>
                    <span className="val-number muted">{totalZiel}</span>
                  </div>
                </div>

                <div className="hero-divider-vertical" />

                <div className="hero-group magazine-group">
                  <div className="val-box">
                    <span className="val-label text-accent">MAGAZIN</span>
                    <span className="val-number text-accent">{totalMagazin}</span>
                  </div>
                </div>
              </div>
              <div className="hero-footer">
                <Clock size={16} />
                <span>Letzter Stand: {format(new Date(), 'HH:mm')}</span>
              </div>
            </div>
          </div>

          <div className="daily-side-pills">
            <div className="mini-pill-card">
              <div className="pill-icon cyan"><Layers size={24} /></div>
              <div className="pill-data">
                <span className="p-label">Magazin Total</span>
                <span className="p-value">{totalMagazin}</span>
              </div>
            </div>
            <div className="mini-pill-card">
              <div className="pill-icon green"><TrendingUp size={24} /></div>
              <div className="pill-data">
                <span className="p-label">Weekly Eff.</span>
                <span className={`p-value ${weeklyEfficiency >= 90 ? 'text-success' : ''}`}>
                  {weeklyEfficiency}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="weekly-charts-grid">
          <div className="main-chart-card">
            <div className="hero-header">
              <Database className="text-accent" size={24} />
              <h3>Schicht-Analyse ({format(selectedDate, 'dd.MM.')})</h3>
            </div>
            
            <div className="shift-analysis-grid">
              {shiftData.map((shift, idx) => (
                <div key={idx} className={`shift-perf-card ${shift.eff >= 100 ? 'met' : ''}`}>
                  <div className="shift-card-header">
                    <span className="shift-name">{shift.name}</span>
                    <span className="shift-percent">{shift.eff}%</span>
                  </div>
                  
                  <div className="shift-metrics">
                    <div className="metric">
                      <span className="m-label">IST WT</span>
                      <span className="m-val">{shift.ist}</span>
                    </div>
                    <div className="metric">
                      <span className="m-label">ZIEL WT</span>
                      <span className="m-val faded">{shift.ziel}</span>
                    </div>
                  </div>

                  <div className="shift-progress-track">
                    <div 
                      className="shift-progress-fill" 
                      style={{ width: `${Math.min(100, shift.eff)}%` }} 
                    />
                  </div>

                  <div className="shift-hours-preview">
                    <Clock size={12} />
                    <span>
                      {shifts[shift.name][0]}:00 - {((shifts[shift.name][shifts[shift.name].length-1] + 1) % 24)}:00
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="actions-card glass-panel">
            <div className="card-title"><LayoutDashboard size={18} /> Schnell-Aktionen</div>
            <div className="action-btns">
              <button onClick={handleExportCSV} className="action-btn print">
                <FileText size={18} /> Export CSV
              </button>
            </div>
            <div className="info-box-compact">
              <AlertCircle size={20} className="text-accent" />
              <p>Der Wochenbericht wird jeden Sonntag um Mitternacht automatisch generiert.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="full-view-wrapper">
      <div className="print-only-header">
        <div className="print-header-top">
          <span className="print-app-name">Collini Industrial Suite</span>
          <span className="print-date">{format(new Date(), 'dd.MM.yyyy HH:mm')}</span>
        </div>
        <div className="print-module-title">
          <h1>WT-ABLAUF SCHICHTBERICHT (KW {getISOWeek(selectedDate)})</h1>
          {selectedLine && <span className="line-badge">{selectedLine}</span>}
        </div>
      </div>

      <div className="wt-header no-print">
        <div className="header-left">
          <button onClick={() => setView('hub')} className="back-btn">
            <ChevronLeft size={20} /> {t.back}
          </button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: 0, textTransform: 'uppercase' }}>
            WT-ABLAUF
            {selectedLine && <span className="line-badge" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>{selectedLine}</span>}
          </h1>
        </div>
        
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div 
            className="kw-badge-header" 
            onClick={() => {
              setPickerYear(getYear(selectedDate));
              setShowKWPicker(true);
            }}
            title="Klick zum Wechseln der Kalenderwoche"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.18) 0%, rgba(0, 242, 254, 0.05) 100%)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '1.5px',
              boxShadow: '0 0 12px rgba(0, 242, 254, 0.15)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}
          >
            <Calendar size={15} />
            <span>KW {getISOWeek(selectedDate)}</span>
          </div>

          <div className="mode-toggle">
            <button 
              className={`mode-btn ${mode === 'tracking' ? 'active' : ''}`}
              onClick={() => setMode('tracking')}
            >
              <Database size={18} /> Erfassung
            </button>
            <button 
              className={`mode-btn ${mode === 'stats' ? 'active' : ''}`}
              onClick={() => setMode('stats')}
            >
              <BarChart3 size={18} /> Statistik
            </button>
          </div>
        </div>
      </div>

      <div className="wt-calendar-stripe no-print">
        <div className="calendar-nav-wrapper">
          <button onClick={() => setSelectedDate(prev => isMobile ? subDays(prev, 1) : subDays(prev, 7))} className="week-nav-btn">
            <ChevronLeft size={20} />
            <span>{isMobile ? t.prevDay : t.prevWeek}</span>
          </button>
          
          <div className="days-container">
            {/* Timeline Track & Playhead */}
            <div className="timeline-track" />
            
            {(() => {
              const now = new Date();
              const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
              const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
              const startOfSelectedWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
              
              // Only show playhead if we are viewing the current week
              if (isSameDay(startOfCurrentWeek, startOfSelectedWeek)) {
                const totalMs = 7 * 24 * 60 * 60 * 1000;
                const elapsedMs = now - startOfCurrentWeek;
                const percent = (elapsedMs / totalMs) * 100;
                return <div className="timeline-playhead" style={{ left: `${percent}%` }} />;
              }
              return null;
            })()}

            {(() => {
              const allDays = eachDayOfInterval({
                start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
                end: endOfWeek(selectedDate, { weekStartsOn: 1 })
              });

              // On mobile, only show 2 days: selected date and the next one (or previous)
              // to ensure zero overflow on real devices.
              const visibleDays = isMobile 
                ? [selectedDate, addDays(selectedDate, 1)]
                : allDays;

              return visibleDays.map((date, idx) => {
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, getProductionDate());
              
              // Night Shift Transition Logic
              const currentHour = new Date().getHours();
              const isNightShift = currentHour >= 22 || currentHour < 6;
              const isBridgeActive = isToday && isNightShift;

              const dateStr = format(date, 'yyyy-MM-dd');
              const dayData = weeklyData.find(d => d.date === dateStr);
              
              let statusClass = 'pending';
              if (dayData && dayData.ziel > 0) {
                statusClass = dayData.ist >= dayData.ziel ? 'met' : 'behind';
              }

              return (
                <button 
                  key={idx} 
                  className={`calendar-day-item ${isSelected ? 'active' : ''} ${isBridgeActive ? 'night-shift-bridge' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="day-name">{format(date, 'EEE', { locale: de }).toUpperCase()}</span>
                  <span className="day-num">{format(date, 'dd')}</span>
                  <div className={`status-dot ${statusClass}`} />
                </button>
              );
            })})()}
          </div>

          <button onClick={() => setSelectedDate(prev => isMobile ? addDays(prev, 1) : addDays(prev, 7))} className="week-nav-btn">
            <span>{isMobile ? t.nextDay : t.nextWeek}</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {isMobile && (
        <div className="mobile-info-banner">
          <Info size={16} /> <span>{t.viewerMode || 'Anzeigemodus'}</span>
        </div>
      )}

      {loading ? (
        <div className="wt-loader-container animate-fade-in">
          <Loader2 className="spinner" size={48} />
          <p>Daten werden geladen...</p>
        </div>
      ) : mode === 'tracking' ? (
        <div className={`wt-content-grid ${isMobile ? 'wt-content-grid-mobile' : ''} animate-fade-in`}>
          <div className="main-table-card glass-panel">
            <div className="shift-tabs-container">
              <div className="shift-controls-group">
                <div className="shift-tabs-pill">
                  {(shifts[activeShift] ? Object.keys(shifts) : Object.keys(shifts)).map(s => (
                    <button 
                      key={s}
                      className={`shift-tab-btn ${activeShift === s ? 'active' : ''}`}
                      onClick={() => setActiveShift(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="shift-mode-toggle">
                  <button 
                    className={`mode-toggle-btn ${shiftMode === '8h' ? 'active' : ''}`}
                    onClick={() => changeShiftMode('8h')}
                    title="3 Schichten à 8 Stunden"
                  >
                    8h (3 Schichten)
                  </button>
                  <button 
                    className={`mode-toggle-btn ${shiftMode === '12h' ? 'active' : ''}`}
                    onClick={() => changeShiftMode('12h')}
                    title="2 Schichten à 12 Stunden"
                  >
                    12h (2 Schichten)
                  </button>
                </div>
              </div>

              <div className="auto-save-indicator">
                <Database size={14} className="text-success" />
                Synchronisiert
              </div>
            </div>

            {(() => {
              const activeHours = shifts[activeShift] || shifts[Object.keys(shifts)[0]] || [];
              const missingCount = activeHours.filter(h => {
                const line = getLineFromHour(h);
                const r = counts.find(c => c.line === line);
                const target = Number(r?.target_count || 0);
                const count = Number(r?.count || 0);
                return isHourPassed(h) && target > 0 && count === 0;
              }).length;

              if (missingCount === 0) return null;

              return (
                <div className="missing-entries-banner animate-fade-in">
                  <AlertCircle size={18} className="text-warning-icon" />
                  <span>
                    <strong>Achtung:</strong> In dieser Schicht fehlt für <strong>{missingCount} Stunde{missingCount > 1 ? 'n' : ''}</strong> noch die Eingabe!
                  </span>
                </div>
              );
            })()}

            <div className="wt-table-header">
              <span>STUNDE</span>
              <span>WT ZIEL</span>
              <span>WT IST</span>
              <span>davon Magazin</span>
              <span>QUALITÄT</span>
              <span>STATUS</span>
              <span>BEMERKUNG</span>
            </div>

            <div className="wt-table-body">
              {(shifts[activeShift] || shifts[Object.keys(shifts)[0]] || []).map((hour) => {
                const line = getLineFromHour(hour);
                const rowData = counts.find(c => c.line === line) || { target_count: 0, count: 0, magazin_count: 0, quality_ok: true };
                const targetNum = Number(rowData.target_count || 0);
                const countNum = Number(rowData.count || 0);
                const isMet = countNum >= targetNum && targetNum > 0;
                const passed = isHourPassed(hour);
                const activeNow = isCurrentHour(hour);
                const isUnfilled = passed && targetNum > 0 && countNum === 0;

                return (
                  <div key={line} className={`wt-row ${isUnfilled ? 'row-unfilled-warning' : ''} ${activeNow ? 'row-current-active' : ''}`}>
                    <div className="col-hour">
                      <Clock size={16} className={activeNow ? 'text-accent' : isUnfilled ? 'text-warning-icon' : 'text-secondary'} />
                      <span className={activeNow ? 'current-hour-text' : ''}>
                        {hour.toString().padStart(2, '0')}:00 - {((hour + 1) % 24).toString().padStart(2, '0')}:00
                      </span>
                        {isMet && <div className="hour-dot" />}
                      {isUnfilled && <div className="hour-warning-dot" title="Eingabe fehlt!" />}
                    </div>
                    
                    <div className="col-target">
                      {!isMobile ? (
                        <input
                          type="number"
                          step="any"
                          value={rowData.target_count}
                          onChange={(e) => handleCountChange(line, 'target_count', e.target.value)}
                          className={`count-input target ${savingLines[`${line}-target_count`] || ''}`}
                        />
                      ) : (
                        <div className="mobile-val-display target">{rowData.target_count}</div>
                      )}
                    </div>

                    <div className="col-ist">
                      {!isMobile ? (
                        <div className="actual-display">
                          <span className="val">{rowData.count}</span>
                          <div className="btn-group">
                            <button onClick={() => handleCountChange(line, 'count', rowData.count + 1)} className="adjust-btn plus">+</button>
                            <button onClick={() => handleCountChange(line, 'count', Math.max(0, rowData.count - 1))} className="adjust-btn minus">-</button>
                          </div>
                          <div className={`sync-stripe ${savingLines[`${line}-count`] || ''}`} />
                        </div>
                      ) : (
                        <div className="mobile-val-display ist">{rowData.count}</div>
                      )}
                    </div>

                    <div className="col-magazin">
                      {!isMobile ? (
                        <div className="actual-display">
                          <span className="val">{rowData.magazin_count}</span>
                          <div className="btn-group">
                            <button onClick={() => handleCountChange(line, 'magazin_count', rowData.magazin_count + 1)} className="adjust-btn plus">+</button>
                            <button onClick={() => handleCountChange(line, 'magazin_count', Math.max(0, rowData.magazin_count - 1))} className="adjust-btn minus">-</button>
                          </div>
                          <div className={`sync-stripe ${savingLines[`${line}-magazin_count`] || ''}`} />
                        </div>
                      ) : (
                        <div className="mobile-val-display">{rowData.magazin_count}</div>
                      )}
                    </div>

                    <div className="col-quality">
                      <button
                        type="button"
                        className={`quality-toggle-btn ${rowData.quality_ok !== false ? 'ok' : 'nok'} ${savingLines[`${line}-quality_ok`] || ''}`}
                        onClick={() => handleCountChange(line, 'quality_ok', rowData.quality_ok === false)}
                        title={rowData.quality_ok !== false ? 'Qualität gut (i.O.)' : 'Qualität schlecht (n.i.O.)'}
                      >
                        <span className="quality-led" />
                        <span className="quality-text">{rowData.quality_ok !== false ? 'i.O.' : 'n.i.O.'}</span>
                      </button>
                    </div>

                    <div className="col-status">
                      {isUnfilled ? (
                        <span className="status-badge missing" title="Diese Stunde ist vergangen, wurde aber noch nicht ausgefüllt!">
                          ⚠️ EINGABE FEHLT
                        </span>
                      ) : activeNow && countNum === 0 ? (
                        <span className="status-badge live-hour">
                          ⚡ AKTUELL
                        </span>
                      ) : targetNum > 0 ? (
                        <span className={`status-badge ${countNum > targetNum ? 'over-met' : isMet ? 'met' : 'behind'}`}>
                          {countNum > targetNum ? 'ÜBERERFÜLLT' : isMet ? 'ERFÜLLT' : 'RÜCKSTAND'}
                        </span>
                      ) : '-'}
                    </div>

                    <div className="col-remark">
                      <input 
                        type="text"
                        className="remark-input"
                        placeholder={t.remark}
                        value={rowData.remark || ''}
                        onChange={(e) => handleCountChange(line, 'remark', e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
              
              {(() => {
                const activeTotals = getShiftTotals(activeShift);
                return (
                  <div className="wt-row totals-row">
                    <div className="col-hour">
                      <span>Gesamt</span>
                    </div>
                    
                    <div className="col-target">
                      <div className="actual-display">
                        <span className="val">{activeTotals.target}</span>
                      </div>
                    </div>

                    <div className="col-ist">
                      <div className="actual-display">
                        <span className="val">{activeTotals.count}</span>
                      </div>
                    </div>

                    <div className="col-magazin">
                      <div className="actual-display">
                        <span className="val">{activeTotals.magazin}</span>
                      </div>
                    </div>

                    <div className="col-quality">
                      <span className={`status-badge ${activeTotals.nokCount === 0 ? 'met' : 'behind'}`}>
                        {activeTotals.nokCount === 0 ? 'i.O.' : `${activeTotals.nokCount} n.i.O.`}
                      </span>
                    </div>

                    <div className="col-status">
                      {activeTotals.target === 0 ? '-' : (
                        <span className={`status-badge ${activeTotals.count > activeTotals.target ? 'over-met' : activeTotals.count >= activeTotals.target ? 'met' : 'behind'}`}>
                          {activeTotals.count > activeTotals.target ? 'ÜBERERFÜLLT' : activeTotals.count >= activeTotals.target ? 'ERFÜLLT' : 'RÜCKSTAND'}
                        </span>
                      )}
                    </div>

                    <div className="col-remark"></div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="stats-sidebar glass-panel">
            <div className="wt-stats-card">
              <div className="card-title"><TrendingUp size={18} /> Schicht-Effizienz</div>
              <div className="efficiency-box">
                <div className="efficiency-value">
                  {getShiftTotals(activeShift).eff}%
                </div>
                <div className="efficiency-label">Zielerreichung</div>
                <div className="efficiency-progress-bg">
                  <div className="efficiency-progress-fill" style={{ 
                    width: `${Math.min(100, getShiftTotals(activeShift).eff)}%`,
                    background: 'var(--accent-gradient)'
                  }} />
                </div>
              </div>

              <div className="info-box-compact">
                <AlertCircle size={20} className="text-accent" />
                <p>Daten werden nach jeder Änderung automatisch gespeichert.</p>
              </div>
              
              <button onClick={handleExportPDF} className="action-btn pdf" style={{ width: '100%' }}>
                <Printer size={18} /> Schichtbericht
              </button>
            </div>
          </div>
        </div>
      ) : renderStats()}

      {showKWPicker && (
        <div className="kw-modal-overlay animate-fade-in" onClick={() => setShowKWPicker(false)} style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(5, 8, 14, 0.82)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '20px'
        }}>
          <div className="kw-modal-content glass-panel" onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(145deg, rgba(18, 24, 34, 0.95) 0%, rgba(10, 14, 22, 0.98) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '720px',
            maxHeight: '88vh', display: 'flex', flexDirection: 'column', gap: '20px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 242, 254, 0.12)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(0, 242, 254, 0.12)', padding: '10px', borderRadius: '12px',
                  border: '1px solid rgba(0, 242, 254, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Calendar className="text-accent" size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, textTransform: 'uppercase', color: '#fff', fontSize: '1.25rem', letterSpacing: '1.5px', fontWeight: 800 }}>
                    Kalenderwoche wählen
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                    Schnellauswahl für Schicht- und Produktionsberichte
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Year Selector */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px', padding: '4px 8px'
                }}>
                  <button 
                    onClick={() => setPickerYear(y => y - 1)} 
                    style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                    title="Vorheriges Jahr"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.95rem', minWidth: '45px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {pickerYear}
                  </span>
                  <button 
                    onClick={() => setPickerYear(y => y + 1)} 
                    style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                    title="Nächstes Jahr"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setShowKWPicker(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#aaa', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                  }}
                  title="Schließen"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Jump Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  setSelectedDate(getProductionDate(new Date()));
                  setPickerYear(getYear(new Date()));
                  setShowKWPicker(false);
                }}
                style={{
                  background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.2) 0%, rgba(46, 204, 113, 0.05) 100%)',
                  border: '1px solid rgba(46, 204, 113, 0.4)',
                  color: '#2ecc71', padding: '8px 16px', borderRadius: '10px',
                  fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 0 15px rgba(46, 204, 113, 0.15)', transition: 'all 0.2s'
                }}
              >
                <CheckCircle2 size={16} /> Aktuelle Woche (KW {getISOWeek(getProductionDate(new Date()))})
              </button>

              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'var(--font-mono)' }}>
                Ausgewählt: <strong style={{ color: 'var(--accent-cyan)' }}>KW {getISOWeek(selectedDate)}</strong> ({format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd.MM.')} - {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd.MM.')})
              </div>
            </div>

            {/* 52 Weeks Grid with Date Ranges */}
            <div 
              className="custom-kw-scroll"
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                gap: '10px', overflowY: 'auto', maxHeight: '52vh', paddingRight: '6px'
              }}
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map(kwNum => {
                const isCurrentKW = pickerYear === getYear(new Date()) && kwNum === getISOWeek(getProductionDate(new Date()));
                const isSelectedKW = pickerYear === getYear(selectedDate) && kwNum === getISOWeek(selectedDate);
                
                // Calculate week date range
                const baseDate = new Date(pickerYear, 0, 4);
                const weekDate = setISOWeek(baseDate, kwNum);
                const wStart = format(startOfWeek(weekDate, { weekStartsOn: 1 }), 'dd.MM.');
                const wEnd = format(endOfWeek(weekDate, { weekStartsOn: 1 }), 'dd.MM.');

                return (
                  <button
                    key={kwNum}
                    ref={isSelectedKW ? activeKWRef : null}
                    onClick={() => handleSelectKW(kwNum)}
                    className="kw-card-btn"
                    style={{
                      background: isSelectedKW 
                        ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' 
                        : isCurrentKW 
                          ? 'rgba(46, 204, 113, 0.15)' 
                          : 'rgba(23, 28, 36, 0.7)',
                      color: isSelectedKW ? '#0a0c10' : isCurrentKW ? '#2ecc71' : '#fff',
                      border: isSelectedKW 
                        ? '1px solid #00f2fe' 
                        : isCurrentKW 
                          ? '1px solid #2ecc71' 
                          : '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '12px 6px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      boxShadow: isSelectedKW ? '0 0 20px rgba(0, 242, 254, 0.4)' : isCurrentKW ? '0 0 10px rgba(46, 204, 113, 0.2)' : 'none',
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      KW {kwNum}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      opacity: isSelectedKW ? 0.85 : 0.6,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600
                    }}>
                      {wStart} - {wEnd}
                    </span>
                    {isCurrentKW && (
                      <span style={{
                        fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase',
                        background: isSelectedKW ? 'rgba(0,0,0,0.3)' : 'rgba(46, 204, 113, 0.25)',
                        padding: '1px 6px', borderRadius: '4px', marginTop: '2px', letterSpacing: '0.5px'
                      }}>
                        ● HEUTE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WTAblauf;
