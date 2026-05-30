const { spawn } = require('child_process');

async function start() {
  console.log('\n========================================================');
  console.log('🚀 STARTING SECURE NGROK TUNNEL (Bypasses all firewalls)');
  console.log('This will fix the java.io.IOException fatal error caused by localtunnel.');
  console.log('========================================================\n');
  
  // Use the native Expo ngrok tunnel which doesn't have the bypass screen issue
  // Set CI=1 to prevent interactive prompts that hang the background process
  const expo = spawn('npx', ['expo', 'start', '--tunnel', '--clear'], { 
    stdio: 'inherit', 
    shell: true,
    env: { ...process.env, CI: '1' }
  });

  expo.on('close', (code) => {
    console.log(`Expo process exited with code ${code}`);
  });
}

start().catch(console.error);
