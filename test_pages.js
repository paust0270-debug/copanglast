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
  console.log(`\n=== Testing ${login ? 'WITH login' : 'WITHOUT login'} ===\n`);
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const results = [];

  if (login) {
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="text"]', 'master');
    await page.fill('input[type="password"]', '123123');
    await page.locator('input[type="checkbox"]').last().check();
    await page.click('button:has-text("濡쒓렇??)');
    await page.waitForTimeout(3000);
    console.log('Login completed\n');
  }

  for (let i = 0; i < pages.length; i++) {
    const path = pages[i];
    try {
      await page.goto(`http://localhost:3000${path}`, {
        waitUntil: 'networkidle',
        timeout: 8000,
      });
      await page.waitForTimeout(1500);
      const currentUrl = page.url();

      if (publicPages.includes(path)) {
        results.push({ page: path, status: 'public', ok: true });
        console.log(`[${i + 1}/${pages.length}] OK: ${path} - Public page`);
      } else if (!login && currentUrl.includes('/login')) {
        results.push({ page: path, status: 'redirected', ok: true });
        console.log(
          `[${i + 1}/${pages.length}] OK: ${path} - Redirected to login`
        );
      } else if (login && !currentUrl.includes('/login')) {
        results.push({ page: path, status: 'accessed', ok: true });
        console.log(`[${i + 1}/${pages.length}] OK: ${path} - Accessible`);
      } else {
        results.push({
          page: path,
          status: 'issue',
          ok: false,
          url: currentUrl,
        });
        console.log(
          `[${i + 1}/${pages.length}] ISSUE: ${path} - ${currentUrl}`
        );
      }
    } catch (error) {
      results.push({
        page: path,
        status: 'error',
        ok: false,
        error: error.message,
      });
      console.log(`[${i + 1}/${pages.length}] ERROR: ${path}`);
    }
    await page.waitForTimeout(300);
  }

  await browser.close();
  return results;
}

(async () => {
  console.log('Starting page authentication tests...\n');
  const withoutLogin = await testPages(false);
  console.log('\n\nWaiting 3 seconds...\n');
  await new Promise(r => setTimeout(r, 3000));
  const withLogin = await testPages(true);

  console.log('\n\n=== SUMMARY ===');
  const redirected = withoutLogin.filter(r => r.status === 'redirected').length;
  const issues = withoutLogin.filter(r => r.status === 'issue').length;
  const accessed = withLogin.filter(
    r => r.status === 'accessed' || r.status === 'public'
  ).length;

  console.log(`Without login - Redirected: ${redirected}, Issues: ${issues}`);
  console.log(`With login - Accessed: ${accessed}`);
  if (issues > 0) {
    console.log('\nPages with issues:');
    withoutLogin
      .filter(r => r.status === 'issue')
      .forEach(r => console.log(`  - ${r.page}`));
  }
  console.log('\nTest completed!');
})();
