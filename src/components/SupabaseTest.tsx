'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>(
    'loading'
  );
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);

        if (error) {
          if (error.code === 'PGRST116') {
            // Table doesn't exist yet, but connection is working
            setStatus('connected');
          } else {
            setStatus('error');
            setError(error.message);
          }
        } else {
          setStatus('connected');
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    testConnection();
  }, []);

  const retryConnection = () => {
    setStatus('loading');
    setError('');
    // Re-run the connection test
    setTimeout(() => {
      const testConnection = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
          if (error) {
            if (error.code === 'PGRST116') {
              setStatus('connected');
            } else {
              setStatus('error');
              setError(error.message);
            }
          } else {
            setStatus('connected');
          }
        } catch (err) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      };
      testConnection();
    }, 100);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Supabase 연결 상태</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {status === 'loading' && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>연결 확인 중...</span>
            </div>
          )}
          {status === 'connected' && (
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              <span>✅ Supabase 연결 성공!</span>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-red-600">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                <span>❌ 연결 오류</span>
              </div>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>

        {status === 'error' && (
          <Button
            onClick={retryConnection}
            variant="outline"
            className="w-full"
          >
            다시 시도
          </Button>
        )}

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <Label>URL:</Label>
            <span>
              {process.env.NEXT_PUBLIC_SUPABASE_URL
                ? '설정됨'
                : '설정되지 않음'}
            </span>
          </div>
          <div className="flex justify-between">
            <Label>Key:</Label>
            <span>
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                ? '설정됨'
                : '설정되지 않음'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
