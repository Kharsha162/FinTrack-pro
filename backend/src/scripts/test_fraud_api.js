import axios from 'axios';

const API_URL = 'http://localhost:4000/api';
let token = '';

async function login() {
  try {
    // Try logging in with the demo admin account
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'AdminPass123'
    });
    token = res.data.accessToken;
    console.log('✅ Login successful');
  } catch (err) {
    console.error('❌ Login failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

async function createTransaction(amount, category, description) {
  try {
    const res = await axios.post(
      `${API_URL}/transactions`,
      {
        type: 'expense',
        amount,
        category,
        description,
        isRecurring: false,
        date: new Date().toISOString()
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`✅ Transaction created: ₹${amount} (${category}) - ID: ${res.data.id}`);
    return res.data.id;
  } catch (err) {
    console.error('❌ Transaction creation failed:', err.response?.data || err.message);
  }
}

async function checkInsights() {
  try {
    const res = await axios.get(`${API_URL}/analytics/insights`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const anomalies = res.data.anomalies || [];
    console.log('\n🔍 Checking Fraud Alerts in Analytics...');
    if (anomalies.length > 0) {
      console.log(`✅ Found ${anomalies.length} anomalies/alerts:`);
      anomalies.forEach(a => {
        console.log(`   - [${a.category}] ${a.reason} (Date: ${a.date})`);
      });
    } else {
      console.log('⚠️ No anomalies found yet in Analytics.');
    }

    // Also check Dashboard Alerts
    const dashRes = await axios.get(`${API_URL}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dashAlerts = dashRes.data.alerts || [];
    console.log('\n🔍 Checking Dashboard Alerts...');
    if (dashAlerts.length > 0) {
      console.log(`✅ Found ${dashAlerts.length} dashboard alerts:`);
      dashAlerts.forEach(a => {
        console.log(`   - [${a.priority}] ${a.message}`);
      });
    } else {
      console.log('⚠️ No dashboard alerts found.');
    }
  } catch (err) {
    console.error('❌ Failed to fetch insights:', err.response?.data || err.message);
  }
}

async function runTest() {
  console.log('🚀 Starting Fraud Detection API Test...\n');
  
  await login();

  // Test 1: Large Transaction (> 50k)
  console.log('\n👉 Test 1: Creating High Value Transaction (> 50k)');
  await createTransaction(60000, 'Electronics', 'Test High Value');

  // Test 2: High Velocity (5 tx in short time)
  console.log('\n👉 Test 2: Creating Rapid Transactions (Velocity Check)');
  for (let i = 0; i < 6; i++) {
    await createTransaction(100 + i, 'Food', `Rapid Tx ${i+1}`);
  }

  // Wait a moment for async processing (though currently it's just a promise in the route)
  console.log('\n⏳ Waiting for fraud checks to process...');
  await new Promise(r => setTimeout(r, 2000));

  await checkInsights();
}

runTest();
