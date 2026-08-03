import React, { useState, useEffect } from 'react';
import { getDeptDisplay, stripHtml } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabase';
import { Check, User, AlertCircle, Bell, Info, ChevronUp, ChevronDown, Monitor } from 'lucide-react';
import { translations } from '../utils/translations';

const GlobalTicker = ({ activeInfos = [] }) => {
  const { staff, fetchActiveInfos, lang, isMobile, autoScale, toggleAutoScale } = useApp();
  const t = translations[lang];
  const [page, setPage] = useState(0);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedInfoId, setSelectedInfoId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('collini_ticker_collapsed');
    if (saved !== null) return saved === 'true';
    return isMobile; // Collapse by default on mobile
  });
  const [, setTick] = useState(0);

  const priorityInfos = activeInfos.filter(info => 
    info.priority === '0_urgent' || info.priority === '1_high'
  );
  const normalCount = activeInfos.filter(info => info.priority === '2_normal').length;

  const itemsPerPage = 3;
  const totalPages = Math.ceil(priorityInfos.length / itemsPerPage);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (totalPages <= 1 || showSelector) return;
    const timer = setInterval(() => {
      setPage(prev => (prev + 1) % totalPages);
    }, 10000); // Longer cycle for 3 items
    return () => clearInterval(timer);
  }, [totalPages, showSelector]);

  const handleAcknowledge = async (staffName) => {
    const targetInfo = priorityInfos.find(i => i.id === selectedInfoId);
    if (!targetInfo) return;

    const existingAcks = targetInfo.acknowledgments || [];
    if (existingAcks.find(a => a.name === staffName)) {
      setShowSelector(false);
      return;
    }

    const newAck = { name: staffName, time: new Date().toISOString() };
    const { error } = await supabase
      .from('collini_info_wall')
      .update({ acknowledgments: [...existingAcks, newAck] })
      .eq('id', selectedInfoId);

    if (!error) {
      setShowSelector(false);
      fetchActiveInfos();
    }
  };

  if (priorityInfos.length === 0 && normalCount === 0) return null;

  // Display current page items
  const currentItems = priorityInfos.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const toggleTicker = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('collini_ticker_collapsed', newState);
  };

  return (
    <>
      <div className={`global-ticker-container mcd-style ${isCollapsed ? 'collapsed' : ''}`}>
        <button className="ticker-toggle-btn" onClick={toggleTicker} title={isCollapsed ? t.show : t.hide}>
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {isCollapsed && priorityInfos.length > 0 && (
            <span className="collapsed-count-badge">{priorityInfos.length}</span>
          )}
        </button>
        
        <div className="ticker-content-wrapper" aria-hidden={isCollapsed}>
          <div className="ticker-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="ticker-total-count">
                {page * itemsPerPage + 1}-{Math.min((page + 1) * itemsPerPage, priorityInfos.length)} / {priorityInfos.length} INFOS
              </span>
              <button 
                className={`auto-fit-btn ${autoScale ? 'active' : ''}`}
                onClick={toggleAutoScale}
                title={autoScale ? "Auto-Fit aktiv: Automatisches Képernyő-Skálázás" : "Standard Modus: Normales Képernyő-Skálázás"}
              >
                <Monitor size={12} />
                <span>{autoScale ? "AUTO-FIT ON" : "AUTO-FIT OFF"}</span>
              </button>
            </div>
            {priorityInfos.length > itemsPerPage && (
              <div className="more-indicator-badge">
                 +{priorityInfos.length - itemsPerPage} WEITERE
              </div>
            )}
            {totalPages > 1 && (
              <div className="ticker-pagination">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div key={i} className={`pag-dot ${i === page ? 'active' : ''}`}></div>
                ))}
              </div>
            )}
          </div>
          <div className="ticker-grid">
            {currentItems.map((info) => {
              const acks = info.acknowledgments || [];
              const isUnacknowledged = acks.length === 0;
              const prioClass = info.priority.split('_')[1];
              
              return (
                <div key={info.id} className={`ticker-card priority-${prioClass} ${isUnacknowledged ? 'ticker-new-blink' : ''}`}>
                  <div className="card-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {prioClass === 'urgent' ? <AlertCircle size={10} color="#ff3b30" /> : <Bell size={10} color="#ffcc00" />}
                      <span className="card-dept">{getDeptDisplay(info.department)}</span>
                      {acks.length > 0 && (
                        <div className="card-acks" style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '8px', marginLeft: '2px' }}>
                          {acks.slice(0, 3).map((a, i) => (
                            <span key={i} className="mini-ack-dot" title={a.name}></span>
                          ))}
                          {acks.length > 3 && <span className="extra-acks">+{acks.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    <p>{stripHtml(info.message)}</p>
                  </div>
                  <button className="card-ok-btn" onClick={() => { setSelectedInfoId(info.id); setShowSelector(true); }} title="GELESEN" tabIndex={isCollapsed ? -1 : 0}>
                    <Check size={16} />
                  </button>
                </div>
              );
            })}

            {/* Filler cards if less than 3 items on last page, and we have normal messages */}
            {currentItems.length < itemsPerPage && normalCount > 0 && (
              <div className="ticker-card status-card">
                <div className="ticker-badge-more">+ WEITERE</div>
                <div className="card-body centered">
                  <span className="status-label">INFOTAFEL</span>
                  <p>{normalCount} weitere Infos</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSelector && (
        <div className="ticker-selector-overlay" onClick={() => setShowSelector(false)}>
          <div className="ticker-selector-content" onClick={e => e.stopPropagation()}>
            <h4>Wer bestätigt?</h4>
            <div className="staff-grid">
              {staff
                .filter(s => s.type === 'operator')
                .map(s => (
                  <button key={s.id} className="staff-ack-item" onClick={() => handleAcknowledge(s.label)}>
                    <User size={14} />
                    {s.label}
                  </button>
                ))
              }
            </div>
            <button className="close-selector" onClick={() => setShowSelector(false)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalTicker;
