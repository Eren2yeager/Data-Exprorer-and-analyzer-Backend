# MongoDB Compass Clone - Backend API

A powerful RESTful API backend for MongoDB database management, built with Node.js and Express. Provides comprehensive MongoDB operations including connection management, database operations, collection management, document CRUD, aggregation pipelines, and data import/export.

## 🚀 Features

### **Connection Management**
- ✅ Session-based authentication
- ✅ Multiple concurrent connections
- ✅ Connection validation and testing
- ✅ MongoDB Atlas support
- ✅ Secure session management

### **Database Operations**
- ✅ List all databases
- ✅ Get database information and statistics
- ✅ Create new databases
- ✅ Drop databases
- ✅ Database size and collection count

### **Collection Management**
- ✅ List collections in a database
- ✅ Get collection statistics
- ✅ Create collections with options
- ✅ Drop collections
- ✅ Rename collections
- ✅ Collection size and document count

### **Document Operations**
- ✅ Query documents with pagination
- ✅ Advanced filtering and sorting
- ✅ Get document by ID
- ✅ Insert single or multiple documents
- ✅ Update documents (full replacement)
- ✅ Delete documents
- ✅ Bulk operations support

### **Schema Analysis**
- ✅ Analyze collection schema
- ✅ Field type detection
- ✅ Field frequency analysis
- ✅ Sample value extraction
- ✅ Index management
- ✅ Create and drop indexes

### **Aggregation Pipeline**
- ✅ Execute aggregation pipelines
- ✅ Pipeline validation
- ✅ Execution plan (explain)
- ✅ Pipeline suggestions
- ✅ Performance optimization

### **Import/Export**
- ✅ Export to JSON
- ✅ Export to CSV
- ✅ Import from JSON
- ✅ Import from CSV
- ✅ Bulk import with validation
- ✅ Export with filtering

## 📋 Prerequisites

- **Node.js** >= 16.x
- **npm** or **pnpm**
- **MongoDB Atlas** account (or hosted MongoDB instance)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd Back-end
```

### 2. Install dependencies
```bash
npm install
# or
pnpm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_TIMEOUT_MS=3600000

# MongoDB Configuration (optional defaults)
MAX_POOL_SIZE=10
MIN_POOL_SIZE=2
```

### 4. Start the server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:4000`

## 📁 Project Structure

```
Back-end/
├── config/
│   ├── db.js                 # MongoDB connection management
│   └── sessionManager.js     # Session management
├── controllers/
│   ├── connectionController.js    # Connection operations
│   ├── databaseController.js      # Database operations
│   ├── collectionController.js    # Collection operations
│   ├── documentController.js      # Document CRUD operations
│   ├── schemaController.js        # Schema analysis
│   ├── aggregationController.js   # Aggregation pipelines
│   └── exportImportController.js  # Import/Export operations
├── middleware/
│   ├── sessionMiddleware.js  # Session validation
│   ├── responseHandler.js    # Standardized responses
│   ├── rateLimiter.js        # Rate limiting
│   └── validation.js         # Request validation
├── routes/
│   ├── connectionRoutes.js   # Connection endpoints
│   ├── databaseRoutes.js     # Database endpoints
│   ├── collectionRoutes.js   # Collection endpoints
│   ├── documentRoutes.js     # Document endpoints
│   ├── schemaRoutes.js       # Schema endpoints
│   ├── aggregationRoutes.js  # Aggregation endpoints
│   └── exportImportRoutes.js # Import/Export endpoints
├── src/
│   └── index.js              # Application entry point
├── .env                      # Environment variables
├── .env.example              # Environment template
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🔌 API Endpoints

### **Connection Management**

#### Connect to MongoDB
```http
POST /api/connect
Content-Type: application/json

{
  "connStr": "mongodb+srv://user:pass@cluster.mongodb.net/database"
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "connected": true,
    "serverInfo": { ... }
  }
}
```

#### Disconnect
```http
POST /api/disconnect
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "message": "Disconnected successfully"
}
```

#### Get Active Sessions
```http
GET /api/sessions

