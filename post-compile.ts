import { copyFileSync } from 'fs';
import { join } from 'path';

copyFileSync(join(__dirname, './package.json'), join(__dirname, '/dist/package.json'));
copyFileSync(join(__dirname, './README.md'), join(__dirname, '/dist/README.md'));