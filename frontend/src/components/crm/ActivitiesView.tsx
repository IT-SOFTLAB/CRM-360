import React, { useState } from 'react';
import { Calendar as CalendarIcon, Check, Plus, X } from 'lucide-react';

interface ActivitiesViewProps {
  activities: any[];
  user: any;
  onToggleActivityDone: (id: string, done: boolean) => void;
  onScheduleActivity: (activityForm: any) => void;
  showActivityModal: boolean;
  setShowActivityModal: (show: boolean) => void;
}

export default function ActivitiesView({
  activities,
  user,
  onToggleActivityDone,
  onScheduleActivity,
  showActivityModal,
  setShowActivityModal
}: ActivitiesViewProps) {
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('month');
  const [activityForm, setActivityForm] = useState({
    title: '', type: 'Meeting', date: '', time: '10:00', duration: '30',
    description: '', salesperson: '', leadId: '', opportunityId: ''
  });

const [selectedActivity, setSelectedActivity] = useState<any>(null);
const hours = Array.from({ length: 24 }, (_, i) => i);

const [selectedDate, setSelectedDate] = useState(new Date());
  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScheduleActivity({
      ...activityForm,
      salesperson: user?.name || 'Unassigned'
    });
    setActivityForm({
      title: '', type: 'Meeting', date: '', time: '10:00', duration: '30',
      description: '', salesperson: '', leadId: '', opportunityId: ''
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs">
      
      {/* Calendar Controls & Lists */}
      <div className="lg:col-span-3 bg-card border border-border-crm rounded-2xl p-6 flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-border-crm mb-6 shrink-0">
          <h3 className="font-bold text-sm tracking-tight text-txt-primary">Calendar Timeline Activities</h3>
          <div className="flex border border-border-crm rounded-xl overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setCalendarView('day')}
              className={`px-3 py-1.5 transition cursor-pointer ${calendarView === 'day' ? 'bg-primary text-white' : 'hover:bg-slate-100 text-txt-secondary bg-white'}`}
            >
              Day
            </button>
            <button
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1.5 border-x border-border-crm transition cursor-pointer ${calendarView === 'week' ? 'bg-primary text-white' : 'hover:bg-slate-100 text-txt-secondary bg-white'}`}
            >
              Week
            </button>
            <button
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1.5 transition cursor-pointer ${calendarView === 'month' ? 'bg-primary text-white' : 'hover:bg-slate-100 text-txt-secondary bg-white'}`}
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
              )
              )}
              

              {/* Empty slots for spacing */}
              {Array.from({ length: 1 }).map((_, i) => (
                <div key={i}  className="min-h-24 p-1 border-r border-b border-border-crm bg-slate-50"></div>
              ))}

              {/* Day cells containing activities */}
              {Array.from({ length: 30 }).map((_, i) => {
                const dayNumber = i + 1;
                const formattedDate = `2026-06-${dayNumber < 10 ? '0' + dayNumber : dayNumber}`;
                const dayActivities = activities.filter(
  a => new Date(a.date).toISOString().split("T")[0] === formattedDate
);

                return (
                  <div key={i}  className="min-h-24 p-2 border-r border-b border-border-crm flex flex-col justify-between">
                    <span className="font-semibold text-[10px] text-slate-400 select-none">{dayNumber}</span>
                    <div className="space-y-1 mt-1 overflow-y-auto flex-1 max-h-16">
                      {dayActivities.map(act => (
                        <div
    key={act.id}
    
    onClick={() => setSelectedActivity(act)}
    className={`rounded-lg px-2 py-1 mb-1 shadow-sm cursor-pointer transition hover:scale-[1.02]
      ${
        act.done
          ? "bg-green-100 border border-green-300"
          : act.type === "Meeting"
          ? "bg-blue-100 border border-blue-300"
          : act.type === "Call"
          ? "bg-emerald-100 border border-emerald-300"
          : act.type === "Email"
          ? "bg-purple-100 border border-purple-300"
          : "bg-amber-100 border border-amber-300"
      }`}
  >
    <div className="text-[9px] font-bold">
      🕒 {act.time}
    </div>

    <div className="text-[10px] font-semibold truncate">
      {act.title}
    </div>
  </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : calendarView === "day" ? (
           <div className="overflow-y-auto h-[700px]">

  {hours.map((hour) => {

   const hourActivities = activities.filter((act) => {

    const sameDay =
        new Date(act.date).toDateString() === selectedDate.toDateString();

    const sameHour =
        Number(act.time.split(":")[0]) === hour;

    return sameDay && sameHour;

});

    return (

      <div
        key={hour}
        className="flex border-b border-border-crm min-h-20"
      >

        <div className="w-20 p-3 font-semibold text-slate-500">
          {hour.toString().padStart(2, "0")}:00
        </div>

        <div className="flex-1 p-2">

          {hourActivities.map((act) => (

            <div
              key={act.id}
              onClick={() => setSelectedActivity(act)}
              className="bg-blue-100 rounded-lg p-2 mb-2 cursor-pointer"
            >
              <div className="font-bold">
                {act.title}
              </div>

              <div className="text-[10px]">
                🕒 {act.time}
              </div>

            </div>

          ))}

        </div>

      </div>

    );

  })}

</div>
          ) : (
 <div className="overflow-auto h-[700px]c">

        <div className="grid grid-cols-8 border border-border-crm">

    {/* Header */}
    <div className="bg-slate-100 border-r border-b border-border-crm p-2 font-bold text-center">
      Time
    </div>

    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
      <div
        key={day}
        className="bg-slate-100 border-r border-b border-border-crm p-2 text-center font-bold"
      >
        {day}
      </div>
    ))}

    {/* Hours */}
    {hours.map(hour => (
      <React.Fragment key={hour}>

        {/* Time Column */}
        <div className="border-r border-b border-border-crm p-2 text-slate-500 font-semibold">
          {hour.toString().padStart(2, "0")}:00
        </div>

        {/* Monday */}
        {[1,2,3,4,5,6,0].map(dayIndex => {

          const dayActivities = activities.filter(act => {

            const d = new Date(act.date);

            return (
              d.getDay() === dayIndex &&
              Number(act.time.split(":")[0]) === hour
            );

          });

          return (

            <div
              key={dayIndex}
              className="border-r border-b border-border-crm min-h-20 p-1"
            >

              {dayActivities.map(act => (

                <div
                  key={act.id}
                  onClick={() => setSelectedActivity(act)}
                  className={`rounded-lg p-2 mb-1 cursor-pointer text-[10px]
                  ${
                    act.type === "Meeting"
                      ? "bg-blue-100"
                      : act.type === "Call"
                      ? "bg-green-100"
                      : act.type === "Email"
                      ? "bg-purple-100"
                      : "bg-yellow-100"
                  }`}
                >

                  <div className="font-bold">
                    {act.title}
                  </div>

                  <div>
                    🕒 {act.time}
                  </div>

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
        <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary">Activity Status Dashboard</h4>
          <div className="space-y-3 text-xs text-txt-primary">
            <div className="flex justify-between">
              <span>Total Meetings</span>
              <span className="font-bold text-primary">{activities.filter(a => a.type === 'Meeting').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Calls</span>
              <span className="font-bold text-success">{activities.filter(a => a.type === 'Call').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Awaiting Completion</span>
              <span className="font-bold text-warning">{activities.filter(a => !a.done).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Completed Logs</span>
              <span className="font-bold text-success">{activities.filter(a => a.done).length}</span>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary">Pending Actions</h4>
          <div className="space-y-3">
            {activities.filter(a => !a.done).map(act => (
       <div
    key={act.id}
    onClick={() => setSelectedActivity(act)}
    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition"
>

  
                <input
                  type="checkbox"
                  className="rounded text-primary border-slate-300 focus:ring-0 mt-0.5 cursor-pointer"
                  checked={act.done}
                  onChange={() => onToggleActivityDone(act.id, act.done)}
                />
                <div className="text-xs">
                  <p className="font-bold">{act.title}</p>
                 <p className="text-[10px] text-slate-500">

📅 {new Date(act.date).toLocaleDateString()}

</p>

<p className="text-[10px] text-slate-500">

🕒 {act.time}

</p>

<p className="text-[10px] text-slate-500">

{act.type}

</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Create Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border-crm rounded-2xl shadow-2xl p-6 max-w-sm w-full text-txt-primary">
            <h4 className="font-bold text-sm tracking-tight mb-4">Schedule Activity Log</h4>
            <form onSubmit={handleActivitySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Title</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white"
                  value={activityForm.title}
                  onChange={e => setActivityForm({ ...activityForm, title: e.target.value })}
                  placeholder="e.g. Call client for feedback"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Type</label>
                  <select
                    className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white"
                    value={activityForm.type}
                    onChange={e => setActivityForm({ ...activityForm, type: e.target.value })}
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Task">Task</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Duration (mins)</label>
                  <input
                    type="number" required
                    className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white"
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
                    className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white"
                    value={activityForm.date}
                    onChange={e => setActivityForm({ ...activityForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Time</label>
                  <input
                    type="time" required
                    className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white"
                    value={activityForm.time}
                    onChange={e => setActivityForm({ ...activityForm, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  className="w-full border border-border-crm bg-bg-main rounded-xl p-2 text-txt-primary focus:outline-none h-16 resize-none bg-white"
                  value={activityForm.description}
                  onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button" onClick={() => setShowActivityModal(false)}
                  className="flex-1 border border-border-crm hover:bg-slate-50 rounded-xl py-2 font-semibold text-txt-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-xl py-2 font-semibold shadow cursor-pointer"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
{/* Activity Details Modal */}

{selectedActivity && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white rounded-2xl w-[450px] p-6">

        <h2 className="text-lg font-bold">
            {selectedActivity.title}
        </h2>

        <div className="mt-5 space-y-3">

            <p><strong>Type:</strong> {selectedActivity.type}</p>

            <p><strong>Date:</strong> {new Date(selectedActivity.date).toLocaleDateString()}</p>

            <p><strong>Time:</strong> {selectedActivity.time}</p>

            <p><strong>Duration:</strong> {selectedActivity.duration} mins</p>

            <p><strong>Salesperson:</strong> {selectedActivity.salesperson}</p>

            <p><strong>Description:</strong></p>

            <p>{selectedActivity.description}</p>

        </div>

        <button
            onClick={() => setSelectedActivity(null)}
            className="mt-6 w-full bg-primary text-white rounded-xl py-2"
        >
            Close
        </button>

    </div>

</div>

)}
    </div>
  );
}
