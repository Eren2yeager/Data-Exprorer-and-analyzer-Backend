# MongoDB Data Explorer and Analyzer - Backend

A secure, production-ready Express.js backend for MongoDB data exploration and analysis. Features session-based authentication, rate limiting, and comprehensive validation.

## ✨ Key Features

- **🔐 Session-Based Authentication**: Secure connection management with auto-expiring sessions
- **🛡️ Request Validation**: Comprehensive Joi validation and NoSQL injection prevention
- **🚫 Rate Limiting**: Three-tier rate limiting to prevent abuse
- **🏠 Local MongoDB Support**: Auto-detection and quick connect to local instances
- **⚡ Performance Optimized**: Connection pooling, lazy loading, and automatic cleanup
- **📐 RESTful API**: Proper HTTP methods and intuitive endpoint structure
- **💾 Memory Safe**: Automatic cleanup of idle connections and expired sessions
- **🔒 Production Ready**: Secure error handling, no credential exposure

## 📋 Tech Stack

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB Native Driver**: Direct MongoDB interaction
- **Joi**: Request validation and sanitization
- **UUID**: Secure session token generation
- **Express Rate Limit**: DDoS protection and rate limiting
- **CORS**: Cross-Origin Resource Sharing support
- **dotenv**: Environment variable management

## 🛠️ Project Structure

```
Back-end/
├── config/                    # Configuration files
│   ├── db.js                  # MongoDB connection management with pooling
│   └── sessionManager.js      # Session lifecycle management
├── controllers/               # API controllers
│   ├── connectionController.js
│   ├── databaseController.js
│   ├── collectionController.js
│   ├── documentController.js
│   └── schemaController.js
├── middleware/                # Express middleware
│   ├── responseHandler.js     # Success/error response formatting
│   ├── validation.js          # Joi validation schemas
│   ├── sessionMiddleware.js   # Session extraction and validation
│   └── rateLimiter.js         # Rate limiting configuration
├── routes/                    # API routes
│   ├── connectionRoutes.js
│   ├── databaseRoutes.js
│   ├── collectionRoutes.js
│   ├── documentRoutes.js
│   └── schemaRoutes.js
├── src/
│   └── index.js               # Application entry point
├── API_DOCUMENTATION.md       # Complete API reference
├── MIGRATION_GUIDE.md         # Migration from old API
├── QUICK_REFERENCE.md         # Quick reference card
└── PHASE1_COMPLETE.md         # Phase 1 summary
```

## 🔌 API Endpoints

> **Note:** All endpoints (except `/connect` and `/health`) require a session ID in the header: `X-Session-Id: your-session-id`

### Connection Management
- `POST /api/connect` - Connect with connection string → Returns session ID
- `POST /api/connect/local` - Quick connect to localhost:27017 → Returns session ID
- `POST /api/disconnect` - Close session
- `GET /api/sessions` - List active sessions
- `GET /api/check-local` - Check if local MongoDB is available

### Database Operations
- `GET /api/databases` - List all databases
- `GET /api/databases/:dbName` - Get database stats
- `POST /api/databases/:dbName` - Create a new database
- `DELETE /api/databases/:dbName` - Drop a database

### Collection Management
- `GET /api/databases/:dbName/collections` - List all collections
- `GET /api/databases/:dbName/collections/:collName` - Get collection stats
- `POST /api/databases/:dbName/collections` - Create collection
- `DELETE /api/databases/:dbName/collections/:collName` - Drop collection
- `PUT /api/databases/:dbName/collections/:collName/rename` - Rename collection

### Document Operations
- `POST /api/databases/:dbName/collections/:collName/documents/query` - Query documents with filters
- `GET /api/databases/:dbName/collections/:collName/documents/:id` - Get a specific document
- `POST /api/databases/:dbName/collections/:collName/documents` - Insert document(s)
- `PUT /api/databases/:dbName/collections/:collName/documents/:id` - Update document
- `DELETE /api/databases/:dbName/collections/:collName/documents/:id` - Delete document

