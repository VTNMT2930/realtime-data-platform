#!/usr/bin/env node

/**
 * Demo Script để test Consumer Search & Pagination
 * Tạo nhiều consumer instances để test tính năng search và phân trang
 */

const axios = require('axios');

const CONSUMER_API_URL = 'http://localhost:3001/api';
const ADMIN_API_URL = 'http://localhost:3000/api';

// Danh sách consumer test data
const testConsumers = [
  { consumerId: 'consumer-test-1', groupId: 'test-group-1' },
  { consumerId: 'consumer-test-2', groupId: 'test-group-1' },
  { consumerId: 'consumer-prod-1', groupId: 'production-group' },
  { consumerId: 'consumer-prod-2', groupId: 'production-group' },
  { consumerId: 'consumer-dev-1', groupId: 'development-group' },
  { consumerId: 'consumer-dev-2', groupId: 'development-group' },
  { consumerId: 'consumer-stage-1', groupId: 'staging-group' },
  { consumerId: 'consumer-stage-2', groupId: 'staging-group' },
  { consumerId: 'consumer-analytics-1', groupId: 'analytics-group' },
  { consumerId: 'consumer-analytics-2', groupId: 'analytics-group' },
  { consumerId: 'consumer-monitoring', groupId: 'monitoring-group' },
  { consumerId: 'consumer-logging', groupId: 'logging-group' },
  { consumerId: 'consumer-backup', groupId: 'backup-group' },
  { consumerId: 'consumer-notification', groupId: 'notification-group' },
  { consumerId: 'consumer-webhook', groupId: 'webhook-group' },
];

// Helper functions
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createConsumer(consumerId, groupId) {
  try {
    const response = await axios.post(`${ADMIN_API_URL}/admin/consumers`, {
      consumerId,
      groupId
    });
    console.log(`✅ Created consumer: ${consumerId}`);
    return response.data;
  } catch (error) {
    console.log(`❌ Failed to create consumer ${consumerId}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function getConsumerStats() {
  try {
    const response = await axios.get(`${CONSUMER_API_URL}/consumers/stats`);
    return response.data;
  } catch (error) {
    console.log(`❌ Failed to get consumer stats:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function stopConsumer(consumerId) {
  try {
    const response = await axios.put(`${CONSUMER_API_URL}/consumers/instances/${consumerId}/stop`);
    console.log(`⏸️ Stopped consumer: ${consumerId}`);
    return response.data;
  } catch (error) {
    console.log(`❌ Failed to stop consumer ${consumerId}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Demo scenarios
async function demoCreateConsumers() {
  console.log('\n🚀 Demo: Creating Test Consumers...\n');

  for (const consumer of testConsumers) {
    await createConsumer(consumer.consumerId, consumer.groupId);
    await delay(500); // Delay để tránh overload
  }

  console.log('\n✅ Finished creating test consumers');

  // Wait a bit for consumers to register
  console.log('\n⏳ Waiting for consumers to register...');
  await delay(3000);

  const stats = await getConsumerStats();
  if (stats) {
    console.log(`\n📊 Consumer Stats:`);
    console.log(`   Total: ${stats.totalConsumers}`);
    console.log(`   Active: ${stats.activeConsumers}`);
    console.log(`   Instances: ${stats.instances?.length || 0}`);
  }
}

async function demoMixedStatus() {
  console.log('\n🎭 Demo: Creating Mixed Status (Active/Inactive)...\n');

  const stats = await getConsumerStats();
  if (!stats || !stats.instances?.length) {
    console.log('❌ No consumers found. Please create consumers first.');
    return;
  }

  // Stop half of the consumers to create mixed status
  const consumersToStop = stats.instances.slice(0, Math.floor(stats.instances.length / 2));

  console.log(`⏸️ Stopping ${consumersToStop.length} consumers for demo...`);

  for (const consumer of consumersToStop) {
    await stopConsumer(consumer.id);
    await delay(1000);
  }

  console.log('\n✅ Created mixed status consumers');

  // Show final stats
  await delay(2000);
  const finalStats = await getConsumerStats();
  if (finalStats) {
    console.log(`\n📊 Final Stats:`);
    console.log(`   Total: ${finalStats.totalConsumers}`);
    console.log(`   Active: ${finalStats.activeConsumers}`);
    console.log(`   Inactive: ${finalStats.totalConsumers - finalStats.activeConsumers}`);
  }
}

async function demoSearchScenarios() {
  console.log('\n🔍 Demo: Search Test Scenarios\n');

  console.log('📝 Test these search queries in the UI:');
  console.log('   1. "test" - Should find consumer-test-1, consumer-test-2');
  console.log('   2. "prod" - Should find consumer-prod-1, consumer-prod-2');
  console.log('   3. "analytics" - Should find consumer-analytics-1, consumer-analytics-2');
  console.log('   4. "monitoring" - Should find consumer-monitoring');
  console.log('   5. "stage" - Should find consumer-stage-1, consumer-stage-2');
  console.log('   6. "xyz" - Should find no results');

  console.log('\n📝 Test these status filters:');
  console.log('   1. "Active Only" - Shows only running consumers');
  console.log('   2. "Inactive Only" - Shows only stopped consumers');
  console.log('   3. "All Status" - Shows all consumers');

  console.log('\n📝 Test pagination:');
  console.log('   1. Set "6 per page" - Should see pagination if >6 consumers');
  console.log('   2. Navigate between pages');
  console.log('   3. Try different page sizes (12, 24, 50)');
}

// Main demo function
async function runDemo() {
  console.log('🎯 Consumer Search & Pagination Demo');
  console.log('=====================================');

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
      await demoCreateConsumers();
      break;

    case 'mixed':
      await demoMixedStatus();
      break;

    case 'scenarios':
      await demoSearchScenarios();
      break;

    case 'all':
      await demoCreateConsumers();
      await delay(2000);
      await demoMixedStatus();
      await delay(1000);
      await demoSearchScenarios();
      break;

    default:
      console.log('\nUsage: node demo-consumer-search.js <command>');
      console.log('\nCommands:');
      console.log('  create     - Create test consumers');
      console.log('  mixed      - Create mixed status (active/inactive)');
      console.log('  scenarios  - Show search test scenarios');
      console.log('  all        - Run all demos');
      console.log('\nExample: node demo-consumer-search.js create');
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error.message);
  process.exit(1);
});

// Run the demo
runDemo().catch(error => {
  console.error('❌ Demo failed:', error.message);
  process.exit(1);
});