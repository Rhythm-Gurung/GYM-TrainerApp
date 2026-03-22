cd E:\GYMJAM\GYM-TrainerApp
node -e "const { execSync } = require('child_process'); try { const output = execSync('npx eslint src/**/*.{ts,tsx,js,jsx} --format=stylish', {encoding: 'utf8'}); console.log(output); } catch(e) { console.log(e.stdout); console.error(e.stderr); }"
