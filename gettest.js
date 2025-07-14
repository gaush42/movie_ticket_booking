const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseURL: 'http://localhost:3000/api/manager', // Change to your API base URL
  outputFile: 'api_test_results.json',
  timeout: 10000
};

// You'll need to replace these with actual credentials
const AUTH_CONFIG = {
  loginEndpoint: 'http://localhost:3000/api/auth/login', // Change to your login endpoint
  credentials: {
    email: 'manager1@m.com', // Replace with actual manager email
    password: '123'       // Replace with actual password
  }
};

class ManagerAPITester {
  constructor() {
    this.token = null;
    this.results = {};
    this.axios = axios.create({
      timeout: CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Login and get JWT token
  async authenticate() {
    try {
      console.log('🔐 Authenticating...');
      const response = await this.axios.post(AUTH_CONFIG.loginEndpoint, AUTH_CONFIG.credentials);
      
      this.token = response.data.token || response.data.accessToken;
      if (!this.token) {
        throw new Error('No token received from login response');
      }
      
      // Set authorization header for all future requests
      this.axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      console.log('✅ Authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      return false;
    }
  }

  // Generic method to test a GET endpoint
  async testEndpoint(name, endpoint, description) {
    try {
      console.log(`\n🔍 Testing ${name}: ${endpoint}`);
      console.log(`📝 Description: ${description}`);
      
      const startTime = Date.now();
      const response = await this.axios.get(`${CONFIG.baseURL}${endpoint}`);
      const endTime = Date.now();
      
      const result = {
        name,
        endpoint,
        description,
        status: response.status,
        responseTime: `${endTime - startTime}ms`,
        headers: response.headers,
        data: response.data,
        dataSize: JSON.stringify(response.data).length,
        timestamp: new Date().toISOString()
      };

      this.results[name] = result;
      
      console.log(`✅ ${name} - Status: ${response.status}, Time: ${result.responseTime}`);
      console.log(`📊 Data preview:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
      
      return result;
    } catch (error) {
      const errorResult = {
        name,
        endpoint,
        description,
        status: error.response?.status || 'ERROR',
        error: error.message,
        responseData: error.response?.data,
        timestamp: new Date().toISOString()
      };

      this.results[name] = errorResult;
      console.error(`❌ ${name} failed:`, error.message);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Response:`, error.response.data);
      }
      
      return errorResult;
    }
  }

  // Test all GET endpoints
  async runAllTests() {
    console.log('🚀 Starting Manager API Tests...\n');
    
    // Authentication first
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }

    // Define all GET endpoints to test
    const endpoints = [
      {
        name: 'Theater Details',
        endpoint: '/theater',
        description: 'Get theater details for the authenticated manager'
      },
      {
        name: 'Screens List',
        endpoint: '/screens',
        description: 'Get all screens in the theater'
      },
      {
        name: 'Showtimes Grouped',
        endpoint: '/showtimes',
        description: 'Get all showtimes grouped by screen'
      },
      {
        name: 'Showtimes List',
        endpoint: '/showtimes/list',
        description: 'Get all showtimes as a flat list'
      },
      {
        name: 'Theater Bookings',
        endpoint: '/bookings',
        description: 'Get all bookings for the theater'
      },
      {
        name: 'Manager Stats',
        endpoint: '/stats',
        description: 'Get manager statistics and analytics'
      }
    ];

    // Test each endpoint
    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint.name, endpoint.endpoint, endpoint.description);
      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📋 Test Summary:');
    console.log('================');
    
    let successCount = 0;
    let errorCount = 0;
    
    Object.values(this.results).forEach(result => {
      if (result.status === 200) {
        successCount++;
        console.log(`✅ ${result.name}: ${result.status} (${result.responseTime || 'N/A'})`);
      } else {
        errorCount++;
        console.log(`❌ ${result.name}: ${result.status} - ${result.error || 'Unknown error'}`);
      }
    });

    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} failed`);
    
    // Save results to file
    await this.saveResults();
    
    return this.results;
  }

  // Save results to JSON file
  async saveResults() {
    try {
      const outputPath = path.join(__dirname, CONFIG.outputFile);
      const formattedResults = {
        testRun: {
          timestamp: new Date().toISOString(),
          baseURL: CONFIG.baseURL,
          totalEndpoints: Object.keys(this.results).length
        },
        results: this.results
      };

      fs.writeFileSync(outputPath, JSON.stringify(formattedResults, null, 2));
      console.log(`\n💾 Results saved to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }

  // Pretty print specific endpoint data
  printEndpointData(endpointName) {
    const result = this.results[endpointName];
    if (!result) {
      console.log(`❌ No data found for endpoint: ${endpointName}`);
      return;
    }

    console.log(`\n📋 ${endpointName} - Detailed Data:`);
    console.log('='.repeat(50));
    console.log(`Status: ${result.status}`);
    console.log(`Response Time: ${result.responseTime || 'N/A'}`);
    console.log(`Data Size: ${result.dataSize || 'N/A'} characters`);
    console.log('\nResponse Data:');
    console.log(JSON.stringify(result.data, null, 2));
  }

  // Generate a summary report
  generateSummaryReport() {
    console.log('\n📊 DETAILED SUMMARY REPORT');
    console.log('='.repeat(60));
    
    Object.values(this.results).forEach(result => {
      console.log(`\n🔍 ${result.name}`);
      console.log(`   Endpoint: ${result.endpoint}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Description: ${result.description}`);
      
      if (result.data) {
        console.log(`   Data Type: ${Array.isArray(result.data) ? 'Array' : typeof result.data}`);
        if (Array.isArray(result.data)) {
          console.log(`   Array Length: ${result.data.length}`);
          if (result.data.length > 0) {
            console.log(`   Sample Item Keys: ${Object.keys(result.data[0]).join(', ')}`);
          }
        } else if (typeof result.data === 'object') {
          console.log(`   Object Keys: ${Object.keys(result.data).join(', ')}`);
        }
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
  }
}

// Usage example
async function main() {
  const tester = new ManagerAPITester();
  
  // Run all tests
  await tester.runAllTests();
  
  // Generate detailed report
  tester.generateSummaryReport();
  
  // Example: Print specific endpoint data
  // tester.printEndpointData('Theater Details');
  // tester.printEndpointData('Screens List');
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ManagerAPITester };

// Additional utility function to test with different parameters
async function testWithSampleData() {
  console.log('\n🔧 Testing with sample data variations...');
  
  const tester = new ManagerAPITester();
  await tester.authenticate();
  
  // You can add more specific tests here
  // For example, if you want to test with query parameters:
  
  // await tester.testEndpoint(
  //   'Showtimes with Date Filter',
  //   '/showtimes?date=2024-01-01',
  //   'Get showtimes for specific date'
  // );
  
  // await tester.testEndpoint(
  //   'Bookings with Status Filter',
  //   '/bookings?status=confirmed',
  //   'Get only confirmed bookings'
  // );
}

// Uncomment to run sample data tests
// testWithSampleData();