Response:
{
  "success": true,
  "data": {
    "sessions": [...]
  }
}
```

---

### **Database Operations**

#### List Databases
```http
GET /api/databases
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "data": {
    "databases": [
      {
        "name": "myDatabase",
        "sizeOnDisk": 1234567,
        "empty": false
      }
    ]
  }
}
```

#### Get Database Info
```http
GET /api/databases/:dbName
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "data": {
    "name": "myDatabase",
    "collections": 5,
    "views": 0,
    "dataSize": 1234567
  }
}
```

#### Create Database
```http
POST /api/databases/:dbName
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "message": "Database created successfully"
}
```

#### Drop Database
```http
DELETE /api/databases/:dbName
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "message": "Database dropped successfully"
}
```

---

### **Collection Operations**

#### List Collections
```http
GET /api/databases/:dbName/collections
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "data": {
    "collections": [
      {
        "name": "users",
        "type": "collection"
      }
    ]
  }
}
```

#### Get Collection Stats
```http
GET /api/databases/:dbName/collections/:collName
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "data": {
    "count": 1000,
    "size": 123456,
    "avgObjSize": 123,
    "storageSize": 234567,
    "indexes": 2
  }
}
```

#### Create Collection
```http
POST /api/databases/:dbName/collections
X-Session-Id: <session-id>
Content-Type: application/json

{
  "collName": "newCollection",
  "options": {
    "capped": false
  }
}
```

#### Drop Collection
```http
DELETE /api/databases/:dbName/collections/:collName
X-Session-Id: <session-id>
```

#### Rename Collection
```http
PUT /api/databases/:dbName/collections/:collName/rename
X-Session-Id: <session-id>
Content-Type: application/json

{
  "newName": "renamedCollection"
}
```

---

### **Document Operations**

#### Query Documents
```http
POST /api/databases/:dbName/collections/:collName/documents/query
X-Session-Id: <session-id>
Content-Type: application/json

{
  "filter": { "status": "active" },
  "projection": { "name": 1, "email": 1 },
  "sort": { "createdAt": -1 },
  "page": 1,
  "pageSize": 25
}

Response:
{
  "success": true,
  "data": {
    "documents": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 25,
      "totalPages": 4
    }
  }
}
```

#### Get Document by ID
```http
GET /api/databases/:dbName/collections/:collName/documents/:id
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    ...
  }
}
```

#### Insert Documents
```http
POST /api/databases/:dbName/collections/:collName/documents
X-Session-Id: <session-id>
Content-Type: application/json

{
  "documents": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}

// Or insert multiple:
{
  "documents": [
    { "name": "John" },
    { "name": "Jane" }
  ]
}
```

#### Update Document
```http
PUT /api/databases/:dbName/collections/:collName/documents/:id
X-Session-Id: <session-id>
Content-Type: application/json

{
  "update": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}

Response:
{
  "success": true,
  "data": {
    "matchedCount": 1,
    "modifiedCount": 1
  }
}
```

#### Delete Document
```http
DELETE /api/databases/:dbName/collections/:collName/documents/:id
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "data": {
    "deletedCount": 1
  }
}
```

---

### **Schema Analysis**

#### Analyze Schema
```http
POST /api/databases/:dbName/collections/:collName/schema
X-Session-Id: <session-id>
Content-Type: application/json

{
  "sampleSize": 100
}

Response:
{
  "success": true,
  "data": {
    "fields": [
      {
        "name": "name",
        "types": ["string"],
        "count": 100,
        "percentage": 100
      }
    ],
    "totalDocuments": 100
  }
}
```

#### List Indexes
```http
GET /api/databases/:dbName/collections/:collName/indexes
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "data": {
    "indexes": [
      {
        "name": "_id_",
        "key": { "_id": 1 },
        "unique": true
      }
    ]
  }
}
```

#### Create Index
```http
POST /api/databases/:dbName/collections/:collName/indexes
X-Session-Id: <session-id>
Content-Type: application/json

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
X-Session-Id: <session-id>
```

---

### **Aggregation Pipeline**

#### Execute Pipeline
```http
POST /api/databases/:dbName/collections/:collName/aggregate
X-Session-Id: <session-id>
Content-Type: application/json

{
  "pipeline": [
    { "$match": { "status": "active" } },
    { "$group": { "_id": "$country", "count": { "$sum": 1 } } },
    { "$sort": { "count": -1 } }
  ],
  "options": {}
}

Response:
{
  "success": true,
  "data": {
    "results": [...],
    "count": 10,
    "executionTime": 45
  }
}
```

#### Get Suggestions
```http
GET /api/databases/:dbName/collections/:collName/aggregate/suggestions
X-Session-Id: <session-id>

Response:
{
  "success": true,
  "data": {
    "suggestions": [...]
  }
}
```

#### Explain Pipeline
```http
POST /api/databases/:dbName/collections/:collName/aggregate/explain
X-Session-Id: <session-id>
Content-Type: application/json

