#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

// Change to the project directory
process.chdir('E:\\GYMJAM\\GYM-TrainerApp');

// Run eslint
const result = spawnSync('npx', ['eslint', 'src/**/*.{ts,tsx,js,jsx}', '--format=stylish'], {
    encoding: 'utf8',
    shell: true,
    stdio: 'pipe'
});

console.log(result.stdout);
console.error(result.stderr);
process.exit(result.status || 0);
