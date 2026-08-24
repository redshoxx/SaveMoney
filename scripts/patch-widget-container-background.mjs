import fs from 'node:fs';
import path from 'node:path';

const iosRoot = path.resolve('ios');
const needle = 'WidgetsEntryView(entry: entry)';
const replacement = `${needle}\n        .containerBackground(\n          Color(red: 23.0 / 255.0, green: 62.0 / 255.0, blue: 43.0 / 255.0),\n          for: .widget\n        )`;

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.isFile() && entry.name.endsWith('.swift') ? [fullPath] : [];
  });
}

const swiftFiles = walk(iosRoot);
let patched = 0;

for (const filePath of swiftFiles) {
  const source = fs.readFileSync(filePath, 'utf8');
  if (!source.includes(needle)) continue;

  if (source.includes(`${needle}\n        .containerBackground(`)) {
    console.log(`Widget container background already patched: ${path.relative(process.cwd(), filePath)}`);
    patched += 1;
    continue;
  }

  const next = source.replaceAll(needle, replacement);
  fs.writeFileSync(filePath, next);
  patched += 1;
  console.log(`Patched WidgetKit root: ${path.relative(process.cwd(), filePath)}`);
}

if (patched === 0) {
  throw new Error('No generated WidgetsEntryView was found. expo-widgets output may have changed.');
}

console.log(`Native WidgetKit containerBackground patch applied to ${patched} file(s).`);
