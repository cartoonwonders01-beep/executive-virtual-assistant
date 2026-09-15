import { telemetry } from '../services/telemetryLogger';

export type EntityNodeType = 'person' | 'project' | 'location' | 'concept' | 'family';

export type EntityRelationType = 
  | 'MEMBER_OF'
  | 'LOCATED_AT'
  | 'WORKS_ON'
  | 'PARTNER_OF'
  | 'CHILD_OF'
  | 'PARENT_OF'
  | 'INTERESTED_IN'
  | 'COLLABORATES_WITH'
  | 'RELATED_TO';

export interface GraphNode {
  id: string; // e.g. "person:celine", "project:auricpass"
  label: string;
  type: EntityNodeType;
  metadata?: Record<string, any>;
  updatedAt: number;
}

export interface GraphEdge {
  id: string; // e.g. "edge:person:andrew->PARTNER_OF->person:celine"
  source: string; // Node ID
  target: string; // Node ID
  relation: EntityRelationType;
  weight?: number; // 0.0 - 1.0 confidence/strength
  metadata?: Record<string, any>;
}

export interface GraphNeighborhood {
  node: GraphNode;
  inbound: Array<{ edge: GraphEdge; node: GraphNode }>;
  outbound: Array<{ edge: GraphEdge; node: GraphNode }>;
}

const DB_NAME = 'EveV2EntityGraphDB';
const DB_VERSION = 1;
const NODES_STORE = 'graph_nodes';
const EDGES_STORE = 'graph_edges';

