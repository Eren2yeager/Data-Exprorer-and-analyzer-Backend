# MongoDB Data Explorer and Analyzer - Backend

A powerful Express.js backend for MongoDB data exploration and analysis, providing a comprehensive API to interact with MongoDB databases, collections, and documents.

## 🚀 Features

- **Connection Management**: Connect to any MongoDB instance with connection string
- **Database Operations**: List, create, and manage MongoDB databases
- **Collection Management**: Create, rename, drop, and analyze collections
- **Document Operations**: CRUD operations with advanced querying capabilities
- **Schema Analysis**: Analyze collection schemas and statistics
- **Index Management**: Create and manage indexes for optimized queries

## 📋 Tech Stack

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB Native Driver**: Direct MongoDB interaction
- **Joi**: Request validation
- **HTTP Status Codes**: Standardized response codes
- **CORS**: Cross-Origin Resource Sharing support
- **dotenv**: Environment variable management

## 🛠️ Project Structure

```
Back-end/
├── config/             # Configuration files
│   └── db.js           # MongoDB connection management
├── controllers/        # API controllers
│   ├── connectionController.js
│   ├── databaseController.js
│   ├── collectionController.js
│   ├── documentController.js
│   └── schemaController.js
├── middleware/         # Express middleware
│   └── responseHandler.js
├── routes/             # API routes
│   ├── connectionRoutes.js
│   ├── databaseRoutes.js
│   ├── collectionRoutes.js
│   ├── documentRoutes.js
│   └── schemaRoutes.js
└── src/
    └── index.js        # Application entry point
```

## 🔌 API Endpoints

### Connection Management
- `POST /api/connect` - Test and establish MongoDB connection
- `POST /api/disconnect` - Close a specific connection
- `GET /api/connections` - List active connections

### Database Operations
- `GET /api/databases` - List all databases
- `GET /api/databases/:dbName` - Get database stats and info
- `POST /api/databases/:dbName` - Create a new database
- `DELETE /api/databases/:dbName` - Drop a database

### Collection Management
- `GET /api/databases/:dbName/collections` - List all collections
- `GET /api/databases/:dbName/collections/:collName` - Get collection stats
- `POST /api/databases/:dbName/collections` - Create collection
- `DELETE /api/databases/:dbName/collections/:collName` - Drop collection
- `PUT /api/databases/:dbName/collections/:collName/rename` - Rename collection

### Document Operations
- `GET /api/databases/:dbName/collections/:collName/documents` - Query documents with pagination, sorting, filtering
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
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/mongodb-data-explorer.git
cd mongodb-data-explorer/Back-end
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=4000
DOMAIN=localhost
```

4. Start the development server
```bash
npm run dev
```

The server will be running at `http://localhost:4000`.

## 🧪 Testing

```bash
npm test
```

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!