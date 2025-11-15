/**
 * Simple API Test Script
 * Tests the new session-based API endpoints
 */

const BASE_URL = 'http://localhost:4000';

async function testAPI() {
  console.log('🧪 Testing MongoDB Data Explorer API\n');
  
  // Test 1: Health Check
  console.log('1️⃣  Testing health endpoint...');
  try {
    const health = await fetch(`${BASE_URL}/health`);
    const healthData = await health.json();
    console.log('✅ Health check:', healthData.data.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test 2: Check Local MongoDB
  console.log('\n2️⃣  Checking local MongoDB availability...');
  try {
    const checkLocal = await fetch(`${BASE_URL}/api/check-local`);
    const localData = await checkLocal.json();
    console.log(localData.success ? '✅' : '❌', localData.message);
    console.log('   Available:', localData.data?.available);
  } catch (error) {
    console.log('❌ Check local failed:', error.message);
  }
  
  // Test 3: Connect to Local MongoDB (if available)
  console.log('\n3️⃣  Attempting to connect to local MongoDB...');
  let sessionId = null;
  try {
    const connect = await fetch(`${BASE_URL}/api/connect/local`, {
      method: 'POST'
    });
    const connectData = await connect.json();
    
    if (connectData.success) {
      sessionId = connectData.data.sessionId;
      console.log('✅ Connected successfully!');
      console.log('   Session ID:', sessionId.substring(0, 20) + '...');
      console.log('   MongoDB Version:', connectData.data.serverInfo.version);
    } else {
      console.log('❌ Connection failed:', connectData.message);
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
  
  // Test 4: List Databases (if connected)
  if (sessionId) {
    console.log('\n4️⃣  Listing databases...');
    try {
      const databases = await fetch(`${BASE_URL}/api/databases`, {
        headers: { 'X-Session-Id': sessionId }
      });
      const dbData = await databases.json();
      
      if (dbData.success) {
        console.log('✅ Found', dbData.data.length, 'databases');
        dbData.data.slice(0, 3).forEach(db => {
          console.log(`   - ${db.name} (${db.collectionCount} collections)`);
        });
      } else {
        console.log('❌ List databases failed:', dbData.message);
      }
    } catch (error) {
      console.log('❌ List databases failed:', error.message);
    }
    
    // Test 5: Get Active Sessions
    console.log('\n5️⃣  Getting active sessions...');
    try {
      const sessions = await fetch(`${BASE_URL}/api/sessions`);
      const sessionData = await sessions.json();
      
      if (sessionData.success) {
        console.log('✅ Active sessions:', sessionData.data.totalSessions);
        console.log('   Active connections:', sessionData.data.totalConnections);
      } else {
        console.log('❌ Get sessions failed:', sessionData.message);
      }
    } catch (error) {
      console.log('❌ Get sessions failed:', error.message);
    }
    
    // Test 6: Disconnect
    console.log('\n6️⃣  Disconnecting...');
    try {
      const disconnect = await fetch(`${BASE_URL}/api/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const disconnectData = await disconnect.json();
      console.log(disconnectData.success ? '✅' : '❌', disconnectData.message);
    } catch (error) {
      console.log('❌ Disconnect failed:', error.message);
    }
  }
  
  // Test 7: Test Rate Limiting
  console.log('\n7️⃣  Testing rate limiting (making 5 rapid requests)...');
  try {
    const promises = Array(5).fill().map(() => 
      fetch(`${BASE_URL}/health`)
    );
    const results = await Promise.all(promises);
    const statuses = results.map(r => r.status);
    console.log('✅ Status codes:', statuses.join(', '));
    console.log('   (All should be 200, rate limit is 100/15min)');
  } catch (error) {
    console.log('❌ Rate limit test failed:', error.message);
  }
  
  console.log('\n✨ API tests complete!\n');
}

// Run tests
testAPI().catch(console.error);