export class EntityGraphStore {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.seedDefaultGraph();
    this.initPromise = this.initIndexedDb();
  }

  private seedDefaultGraph(): void {
    const coreNodes: GraphNode[] = [
      { id: 'person:andrew', label: 'Andrew', type: 'person', updatedAt: Date.now() },
      { id: 'person:celine', label: 'Celine', type: 'person', metadata: { language: 'French' }, updatedAt: Date.now() },
      { id: 'person:angelina', label: 'Angelina', type: 'person', updatedAt: Date.now() },
      { id: 'person:elizabeth', label: 'Elizabeth', type: 'person', updatedAt: Date.now() },
      { id: 'person:alexander', label: 'Alexander', type: 'person', updatedAt: Date.now() },
      { id: 'person:eleonore', label: 'Eleonore', type: 'person', updatedAt: Date.now() },
      { id: 'location:hoeilaart', label: 'Hoeilaart', type: 'location', updatedAt: Date.now() },
      { id: 'location:brussels', label: 'Brussels', type: 'location', updatedAt: Date.now() },
      { id: 'project:eve', label: 'Eve Assistant v2', type: 'project', updatedAt: Date.now() },
      { id: 'project:auricpass', label: 'AuricPass Security', type: 'project', updatedAt: Date.now() },
      { id: 'family:andrew_celine', label: 'B Family', type: 'family', updatedAt: Date.now() }
    ];

    coreNodes.forEach(n => this.nodes.set(n.id, n));

    const coreEdges: GraphEdge[] = [
      { id: 'edge:andrew->partner->celine', source: 'person:andrew', target: 'person:celine', relation: 'PARTNER_OF', weight: 1.0 },
      { id: 'edge:celine->partner->andrew', source: 'person:celine', target: 'person:andrew', relation: 'PARTNER_OF', weight: 1.0 },
      { id: 'edge:andrew->located->hoeilaart', source: 'person:andrew', target: 'location:hoeilaart', relation: 'LOCATED_AT', weight: 0.9 },
      { id: 'edge:celine->located->hoeilaart', source: 'person:celine', target: 'location:hoeilaart', relation: 'LOCATED_AT', weight: 0.9 },
      { id: 'edge:andrew->works->eve', source: 'person:andrew', target: 'project:eve', relation: 'WORKS_ON', weight: 1.0 },
      { id: 'edge:andrew->works->auricpass', source: 'person:andrew', target: 'project:auricpass', relation: 'WORKS_ON', weight: 1.0 },
      { id: 'edge:angelina->parent->andrew', source: 'person:angelina', target: 'person:andrew', relation: 'CHILD_OF', weight: 1.0 },
      { id: 'edge:elizabeth->parent->andrew', source: 'person:elizabeth', target: 'person:andrew', relation: 'CHILD_OF', weight: 1.0 },
      { id: 'edge:alexander->parent->andrew', source: 'person:alexander', target: 'person:andrew', relation: 'CHILD_OF', weight: 1.0 },
      { id: 'edge:eleonore->parent->andrew', source: 'person:eleonore', target: 'person:andrew', relation: 'CHILD_OF', weight: 1.0 },
      { id: 'edge:andrew->member->family', source: 'person:andrew', target: 'family:andrew_celine', relation: 'MEMBER_OF', weight: 1.0 },
      { id: 'edge:celine->member->family', source: 'person:celine', target: 'family:andrew_celine', relation: 'MEMBER_OF', weight: 1.0 }
    ];

    coreEdges.forEach(e => this.edges.set(e.id, e));
  }

  private async initIndexedDb(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(NODES_STORE)) {
          db.createObjectStore(NODES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(EDGES_STORE)) {
          const edgeStore = db.createObjectStore(EDGES_STORE, { keyPath: 'id' });
          edgeStore.createIndex('source', 'source', { unique: false });
          edgeStore.createIndex('target', 'target', { unique: false });
          edgeStore.createIndex('relation', 'relation', { unique: false });
        }
      };

      request.onsuccess = async () => {
        this.db = request.result;
        await this.loadFromIndexedDb();
      };
    } catch {
      // In-memory fallback
    }
  }

  private async loadFromIndexedDb(): Promise<void> {
    if (!this.db) return;
    try {
      const tx = this.db.transaction([NODES_STORE, EDGES_STORE], 'readonly');
      const nodeStore = tx.objectStore(NODES_STORE);
      const edgeStore = tx.objectStore(EDGES_STORE);

      const loadedNodes = await new Promise<GraphNode[]>((resolve) => {
        const req = nodeStore.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      const loadedEdges = await new Promise<GraphEdge[]>((resolve) => {
        const req = edgeStore.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      if (loadedNodes.length > 0) {
        loadedNodes.forEach(n => this.nodes.set(n.id, n));
      }
      if (loadedEdges.length > 0) {
        loadedEdges.forEach(e => this.edges.set(e.id, e));
      }
    } catch {
      // Keep seeded in-memory state
    }
  }

  public async setNode(node: GraphNode): Promise<void> {
    this.nodes.set(node.id, node);
    if (this.db) {
      try {
        const tx = this.db.transaction(NODES_STORE, 'readwrite');
        tx.objectStore(NODES_STORE).put(node);
      } catch {}
    }
    telemetry.log('event', { action: 'graph_node_saved', nodeId: node.id, type: node.type });
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public findNodeByLabel(label: string): GraphNode | undefined {
    const clean = label.trim().toLowerCase();
    for (const node of this.nodes.values()) {
      if (node.label.toLowerCase() === clean) return node;
    }
    return undefined;
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public async setEdge(edge: GraphEdge): Promise<void> {
    this.edges.set(edge.id, edge);
    if (this.db) {
      try {
        const tx = this.db.transaction(EDGES_STORE, 'readwrite');
        tx.objectStore(EDGES_STORE).put(edge);
      } catch {}
    }
    telemetry.log('event', { action: 'graph_edge_saved', edgeId: edge.id, relation: edge.relation });
  }

  public getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  public getNeighborhood(nodeId: string): GraphNeighborhood | null {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    const inbound: Array<{ edge: GraphEdge; node: GraphNode }> = [];
    const outbound: Array<{ edge: GraphEdge; node: GraphNode }> = [];

    for (const edge of this.edges.values()) {
      if (edge.source === nodeId) {
        const targetNode = this.nodes.get(edge.target);
        if (targetNode) outbound.push({ edge, node: targetNode });
      } else if (edge.target === nodeId) {
        const srcNode = this.nodes.get(edge.source);
        if (srcNode) inbound.push({ edge, node: srcNode });
      }
    }

    return { node, inbound, outbound };
  }

  public async linkEntities(
    sourceLabel: string, 
    sourceType: EntityNodeType, 
    relation: EntityRelationType, 
    targetLabel: string, 
    targetType: EntityNodeType,
    weight = 1.0
  ): Promise<GraphEdge> {
    const srcId = `${sourceType}:${sourceLabel.toLowerCase().replace(/\s+/g, '_')}`;
    const tgtId = `${targetType}:${targetLabel.toLowerCase().replace(/\s+/g, '_')}`;

    if (!this.nodes.has(srcId)) {
      await this.setNode({ id: srcId, label: sourceLabel, type: sourceType, updatedAt: Date.now() });
    }
    if (!this.nodes.has(tgtId)) {
      await this.setNode({ id: tgtId, label: targetLabel, type: targetType, updatedAt: Date.now() });
    }

    const edgeId = `edge:${srcId}->${relation}->${tgtId}`;
    const edge: GraphEdge = {
      id: edgeId,
      source: srcId,
      target: tgtId,
      relation,
      weight,
      metadata: { createdAt: Date.now() }
    };

    await this.setEdge(edge);
    return edge;
  }

  public getRelationalContextSummary(focusEntityLabel?: string): string {
    if (!focusEntityLabel) {
      const andrewNeighbors = this.getNeighborhood('person:andrew');
      if (!andrewNeighbors) return 'No relational graph found.';

      const relations = andrewNeighbors.outbound.map(o => 
        `• Andrew [${o.edge.relation}] -> ${o.node.label} (${o.node.type})`
      );
      return `RELATIONAL ENTITY GRAPH:\n${relations.join('\n')}`;
    }

    const target = this.findNodeByLabel(focusEntityLabel);
    if (!target) return `No graph entity matched "${focusEntityLabel}".`;

    const neighborhood = this.getNeighborhood(target.id);
    if (!neighborhood) return `No relations known for "${focusEntityLabel}".`;

    const lines: string[] = [`RELATIONAL CONTEXT FOR [${target.label}]:`];
    neighborhood.outbound.forEach(o => lines.push(`• ${target.label} [${o.edge.relation}] -> ${o.node.label} (${o.node.type})`));
    neighborhood.inbound.forEach(i => lines.push(`• ${i.node.label} (${i.node.type}) [${i.edge.relation}] -> ${target.label}`));

    return lines.join('\n');
  }

  public clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.seedDefaultGraph();
  }
}

export const entityGraphStore = new EntityGraphStore();
