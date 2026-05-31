#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('public/data/residency.json');
let data;
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (err) {
  console.error(`Failed to read or parse ${file}: ${err.message}`);
  process.exit(1);
}

const errors = [];
const seen = new Set();
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_COUNTRY = /^[A-Z]{2}$/;

if (!Array.isArray(data)) {
  console.error('Top-level value must be an array');
  process.exit(1);
}

data.forEach((rec, i) => {
  if (typeof rec !== 'object' || rec === null) {
    errors.push(`#${i}: not an object`);
    return;
  }
  if (typeof rec.date !== 'string' || !ISO_DATE.test(rec.date)) {
    errors.push(`#${i}: bad date "${rec.date}" (expected YYYY-MM-DD)`);
  } else {
    const d = new Date(rec.date + 'T00:00:00Z');
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== rec.date) {
      errors.push(`#${i}: invalid calendar date "${rec.date}"`);
    }
  }
  if (typeof rec.country !== 'string' || !ISO_COUNTRY.test(rec.country)) {
    errors.push(`#${i}: bad country "${rec.country}" (expected ISO 3166-1 alpha-2 like US, CA)`);
  }
  if (rec.note !== undefined && typeof rec.note !== 'string') {
    errors.push(`#${i}: note must be a string`);
  }
  const allowedKeys = new Set(['date', 'country', 'note']);
  for (const k of Object.keys(rec)) {
    if (!allowedKeys.has(k)) errors.push(`#${i}: unknown key "${k}"`);
  }
  const key = `${rec.date}|${rec.country}`;
  if (seen.has(key)) errors.push(`#${i}: duplicate (date, country) = (${rec.date}, ${rec.country})`);
  seen.add(key);
});

if (errors.length) {
  console.error(`Found ${errors.length} validation error(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log(`OK: ${data.length} records validated`);
