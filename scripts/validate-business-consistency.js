// scripts/validate-business-consistency.js
/**
 * Automated Forensic Business Consistency & SSOT Integrity Validator
 * Asserts that zero dummy placeholder data, conflicting sizing strings,
 * or uncontrolled staging URLs exist in the codebase.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

let failures = [];
let passes = [];

function assert(condition, message) {
  if (condition) {
    passes.push(message);
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failures.push(message);
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// ─── 1. Scan src/ for forbidden placeholder numbers ───────────────────────────
console.log('\n🔍 [1/5] Checking for forbidden dummy/placeholder numbers in src/ ...');

function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        scanDir(filePath, fileList);
      }
    } else if (/\.(tsx|ts|jsx|js|json)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allSrcFiles = scanDir(SRC_DIR);
const dummyPhonePattern = /2348000000000/g;
let foundDummyPhone = false;

for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (dummyPhonePattern.test(content)) {
    foundDummyPhone = true;
    failures.push(`Found forbidden dummy number 2348000000000 in ${path.relative(ROOT_DIR, file)}`);
  }
}
assert(!foundDummyPhone, 'Zero instances of dummy placeholder phone 2348000000000 across entire src/');

// ─── 2. Scan client components for hardcoded staging URLs ─────────────────────
console.log('\n🔍 [2/5] Checking for hardcoded staging URL leaks in UI components ...');

const uiComponentFiles = scanDir(path.join(SRC_DIR, 'components'));
const rawStagingUrlPattern = /['"`]https:\/\/optisource-two\.vercel\.app\/?['"`]/g;
let foundRawStagingUrl = false;

for (const file of uiComponentFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (rawStagingUrlPattern.test(content)) {
    foundRawStagingUrl = true;
    failures.push(`Found hardcoded staging URL in UI component ${path.relative(ROOT_DIR, file)}`);
  }
}
assert(!foundRawStagingUrl, 'Zero hardcoded raw staging URLs in UI components (must consume canonical config)');

// ─── 3. Verify SSOT Business Configuration ────────────────────────────────────
console.log('\n🔍 [3/5] Validating SSOT business configuration completeness ...');

const businessConfigFile = path.join(SRC_DIR, 'config', 'business.ts');
assert(fs.existsSync(businessConfigFile), 'Canonical business.ts config file exists');

const businessContent = fs.readFileSync(businessConfigFile, 'utf8');
assert(businessContent.includes('2348152346649'), 'Canonical WhatsApp/Phone number is 2348152346649');
assert(businessContent.includes('4, Nnamdi Azikiwe Street'), 'Canonical address is 4, Nnamdi Azikiwe Street');
assert(businessContent.includes('Monday – Friday, 9:00 AM – 5:00 PM'), 'Canonical operating hours structured');
assert(businessContent.includes('mcdavesopticals@gmail.com'), 'Canonical email is mcdavesopticals@gmail.com');

// ─── 4. Verify Services & Delivery Configuration ──────────────────────────────
console.log('\n🔍 [4/5] Validating Services & Delivery Configuration ...');

const servicesConfigFile = path.join(SRC_DIR, 'config', 'services.ts');
assert(fs.existsSync(servicesConfigFile), 'Canonical services.ts config file exists');

const servicesContent = fs.readFileSync(servicesConfigFile, 'utf8');
assert(servicesContent.includes('standardFee: 2500'), 'Standard delivery fee is ₦2,500');
assert(servicesContent.includes('freeThreshold: 50000'), 'Free delivery threshold is ₦50,000');
assert(servicesContent.includes('2–5 business days'), 'Standard delivery timeline is 2–5 business days');

// ─── 5. Verify Product Catalog Dimensions ─────────────────────────────────────
console.log('\n🔍 [5/5] Validating Product Sizing Specification Formats ...');

const productsConfigFile = path.join(SRC_DIR, 'data', 'products.ts');
assert(fs.existsSync(productsConfigFile), 'Product catalog file exists');

const productsContent = fs.readFileSync(productsConfigFile, 'utf8');
const sizePattern = /\d{2}□\d{2}-\d{3}/g;
const matches = productsContent.match(sizePattern);
assert(matches && matches.length >= 3, `Found ${matches ? matches.length : 0} valid optical dimension specifications`);

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────────────────────');
console.log(`Audit Summary: ${passes.length} assertions passed, ${failures.length} failed.\n`);

if (failures.length > 0) {
  console.error('❌ CONSISTENCY VALIDATION FAILED!');
  process.exit(1);
} else {
  console.log('✅ ALL FORENSIC CONSISTENCY CHECKS PASSED PERFECTLY!');
  process.exit(0);
}
