import React, { useState, useEffect } from 'react';
import { entityGraphStore, GraphNode, GraphEdge } from '../brain/entityGraphStore';

export const EntityGraphExplorer: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    refreshGraph();
  }, []);

  const refreshGraph = () => {
    const allNodes = entityGraphStore.getAllNodes();
    const allEdges = entityGraphStore.getAllEdges();
    setNodes(allNodes);
    setEdges(allEdges);
    if (allNodes.length > 0 && !selectedNode) {
      const andrew = allNodes.find(n => n.id === 'person:andrew') || allNodes[0];
      setSelectedNode(andrew);
    }
  };

  const filteredNodes = filterType === 'all' 
    ? nodes 
    : nodes.filter(n => n.type === filterType);

  const selectedNeighborhood = selectedNode 
    ? entityGraphStore.getNeighborhood(selectedNode.id) 
    : null;

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'person': return 'border-blue-500/60 bg-blue-950/40 text-blue-300';
      case 'project': return 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300';
      case 'location': return 'border-amber-500/60 bg-amber-950/40 text-amber-300';
      case 'family': return 'border-purple-500/60 bg-purple-950/40 text-purple-300';
      default: return 'border-gray-600 bg-gray-900 text-gray-300';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'person': return 'bg-blue-900/60 text-blue-300 border-blue-700';
      case 'project': return 'bg-emerald-900/60 text-emerald-300 border-emerald-700';
      case 'location': return 'bg-amber-900/60 text-amber-300 border-amber-700';
      case 'family': return 'bg-purple-900/60 text-purple-300 border-purple-700';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-400 font-medium">Filter Type:</span>
          {['all', 'person', 'project', 'location', 'family'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                filterType === t 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-950 text-gray-400 hover:text-gray-200 border border-gray-800'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-gray-500 font-mono">
          {nodes.length} nodes · {edges.length} edges
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-[320px]">
        {/* Node Cluster Canvas */}
        <div className="md:col-span-2 bg-black/40 border border-gray-800/80 rounded-xl p-4 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Knowledge Entity Canvas
          </div>
          <div className="flex flex-wrap gap-2.5">
            {filteredNodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left flex items-center gap-2 ${
                    getNodeColor(node.type)
                  } ${isSelected ? 'ring-2 ring-white/80 scale-105 shadow-lg' : 'hover:scale-[1.02]'}`}
                >
                  <span className="font-semibold">{node.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono ${getTypeBadge(node.type)}`}>
                    {node.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Neighborhood & Relational Context */}
        <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 flex flex-col space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-2">
            Relational Neighborhood
          </div>

          {selectedNode && selectedNeighborhood ? (
            <div className="space-y-4 text-xs overflow-y-auto pr-1">
              <div>
                <div className="text-gray-400 text-[10px] uppercase font-mono">Active Node</div>
                <div className="text-base font-bold text-white mt-0.5">{selectedNode.label}</div>
                <div className="text-[11px] text-gray-400">Type: <span className="font-mono text-gray-200">{selectedNode.type}</span></div>
              </div>

              {/* Outbound relations */}
              <div>
                <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1.5">
                  Direct Connections ({selectedNeighborhood.outbound.length})
                </div>
                {selectedNeighborhood.outbound.length === 0 ? (
                  <div className="text-gray-500 italic text-[11px]">No outbound edges</div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedNeighborhood.outbound.map(({ edge, node }) => (
                      <div 
                        key={edge.id}
                        onClick={() => setSelectedNode(node)}
                        className="bg-gray-900/80 p-2 rounded-lg border border-gray-800 hover:border-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="text-[10px] font-mono text-amber-400 uppercase">--[{edge.relation}]--&gt;</div>
                        <div className="font-semibold text-gray-200">{node.label} <span className="text-[10px] text-gray-400 font-normal">({node.type})</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inbound relations */}
              <div>
                <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-1.5">
                  Referenced By ({selectedNeighborhood.inbound.length})
                </div>
                {selectedNeighborhood.inbound.length === 0 ? (
                  <div className="text-gray-500 italic text-[11px]">No inbound edges</div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedNeighborhood.inbound.map(({ edge, node }) => (
                      <div 
                        key={edge.id}
                        onClick={() => setSelectedNode(node)}
                        className="bg-gray-900/80 p-2 rounded-lg border border-gray-800 hover:border-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="text-[10px] font-mono text-emerald-400 uppercase">&lt;--[{edge.relation}]--</div>
                        <div className="font-semibold text-gray-200">{node.label} <span className="text-[10px] text-gray-400 font-normal">({node.type})</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-xs italic">Select a node to inspect relationships.</div>
          )}
        </div>
      </div>
    </div>
  );
};
