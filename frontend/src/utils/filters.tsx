export const applyFilters = (
  data: any[],
  type: 'leads' | 'opportunities' | 'emails',
  searchQuery: string,
  activeFilters: any,
  user: any
): any[] => {
  let filtered = [...data];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(item => {
      if (type === 'leads') {
        const contactName = item.contactName || item.name || '';
        const company = item.company || '';
        const email = item.email || '';
        return contactName.toLowerCase().includes(q) || company.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      } else if (type === 'opportunities') {
        const customerName = item.customerName || '';
        const company = item.company || '';
        const priority = item.priority || '';
        return customerName.toLowerCase().includes(q) || company.toLowerCase().includes(q) || priority.toLowerCase().includes(q);
      } else if (type === 'emails') {
        const subject = item.subject || '';
        const sender = item.sender || '';
        const body = item.body || '';
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
  if (activeFilters.open) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => o.stageId !== 'p_6' && o.stageId !== 'p_7');
    }
  }
  if (activeFilters.won) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => o.stageId === 'p_6');
    }
  }
  if (activeFilters.lost) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => o.stageId === 'p_7');
    }
  }
  if (activeFilters.category) {
    if (type === 'leads') {
      filtered = filtered.filter(l => l.category === activeFilters.category);
    } else if (type === 'opportunities') {
      filtered = filtered.filter(o => o.tags?.includes(activeFilters.category));
    }
  }
  if (activeFilters.serviceType) {
    if (type === 'leads') {
      filtered = filtered.filter(l => l.serviceType === activeFilters.serviceType);
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
  // Date Limit Filters
  if (activeFilters.createdDateStart) {
    filtered = filtered.filter(x => x.createdDate && x.createdDate >= activeFilters.createdDateStart);
  }
  if (activeFilters.createdDateEnd) {
    filtered = filtered.filter(x => x.createdDate && x.createdDate <= activeFilters.createdDateEnd);
  }
  if (activeFilters.expectedClosingStart) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => o.expectedClosing && o.expectedClosing >= activeFilters.expectedClosingStart);
    }
  }
  if (activeFilters.expectedClosingEnd) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => o.expectedClosing && o.expectedClosing <= activeFilters.expectedClosingEnd);
    }
  }
  if (activeFilters.closedDateStart) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => o.closedDate && o.closedDate >= activeFilters.closedDateStart);
    }
  }
  if (activeFilters.closedDateEnd) {
    if (type === 'opportunities') {
      filtered = filtered.filter(o => o.closedDate && o.closedDate <= activeFilters.closedDateEnd);
    }
  }

  return filtered;
};
