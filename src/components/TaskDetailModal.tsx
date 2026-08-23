import React, { useState } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { TaskItem, TaskCategory, TaskStatus, FeasibilityType, UserPriority, AIPriority } from '../types';
import { X, Save, Trash2, Bot, Sparkles, Clock, Calendar, CheckSquare } from 'lucide-react';

export const TaskDetailModal: React.FC = () => {
  const { selectedTaskForEdit, setSelectedTaskForEdit, updateTask, deleteTask, tasks } = useAssistant();

  if (!selectedTaskForEdit) return null;

  const [title, setTitle] = useState(selectedTaskForEdit.title);
  const [description, setDescription] = useState(selectedTaskForEdit.description);
  const [category, setCategory] = useState<TaskCategory>(selectedTaskForEdit.category);
  const [status, setStatus] = useState<TaskStatus>(selectedTaskForEdit.status);
  const [userPriority, setUserPriority] = useState<UserPriority>(selectedTaskForEdit.userPriority);
  const [aiPriority, setAiPriority] = useState<AIPriority>(selectedTaskForEdit.aiPriority);
  const [feasibility, setFeasibility] = useState<FeasibilityType>(selectedTaskForEdit.feasibility);
  const [timeWonBackHours, setTimeWonBackHours] = useState(selectedTaskForEdit.timeWonBackHours || 8);
  const [startDate, setStartDate] = useState(selectedTaskForEdit.startDate);
  const [dueDate, setDueDate] = useState(selectedTaskForEdit.dueDate);
  const [durationDays, setDurationDays] = useState(selectedTaskForEdit.durationDays || 3);
  const [progressPercent, setProgressPercent] = useState(selectedTaskForEdit.progressPercent || 0);
  const [selectedDep, setSelectedDep] = useState<string>(selectedTaskForEdit.dependencies?.[0] || '');

  const handleSave = async () => {
    await updateTask(selectedTaskForEdit.id, {
      title,
      description,
      category,
      status,
      userPriority,
      aiPriority,
      feasibility,
      timeWonBackHours: Number(timeWonBackHours),
      startDate,
      dueDate,
      durationDays: Number(durationDays),
      progressPercent: Number(progressPercent),
      dependencies: selectedDep ? [selectedDep] : []
    });
    setSelectedTaskForEdit(null);
  };

  const handleDelete = async () => {
    await deleteTask(selectedTaskForEdit.id);
    setSelectedTaskForEdit(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-fadeIn text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-400" />
            <span>Edit Task & Feasibility Assessment</span>
          </h2>
          <button
            onClick={() => setSelectedTaskForEdit(null)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 text-xs">
          
          {/* Title */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-brand-500 font-semibold"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Description & Scope</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Tech/Dev">Tech/Dev</option>
                <option value="Business & Strategy">Business & Strategy</option>
                <option value="Finance">Finance</option>
                <option value="Operations & Admin">Operations & Admin</option>
                <option value="Marketing & Sales">Marketing & Sales</option>
                <option value="Client Projects">Client Projects</option>
                <option value="Personal & Health">Personal & Health</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="automating">Automating</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {/* Dual Priority & Feasibility */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">User Priority</label>
              <select
                value={userPriority}
                onChange={(e) => setUserPriority(e.target.value as UserPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">AI Assessment</label>
              <select
                value={aiPriority}
                onChange={(e) => setAiPriority(e.target.value as AIPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="defer">Defer</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Feasibility</label>
              <select
                value={feasibility}
                onChange={(e) => setFeasibility(e.target.value as FeasibilityType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="ai_automated">🤖 AI Automated</option>
                <option value="hybrid">⚡ Hybrid</option>
                <option value="human_only">👤 Human Only</option>
              </select>
            </div>
          </div>

          {/* Timeline & Dependencies */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Gantt Dependency (Parent)</label>
              <select
                value={selectedDep}
                onChange={(e) => setSelectedDep(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">None (Root Task)</option>
                {tasks
                  .filter(t => t.id !== selectedTaskForEdit.id)
                  .map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </div>

          {/* Hours Won Back & Progress */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Hours Won Back (ROI)</label>
              <input
                type="number"
                value={timeWonBackHours}
                onChange={(e) => setTimeWonBackHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Progress ({progressPercent}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(Number(e.target.value))}
                className="w-full accent-brand-500 mt-2"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={handleDelete}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Task</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedTaskForEdit(null)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
