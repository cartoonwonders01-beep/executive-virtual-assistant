import React, { useState } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { WikiArticle, WikiCategory } from '../types';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Tag, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Mic, 
  Table2, 
  GanttChartSquare, 
  ShieldCheck, 
  Clock, 
  User, 
  CheckCircle,
  X,
  Save,
  ChevronRight
} from 'lucide-react';

export const WikiKnowledgeHub: React.FC = () => {
  const { 
    wikiArticles, 
    createWikiArticle, 
    updateWikiArticle, 
    deleteWikiArticle,
    startInteractiveTour 
  } = useAssistant();

  const [selectedArticleId, setSelectedArticleId] = useState<string>(wikiArticles[0]?.id || 'wiki-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<WikiCategory | 'all'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<Partial<WikiArticle> | null>(null);

  const categories: WikiCategory[] = [
    'Voice AI & Mobile',
    'Executive Actions',
    'Work Hub & Gantt',
    'Automation Studio',
    'System Architecture'
  ];

  const filteredArticles = wikiArticles.filter((art) => {
    const matchesSearch = searchQuery === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedArticle = wikiArticles.find(a => a.id === selectedArticleId || a.slug === selectedArticleId) || filteredArticles[0] || wikiArticles[0];

  const handleOpenCreate = () => {
    setEditingArticle({
      title: '',
      category: 'Automation Studio',
      summary: '',
      content: '## Overview\nDescribe the functionality here...\n\n### Usage & Commands\n- Example: ...',
      tags: ['Automation', 'Guide'],
      author: 'Andrew'
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (article: WikiArticle) => {
    setEditingArticle(article);
    setIsEditorOpen(true);
  };

  const handleSaveArticle = async () => {
    if (!editingArticle || !editingArticle.title || !editingArticle.content) return;

    if (editingArticle.id) {
      await updateWikiArticle(editingArticle.id, editingArticle);
    } else {
      const created = await createWikiArticle(editingArticle);
      setSelectedArticleId(created.id);
    }
    setIsEditorOpen(false);
    setEditingArticle(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this wiki article?')) {
      await deleteWikiArticle(id);
      if (selectedArticleId === id) {
        setSelectedArticleId(wikiArticles[0]?.id || '');
      }
    }
  };

  const getCategoryIcon = (cat: WikiCategory) => {
    switch (cat) {
      case 'Voice AI & Mobile': return <Mic className="w-4 h-4 text-brand-400" />;
      case 'Executive Actions': return <Calendar className="w-4 h-4 text-teal-400" />;
      case 'Work Hub & Gantt': return <Table2 className="w-4 h-4 text-indigo-400" />;
      case 'Automation Studio': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'System Architecture': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default: return <BookOpen className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header Banner with Tour Button */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-brand-500/20 text-brand-300 rounded-lg border border-brand-500/30">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Assistant Functionality Wiki & Knowledge Hub
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Living documentation of all AI capabilities, voice commands, automation recipes, and architecture rules.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={startInteractiveTour}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-600 hover:to-teal-600 text-slate-950 shadow-md transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Interactive Voice Tour</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Enrich Wiki</span>
          </button>
        </div>
      </div>

      {/* Main Split-Pane Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Sidebar & Article Index (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Search & Category Filter */}
          <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl space-y-2.5 shadow-lg">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wiki articles..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedCategory === 'all' ? 'bg-brand-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition truncate ${
                    selectedCategory === cat ? 'bg-brand-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {cat.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Article List Cards */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-900/40 rounded-xl border border-slate-800">
                No wiki articles match your filter.
              </div>
            ) : (
              filteredArticles.map((article) => {
                const isSelected = selectedArticle?.id === article.id;
                return (
                  <div
                    key={article.id}
                    onClick={() => setSelectedArticleId(article.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-1.5 shadow-md ${
                      isSelected
                        ? 'bg-slate-850 border-brand-500/60 shadow-brand-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(article.category)}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {article.category}
                        </span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-400' : 'text-slate-600'}`} />
                    </div>

                    <h3 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {article.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {article.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 text-[9px] font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Article Reader (8 cols) */}
        <div className="lg:col-span-8">
          {selectedArticle ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
              
              {/* Reader Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-slate-800 rounded-lg">
                      {getCategoryIcon(selectedArticle.category)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-400 font-mono">
                      {selectedArticle.category}
                    </span>
                  </div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    {selectedArticle.title}
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">
                    {selectedArticle.summary}
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(selectedArticle)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                    title="Edit Wiki Article"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedArticle.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                    title="Delete Article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tags & Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-brand-400" />
                  <span>Author: <strong className="text-slate-200">{selectedArticle.author}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Updated: {new Date(selectedArticle.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Article Content Render */}
              <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-4 text-slate-300">
                {selectedArticle.content.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('## ')) {
                    return <h2 key={idx} className="text-base font-bold text-white pt-2 border-b border-slate-800 pb-1">{paragraph.replace('## ', '')}</h2>;
                  }
                  if (paragraph.startsWith('### ')) {
                    return <h3 key={idx} className="text-sm font-bold text-brand-300 pt-1">{paragraph.replace('### ', '')}</h3>;
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <ul key={idx} className="space-y-1.5 pl-4 list-disc text-slate-300">
                        {paragraph.split('\n').map((li, liIdx) => (
                          <li key={liIdx}>{li.replace(/^- /, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (paragraph.startsWith('1. ') || paragraph.startsWith('2. ') || paragraph.startsWith('3. ')) {
                    return (
                      <ol key={idx} className="space-y-1.5 pl-4 list-decimal text-slate-300">
                        {paragraph.split('\n').map((li, liIdx) => (
                          <li key={liIdx}>{li.replace(/^\d+\.\s+/, '')}</li>
                        ))}
                      </ol>
                    );
                  }
                  return <p key={idx} className="text-slate-300">{paragraph}</p>;
                })}
              </div>

              {/* Tags Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
                {selectedArticle.tags.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono">
                    #{t}
                  </span>
                ))}
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs italic">
              Select an article from the sidebar to view documentation.
            </div>
          )}
        </div>

      </div>

      {/* Article Editor / Creator Modal */}
      {isEditorOpen && editingArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-4 animate-fadeIn text-slate-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-400" />
                <span>{editingArticle.id ? 'Edit Wiki Article' : 'Enrich Knowledge Hub (New Article)'}</span>
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Article Title</label>
                <input
                  type="text"
                  value={editingArticle.title || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  placeholder="e.g. Inbound Webhook Automation Pipeline"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Category</label>
                  <select
                    value={editingArticle.category || 'Automation Studio'}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value as WikiCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editingArticle.tags ? editingArticle.tags.join(', ') : ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    placeholder="e.g. Email, Automation, Zapier"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Summary</label>
                <input
                  type="text"
                  value={editingArticle.summary || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                  placeholder="Short 1-sentence summary"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Content (Markdown)</label>
                <textarea
                  value={editingArticle.content || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveArticle}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>Save Article</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
