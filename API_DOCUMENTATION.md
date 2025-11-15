# MongoDB Data Explorer & Analyzer - API Documentation

## 🔐 Authentication & Sessions

This API uses **session-based authentication** for security. Connection strings are never sent repeatedly - instead, you connect once and receive a session ID that you use for all subsequent requests.

### Session Flow
1. **Connect**: Send connection string → Receive session ID
2. **Store**: Save session ID in localStorage
3. **Use**: Include session ID in all API requests
4. **Disconnect**: Delete session when done

### Session ID Usage

Include the session ID in one of three ways:
- **Request Body**: `{ "sessionId": "your-session-id", ... }`
- **Query Parameter**: `?sessionId=your-session-id`
- **Header**: `X-Session-Id: your-session-id`

---

## 📡 API Endpoints

### Connection Management

#### 1. Connect to MongoDB (Atlas or Remote)
```http
POST /api/connect
Content-Type: application/json

{
  "connStr": "mongodb+srv://username:password@cluster.mongodb.net/dbname"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected to MongoDB",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "connected": true,
    "serverInfo": {
      "version": "7.0.0",
      "uptime": 12345,
      "host": "cluster0-shard-00-00.mongodb.net:27017",
      "process": "mongod",
      "connections": {
        "current": 5,
        "available": 995
      }
    }
  }
}
```

#### 2. Connect to Local MongoDB
```http
POST /api/connect/local
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected to local MongoDB",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "connected": true,
    "isLocal": true,
    "serverInfo": {
      "version": "7.0.0",
      "uptime": 12345,
      "host": "localhost:27017"
    }
  }
}
```

#### 3. Check Local MongoDB Availability
```http
GET /api/check-local
```


#### 4. Disconnect
```http
POST /api/disconnect
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 5. Get Active Sessions
```http
GET /api/sessions
```

---

### Database Operations

**Note:** All database operations require a valid session ID.

#### 1. List All Databases
```http
GET /api/databases
X-Session-Id: your-session-id
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "myDatabase",
      "sizeOnDisk": 83886080,
      "empty": false,
      "collectionCount": 5
    }
  ]
}
```

#### 2. Get Database Info
```http
GET /api/databases/:dbName
X-Session-Id: your-session-id
```

#### 3. Create Database
```http
POST /api/databases/:dbName
X-Session-Id: your-session-id
```

#### 4. Drop Database
```http
DELETE /api/databases/:dbName
X-Session-Id: your-session-id
```

---

### Collection Operations

#### 1. List Collections
```http
GET /api/databases/:dbName/collections
X-Session-Id: your-session-id
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "users",
      "type": "collection",
      "count": 1250,
      "size": 524288,
      "avgObjSize": 419
    }
  ]
}
```

#### 2. Get Collection Stats
```http
GET /api/databases/:dbName/collections/:collName
X-Session-Id: your-session-id
```

#### 3. Create Collection
```http
POST /api/databases/:dbName/collections
Content-Type: application/json
X-Session-Id: your-session-id

{
  "collName": "newCollection",
  "options": {
    "capped": false
  }
}
```

#### 4. Drop Collection
```http
DELETE /api/databases/:dbName/collections/:collName
X-Session-Id: your-session-id
```

#### 5. Rename Collection
```http
PUT /api/databases/:dbName/collections/:collName/rename
Content-Type: application/json
X-Session-Id: your-session-id

{
  "newName": "renamedCollection"
}
```

---

### Document Operations

#### 1. Query Documents (with pagination, filtering, sorting)
```http
POST /api/databases/:dbName/collections/:collName/documents/query
Content-Type: application/json
X-Session-Id: your-session-id

{
  "filter": { "age": { "$gt": 25 } },
  "projection": { "name": 1, "email": 1 },
  "sort": { "createdAt": -1 },
  "page": 1,
  "pageSize": 25
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "pageSize": 25,
      "totalPages": 6
    }
  }
}
```

#### 2. Get Document by ID
```http
GET /api/databases/:dbName/collections/:collName/documents/:id
X-Session-Id: your-session-id
```

#### 3. Insert Document(s)
```http
POST /api/databases/:dbName/collections/:collName/documents
Content-Type: application/json
X-Session-Id: your-session-id

{
  "documents": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "age": 28
  }
}
```

Or insert multiple:
```json
{
  "documents": [
    { "name": "User 1", "email": "user1@example.com" },
    { "name": "User 2", "email": "user2@example.com" }
  ]
}
```

#### 4. Update Document
```http
PUT /api/databases/:dbName/collections/:collName/documents/:id
Content-Type: application/json
X-Session-Id: your-session-id

