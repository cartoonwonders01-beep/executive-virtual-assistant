// ==============================================================================
// Google Apps Script BigQuery Vector & Warehouse Module
// Project ID: homeassistant-506520
// Dataset ID: executive_assistant_hub
// ==============================================================================

var BIGQUERY_PROJECT_ID = 'homeassistant-506520';
var BIGQUERY_DATASET_ID = 'executive_assistant_hub';

/**
 * Inserts a voice memo transcript and embedding vector into BigQuery
 */
function insertVoiceMemoVector(memo) {
  var tableId = 'voice_memos_vectors';
  var row = {
    memo_id: memo.id || ('memo-' + new Date().getTime()),
    title: memo.title || 'Voice Memo',
    transcript: memo.transcript || '',
    summary: memo.summary || '',
    category: memo.category || 'Business & Strategy',
    source: memo.source || 'browser_mic',
    duration_seconds: memo.durationSeconds || 15,
    extracted_tasks_count: (memo.extractedTaskIds || []).length,
    embedding: memo.embedding || [],
    created_at: new Date().toISOString()
  };

  try {
    var insertRequest = {
      rows: [{ json: row }]
    };
    BigQuery.Tabledata.insertAll(insertRequest, BIGQUERY_PROJECT_ID, BIGQUERY_DATASET_ID, tableId);
    return { success: true, memoId: row.memo_id };
  } catch (err) {
    Logger.log('BigQuery Insert Error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Executes a semantic vector search query using BigQuery VECTOR_SEARCH
 */
function querySemanticVectors(queryVector, topK) {
  var k = topK || 3;
  var sql = 
    'SELECT base.memo_id, base.title, base.transcript, base.summary, base.category, distance ' +
    'FROM VECTOR_SEARCH(' +
    '  TABLE `' + BIGQUERY_PROJECT_ID + '.' + BIGQUERY_DATASET_ID + '.voice_memos_vectors`, ' +
    '  \'embedding\', ' +
    '  (SELECT ' + JSON.stringify(queryVector) + ' AS query_vec), ' +
    '  top_k => ' + k + ', ' +
    '  distance_type => \'COSINE\'' +
    ') ORDER BY distance ASC;';

  try {
    var queryRequest = {
      query: sql,
      useLegacySql: false
    };
    var queryResults = BigQuery.Jobs.query(queryRequest, BIGQUERY_PROJECT_ID);
    return { success: true, rows: queryResults.rows || [] };
  } catch (err) {
    Logger.log('BigQuery Vector Search Error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}
