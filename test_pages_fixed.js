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

      // Find inputs by type or placeholder
      const textInputs = await page.locator('input[type="text"]').all();
      if (textInputs.length > 0) {
        await textInputs[0].fill('master');
      }

      const passwordInputs = await page.locator('input[type="password"]').all();
      if (passwordInputs.length > 0) {
        await passwordInputs[0].fill('123123');
      }

      // Check remember me checkbox (last checkbox)
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      if (checkboxes.length > 0) {
        await checkboxes[checkboxes.length - 1].check();
      }

      // Click login button - try multiple selectors
      const loginButton = page
        .locator('button')
        .filter({ hasText: /login|로그인/i })
        .first();
      await loginButton.waitFor({ state: 'visible', timeout: 5000 });
      await loginButton.click();

      // Wait for navigation away from login page
      await page.waitForURL(url => !url.pathname.includes('/login'), {
        timeout: 5000,
      });
      await page.waitForTimeout(2000);

      console.log('Login successful!\n');
    } catch (error) {
      console.log(`Login failed: ${error.message}`);
    }
  }

  console.log(`[${login ? '2' : '1'}/2] Testing pages...\n`);

  for (let i = 0; i < pages.length; i++) {
    const path = pages[i];
    const url = `http://localhost:3000${path}`;

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);

      const currentUrl = page.url();

      if (publicPages.includes(path)) {
        results.push({ page: path, status: 'public', ok: true });
        console.log(`[${i + 1}/${pages.length}] ??${path} - Public page`);
      } else if (!login && currentUrl.includes('/login')) {
        results.push({ page: path, status: 'redirected', ok: true });
        console.log(
          `[${i + 1}/${pages.length}] ?봽 ${path} - Redirected to login (OK)`
        );
      } else if (login && !currentUrl.includes('/login')) {
        results.push({ page: path, status: 'accessed', ok: true });
        console.log(`[${i + 1}/${pages.length}] ??${path} - Accessible`);
      } else if (!login && !currentUrl.includes('/login')) {
        results.push({
          page: path,
          status: 'issue',
          ok: false,
          url: currentUrl,
        });
        console.log(
          `[${i + 1}/${pages.length}] ?좑툘 ${path} - ISSUE: Not redirected (${currentUrl})`
        );
      } else {
        results.push({
          page: path,
          status: 'other',
          ok: false,
          url: currentUrl,
        });
        console.log(`[${i + 1}/${pages.length}] ?뱄툘 ${path} - ${currentUrl}`);
      }
    } catch (error) {
      results.push({
        page: path,
        status: 'error',
        ok: false,
        error: error.message.substring(0, 50),
      });
      console.log(`[${i + 1}/${pages.length}] ??${path} - Error`);
    }

    await page.waitForTimeout(500);
  }

  await browser.close();
  return results;
}

async function main() {
  console.log('\n?? Starting comprehensive page authentication tests\n');

  // Test without login
  const withoutLogin = await testPages(false);

  console.log('\n\n' + '='.repeat(60));
  console.log('Waiting 3 seconds before login test...');
  console.log('='.repeat(60));
  await new Promise(r => setTimeout(r, 3000));

  // Test with login
  const withLogin = await testPages(true);

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('?뱤 TEST SUMMARY');
  console.log('='.repeat(60));

  const redirected = withoutLogin.filter(r => r.status === 'redirected').length;
  const issues = withoutLogin.filter(r => r.status === 'issue').length;
  const errors = withoutLogin.filter(r => r.status === 'error').length;
  const accessed = withLogin.filter(
    r => r.status === 'accessed' || r.status === 'public'
  ).length;

  console.log('\n?뱦 WITHOUT LOGIN:');
  console.log(`   ??Redirected (correct): ${redirected}`);
  console.log(`   ?좑툘 Issues (not redirected): ${issues}`);
  console.log(`   ??Errors: ${errors}`);

  console.log('\n?뱦 WITH LOGIN:');
  console.log(`   ??Accessible: ${accessed}`);

  if (issues > 0) {
    console.log('\n?좑툘 PAGES WITH ISSUES (not protected):');
    withoutLogin
      .filter(r => r.status === 'issue')
      .forEach(r => {
        console.log(`   - ${r.page} -> ${r.url}`);
      });
  }

  if (errors > 0) {
    console.log('\n??PAGES WITH ERRORS:');
    withoutLogin
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`   - ${r.page}: ${r.error}`);
      });
  }

  console.log('\n??Test completed!\n');
}

main().catch(console.error);
