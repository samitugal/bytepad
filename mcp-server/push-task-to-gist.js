// Create task and push to Gist
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load .env
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = spawn('node', [join(__dirname, 'dist', 'index.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GIST_ID: process.env.GIST_ID
  }
});

let responseBuffer = '';

function parseResponse(line) {
  try {
    const response = JSON.parse(line);
    if (response.result?.content?.[0]?.text) {
      const data = JSON.parse(response.result.content[0].text);
      console.log('\n' + (data.success ? '✅' : '❌'), data.message);
      if (data.data) {
        console.log('   Data:', JSON.stringify(data.data, null, 2).split('\n').join('\n   '));
      }
    } else if (response.result?.serverInfo) {
      console.log('✅ Server ready:', response.result.serverInfo.name, response.result.serverInfo.version);
    }
  } catch (e) {
    // Not JSON
  }
}

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  const lines = responseBuffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    parseResponse(lines[i]);
  }
  responseBuffer = lines[lines.length - 1];
});

server.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg.includes('INFO')) {
    console.log('📋', msg.split('] ')[1] || msg);
  }
});

function sendRequest(request) {
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Step 1: Initialize
setTimeout(() => {
  console.log('\n🚀 Initializing MCP server...');
  sendRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'gist-push-client', version: '1.0.0' }
    }
  });
}, 500);

// Step 2: Initialized notification
setTimeout(() => {
  sendRequest({ jsonrpc: '2.0', method: 'notifications/initialized' });
}, 1000);

// Step 3: Configure Gist
setTimeout(() => {
  console.log('\n⚙️  Configuring Gist sync...');
  sendRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'gist_configure',
      arguments: {
        token: process.env.GITHUB_TOKEN,
        gistId: process.env.GIST_ID
      }
    }
  });
}, 1500);

// Step 4: Create task
setTimeout(() => {
  console.log('\n📝 Creating task...');
  sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'create_task',
      arguments: {
        title: 'MCP Server Integration Test',
        description: 'This task was created via MCP server and pushed to Gist',
        priority: 'P1',
        tags: ['mcp', 'gist', 'integration']
      }
    }
  });
}, 2500);

// Step 5: Push to Gist
setTimeout(() => {
  console.log('\n☁️  Pushing to Gist...');
  sendRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'gist_push',
      arguments: {
        force: true
      }
    }
  });
}, 3500);

// Step 6: Verify
setTimeout(() => {
  console.log('\n🔍 Verifying Gist status...');
  sendRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'gist_status',
      arguments: {}
    }
  });
}, 5000);

// Exit
setTimeout(() => {
  console.log('\n\n✅ Done! Now sync in your Electron app to see the task.');
  server.kill('SIGTERM');
  process.exit(0);
}, 6500);

server.on('error', (err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