### Schema Analysis
- `GET /api/databases/:dbName/collections/:collName/schema` - Analyze collection schema
- `GET /api/databases/:dbName/collections/:collName/stats` - Get collection statistics

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm, yarn, or pnpm
- MongoDB (optional, for local testing)

### Installation

1. Navigate to the backend directory
```bash
cd Back-end
```

2. Install dependencies
```bash
pnpm install
# or npm install
# or yarn install
```

3. Configure environment variables (`.env` file):
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

4. Start the server
```bash
# Development mode with auto-reload
pnpm dev

# Production mode
pnpm start
```

The server will be running at `http://localhost:4000`.

## 🧪 Testing

```bash
# Run API tests
node test-api.js

# Health check
curl http://localhost:4000/health
```

## 🔧 Troubleshooting

### MongoDB Atlas Connection Timeout

If you're experiencing `querySrv ETIMEOUT` errors when connecting to MongoDB Atlas:

1. **Check Network Access**: Ensure your IP address is whitelisted in MongoDB Atlas
   - Go to Network Access in Atlas dashboard
   - Add your current IP or use `0.0.0.0/0` for testing (not recommended for production)

2. **Verify Connection String**: Make sure your connection string is correct
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/`
   - Ensure password is URL-encoded if it contains special characters

3. **Firewall/VPN Issues**: Some corporate firewalls or VPNs block MongoDB Atlas connections
   - Try disabling VPN temporarily
   - Check if port 27017 is open

4. **DNS Resolution**: The `querySrv` error indicates DNS lookup issues
   - Try using a direct connection string instead of SRV format
   - Format: `mongodb://host1:27017,host2:27017/`

5. **Increased Timeouts**: The backend now uses 30-second timeouts for Atlas connections
   - If issues persist, check your internet connection stability

## 🔒 Security Features

- **Session-Based Auth**: Connection strings stored server-side only
- **Rate Limiting**: Protection against DDoS and brute force attacks
- **Input Validation**: Comprehensive Joi validation on all inputs
- **NoSQL Injection Prevention**: Query sanitization and dangerous operator blocking
- **Automatic Cleanup**: Expired sessions and idle connections removed automatically
- **Secure Logging**: No sensitive data in logs
- **System Protection**: Cannot drop admin/config/local databases

## 📚 Documentation

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Migration Guide](MIGRATION_GUIDE.md)** - Migrate from old API to new session-based API
- **[Quick Reference](QUICK_REFERENCE.md)** - Quick reference card for developers
- **[Improvements Summary](IMPROVEMENTS_SUMMARY.md)** - Detailed list of all improvements
- **[Phase 1 Complete](PHASE1_COMPLETE.md)** - Phase 1 completion summary

## 🚀 Quick Example

```javascript
// 1. Connect to MongoDB
const response = await fetch('http://localhost:4000/api/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    connStr: 'mongodb+srv://user:pass@cluster.mongodb.net/'
  })
});

const { sessionId } = (await response.json()).data;

// 2. Store session ID
localStorage.setItem('mongoSessionId', sessionId);

// 3. Use session for all requests
const databases = await fetch('http://localhost:4000/api/databases', {
  headers: { 'X-Session-Id': sessionId }
});

// 4. Disconnect when done
await fetch('http://localhost:4000/api/disconnect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId })
});
```

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⚡ What's New

### Phase 2 (Latest)
- ✅ Advanced schema analysis with field statistics
- ✅ Full aggregation pipeline support with validation
- ✅ Export/Import (JSON & CSV)
- ✅ Enhanced index management
- ✅ Professional Winston logging system
- ✅ Pipeline execution plans and suggestions
- ✅ Bulk operations and upsert support

### Phase 1
- ✅ Session-based authentication (no more repeated connection strings)
- ✅ Comprehensive request validation with Joi
- ✅ Three-tier rate limiting
- ✅ Connection lifecycle management with auto-cleanup
- ✅ Local MongoDB support and auto-detection
- ✅ NoSQL injection prevention
- ✅ RESTful API design with proper HTTP methods
- ✅ Performance optimizations (connection pooling, lazy loading)
- ✅ Production-ready error handling
- ✅ Complete documentation