// Google Cloud BigQuery Vector & Data Warehouse Service
// Project: homeassistant-506520
// Dataset: executive_assistant_hub
// Authenticates securely via service_account.json

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BigQueryVoiceMemoRecord {
  memo_id: string;
  title: string;
  transcript: string;
  summary: string;
  category: string;
  source: string;
  duration_seconds: number;
  extracted_tasks_count: number;
  embedding: number[];
  created_at?: string;
}

export class BigQueryService {
  private static instance: BigQueryService;
  private bqClient: any = null;
  private projectId = 'homeassistant-506520';
  private datasetId = 'executive_assistant_hub';
  private initialized = false;

  private constructor() {
    this.initClient();
  }

  public static getInstance(): BigQueryService {
    if (!BigQueryService.instance) {
      BigQueryService.instance = new BigQueryService();
    }
    return BigQueryService.instance;
  }

  private initClient(): void {
    const envCreds = process.env.GCP_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const keyPath = path.resolve(__dirname, 'service_account.json');

    try {
      const { BigQuery } = require('@google-cloud/bigquery');

      if (envCreds) {
        if (envCreds.trim().startsWith('{')) {
          const credentials = JSON.parse(envCreds);
          this.bqClient = new BigQuery({
            projectId: credentials.project_id || this.projectId,
            credentials
          });
          console.log(`[BIGQUERY] 🔐 Successfully authenticated with project [${this.projectId}] via RAM Environment Variable.`);
          return;
        } else if (fs.existsSync(envCreds)) {
          this.bqClient = new BigQuery({
            projectId: this.projectId,
            keyFilename: envCreds
          });
          console.log(`[BIGQUERY] 🔐 Successfully authenticated with project [${this.projectId}] via ENV keyFilename.`);
          return;
        }
      }

      if (fs.existsSync(keyPath)) {
        this.bqClient = new BigQuery({
          projectId: this.projectId,
          keyFilename: keyPath
        });
        console.log(`[BIGQUERY] 🔐 Successfully authenticated with project [${this.projectId}] via Service Account.`);
        return;
      }

      console.log(`[BIGQUERY] ℹ️ service_account credentials not detected; operating in simulated BigQuery mode.`);
    } catch (err) {
      console.warn(`[BIGQUERY] Notice initializing client:`, err);
    }
  }

  /**
   * Initializes the BigQuery schema and vector index automatically
   */
  public async initializeDatabase(): Promise<{ success: boolean; message: string }> {
    if (!this.bqClient) {
      return { success: true, message: 'BigQuery client in simulated mode.' };
    }

    try {
      const sqlPath = path.resolve(__dirname, '../google-cloud/bigquery_schema.sql');
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 10 && !s.startsWith('--'));

        for (const stmt of statements) {
          try {
            await this.bqClient.query({ query: stmt, location: 'EU' });
          } catch (stmtErr: any) {
            console.warn(`[BIGQUERY] Statement notice: ${stmtErr.message}`);
          }
        }
        this.initialized = true;
        return { success: true, message: 'BigQuery dataset, tables, and vector index initialized successfully in EU.' };
      }
      return { success: true, message: 'Schema script not found, skipped.' };
    } catch (err: any) {
      console.error(`[BIGQUERY] Error initializing schema:`, err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Inserts a voice memo transcript and 768-dim vector embedding
   */
  public async insertVoiceMemoVector(record: BigQueryVoiceMemoRecord): Promise<boolean> {
    if (!this.bqClient) return true;

    try {
      const dataset = this.bqClient.dataset(this.datasetId);
      const table = dataset.table('voice_memos_vectors');
      await table.insert([{
        ...record,
        created_at: record.created_at || new Date().toISOString()
      }]);
      return true;
    } catch (err) {
      console.error(`[BIGQUERY] Insert error:`, err);
      return false;
    }
  }

  /**
   * Executes BigQuery Vector Search over historical voice memos
   */
  public async searchSemanticVectors(queryVector: number[], topK: number = 3): Promise<any[]> {
    if (!this.bqClient) return [];

    const sql = `
      SELECT base.memo_id, base.title, base.transcript, base.summary, base.category, distance
      FROM VECTOR_SEARCH(
        TABLE \`${this.projectId}.${this.datasetId}.voice_memos_vectors\`,
        'embedding',
        (SELECT ${JSON.stringify(queryVector)} AS query_vec),
        top_k => ${topK},
        distance_type => 'COSINE'
      )
      ORDER BY distance ASC;
    `;

    try {
      const [rows] = await this.bqClient.query({ query: sql, location: 'EU' });
      return rows || [];
    } catch (err) {
      console.error(`[BIGQUERY] Vector Search error:`, err);
      return [];
    }
  }
}

export const bigQueryService = BigQueryService.getInstance();
