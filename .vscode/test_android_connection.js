const { exec } = require('child_process');
const fs = require('fs');

class AndroidConnectionTester {
  constructor() {
    this.adbPath = 'adb.exe'; // ADB 경로
    this.deviceId = null;
  }

  // ADB 명령어 실행
  async execAdbCommand(command, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const fullCommand = `${this.adbPath} ${command}`;
      console.log(`🔧 ADB 명령어: ${fullCommand}`);
      
      exec(fullCommand, { timeout }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ ADB 명령어 실패: ${error.message}`);
          reject(error);
        } else {
          console.log(`✅ ADB 명령어 성공: ${stdout.trim()}`);
          resolve(stdout.trim());
        }
      });
    });
  }

  // 안드로이드 디바이스 연결 확인
  async checkAndroidDevice() {
    try {
      console.log('🔍 안드로이드 디바이스 연결 확인 중...');
      
      const output = await this.execAdbCommand('devices');
      const lines = output.split('\n');
      const deviceLine = lines.find(line => line.includes('device') && !line.includes('List of devices'));
      
      if (deviceLine) {
        this.deviceId = deviceLine.split('\t')[0];
        console.log(`✅ 안드로이드 디바이스 연결됨: ${this.deviceId}`);
        return true;
      } else {
        console.log('❌ 연결된 안드로이드 디바이스가 없습니다');
        return false;
      }
    } catch (error) {
      console.error('❌ 안드로이드 디바이스 확인 실패:', error);
      return false;
    }
  }

  // 기기 정보 확인
  async getDeviceInfo() {
    try {
      console.log('📱 기기 정보 확인 중...');
      
      const model = await this.execAdbCommand(`shell getprop ro.product.model`);
      const version = await this.execAdbCommand(`shell getprop ro.build.version.release`);
      const sdk = await this.execAdbCommand(`shell getprop ro.build.version.sdk`);
      
      console.log(`📱 기기 모델: ${model}`);
      console.log(`📱 Android 버전: ${version}`);
      console.log(`📱 SDK 버전: ${sdk}`);
      
      return { model, version, sdk };
    } catch (error) {
      console.error('❌ 기기 정보 확인 실패:', error);
      return null;
    }
  }

  // 네트워크 연결 확인
  async checkNetworkConnection() {
    try {
      console.log('🌐 네트워크 연결 확인 중...');
      
      // 1. IP 확인
      try {
        const ipRoute = await this.execAdbCommand('shell ip route');
        const ipMatch = ipRoute.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch) {
          console.log(`📍 내부 IP: ${ipMatch[1]}`);
        }
      } catch (error) {
        console.log('⚠️ 내부 IP 확인 실패');
      }

      // 2. 외부 IP 확인
      try {
        const externalIP = await this.execAdbCommand('shell curl -s https://ipinfo.io/ip');
        if (externalIP && externalIP.match(/\d+\.\d+\.\d+\.\d+/)) {
          console.log(`📍 외부 IP: ${externalIP.trim()}`);
        }
      } catch (error) {
        console.log('⚠️ 외부 IP 확인 실패');
      }

      // 3. 인터넷 연결 테스트
      try {
        const pingResult = await this.execAdbCommand('shell ping -c 3 8.8.8.8');
        if (pingResult.includes('3 received')) {
          console.log('✅ 인터넷 연결 정상');
        } else {
          console.log('⚠️ 인터넷 연결 불안정');
        }
      } catch (error) {
        console.log('❌ 인터넷 연결 실패');
      }

      return true;
    } catch (error) {
      console.error('❌ 네트워크 연결 확인 실패:', error);
      return false;
    }
  }

  // 쿠팡 앱 확인
  async checkCoupangApp() {
    try {
      console.log('🛒 쿠팡 앱 확인 중...');
      
      // 1. 쿠팡 앱 설치 확인
      const packages = await this.execAdbCommand('shell pm list packages | grep coupang');
      
      if (packages.includes('com.coupang.mobile')) {
        console.log('✅ 쿠팡 앱 설치됨');
        
        // 2. 앱 버전 확인
        try {
          const version = await this.execAdbCommand('shell dumpsys package com.coupang.mobile | grep versionName');
          console.log(`📱 쿠팡 앱 버전: ${version}`);
        } catch (error) {
          console.log('⚠️ 앱 버전 확인 실패');
        }
        
        // 3. 앱 실행 테스트
        try {
          console.log('🚀 쿠팡 앱 실행 테스트...');
          await this.execAdbCommand('shell am start -n com.coupang.mobile/com.coupang.mobile.MainActivity');
          console.log('✅ 쿠팡 앱 실행 성공');
          
          // 3초 후 앱 종료
          await new Promise(resolve => setTimeout(resolve, 3000));
          await this.execAdbCommand('shell am force-stop com.coupang.mobile');
          console.log('🛑 쿠팡 앱 종료');
          
        } catch (error) {
          console.log('❌ 쿠팡 앱 실행 실패');
        }
        
        return true;
      } else {
        console.log('❌ 쿠팡 앱이 설치되지 않음');
        return false;
      }
    } catch (error) {
      console.error('❌ 쿠팡 앱 확인 실패:', error);
      return false;
    }
  }

  // 모바일 데이터 연결 테스트
  async testMobileDataConnection() {
    try {
      console.log('📱 모바일 데이터 연결 테스트 중...');
      
      // 1. 현재 데이터 연결 상태 확인
      try {
        const dataState = await this.execAdbCommand('shell dumpsys telephony.registry | grep mDataConnectionState');
        console.log(`📱 데이터 연결 상태: ${dataState}`);
      } catch (error) {
        console.log('⚠️ 데이터 연결 상태 확인 실패');
      }

      // 2. 모바일 데이터 재연결 테스트
      console.log('🔄 모바일 데이터 재연결 테스트...');
      
      // 데이터 연결 해제
      await this.execAdbCommand('shell svc data disable');
      console.log('📱 데이터 연결 해제');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 데이터 연결 활성화
      await this.execAdbCommand('shell svc data enable');
      console.log('📱 데이터 연결 활성화');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 새 IP 확인
      try {
        const newIP = await this.execAdbCommand('shell curl -s https://ipinfo.io/ip');
        if (newIP && newIP.match(/\d+\.\d+\.\d+\.\d+/)) {
          console.log(`📍 새 외부 IP: ${newIP.trim()}`);
        }
      } catch (error) {
        console.log('⚠️ 새 IP 확인 실패');
      }
      
      return true;
    } catch (error) {
      console.error('❌ 모바일 데이터 연결 테스트 실패:', error);
      return false;
    }
  }

  // 전체 테스트 실행
  async runFullTest() {
    console.log('🚀 Android 연결 테스트 시작...\n');
    
    const results = {
      device: false,
      deviceInfo: null,
      network: false,
      coupangApp: false,
      mobileData: false
    };
    
    try {
      // 1. 디바이스 연결 확인
      results.device = await this.checkAndroidDevice();
      if (!results.device) {
        console.log('❌ 디바이스 연결 실패로 테스트 중단');
        return results;
      }
      
      // 2. 기기 정보 확인
      results.deviceInfo = await this.getDeviceInfo();
      
      // 3. 네트워크 연결 확인
      results.network = await this.checkNetworkConnection();
      
      // 4. 쿠팡 앱 확인
      results.coupangApp = await this.checkCoupangApp();
      
      // 5. 모바일 데이터 연결 테스트
      results.mobileData = await this.testMobileDataConnection();
      
      // 결과 출력
      console.log('\n📊 테스트 결과:');
      console.log(`디바이스 연결: ${results.device ? '✅' : '❌'}`);
      console.log(`네트워크 연결: ${results.network ? '✅' : '❌'}`);
      console.log(`쿠팡 앱: ${results.coupangApp ? '✅' : '❌'}`);
      console.log(`모바일 데이터: ${results.mobileData ? '✅' : '❌'}`);
      
      if (results.device && results.network && results.coupangApp) {
        console.log('\n🎉 모든 테스트 통과! Android 기반 쿠팡 순위 체크 시스템을 사용할 수 있습니다.');
      } else {
        console.log('\n⚠️ 일부 테스트 실패. 설정을 확인해주세요.');
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ 테스트 실행 실패:', error);
      return results;
    }
  }
}

// 실행 함수
async function main() {
  const tester = new AndroidConnectionTester();
  
  try {
    const results = await tester.runFullTest();
    console.log('\n📋 상세 결과:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

// 직접 실행
if (require.main === module) {
  main();
}

module.exports = AndroidConnectionTester;