{
  "update": {
    "name": "Updated Name",
    "age": 30
  }
}
```

Or with MongoDB operators:
```json
{
  "update": {
    "$set": { "name": "Updated Name" },
    "$inc": { "age": 1 }
  }
}
```

#### 5. Delete Document
```http
DELETE /api/databases/:dbName/collections/:collName/documents/:id
X-Session-Id: your-session-id
```

---

## 🛡️ Security Features

### 1. Session-Based Authentication
- Connection strings stored server-side only
- Sessions expire after 30 minutes of inactivity
- Automatic cleanup of expired sessions
- Maximum 1000 concurrent sessions

### 2. Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Connection Attempts**: 10 attempts per 15 minutes per IP
- **Write Operations**: 30 operations per minute per IP

### 3. Input Validation
- All requests validated with Joi schemas
- MongoDB query sanitization (prevents NoSQL injection)
- Maximum document size limits
- Connection string format validation

### 4. Connection Management
- Automatic cleanup of idle connections (30 min)
- Connection pooling with max pool size
- Secure connection string hashing
- Dead connection detection and removal

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-11-14T10:30:00.000Z",
  "statusCode": 200
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-11-14T10:30:00.000Z",
  "statusCode": 400
}
```

---

## 🚀 Quick Start Example

```javascript
// 1. Connect to MongoDB
const connectResponse = await fetch('http://localhost:4000/api/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    connStr: 'mongodb+srv://user:pass@cluster.mongodb.net/'
  })
});

const { data } = await connectResponse.json();
const sessionId = data.sessionId;

// 2. Store session ID
localStorage.setItem('mongoSessionId', sessionId);

// 3. List databases
const dbResponse = await fetch('http://localhost:4000/api/databases', {
  headers: { 'X-Session-Id': sessionId }
});

// 4. Query documents
const docsResponse = await fetch(
  'http://localhost:4000/api/databases/mydb/collections/users/documents/query',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': sessionId
    },
    body: JSON.stringify({
      filter: {},
      page: 1,
      pageSize: 25
    })
  }
);

// 5. Disconnect when done
await fetch('http://localhost:4000/api/disconnect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId })
});
```

---

## 🔧 Configuration

Environment variables in `.env`:

```env
NODE_ENV=development
PORT=4000
DOMAIN=localhost
CORS_ORIGIN=*
SESSION_TIMEOUT=1800000
MAX_SESSIONS=1000
CONNECTION_TIMEOUT=10000
MAX_POOL_SIZE=10
```


---

## 🆕 Phase 2 - Advanced Features

### Schema Analysis

#### Analyze Collection Schema
```http
POST /api/databases/:dbName/collections/:collName/schema
Content-Type: application/json
X-Session-Id: your-session-id

{
  "sampleSize": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "path": "email",
        "count": 98,
        "frequency": 0.98,
        "types": { "string": 98 },
        "primaryType": "string",
        "topValues": [
          { "value": "john@example.com", "count": 1 }
        ],
        "isRequired": true,
        "isUnique": true
      }
    ],
    "sampleSize": 100,
    "totalDocuments": 1250,
    "samplingPercentage": "8.00"
  }
}
```

---

### Index Management

#### List Indexes
```http
GET /api/databases/:dbName/collections/:collName/indexes
X-Session-Id: your-session-id
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "v": 2,
      "key": { "_id": 1 },
      "name": "_id_",
      "size": 1,
      "fields": ["_id"],
      "isUnique": false,
      "isSparse": false,
      "isPartial": false
    },
    {
      "v": 2,
      "key": { "email": 1 },
      "name": "email_unique",
      "unique": true,
      "size": 1,
      "fields": ["email"],
      "isUnique": true,
      "isSparse": false,
      "isPartial": false
    }
  ]
}
```

#### Create Index
```http
POST /api/databases/:dbName/collections/:collName/indexes
Content-Type: application/json
X-Session-Id: your-session-id

{
  "key": { "email": 1 },
  "options": {
    "unique": true,
    "name": "email_unique"
  }
}
```

#### Drop Index
```http
DELETE /api/databases/:dbName/collections/:collName/indexes/:indexName
X-Session-Id: your-session-id
```

---

### Aggregation Pipeline

#### Execute Aggregation
```http
POST /api/databases/:dbName/collections/:collName/aggregate
Content-Type: application/json
X-Session-Id: your-session-id

{
  "pipeline": [
    { "$match": { "status": "active" } },
    { "$group": { "_id": "$category", "total": { "$sum": "$amount" } } },
    { "$sort": { "total": -1 } },
    { "$limit": 10 }
  ],
  "options": {
    "maxTimeMS": 30000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      { "_id": "electronics", "total": 15000 },
      { "_id": "clothing", "total": 12000 }
    ],
    "count": 2,
    "executionTime": 45,
    "pipeline": [...]
  }
}
```

