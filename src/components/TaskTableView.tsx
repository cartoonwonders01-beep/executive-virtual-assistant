import React, { useState } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { TaskItem, TaskCategory, TaskStatus, FeasibilityType } from '../types';
import { 
  Sparkles, 
  Bot, 
  User, 
  Zap, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  TrendingUp, 
  SlidersHorizontal,
  ExternalLink,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  CheckCircle2,
  Download,
  FileCode2
} from 'lucide-react';
import { playChime } from '../services/soundEffects';

export const TaskTableView: React.FC = () => {
  const { 
    tasks, 
    updateTaskStatus, 
    setSelectedTaskForBlueprint, 
    setSelectedTaskForEdit, 
    deleteTask,
    searchQuery, 
    setSearchQuery, 
    filterCategory, 
    setFilterCategory, 
    filterFeasibility, 
    setFilterFeasibility,
    setIsRecordModalOpen,
    refreshAll
  } = useAssistant();

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  };

  // Bulk Actions
  const handleBulkAutomate = async () => {
    for (const id of selectedTaskIds) {
      await updateTaskStatus(id, 'automating');
    }
    playChime('action_success');
    setSelectedTaskIds([]);
    await refreshAll();
  };

  const handleBulkComplete = async () => {
    for (const id of selectedTaskIds) {
      await updateTaskStatus(id, 'completed');
    }
    playChime('action_success');
    setSelectedTaskIds([]);
    await refreshAll();
  };

  const handleExportSelectedJSON = () => {
    const selectedData = tasks.filter(t => selectedTaskIds.includes(t.id));
    const blob = new Blob([JSON.stringify(selectedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_tasks_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playChime('action_success');
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = searchQuery === '' || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesFeasibility = filterFeasibility === 'all' || t.feasibility === filterFeasibility;
    return matchesSearch && matchesCategory && matchesFeasibility;
  });

  const categories: TaskCategory[] = [
    'Tech/Dev',
    'Business & Strategy',
    'Finance',
    'Operations & Admin',
    'Marketing & Sales',
    'Client Projects',
    'Personal & Health'
  ];

  const statusColors: Record<TaskStatus, { bg: string; text: string; border: string }> = {
    backlog: { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
    automating: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
    completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
    blocked: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' }
  };

  const priorityColors = {
    urgent: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    critical: 'bg-rose-600/30 text-rose-200 border-rose-500/60 font-bold',
    high: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    medium: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    low: 'bg-slate-700/40 text-slate-400 border-slate-700',
    defer: 'bg-slate-800 text-slate-500 border-slate-700'
  };

  return (
    <div className="space-y-4">
      
      {/* Top Filter & Search Controls */}
      <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, descriptions, blueprints..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <a
            href="/api/tasks/export/csv"
            download="monday_work_hub.csv"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task / Audio</span>
          </button>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full pt-1 border-t border-slate-850">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              filterCategory === 'all' ? 'bg-brand-500 text-slate-950 shadow-sm' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
            }`}
          >
            All Categories ({tasks.length})
          </button>
          {categories.map((c) => {
            const count = tasks.filter(t => t.category === c).length;
            const isSelected = filterCategory === c;
            return (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  isSelected ? 'bg-brand-500 text-slate-950 shadow-sm' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Bulk Action Bar (Visible when tasks are selected) */}
      {selectedTaskIds.length > 0 && (
        <div className="bg-brand-950/90 border border-brand-500/50 p-3 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn text-xs text-brand-200">
          <div className="flex items-center space-x-2 font-semibold">
            <CheckSquare className="w-4 h-4 text-brand-400" />
            <span>{selectedTaskIds.length} Task(s) Selected</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkAutomate}
              className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-sm transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Automate ({selectedTaskIds.length})</span>
            </button>

            <button
              onClick={handleBulkComplete}
              className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Done ({selectedTaskIds.length})</span>
            </button>

            <button
              onClick={handleExportSelectedJSON}
              className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold transition"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main Monday.com-Style Category Groups */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const groupTasks = filteredTasks.filter(t => t.category === cat);
          if (groupTasks.length === 0 && (filterCategory !== 'all' || searchQuery !== '')) {
            return null;
          }

          const isCollapsed = !!collapsedCategories[cat];
          const totalWonBack = groupTasks.reduce((sum, t) => sum + (t.timeWonBackHours || 0), 0);

          return (
            <div key={cat} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              
              {/* Category Group Header */}
              <div 
                onClick={() => toggleCategory(cat)}
                className="bg-slate-850/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition"
              >
                <div className="flex items-center space-x-3">
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-brand-400" />}
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>{cat}</span>
                    <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {groupTasks.length}
                    </span>
                  </h3>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span className="font-mono text-brand-400 font-semibold">
                    +{totalWonBack}h won back
                  </span>
                </div>
              </div>

              {/* Table Body */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60">
                      <tr>
                        <th className="py-2.5 px-3 w-8">
                          <button onClick={selectAllFiltered} className="p-0.5 text-slate-400 hover:text-white">
                            {selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0 ? (
                              <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                            ) : (
                              <Square className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 font-semibold">Task Item</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold">User Priority</th>
                        <th className="py-2.5 px-3 font-semibold">AI Assessment</th>
                        <th className="py-2.5 px-3 font-semibold">Feasibility</th>
                        <th className="py-2.5 px-3 font-semibold">ROI (Hours Won)</th>
                        <th className="py-2.5 px-3 font-semibold">Timeline</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {groupTasks.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-6 text-slate-400 text-xs italic">
                            No tasks in this category. Speak to assistant to extract new tasks!
                          </td>
                        </tr>
                      ) : (
                        groupTasks.map((task) => {
                          const isSelected = selectedTaskIds.includes(task.id);
                          return (
                            <tr 
                              key={task.id} 
                              className={`transition group ${isSelected ? 'bg-brand-950/20' : 'hover:bg-slate-850/40'}`}
                            >
                              {/* Checkbox Column */}
                              <td className="py-3 px-3">
                                <button
                                  type="button"
                                  onClick={() => toggleSelectTask(task.id)}
                                  className="text-slate-500 hover:text-brand-400"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>

                              {/* Task Title & Description */}
                              <td className="py-3 px-3 max-w-xs sm:max-w-md">
                                <div className="font-semibold text-slate-100 group-hover:text-brand-300 transition flex items-center gap-1.5">
                                  {task.title}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5" title={task.description}>
                                  {task.description}
                                </p>
                              </td>

                              {/* Status Dropdown */}
                              <td className="py-3 px-3">
                                <select
                                  value={task.status}
                                  onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                                  className={`px-2 py-1 rounded-lg text-xs font-semibold border focus:outline-none ${
                                    statusColors[task.status].bg
                                  } ${statusColors[task.status].text} ${statusColors[task.status].border}`}
                                >
                                  <option value="backlog">Backlog</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="automating">Automating</option>
                                  <option value="completed">Completed</option>
                                  <option value="blocked">Blocked</option>
                                </select>
                              </td>

                              {/* User Priority */}
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  priorityColors[task.userPriority] || priorityColors.medium
                                }`}>
                                  {task.userPriority.toUpperCase()}
                                </span>
                              </td>

                              {/* AI Assessed Priority & Rationale */}
                              <td className="py-3 px-3">
                                <div className="flex flex-col" title={task.priorityRationale}>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border w-max ${
                                    priorityColors[task.aiPriority] || priorityColors.medium
                                  }`}>
                                    {task.aiPriority.toUpperCase()}
                                  </span>
                                  <span className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">
                                    {task.priorityRationale}
                                  </span>
                                </div>
                              </td>

                              {/* Feasibility Tag */}
                              <td className="py-3 px-3">
                                {task.feasibility === 'ai_automated' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40">
                                    <Bot className="w-3 h-3" />
                                    <span>AI Automated</span>
                                  </span>
                                )}
                                {task.feasibility === 'hybrid' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                    <Zap className="w-3 h-3" />
                                    <span>Hybrid</span>
                                  </span>
                                )}
                                {task.feasibility === 'human_only' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    <User className="w-3 h-3" />
                                    <span>Human Only</span>
                                  </span>
                                )}
                              </td>

                              {/* Hours Won Back / ROI */}
                              <td className="py-3 px-3 font-mono">
                                <span className="text-brand-400 font-bold">+{task.timeWonBackHours}h</span>
                                <span className="text-[10px] text-slate-400 block">{task.estimatedValue}</span>
                              </td>

                              {/* Dates */}
                              <td className="py-3 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                                <span>{task.startDate}</span>
                                <span className="block text-slate-400 font-mono">Due {task.dueDate}</span>
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                                {task.automationBlueprint && (
                                  <button
                                    onClick={() => setSelectedTaskForBlueprint(task)}
                                    className="p-1.5 text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition"
                                    title="View Automation Blueprint & Code"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedTaskForEdit(task)}
                                  className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
                                  title="Edit Task"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
