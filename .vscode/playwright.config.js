// @ts-check

/**
 * Playwright 설정 파일
 * 쿠팡 순위체크 테스트용
 */

const { devices } = require('@playwright/test');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: '.',
  testMatch: '**/*test*.js',
  
  // 각 테스트별 타임아웃 설정
  timeout: 60000, // 60초
  
  // 전역 설정 타임아웃
  globalTimeout: 300000, // 5분
  
  // 테스트 간격
  forbidOnly: process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // 리포터 설정
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  
  // 브라우저 설정
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 브라우저 옵션
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-ipc-flooding-protection',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        },
        // 요청 차단 설정 (성능 최적화)
        requestInterception: true,
        // 네트워크 타임아웃
        actionTimeout: 30000,
        navigationTimeout: 30000
      },
    },
    
    // 추가 브라우저 (필요시)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // 웹서버 설정 (필요시)
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
};

module.exports = config;