#### Get Aggregation Suggestions
```http
GET /api/databases/:dbName/collections/:collName/aggregate/suggestions
X-Session-Id: your-session-id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "name": "Count Documents",
        "description": "Count total documents in collection",
        "pipeline": [{ "$count": "total" }]
      },
      {
        "name": "Group and Count",
        "description": "Group by field and count occurrences",
        "pipeline": [...]
      }
    ],
    "availableFields": ["name", "email", "age", "city"]
  }
}
```

#### Validate Pipeline
```http
POST /api/aggregate/validate
Content-Type: application/json
X-Session-Id: your-session-id

{
  "pipeline": [
    { "$match": { "age": { "$gt": 25 } } },
    { "$group": { "_id": "$city", "count": { "$sum": 1 } } }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "stageCount": 2
  }
}
```

#### Explain Aggregation
```http
POST /api/databases/:dbName/collections/:collName/aggregate/explain
Content-Type: application/json
X-Session-Id: your-session-id

{
  "pipeline": [
    { "$match": { "age": { "$gt": 25 } } }
  ]
}
```

---

### Export/Import

#### Export to JSON
```http
POST /api/databases/:dbName/collections/:collName/export/json
Content-Type: application/json
X-Session-Id: your-session-id

{
  "filter": { "age": { "$gt": 18 } },
  "limit": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      { "_id": "...", "name": "John", "age": 30 },
      { "_id": "...", "name": "Jane", "age": 25 }
    ],
    "count": 2,
    "format": "json",
    "collection": "users",
    "database": "mydb"
  }
}
```

#### Export to CSV
```http
POST /api/databases/:dbName/collections/:collName/export/csv
Content-Type: application/json
X-Session-Id: your-session-id

{
  "filter": {},
  "fields": ["name", "email", "age"],
  "limit": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "csv": "\"name\",\"email\",\"age\"\n\"John\",\"john@example.com\",30\n...",
    "count": 1000,
    "fields": ["name", "email", "age"],
    "format": "csv"
  }
}
```

#### Get Export Info
```http
POST /api/databases/:dbName/collections/:collName/export/info
Content-Type: application/json
X-Session-Id: your-session-id

{
  "filter": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 1250,
    "availableFields": ["_id", "name", "email", "age"],
    "estimatedSizeBytes": 125000,
    "estimatedSizeMB": "0.12",
    "maxExportLimit": 50000,
    "canExportAll": true
  }
}
```

#### Import from JSON
```http
POST /api/databases/:dbName/collections/:collName/import/json
Content-Type: application/json
X-Session-Id: your-session-id

{
  "data": [
    { "name": "John", "email": "john@example.com", "age": 30 },
    { "name": "Jane", "email": "jane@example.com", "age": 25 }
  ],
  "mode": "insert"
}
```

**Modes:**
- `insert` - Insert all documents (fails on duplicates)
- `upsert` - Update if exists, insert if not

**Response:**
```json
{
  "success": true,
  "data": {
    "insertedCount": 2,
    "insertedIds": 2,
    "mode": "insert"
  }
}
```

#### Import from CSV
```http
POST /api/databases/:dbName/collections/:collName/import/csv
Content-Type: application/json
X-Session-Id: your-session-id

{
  "csv": "\"name\",\"email\",\"age\"\n\"John\",\"john@example.com\",30\n\"Jane\",\"jane@example.com\",25",
  "mode": "insert"
}
```

---

## 📊 Limits & Constraints

### Aggregation
- Maximum 50 stages per pipeline
- 30-second execution timeout (configurable)
- Pipeline validation before execution

### Export
- Maximum 50,000 documents per export
- JSON and CSV formats supported
- Filtering and field selection available

### Import
- Maximum 10,000 documents per import
- Bulk operations for efficiency
- Automatic type conversion for CSV
- Upsert mode available

### Schema Analysis
- Maximum 1,000 sample documents
- Configurable sample size
- Nested field support
- Type detection for all MongoDB types

---

## 🔧 Configuration

Add to `.env`:

```env
# Logging
LOG_LEVEL=info

# Aggregation
MAX_AGGREGATION_STAGES=50
AGGREGATION_TIMEOUT=30000

# Export/Import
MAX_EXPORT_LIMIT=50000
MAX_IMPORT_LIMIT=10000
```
