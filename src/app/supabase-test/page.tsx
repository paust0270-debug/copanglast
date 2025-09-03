'use client'

import { useState, useEffect } from 'react'
import { testSupabaseConnection } from '@/lib/supabase'

export default function SupabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('테스트 중...')
  const [connectionDetails, setConnectionDetails] = useState<any>(null)
  const [envVars, setEnvVars] = useState<any>({})

  useEffect(() => {
    checkEnvironmentVariables()
    testConnection()
  }, [])

  const checkEnvironmentVariables = () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV
    }
    
    setEnvVars(env)
    
    console.log('🔍 환경 변수 상태:', env)
  }

  const testConnection = async () => {
    try {
      setConnectionStatus('연결 테스트 중...')
      const result = await testSupabaseConnection()
      
      if (result.success) {
        setConnectionStatus('✅ 연결 성공!')
        setConnectionDetails(result.data)
      } else {
        setConnectionStatus('❌ 연결 실패')
        setConnectionDetails(result.error)
      }
    } catch (error) {
      setConnectionStatus('❌ 테스트 오류')
      setConnectionDetails(error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔍 Supabase 연결 테스트</h1>
      
      {/* 환경 변수 상태 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">📋 환경 변수 상태</h2>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="font-medium w-64">NEXT_PUBLIC_SUPABASE_URL:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              envVars.NEXT_PUBLIC_SUPABASE_URL ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {envVars.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 설정되지 않음'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium w-64">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 설정되지 않음'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium w-64">NODE_ENV:</span>
            <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
              {envVars.NODE_ENV || '설정되지 않음'}
            </span>
          </div>
        </div>
      </div>

      {/* 연결 테스트 결과 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">🔌 연결 테스트 결과</h2>
        <div className="mb-3">
          <span className="font-medium">상태:</span>
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            connectionStatus.includes('성공') ? 'bg-green-100 text-green-800' : 
            connectionStatus.includes('실패') ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'
          }`}>
            {connectionStatus}
          </span>
        </div>
        
        {connectionDetails && (
          <div className="bg-white p-3 rounded border">
            <h3 className="font-medium mb-2">상세 정보:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(connectionDetails, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* 해결 방법 */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">💡 문제 해결 방법</h2>
        
        {!envVars.NEXT_PUBLIC_SUPABASE_URL || !envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
          <div className="space-y-3">
            <h3 className="font-medium text-red-700">환경 변수가 설정되지 않았습니다</h3>
            <div className="space-y-2 text-sm">
              <p><strong>1단계:</strong> 프로젝트 루트에 <code>.env.local</code> 파일 생성</p>
              <p><strong>2단계:</strong> 다음 내용 추가:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`}
              </pre>
              <p><strong>3단계:</strong> <code>npm run dev</code>로 서버 재시작</p>
              <p><strong>자동 설정:</strong> <code>node setup-env.js</code> 실행</p>
            </div>
          </div>
        ) : connectionStatus.includes('실패') ? (
          <div className="space-y-3">
            <h3 className="font-medium text-red-700">연결은 되지만 테이블 접근에 실패했습니다</h3>
            <div className="space-y-2 text-sm">
              <p><strong>1단계:</strong> Supabase 대시보드에서 SQL Editor 열기</p>
              <p><strong>2단계:</strong> <code>supabase-schema.sql</code> 파일 내용 실행</p>
              <p><strong>3단계:</strong> 테이블이 생성되었는지 확인</p>
            </div>
          </div>
        ) : (
          <div className="text-green-700">
            <p>✅ 모든 설정이 완료되었습니다!</p>
            <p className="text-sm mt-1">이제 쿠팡APP → 작업등록 페이지에서 정상적으로 작동할 것입니다.</p>
          </div>
        )}
      </div>

      {/* 재테스트 버튼 */}
      <div className="text-center">
        <button
          onClick={testConnection}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          🔄 연결 재테스트
        </button>
      </div>
    </div>
  )
}
