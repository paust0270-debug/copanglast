'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isMasterAdmin } from '@/lib/auth';

interface SlotTypeSettings {
  slot_type: string;
  interval_hours: number;
}

function SettingsPageContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<SlotTypeSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 사용자 정보 확인
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userInfo = JSON.parse(userStr);
    setUser(userInfo);

    // 최고관리자 체크
    if (!isMasterAdmin(userInfo)) {
      alert('접근 권한이 없습니다.');
      router.push('/dashboard');
      return;
    }

    // 환경설정 로드
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        setSettings(result.data);
      } else {
        // 기본 설정값
        const defaultSettings: SlotTypeSettings[] = [
          { slot_type: '쿠팡', interval_hours: 0 },
          { slot_type: '쿠팡app', interval_hours: 0 },
          { slot_type: '쿠팡vip', interval_hours: 0 },
        ];
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('환경설정 로드 오류:', error);
      // 기본 설정값
      const defaultSettings: SlotTypeSettings[] = [
        { slot_type: '쿠팡', interval_hours: 0 },
        { slot_type: '쿠팡app', interval_hours: 0 },
        { slot_type: '쿠팡vip', interval_hours: 0 },
      ];
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: number) => {
    const newSettings = [...settings];
    newSettings[index].interval_hours = value;
    setSettings(newSettings);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      const result = await response.json();

      if (result.success) {
        alert('환경설정이 저장되었습니다.');
      } else {
        alert('저장에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('환경설정 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              관리자용 환경설정 페이지
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              slot_type별 순위 체크 간격을 설정합니다.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {settings.map((setting, index) => (
                <div
                  key={setting.slot_type}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <Label className="text-lg font-medium w-32">
                    {setting.slot_type}
                  </Label>
                  <div className="flex items-center space-x-2 flex-1">
                    <Input
                      type="number"
                      min="0"
                      value={setting.interval_hours}
                      onChange={e =>
                        handleChange(index, parseInt(e.target.value) || 0)
                      }
                      className="w-32"
                      placeholder="시간"
                    />
                    <span className="text-gray-600">시간</span>
                  </div>
                </div>
              ))}

              <div className="flex justify-end space-x-4 mt-8">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
