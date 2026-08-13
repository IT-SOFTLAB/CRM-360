export const getYYYYMMDD = (dateVal: any): string | null => {
  if (!dateVal) return null;
  const cleanVal = dateVal;
  if (typeof cleanVal === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanVal.trim())) {
      return cleanVal.trim();
    }
    if (cleanVal.includes('T') || cleanVal.includes(' ')) {
      try {
        const d = new Date(cleanVal);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } catch {
        // Fallback below
      }
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanVal)) {
      return cleanVal.substring(0, 10);
    }
  }
  try {
    const d = new Date(cleanVal);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback
  }
  return null;
};

export const getHHMM = (dateVal: any): string | null => {
  if (!dateVal) return null;
  const cleanVal = dateVal;
  if (typeof cleanVal === 'string') {
    if (/^\d{2}:\d{2}$/.test(cleanVal.trim())) {
      return cleanVal.trim();
    }
  }
  try {
    const d = new Date(cleanVal);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch {
    // Fallback
  }
  if (typeof cleanVal === 'string') {
    if (/^\d{2}:\d{2}/.test(cleanVal)) {
      return cleanVal.substring(0, 5);
    }
  }
  return null;
};

export const applyFilters = (
  data: any[],
  type: 'leads' | 'opportunities' | 'emails',
  searchQuery: string,
  activeFilters: any,
  user: any,
  leads?: any[]
): any[] => {
  let filtered = data.filter(item => item !== null && item !== undefined);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(item => {
      if (!item) return false;
      if (type === 'leads') {
        const contactName = String(item.contactName || item.name || '');
        const company = String(item.company || '');
        const email = String(item.email || '');
        return contactName.toLowerCase().includes(q) || company.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      } else if (type === 'opportunities') {
        const customerName = String(item.customerName || '');
        const company = String(item.company || '');
        const priority = String(item.priority || '');
        return customerName.toLowerCase().includes(q) || company.toLowerCase().includes(q) || priority.toLowerCase().includes(q);
      } else if (type === 'emails') {
        const subject = String(item.subject || '');
        const sender = String(item.sender || '');
        const body = String(item.body || '');
        return subject.toLowerCase().includes(q) || sender.toLowerCase().includes(q) || body.toLowerCase().includes(q);
      }
      return false;
    });
  }

  if (activeFilters.myPipeline && user) {
    if (type === 'leads') {
      filtered = filtered.filter(l => l.assignedUser === user?.name);
    } else if (type === 'opportunities') {
      filtered = filtered.filter(o => o.assignedSalesperson === user?.name);
    }
  }
  if (activeFilters.unassigned) {
    if (type === 'leads') {
      filtered = filtered.filter(l => !l.assignedUser || l.assignedUser === 'Unassigned');
    } else if (type === 'opportunities') {
      filtered = filtered.filter(o => !o.assignedSalesperson || o.assignedSalesperson === 'Unassigned');
    }
  }
  const isWonOpp = (o: any) => {
    const stageIdStr = String(o?.stageId || '').toLowerCase().trim();
    const stageStr = String(o?.stage || '').toLowerCase().trim();
    const statusStr = String(o?.status || '').toLowerCase().trim();
    return stageIdStr === 'p_6' || stageIdStr === 'won' || stageIdStr.includes('won') || stageStr.includes('won') || statusStr.includes('won');
  };

  const isLostOpp = (o: any) => {
    const stageIdStr = String(o?.stageId || '').toLowerCase().trim();
    const stageStr = String(o?.stage || '').toLowerCase().trim();
    const statusStr = String(o?.status || '').toLowerCase().trim();
    return stageIdStr === 'p_7' || stageIdStr === 'lost' || stageIdStr.includes('lost') || stageStr.includes('lost') || statusStr.includes('lost');
  };

  if (activeFilters.open) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => !isWonOpp(o) && !isLostOpp(o));
    }
  }
  if (activeFilters.won) {
    if (type === 'opportunities') {
      filtered = filtered.filter(isWonOpp);
    }
  }
  if (activeFilters.lost) {
    if (type === 'opportunities') {
      filtered = filtered.filter(isLostOpp);
    }
  }
  if (activeFilters.category) {
    if (type === 'leads') {
      filtered = filtered.filter(l => l.category === activeFilters.category);
    } else if (type === 'opportunities') {
      filtered = filtered.filter(o => {
        const lead = leads?.find(l => l.id === o.leadId);
        return lead ? lead.category === activeFilters.category : false;
      });
    }
  }
  if (activeFilters.serviceType) {
    if (type === 'leads') {
      filtered = filtered.filter(l => l.serviceType === activeFilters.serviceType);
    } else if (type === 'opportunities') {
      filtered = filtered.filter(o => {
        const lead = leads?.find(l => l.id === o.leadId);
        return lead ? lead.serviceType === activeFilters.serviceType : false;
      });
    }
  }
  if (activeFilters.salesperson) {
    if (type === 'leads') {
      filtered = filtered.filter(l => l.assignedUser === activeFilters.salesperson);
    } else if (type === 'opportunities') {
      filtered = filtered.filter(o => o.assignedSalesperson === activeFilters.salesperson);
    }
  }
  if (activeFilters.team) {
    if (type === 'leads' || type === 'opportunities') {
      filtered = filtered.filter(x => x.team === activeFilters.team);
    }
  }
  if (activeFilters.city) {
    if (type === 'leads' || type === 'opportunities') {
      filtered = filtered.filter(x => x.city?.toLowerCase().includes(activeFilters.city.toLowerCase()));
    }
  }
  if (activeFilters.country) {
    if (type === 'leads' || type === 'opportunities') {
      filtered = filtered.filter(x => x.country?.toLowerCase().includes(activeFilters.country.toLowerCase()));
    }
  }
  if (activeFilters.campaign) {
    if (type === 'leads' || type === 'opportunities') {
      filtered = filtered.filter(x => x.campaign === activeFilters.campaign);
    }
  }
  if (activeFilters.source) {
    if (type === 'leads') {
      filtered = filtered.filter(l => l.source === activeFilters.source);
    } else if (type === 'opportunities') {
      filtered = filtered.filter(o => o.source === activeFilters.source || o.tags?.includes(activeFilters.source));
    }
  }
  // Date and Time Filters
  if (activeFilters.createdDate) {
    filtered = filtered.filter(x => {
      const d = getYYYYMMDD(x.createdDate || x.createdAt);
      return d === activeFilters.createdDate;
    });
  }
  if (activeFilters.createdTimeFrom) {
    filtered = filtered.filter(x => {
      const t = getHHMM(x.createdDate || x.createdAt);
      return t ? t >= activeFilters.createdTimeFrom : false;
    });
  }
  if (activeFilters.createdTimeTo) {
    filtered = filtered.filter(x => {
      const t = getHHMM(x.createdDate || x.createdAt);
      return t ? t <= activeFilters.createdTimeTo : false;
    });
  }
  if (activeFilters.expectedClosingStart) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => {
        const d = getYYYYMMDD(o.expectedClosing);
        return d ? d >= activeFilters.expectedClosingStart : false;
      });
    }
  }
  if (activeFilters.expectedClosingEnd) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => {
        const d = getYYYYMMDD(o.expectedClosing);
        return d ? d <= activeFilters.expectedClosingEnd : false;
      });
    }
  }
  if (activeFilters.closedDateStart) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => {
        const d = getYYYYMMDD(o.closedDate);
        return d ? d >= activeFilters.closedDateStart : false;
      });
    }
  }
  if (activeFilters.closedDateEnd) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => {
        const d = getYYYYMMDD(o.closedDate);
        return d ? d <= activeFilters.closedDateEnd : false;
      });
    }
  }

  // Tags filter
  if (activeFilters.hasTags) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => o.tags && o.tags.length > 0);
    }
  }
  if (activeFilters.tag) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => o.tags && o.tags.some((t: string) => t.toLowerCase().includes(activeFilters.tag.toLowerCase())));
    }
  }

  return filtered;
};
