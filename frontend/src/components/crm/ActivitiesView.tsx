"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Check, Plus, X, Phone, Mail, Clock, AlertTriangle, Users, ListFilter } from 'lucide-react';
import api from '@/services/api';

interface ActivitiesViewProps {
  activities: any[];
  user: any;

  onToggleActivityDone: (id: string, done: boolean) => void;
  onScheduleActivity: (activityForm: any) => void;

  showActivityModal: boolean;
  setShowActivityModal: (show: boolean) => void;

  calendarConnected: boolean;
  calendarEmail: string;
  connectCalendar: () => void;
}

export default function ActivitiesView({
  activities,
  user,

  onToggleActivityDone,
  onScheduleActivity,

  showActivityModal,
  setShowActivityModal,

  calendarConnected,
  calendarEmail,
  connectCalendar

}: ActivitiesViewProps) {
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('month');
  const [teams, setTeams] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'my' | 'team' | 'all' | 'overdue' | 'today'>('all');

  
  
 const [activityForm, setActivityForm] = useState({
  title: "",
  type: "Meeting",
  date: "",
  time: "10:00",
  duration: "30",
  description: "",
  salesperson: "",
  leadId: "",
  opportunityId: "",

  syncOutlook: false,
  teamsMeeting: false,

  location: "",
  attendees: "",
});


  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const userRole = (user?.role || '').toUpperCase().replace(/[\s_]+/g, '_');
  const isManager = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Load Sales Teams to filter Team Activities
  useEffect(() => {
    if (isManager) {
      api.get('/salesteam')
        .then(res => setTeams(res.data))
        .catch(err => console.warn('Failed loading teams in activities', err));
    }
  }, [isManager]);

  // Set default active filter for Sales Executives
  useEffect(() => {
    if (!isManager) {
      setActiveFilter('my');
    }
  }, [isManager]);

  // Compile team member names dynamically
  const managedTeamMemberNames = useMemo(() => {
    if (!isManager) return [user?.name];
    
    let myTeams = teams;
    if (userRole === 'ADMIN') {
      // Filter teams where this Admin is the leader
      myTeams = teams.filter(t => t.leaderId === user?.id || t.leader?.email === user?.email);
    }
    
    const names = new Set<string>();
    if (user?.name) names.add(user.name);
    
    myTeams.forEach(t => {
      if (t.leader?.name) names.add(t.leader.name);
      (t.members || []).forEach((m: any) => {
        if (m.name) names.add(m.name);
      });
    });
    
    return Array.from(names);
  }, [teams, user, userRole, isManager]);

  // Dynamically Filtered Activities based on role and active tab
  const filteredActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activities.filter(a => {
      // Standard Sales Executive is strictly locked to their own activities
      if (!isManager) {
        return a.salesperson === user?.name;
      }

      // CRM Manager / Super Admin filter options
      if (activeFilter === 'my') {
        return a.salesperson === user?.name;
      }
      if (activeFilter === 'team') {
        return managedTeamMemberNames.includes(a.salesperson);
      }
      if (activeFilter === 'overdue') {
        const actDate = new Date(a.date);
        actDate.setHours(0, 0, 0, 0);
        return !a.done && actDate.getTime() < today.getTime();
      }
      if (activeFilter === 'today') {
        const actDate = new Date(a.date);
        actDate.setHours(0, 0, 0, 0);
        return actDate.getTime() === today.getTime();
      }
      return true; // 'all'
    });
  }, [activities, activeFilter, user, isManager, managedTeamMemberNames]);

  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
  const start = new Date(
    `${activityForm.date}T${activityForm.time}:00`
);

const end = new Date(start);

end.setMinutes(
    end.getMinutes() + Number(activityForm.duration)
);

