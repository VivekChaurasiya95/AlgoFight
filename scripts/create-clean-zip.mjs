import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver'; // check if exists or use child_process/zip

const rootDir = path.resolve('d:/AlgoFight-backend-new');
const outZip = path.resolve('d:/AlgoFight-backend-new/AlgoFight-clean-project.zip');

console.log('Root dir:', rootDir);
