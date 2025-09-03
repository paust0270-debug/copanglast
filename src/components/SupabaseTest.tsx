'use client';

import { useState, useEffect } from 'react';
import { supabase, addCustomer, getCustomers } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [testResult, setTestResult] = useState<string>('');
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('checking');
      
      // 환경 변수 확인
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        setConnectionStatus('error');
        setTestResult('환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
        return;
      }

      // 간단한 쿼리 테스트
      const { data, error } = await supabase.from('customers').select('count').limit(1);
      
      if (error) {
        setConnectionStatus('error');
        setTestResult(`연결 실패: ${error.message}`);
        return;
      }

      setConnectionStatus('success');
      setTestResult('Supabase 연결 성공!');
      
      // 고객 목록 로드
      await loadCustomers();
    } catch (error) {
      setConnectionStatus('error');
      setTestResult(`연결 오류: ${error}`);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('고객 목록 로드 실패:', error);
    }
  };

  const testAddCustomer = async () => {
    try {
      const testData = {
        name: '_PD_test',
        keyword: '테스트 상품',
        link_url: 'https://example.com',
        slot_count: 1,
        memo: '테스트용 데이터입니다.'
      };

      await addCustomer(testData);
      setTestResult('고객 추가 테스트 성공!');
      await loadCustomers(); // 목록 새로고침
    } catch (error) {
      setTestResult(`고객 추가 테스트 실패: ${error}`);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'success': return '✅ 연결됨';
      case 'error': return '❌ 연결 실패';
      default: return '⏳ 확인 중...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase 연결 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <span className="font-medium">연결 상태:</span>
            <span className={getStatusColor()}>{getStatusText()}</span>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || '설정되지 않음'}
            </div>
            <div className="text-sm">
              <strong>API Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '설정되지 않음'}
            </div>
          </div>

          <div className="space-x-2">
            <Button onClick={testConnection} variant="outline">
              연결 재테스트
            </Button>
            <Button onClick={testAddCustomer} disabled={connectionStatus !== 'success'}>
              고객 추가 테스트
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded ${
              connectionStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {testResult}
            </div>
          )}
        </CardContent>
      </Card>

      {customers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>저장된 고객 목록 ({customers.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customers.map((customer) => (
                <div key={customer.id} className="p-3 border rounded">
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">
                    키워드: {customer.keyword} | 슬롯: {customer.slot_count}개
                  </div>
                  <div className="text-xs text-gray-500">
                    생성일: {new Date(customer.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