onScheduleActivity({
    ...activityForm,

    salesperson: user?.name || "Unassigned",

    attendees: activityForm.attendees
        .split(",")
        .map(e => e.trim())
        .filter(Boolean),

    startTime: start.toISOString(),

    endTime: end.toISOString()
});
   setActivityForm({
  title:"",
  type:"Meeting",
  date:"",
  time:"10:00",
  duration:"30",
  description:"",
  salesperson:"",
  leadId:"",
  opportunityId:"",
  syncOutlook:false,
  teamsMeeting:false,
  location:"",
  attendees:""
});
setShowActivityModal(false);

  };

  // Dynamic calendar Helper values
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthLabel = `${monthNames[month]} ${year}`;

  // Get dates of the current week (from Monday to Sunday)
  const currentWeekDates = useMemo(() => {
    const dates = [];
    const currentDay = selectedDate.getDay();
    // Sun=0, Mon=1, Tue=2, etc.
    const distance = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() + distance);
    monday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [selectedDate]);

  // Dynamic Navigation Title Label
  const currentViewLabel = useMemo(() => {
    if (calendarView === 'month') {
      return currentMonthLabel;
    }
    if (calendarView === 'week') {
      const start = currentWeekDates[0];
      const end = currentWeekDates[6];
      return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${year}`;
    }
    // Day view
    return `${selectedDate.getDate()} ${monthNames[month]} ${year}`;
  }, [calendarView, selectedDate, currentMonthLabel, currentWeekDates, monthNames, month, year]);

  // Navigate Previous
  const handleNavigatePrev = () => {
    if (calendarView === 'month') {
      setSelectedDate(new Date(year, month - 1, 1));
    } else if (calendarView === 'week') {
      setSelectedDate(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  // Navigate Next
  const handleNavigateNext = () => {
    if (calendarView === 'month') {
      setSelectedDate(new Date(year, month + 1, 1));
    } else if (calendarView === 'week') {
      setSelectedDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  return (
    <div className="space-y-6 text-xs text-txt-primary">
      {/* Activity Filter Header - only shown for Managers */}
      {isManager && (
        <div className="bg-card border border-border-crm rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="bg-primary/10 p-2 rounded-xl text-primary border border-primary/20">
              <ListFilter className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary">Admin Activity Filters</h4>
              <p className="text-[10px] text-txt-secondary mt-0.5">Toggle workspaces to verify workload across teams and individual members</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'my', label: 'My Activities' },
              { id: 'team', label: 'Team Activities' },
              { id: 'today', label: 'Today\'s Activities' },
              
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer shadow-sm ${
                  activeFilter === f.id
                    ? 'bg-primary text-white border-primary/50'
                    : 'bg-card text-txt-secondary border-border-crm hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* {!isManager && (
        <div className="bg-card border border-border-crm rounded-2xl p-4 flex items-center space-x-2 text-txt-secondary select-none shadow-sm">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span className="font-bold text-xs">Viewing Activities Assigned To You ({filteredActivities.length})</span>
        </div>
      )} */}

<div className="bg-card border border-border-crm rounded-2xl p-5 flex justify-between items-center">

    <div>

        <h3 className="font-bold text-sm">

            Outlook Calendar

        </h3>

        {calendarConnected ? (

            <>
                <p className="text-green-600 font-semibold mt-1">
                    ✓ Connected
                </p>

                <p className="text-xs text-txt-secondary">
                    {calendarEmail}
                </p>
            </>

        ) : (

            <p className="text-xs text-red-500 mt-1">

                Not Connected

            </p>

        )}

    </div>

    {!calendarConnected && (

        <button

            onClick={connectCalendar}

            className="bg-primary text-white px-4 py-2 rounded-xl"

        >

            Connect Outlook Calendar

        </button>

    )}

</div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Calendar Controls & Lists */}
        <div className="lg:col-span-3 bg-card border border-border-crm rounded-2xl p-6 flex flex-col shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-crm mb-6 shrink-0 gap-3">
            <div className="flex items-center space-x-4">
              <h3 className="font-bold text-sm tracking-tight text-txt-primary">Calendar Timeline</h3>
              <div className="flex items-center space-x-2 border border-border-crm rounded-xl px-3 py-1.5 bg-bg-main shadow-xs">
                <button
                  onClick={handleNavigatePrev}
                  className="hover:text-primary font-extrabold text-xs cursor-pointer px-1 text-txt-secondary"
                  title="Previous"
                >
                  &lt;
                </button>
                <span className="text-[11px] font-bold text-txt-primary min-w-[120px] text-center select-none">
                  {currentViewLabel}
                </span>
                <button
                  onClick={handleNavigateNext}
                  className="hover:text-primary font-extrabold text-xs cursor-pointer px-1 text-txt-secondary"
                  title="Next"
                >
                  &gt;
                </button>
              </div>
            </div>

            <div className="flex border border-border-crm rounded-xl overflow-hidden text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setCalendarView('day')}
                className={`px-3 py-1.5 transition cursor-pointer ${calendarView === 'day' ? 'bg-primary text-white' : 'hover:bg-slate-100 text-txt-secondary bg-white dark:bg-slate-700'}`}
              >
                Day
              </button>
              <button
                onClick={() => setCalendarView('week')}
                className={`px-3 py-1.5 border-x border-border-crm transition cursor-pointer ${calendarView === 'week' ? 'bg-primary text-white' : 'hover:bg-slate-100 text-txt-secondary bg-white dark:bg-slate-700'}`}
              >
                Week
              </button>
              <button
                onClick={() => setCalendarView('month')}
                className={`px-3 py-1.5 transition cursor-pointer ${calendarView === 'month' ? 'bg-primary text-white' : 'hover:bg-slate-100 text-txt-secondary bg-white dark:bg-slate-700'}`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Simulated Month Grid layout */}
          <div className="flex-1 overflow-y-auto">
            {calendarView === 'month' ? (
              <div className="grid grid-cols-7 border-t border-l border-border-crm text-xs">
                {/* Day headers */}
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="bg-bg-main p-2 border-r border-b border-border-crm font-bold text-center text-txt-secondary select-none">
                    {d}
                  </div>
                ))}
                
                {/* Empty slots for start index offset spacing - White/Card background to avoid grey boxes */}
                {Array.from({ length: startDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-24 p-1 border-r border-b border-border-crm bg-card dark:bg-slate-900/10"></div>
                ))}

                {/* Day cells containing activities */}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const dayNumber = i + 1;
                  
                  const dayActivities = filteredActivities.filter(a => {
                    const actDate = new Date(a.date);
                    return actDate.getFullYear() === year && 
                           actDate.getMonth() === month && 
                           actDate.getDate() === dayNumber;
                  });

                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        setSelectedDate(new Date(year, month, dayNumber));
                        setCalendarView("day");
                      }} 
                      className="min-h-24 p-2 border-r border-b border-border-crm flex flex-col justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition bg-card"
                    >
                      <span className="font-semibold text-[10px] text-slate-400 select-none">{dayNumber}</span>
                      <div className="space-y-1 mt-1 overflow-y-auto flex-1 max-h-16">
                        {dayActivities.map(act => (
                          <div
                            key={act.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActivity(act);
                            }}
                            className={`rounded-lg px-2 py-1 mb-1 shadow-sm cursor-pointer transition hover:scale-[1.02] ${
                              act.done
                                ? "bg-green-150 border border-green-300 dark:bg-green-950/40 text-emerald-800 dark:text-emerald-300"
                                : act.type === "Meeting"
                                ? "bg-blue-100 border border-blue-300 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                                : act.type === "Call"
                                ? "bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                                : act.type === "Email"
                                ? "bg-purple-100 border border-purple-300 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300"
                                : "bg-amber-100 border border-amber-300 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                            }`}
                          >
                            <div className="text-[8px] font-bold">🕒 {act.time}</div>
                         <div className="flex items-center justify-between gap-1">

    <span className="text-[9px] font-semibold truncate">
        {act.title}
    </span>
{act.location && (
  <div className="text-[8px] opacity-70 truncate">
    📍 {act.location}
  </div>
)}
    {act.isOutlookSynced && (
        <span
            className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded"
        >
            Outlook
        </span>
    )}

</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : calendarView === "day" ? (
              <div className="overflow-y-auto h-[600px] divide-y divide-border-crm border-t border-border-crm">
                {hours.map((hour) => {
                  const hourActivities = filteredActivities.filter((act) => {
                    const sameDay = new Date(act.date).toDateString() === selectedDate.toDateString();
                    const sameHour = Number(act.time.split(":")[0]) === hour;
                    return sameDay && sameHour;
                  });

                  return (
                    <div key={hour} className="flex min-h-20 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <div className="w-20 p-4 font-semibold text-slate-500 border-r border-border-crm bg-bg-main">
                        {hour.toString().padStart(2, "0")}:00
                      </div>
                      <div className="flex-1 p-3 space-y-2">
                        {hourActivities.map((act) => (
                          <div
                            key={act.id}
                            onClick={() => setSelectedActivity(act)}
                            className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl p-3 cursor-pointer transition shadow-xs"
                          >
                            <div className="font-bold text-txt-primary">{act.title}</div>
                            <div className="text-[10px] text-txt-secondary mt-1">🕒 {act.time} | Salesperson: {act.salesperson}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Dynamic Weekly Grid Layout */
              <div className="overflow-auto h-[600px]">
                <div className="grid grid-cols-8 border border-border-crm">
                  <div className="bg-bg-main border-r border-b border-border-crm p-3 font-bold text-center">Time</div>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName, idx) => {
                    const d = currentWeekDates[idx];
                    return (
                      <div key={dayName} className="bg-bg-main border-r border-b border-border-crm p-3 text-center font-bold text-txt-primary">
                        {dayName} ({d.getDate()})
                      </div>
                    );
                  })}

                  {hours.map(hour => (
                    <React.Fragment key={hour}>
                      <div className="border-r border-b border-border-crm p-2 text-slate-500 font-semibold bg-bg-main">
                        {hour.toString().padStart(2, "0")}:00
                      </div>

                      {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                        const cellDate = currentWeekDates[dayIndex];
                        const dayActivities = filteredActivities.filter(act => {
                          const actDate = new Date(act.date);
                          const actHour = Number(act.time.split(":")[0]);
                          return actDate.getFullYear() === cellDate.getFullYear() &&
                                 actDate.getMonth() === cellDate.getMonth() &&
                                 actDate.getDate() === cellDate.getDate() &&
                                 actHour === hour;
                        });

                        return (
                          <div key={dayIndex} className="border-r border-b border-border-crm min-h-20 p-1 bg-card">
                            {dayActivities.map(act => (
                              <div
                                key={act.id}
                                onClick={() => setSelectedActivity(act)}
                                className={`rounded-lg p-2 mb-1 cursor-pointer text-[9px] border shadow-xs ${
                                  act.type === "Meeting"
                                    ? "bg-blue-100 border-blue-300 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                                    : act.type === "Call"
                                    ? "bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                                    : act.type === "Email"
                                    ? "bg-purple-100 border-purple-300 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300"
                                    : "bg-amber-100 border-amber-300 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                                }`}
                              >
                                <div className="font-bold truncate">{act.title}</div>
                                <div>🕒 {act.time}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Activity Stats / Reminders */}
        <div className="space-y-6">
          
          {/* Scheduling Modal Trigger card */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary">Activity Stats</h4>
            <div className="space-y-3 text-xs text-txt-primary">
              <div className="flex justify-between">
                <span>Meetings Scheduled</span>
                <span className="font-bold text-primary">{filteredActivities.filter(a => a.type === 'Meeting').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Calls Logged</span>
                <span className="font-bold text-success">{filteredActivities.filter(a => a.type === 'Call').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Tasks</span>
                <span className="font-bold text-warning">{filteredActivities.filter(a => !a.done).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Actions</span>
                <span className="font-bold text-success">{filteredActivities.filter(a => a.done).length}</span>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary">Upcoming Activities</h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {filteredActivities.filter(a => !a.done).map(act => (
                <div
                  key={act.id}
                  onClick={() => setSelectedActivity(act)}
                  className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-border-crm"
                >
                  <input
  type="checkbox"
  checked={act.done}
  disabled={act.isOutlookSynced}
  onChange={(e) => {
    if (act.isOutlookSynced) return;
    e.stopPropagation();
    onToggleActivityDone(act.id, act.done);
  }}
/>
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-txt-primary truncate max-w-[150px]">{act.title}</p>
                    <p className="text-[10px] text-txt-secondary">📅 {new Date(act.date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-txt-secondary">🕒 {act.time} ({act.type})</p>
                    <p className="text-[10px] text-primary font-semibold">Assignee: {act.salesperson}</p>
                  </div>
                </div>
              ))}
              {filteredActivities.filter(a => !a.done).length === 0 && (
                <p className="text-xs text-txt-secondary italic text-center py-4">No Upcoming activities</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Create Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 ">
          <div className="
bg-card
border
border-border-crm
rounded-2xl
shadow-2xl
w-full
max-w-2xl
max-h-[90vh]
overflow-hidden
flex
flex-col
">
            <h4 className="font-bold text-sm tracking-tight mb-4 text-txt-primary">Schedule Activity Log</h4>
            <form onSubmit={handleActivitySubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Title</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm bg-card rounded-xl px-3 py-2 text-txt-primary focus:outline-none"
                  value={activityForm.title}
                  onChange={e => setActivityForm({ ...activityForm, title: e.target.value })}
                  placeholder="e.g. Call client for feedback"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Type</label>
                  <select
                    className="w-full border border-border-crm bg-card rounded-xl px-3 py-2 text-txt-primary focus:outline-none"
                    value={activityForm.type}
                    onChange={e => setActivityForm({ ...activityForm, type: e.target.value })}
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Duration (mins)</label>
                  <input
                    type="number" required
                    className="w-full border border-border-crm bg-card rounded-xl px-3 py-2 text-txt-primary focus:outline-none"
                    value={activityForm.duration}
                    onChange={e => setActivityForm({ ...activityForm, duration: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Date</label>
                  <input
                    type="date" required
                    className="w-full border border-border-crm bg-card rounded-xl px-3 py-2 text-txt-primary focus:outline-none"
                    value={activityForm.date}
                    onChange={e => setActivityForm({ ...activityForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Time</label>
                  <input
                    type="time" required
                    className="w-full border border-border-crm bg-card rounded-xl px-3 py-2 text-txt-primary focus:outline-none"
                    value={activityForm.time}
                    onChange={e => setActivityForm({ ...activityForm, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  className="w-full border border-border-crm bg-card rounded-xl p-2 text-txt-primary focus:outline-none h-16 resize-none"
                  value={activityForm.description}
                  onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}
                />
              </div>

 







              {activityForm.type === "Meeting" && (
 <div className="space-y-3 border border-border-crm rounded-xl p-4">

<div>
  <label className="block text-slate-400 font-semibold mb-1">
    Location
  </label>

  <input
    type="text"
    placeholder="Conference Room / Client Office / Online"
    className="w-full border border-border-crm bg-card rounded-xl px-3 py-2"
    value={activityForm.location}
    onChange={(e)=>
      setActivityForm({
        ...activityForm,
        location:e.target.value
      })
    }
  />
</div>

<div>
  <label className="block text-slate-400 font-semibold mb-1">
    Invite Attendees
  </label>

  <input
    type="text"
    placeholder="abc@gmail.com, xyz@gmail.com"
    className="w-full border border-border-crm bg-card rounded-xl px-3 py-2"
    value={activityForm.attendees}
    onChange={(e)=>
      setActivityForm({
        ...activityForm,
        attendees:e.target.value
      })
    }
  />

  <p className="text-[10px] text-txt-secondary mt-1">
    Separate email addresses with commas.
  </p>
</div>

  <div>
    <p className="text-sm font-semibold text-primary">
      Outlook Calendar
    </p>

    <p className="text-xs text-txt-secondary mt-1">
      Sync this meeting with your connected Outlook Calendar.
    </p>
  </div>

  {/* Sync Outlook */}
  <label className="flex items-center justify-between border border-border-crm rounded-xl p-3 cursor-pointer hover:bg-muted/30 transition">

    <div>
      <p className="font-medium">
        Sync with Outlook Calendar
      </p>

      <p className="text-[11px] text-txt-secondary">
        Save this meeting to Outlook Calendar
      </p>
    </div>

    <input
      type="checkbox"
      checked={activityForm.syncOutlook}
      onChange={(e) =>
        setActivityForm({
          ...activityForm,
          syncOutlook: e.target.checked
        })
      }
      className="w-4 h-4"
    />

  </label>

  {/* Teams Meeting */}
  <label className="flex items-center justify-between border border-border-crm rounded-xl p-3 cursor-pointer hover:bg-muted/30 transition">

    <div>
      <p className="font-medium">
        Create Microsoft Teams Meeting
      </p>

      <p className="text-[11px] text-txt-secondary">
        Automatically generate a Teams meeting link
      </p>
    </div>

    <input
      type="checkbox"
      checked={activityForm.teamsMeeting}
      onChange={(e) =>
        setActivityForm({
          ...activityForm,
          teamsMeeting: e.target.checked
        })
      }
      className="w-4 h-4"
    />

  </label>

</div>
)}
              <div className="flex gap-2 pt-4">
                <button
                  type="button" onClick={() => setShowActivityModal(false)}
                  className="flex-1 border border-border-crm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl py-2 font-semibold text-txt-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/95 text-white rounded-xl py-2 font-semibold shadow cursor-pointer"
                >
                {activityForm.type === "Meeting"
    ? "Schedule Meeting"
    : "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Details Modal */}
      {selectedActivity && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
    <div className="flex min-h-full items-center justify-center">
      <div
        className="
          bg-card
          border
          border-border-crm
          rounded-2xl
          w-full
          max-w-md
          max-h-[90vh]
          overflow-y-auto
          p-6
          shadow-2xl
          space-y-4
          text-txt-primary
        "
      >
            <div className="flex justify-between items-start">
              <h2 className="text-sm font-bold text-txt-primary">
                {selectedActivity.title}
              </h2>
              <button onClick={() => setSelectedActivity(null)} className="text-txt-secondary hover:text-txt-primary cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-border-crm pb-2">
                <span className="text-txt-secondary">Type</span>
                <span className="font-semibold text-txt-primary">{selectedActivity.type}</span>
              </div>
              <div className="flex justify-between border-b border-border-crm pb-2">
                <span className="text-txt-secondary">Date</span>
                <span className="font-semibold text-txt-primary">{new Date(selectedActivity.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b border-border-crm pb-2">
                <span className="text-txt-secondary">Time</span>
                <span className="font-semibold text-txt-primary">{selectedActivity.time}</span>
              </div>
              <div className="flex justify-between border-b border-border-crm pb-2">
                <span className="text-txt-secondary">Duration</span>
                <span className="font-semibold text-txt-primary">{selectedActivity.duration} mins</span>
              </div>
              <div className="flex justify-between border-b border-border-crm pb-2">
                <span className="text-txt-secondary">Salesperson</span>
                <span className="font-semibold text-primary">{selectedActivity.salesperson}</span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-txt-secondary block font-semibold">Description</span>
                <p className="text-txt-primary bg-bg-main border border-border-crm p-3 rounded-xl leading-relaxed whitespace-pre-wrap break-words">{selectedActivity.description || 'No description provided'}</p>
              </div>


              
            </div>

            {selectedActivity.location && (
  <div className="flex justify-between border-b border-border-crm pb-2">
    <span className="text-txt-secondary">Location</span>
    <span className="font-semibold">
      {selectedActivity.location}
    </span>
  </div>
)}

{selectedActivity.attendees?.length > 0 && (
  <div className="space-y-2">
    <span className="text-txt-secondary font-semibold">
      Attendees
    </span>

  <div className="space-y-1">
  {selectedActivity.attendees.map((email: string) => (
    <div
      key={email}
      className="text-xs bg-bg-main border border-border-crm rounded-lg p-2 break-all"
    >
      {email}
    </div>
  ))}
</div>
  </div>
)}

{selectedActivity.isOutlookSynced && (
    <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">

        Outlook Calendar Event

    </div>
)}



           <button
  onClick={() => setSelectedActivity(null)}
  className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-350 dark:hover:bg-slate-650 text-txt-primary rounded-xl py-2 text-xs font-semibold transition cursor-pointer"
>
  Close
</button>

      </div>
    </div>
  </div>
)}
    </div>
  );
}

