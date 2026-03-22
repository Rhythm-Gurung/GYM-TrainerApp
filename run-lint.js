const { exec } = require('child_process');

// Run eslint and capture output
exec('npx eslint src/**/*.{ts,tsx,js,jsx} --format=stylish', (error, stdout, stderr) => {
    console.log(stdout);
    if (stderr) console.error(stderr);
    if (error) {
        console.error(`Exit code: ${error.code}`);
    }
});
