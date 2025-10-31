const { chromium } = require('playwright');
const fs = require('fs');

const PAGES = [
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

const PUBLIC = new Set(['/', '/login', '/signup']);

async function runSuite(withLogin) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  if (withLogin) {
    const user = {
      id: 'test',
      username: 'master',
      name: 'master',
      grade: '理쒓퀬愿由ъ옄',
      distributor: '理쒓퀬愿由ъ옄',
      status: 'active',
    };
    await context.addCookies([
      {
        name: 'isAuthenticated',
        value: 'true',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'userInfo',
        value: encodeURIComponent(JSON.stringify(user)),
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await context.addInitScript(u => {
      try {
        localStorage.setItem('user', JSON.stringify(u));
      } catch {}
    }, user);
  }

  const page = await context.newPage();
  const results = [];
  for (let i = 0; i < PAGES.length; i++) {
    const path = PAGES[i];
    const url = `http://localhost:3000${path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(300);
      const current = page.url();

      if (PUBLIC.has(path)) {
        results.push({ page: path, status: 'public', url: current, ok: true });
      } else if (!withLogin && current.includes('/login')) {
        results.push({
          page: path,
          status: 'redirected',
          url: current,
          ok: true,
        });
      } else if (withLogin && !current.includes('/login')) {
        results.push({ page: path, status: 'access', url: current, ok: true });
      } else if (!withLogin && !current.includes('/login')) {
        results.push({
          page: path,
          status: 'issue_not_protected',
          url: current,
          ok: false,
        });
      } else {
        results.push({ page: path, status: 'other', url: current, ok: false });
      }
    } catch (e) {
      results.push({
        page: path,
        status: 'error',
        error: String(e).slice(0, 200),
        ok: false,
      });
    }
  }

  await browser.close();
  return { withLogin, results };
}

(async () => {
  const noLogin = await runSuite(false);
  fs.writeFileSync('play_no_login.json', JSON.stringify(noLogin, null, 2));
  const withLogin = await runSuite(true);
  fs.writeFileSync('play_with_login.json', JSON.stringify(withLogin, null, 2));

  const noLoginSummary = noLogin.results.reduce(
    (acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc),
    {}
  );
  const withLoginSummary = withLogin.results.reduce(
    (acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc),
    {}
  );

  console.log('\nSummary WITHOUT login:', noLoginSummary);
  console.log('Summary WITH login:', withLoginSummary);
})();
