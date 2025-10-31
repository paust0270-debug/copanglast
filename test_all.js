const { chromium } = require('playwright');

const pages = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
  '/customer',
  '/slot-add',
  '/slot-add-forms',
  '/slot-status',
  '/slot-management',
  '/coupangapp',
  '/coupangapp/add',
  '/coupangapp/copangrank',
  '/coupangapp/vip',
  '/coupang-app',
  '/coupangapp/naver',
  '/coupangapp/naverrank',
  '/coupangapp/place',
  '/coupangapp/placerank',
  '/coupangapp/todayhome',
  '/coupangapp/aliexpress',
  '/notices',
  '/notices/write',
  '/settlement-management',
  '/settlement',
  '/settlement/edit',
  '/settlement/request',
  '/settlement/status',
  '/settlement/history',
  '/settlement/unsettled',
  '/settlement-completed',
  '/settlement-pending',
  '/settlement-request',
  '/ranking-status',
  '/traffic-status',
  '/distributor-add',
  '/distributor-add/add',
  '/admin/slots',
];

const publicPages = ['/', '/login', '/signup'];

async function testPages(login = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${login ? 'WITH login' : 'WITHOUT login'}`);
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const results = [];

  if (login) {
    console.log('\n[1/2] Logging in...');
    try {
      await page.goto('http://localhost:3000/login', {
        waitUntil: 'networkidle',
        timeout: 10000,
      });
      await page.waitForTimeout(1000);

      const textInputs = await page.locator('input[type="text"]').all();
      if (textInputs.length > 0) await textInputs[0].fill('master');

      const passwordInputs = await page.locator('input[type="password"]').all();
      if (passwordInputs.length > 0) await passwordInputs[0].fill('123123');

      const checkboxes = await page.locator('input[type="checkbox"]').all();
      if (checkboxes.length > 0)
        await checkboxes[checkboxes.length - 1].check();

      const buttons = await page.locator('button').all();
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (
          text &&
          (text.includes('로그인') || text.toLowerCase().includes('login'))
        ) {
          await btn.click();
          break;
        }
      }

      await page.waitForURL(url => !url.pathname.includes('/login'), {
        timeout: 5000,
      });
      await page.waitForTimeout(2000);
      console.log('Login successful!\n');
    } catch (error) {
      console.log(`Login failed: ${error.message}`);
    }
  }

  console.log(`[${login ? '2' : '1'}/2] Testing ${pages.length} pages...\n`);

  for (let i = 0; i < pages.length; i++) {
    const path = pages[i];
    try {
      await page.goto(`http://localhost:3000${path}`, {
        waitUntil: 'networkidle',
        timeout: 10000,
      });
      await page.waitForTimeout(2000);
      const currentUrl = page.url();

      if (publicPages.includes(path)) {
        results.push({ page: path, status: 'public', ok: true });
        console.log(`[${i + 1}/${pages.length}] OK: ${path} - Public`);
      } else if (!login && currentUrl.includes('/login')) {
        results.push({ page: path, status: 'redirected', ok: true });
        console.log(`[${i + 1}/${pages.length}] OK: ${path} - Redirected`);
      } else if (login && !currentUrl.includes('/login')) {
        results.push({ page: path, status: 'accessed', ok: true });
        console.log(`[${i + 1}/${pages.length}] OK: ${path} - Accessed`);
      } else if (!login && !currentUrl.includes('/login')) {
        results.push({
          page: path,
          status: 'issue',
          ok: false,
          url: currentUrl,
        });
        console.log(
          `[${i + 1}/${pages.length}] ISSUE: ${path} - Not protected`
        );
      } else {
        results.push({
          page: path,
          status: 'other',
          ok: false,
          url: currentUrl,
        });
        console.log(`[${i + 1}/${pages.length}] OTHER: ${path}`);
      }
    } catch (error) {
      results.push({
        page: path,
        status: 'error',
        ok: false,
        error: error.message.substring(0, 50),
      });
      console.log(`[${i + 1}/${pages.length}] ERROR: ${path}`);
    }
    await page.waitForTimeout(300);
  }

  await browser.close();
  return results;
}

(async () => {
  console.log('\nStarting comprehensive page authentication tests\n');
  const withoutLogin = await testPages(false);
  console.log('\n\nWaiting 3 seconds...\n');
  await new Promise(r => setTimeout(r, 3000));
  const withLogin = await testPages(true);

  console.log('\n\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  const redirected = withoutLogin.filter(r => r.status === 'redirected').length;
  const issues = withoutLogin.filter(r => r.status === 'issue').length;
  const errors = withoutLogin.filter(r => r.status === 'error').length;
  const accessed = withLogin.filter(
    r => r.status === 'accessed' || r.status === 'public'
  ).length;

  console.log('\nWITHOUT LOGIN:');
  console.log(`  Redirected: ${redirected}`);
  console.log(`  Issues: ${issues}`);
  console.log(`  Errors: ${errors}`);

  console.log('\nWITH LOGIN:');
  console.log(`  Accessed: ${accessed}`);

  if (issues > 0) {
    console.log('\nISSUES:');
    withoutLogin
      .filter(r => r.status === 'issue')
      .forEach(r => console.log(`  - ${r.page}`));
  }
  if (errors > 0) {
    console.log('\nERRORS:');
    withoutLogin
      .filter(r => r.status === 'error')
      .forEach(r => console.log(`  - ${r.page}: ${r.error}`));
  }
  console.log('\nTest completed!\n');
})();
