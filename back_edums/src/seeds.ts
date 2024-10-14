import * as path from 'path';
import * as fs from 'fs';
import argv from 'minimist';

const params = argv(process.argv.slice(2));

const options = {
  years: +params.years || 0,
  drop: params.drop ? params.drop.split(',') : [],
};

function recFindByExt(base, ext, files?, result?) {
  files = files || fs.readdirSync(base);
  result = result || [];

  files.forEach(file => {
    const newBase = path.join(base, file);

    if (fs.statSync(newBase).isDirectory())
      result = recFindByExt(newBase, ext, fs.readdirSync(newBase), result);

    if (file.includes(`.${ext}.ts`))
      result.push(newBase);
  });

  return result;
}

const seedersFolders = recFindByExt('./src/', 'seeder');
const seedersStack = [];

seedersFolders.forEach(f => seedersStack.push(require(f)(options)));
seedersStack.sort((prev, next) => prev.priority - next.priority);

(async function run() {
  if (seedersStack.length !== 0) {
    const first = seedersStack.pop();
    await first.call();
    await run();
  }
})();