{
  "pipeline": [...]
}
```

---

### **Import/Export**

#### Export to JSON
```http
POST /api/databases/:dbName/collections/:collName/export/json
X-Session-Id: <session-id>
Content-Type: application/json

{
  "filter": {},
  "limit": 1000
}

Response:
{
  "success": true,
  "data": {
    "data": [...],
    "count": 100
  }
}
```

#### Export to CSV
```http
POST /api/databases/:dbName/collections/:collName/export/csv
X-Session-Id: <session-id>
Content-Type: application/json

{
  "filter": {},
  "fields": ["name", "email"],
  "limit": 1000
}

Response:
{
  "success": true,
  "data": {
    "csv": "name,email\nJohn,john@example.com\n...",
    "count": 100
  }
}
```

#### Import JSON
```http
POST /api/databases/:dbName/collections/:collName/import/json
X-Session-Id: <session-id>
Content-Type: application/json

{
  "data": [
    { "name": "John" },
    { "name": "Jane" }
  ],
  "mode": "insert"
}

Response:
{
  "success": true,
  "data": {
    "insertedCount": 2
  }
}
```

#### Import CSV
```http
POST /api/databases/:dbName/collections/:collName/import/csv
X-Session-Id: <session-id>
Content-Type: application/json

{
  "csv": "name,email\nJohn,john@example.com",
  "mode": "insert"
}
```

---

## 🔒 Security Features

### **Session Management**
- UUID-based session IDs
- Session timeout (1 hour default)
- Automatic session cleanup
- Session validation on every request

### **Rate Limiting**
- Connection endpoint: 10 requests per 15 minutes
- Other endpoints: 100 requests per 15 minutes
- Configurable limits via environment variables

### **Input Validation**
- Request body validation using Joi
- MongoDB query sanitization
- NoSQL injection prevention
- Connection string validation

### **Error Handling**
- Standardized error responses
- Detailed error logging
- No sensitive data in error messages
- Graceful error recovery

## 🎯 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "statusCode": 200
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "statusCode": 400
}
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📊 Performance

- **Connection Pooling**: Reuses MongoDB connections
- **Pagination**: Efficient document querying
- **Indexing**: Supports index management
- **Caching**: Session caching for faster validation
- **Rate Limiting**: Prevents API abuse

## 🚀 Deployment

### **Environment Variables for Production**
```env
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://your-frontend-domain.com
SESSION_TIMEOUT_MS=3600000
```

### **Deployment Platforms**

#### **Railway**
```bash
railway login
railway init
railway up
```

#### **Render**
1. Connect GitHub repository
2. Set environment variables
3. Deploy

#### **Heroku**
```bash
heroku create your-app-name
git push heroku main
```

## 🔧 Configuration

### **MongoDB Connection Pool**
```javascript
// config/db.js
const client = new MongoClient(connStr, {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000
});
```

### **CORS Configuration**
```javascript
// src/index.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

### **Rate Limiting**
```javascript
// middleware/rateLimiter.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## 📝 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 4000 | No |
| `NODE_ENV` | Environment | development | No |
| `CORS_ORIGIN` | Allowed origin | http://localhost:5173 | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests | 100 | No |
| `SESSION_TIMEOUT_MS` | Session timeout | 3600000 | No |

## 🐛 Troubleshooting

### **Connection Issues**
```
Error: Failed to connect to MongoDB
```
**Solution**: Check your MongoDB Atlas connection string and ensure IP whitelist is configured (0.0.0.0/0 for all IPs).

### **Session Expired**
```
Error: Session not found or expired
```
**Solution**: Reconnect to MongoDB. Sessions expire after 1 hour of inactivity.

### **Rate Limit Exceeded**
```
Error: Too many requests
```
**Solution**: Wait 15 minutes or adjust rate limit settings in `.env`.

## 📚 Dependencies

### **Core**
- `express` - Web framework
- `mongodb` - MongoDB driver
- `cors` - CORS middleware
- `dotenv` - Environment variables

### **Middleware**
- `express-rate-limit` - Rate limiting
- `joi` - Validation
- `uuid` - Session ID generation

### **Utilities**
- `winston` - Logging
- `http-status-codes` - HTTP status codes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Related

- **Frontend Repository**: https://github.com/Eren2yeager/Data-Exprorer-and-analyzer-React.git
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **MongoDB Documentation**: https://docs.mongodb.com/

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review MongoDB Atlas documentation

---

**Built with ❤️ using Node.js and MongoDB**
