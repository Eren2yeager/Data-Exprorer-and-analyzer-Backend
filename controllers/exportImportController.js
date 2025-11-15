/**
 * Export/Import Controller
 * Handles data export and import operations
 */
import { getMongoClient } from '../config/db.js';

/**
 * Export collection data to JSON
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const exportToJSON = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    const { filter = {}, limit = 10000 } = req.body;
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    // Enforce maximum export limit
    const maxLimit = Math.min(limit, 50000);
    
    const documents = await collection
      .find(filter)
      .limit(maxLimit)
      .toArray();
    
    return res.success({
      data: documents,
      count: documents.length,
      format: 'json',
      collection: collName,
      database: dbName
    }, `Exported ${documents.length} documents to JSON`);
    
  } catch (error) {
    console.error('Export JSON error:', error.message);
    return res.error(`Failed to export to JSON: ${error.message}`, 500);
  }
};

/**
 * Export collection data to CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const exportToCSV = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    const { filter = {}, fields = [], limit = 10000 } = req.body;
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    const maxLimit = Math.min(limit, 50000);
    
    const documents = await collection
      .find(filter)
      .limit(maxLimit)
      .toArray();
    
    if (documents.length === 0) {
      return res.error('No documents to export', 404);
    }
    
    // Determine fields to export
    let csvFields = fields;
    if (csvFields.length === 0) {
      // Use all fields from first document
      const allFields = new Set();
      documents.forEach(doc => {
        Object.keys(doc).forEach(key => allFields.add(key));
      });
      csvFields = Array.from(allFields);
    }
    
    // Generate CSV
    const csv = convertToCSV(documents, csvFields);
    
    return res.success({
      csv,
      count: documents.length,
      fields: csvFields,
      format: 'csv'
    }, `Exported ${documents.length} documents to CSV`);
    
  } catch (error) {
    console.error('Export CSV error:', error.message);
    return res.error(`Failed to export to CSV: ${error.message}`, 500);
  }
};

/**
 * Convert documents to CSV format
 */
function convertToCSV(documents, fields) {
  // CSV header
  const header = fields.map(field => `"${field}"`).join(',');
  
  // CSV rows
  const rows = documents.map(doc => {
    return fields.map(field => {
      const value = getNestedValue(doc, field);
      
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      const strValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      
      return strValue;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Import data from JSON
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const importFromJSON = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    const { data, mode = 'insert' } = req.body; // mode: 'insert' or 'upsert'
    
    if (!data || !Array.isArray(data)) {
      return res.error('Data must be an array of documents', 400);
    }
    
    if (data.length === 0) {
      return res.error('Data array is empty', 400);
    }
    
    if (data.length > 10000) {
      return res.error('Cannot import more than 10,000 documents at once', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    let result;
    
    if (mode === 'upsert') {
      // Upsert mode: update if exists, insert if not
      const bulkOps = data.map(doc => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true
        }
      }));
      
      result = await collection.bulkWrite(bulkOps);
      
      return res.success({
        insertedCount: result.upsertedCount,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        mode: 'upsert'
      }, `Imported ${result.upsertedCount + result.modifiedCount} documents`);
      
    } else {
      // Insert mode: insert all documents
      result = await collection.insertMany(data, { ordered: false });
      
      return res.success({
        insertedCount: result.insertedCount,
        insertedIds: Object.keys(result.insertedIds).length,
        mode: 'insert'
      }, `Imported ${result.insertedCount} documents`);
    }
    
  } catch (error) {
    console.error('Import JSON error:', error.message);
    
    // Handle partial success in bulk operations
    if (error.result) {
      return res.success({
        insertedCount: error.result.insertedCount || 0,
        errors: error.writeErrors?.length || 0,
        message: 'Partial import completed with some errors'
      }, 'Import completed with errors');
    }
    
    return res.error(`Failed to import from JSON: ${error.message}`, 500);
  }
};

/**
 * Import data from CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const importFromCSV = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    const { csv, mode = 'insert' } = req.body;
    
    if (!csv || typeof csv !== 'string') {
      return res.error('CSV data is required as a string', 400);
    }
    
    // Parse CSV
    const documents = parseCSV(csv);
    
    if (documents.length === 0) {
      return res.error('No valid documents found in CSV', 400);
    }
    
    if (documents.length > 10000) {
      return res.error('Cannot import more than 10,000 documents at once', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    // Insert documents
    const result = await collection.insertMany(documents, { ordered: false });
    
    return res.success({
      insertedCount: result.insertedCount,
      mode: 'insert'
    }, `Imported ${result.insertedCount} documents from CSV`);
    
  } catch (error) {
    console.error('Import CSV error:', error.message);
    return res.error(`Failed to import from CSV: ${error.message}`, 500);
  }
};

/**
 * Parse CSV string to array of documents
 */
function parseCSV(csv) {
  const lines = csv.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row');
  }
  
  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const documents = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      continue; // Skip malformed rows
    }
    
    const doc = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      // Try to parse as number
      if (value && !isNaN(value)) {
        value = Number(value);
      }
      // Try to parse as boolean
      else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      }
      // Try to parse as JSON
      else if (value && (value.startsWith('{') || value.startsWith('['))) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if JSON parse fails
        }
      }
      
      doc[header] = value;
    });
    
    documents.push(doc);
  }
  
  return documents;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

/**
 * Get export statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getExportInfo = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    const { filter = {} } = req.body;
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    const count = await collection.countDocuments(filter);
    const sampleDoc = await collection.findOne(filter);
    
    const fields = sampleDoc ? Object.keys(sampleDoc) : [];
    const estimatedSize = count * (sampleDoc ? JSON.stringify(sampleDoc).length : 0);
    
    return res.success({
      totalDocuments: count,
      availableFields: fields,
      estimatedSizeBytes: estimatedSize,
      estimatedSizeMB: (estimatedSize / 1024 / 1024).toFixed(2),
      maxExportLimit: 50000,
      canExportAll: count <= 50000
    }, 'Export information retrieved');
    
  } catch (error) {
    console.error('Export info error:', error.message);
    return res.error(`Failed to get export info: ${error.message}`, 500);
  }
};
