'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function NoticeWritePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    target: '전체',
    title: '',
    content: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    router.push('/notices');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 검증
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      // Supabase API를 통해 공지사항 저장
      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: formData.target,
          title: formData.title,
          content: formData.content,
          author: '관리자'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 에러:', errorText);
        throw new Error(`공지사항 등록 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('공지사항이 등록되었습니다.');
        router.push('/notices');
      } else {
        console.error('API 에러 상세:', result);
        throw new Error(result.error || result.details || '공지사항 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('공지사항 등록 실패:', error);
      alert('공지사항 등록에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">공지사항 글쓰기</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 대상총판 선택 */}
            <div>
              <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-2">
                대상총판
              </label>
              <select
                id="target"
                name="target"
                value={formData.target}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                <option value="본사">본사</option>
                <option value="총판A">총판A</option>
                <option value="총판B">총판B</option>
                <option value="총판C">총판C</option>
              </select>
            </div>

            {/* 제목 입력 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="제목을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 내용 입력 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="공지사항 내용을 입력하세요"
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* 버튼 그룹 */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                등록
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
