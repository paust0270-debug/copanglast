'use client';
import { useState } from 'react';
import Navigation from '@/components/Navigation';

interface Distributor {
  id: string;
  name: string;
  company: string;
  contact: string;
  email: string;
  status: string;
  createdAt: string;
  commission: number;
  memo: string;
  processor: string;
  slotCount: number;
  additionalCount: number;
}

export default function DistributorPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([
    {
      id: 'dist001',
      name: '김영수',
      company: 'ABC 마케팅',
      contact: '010-1234-5678',
      email: 'kim@abc.com',
      status: '승인',
      createdAt: '2024-01-15',
      commission: 15,
      memo: '우수 총판',
      processor: '관리자',
      slotCount: 50,
      additionalCount: 5
    },
    {
      id: 'dist002',
      name: '이미영',
      company: 'XYZ 에이전시',
      contact: '010-2345-6789',
      email: 'lee@xyz.com',
      status: '승인',
      createdAt: '2024-01-10',
      commission: 20,
      memo: '신규 총판',
      processor: '관리자',
      slotCount: 30,
      additionalCount: 2
    },
    {
      id: 'dist003',
      name: '박준호',
      company: 'DEF 커머스',
      contact: '010-3456-7890',
      email: 'park@def.com',
      status: '대기',
      createdAt: '2024-01-05',
      commission: 12,
      memo: '검토 필요',
      processor: '관리자',
      slotCount: 0,
      additionalCount: 0
    }
  ]);

  const [newDistributor, setNewDistributor] = useState({
    name: '',
    company: '',
    contact: '',
    email: '',
    commission: 0,
    memo: ''
  });

  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (distributor: Distributor) => {
    setEditingDistributor(distributor);
    setIsEditModalOpen(true);
  };

  const handleDelete = (distributorId: string) => {
    if (confirm('정말로 이 총판을 삭제하시겠습니까?')) {
      setDistributors(distributors.filter(d => d.id !== distributorId));
      alert('총판이 삭제되었습니다.');
    }
  };

  const handleSaveEdit = () => {
    if (editingDistributor) {
      setDistributors(distributors.map(d => 
        d.id === editingDistributor.id ? editingDistributor : d
      ));
      setIsEditModalOpen(false);
      setEditingDistributor(null);
      alert('총판 정보가 수정되었습니다.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingDistributor(null);
  };

  const handleInputChange = (field: keyof Distributor, value: string | number) => {
    if (editingDistributor) {
      setEditingDistributor({
        ...editingDistributor,
        [field]: value
      });
    }
  };

  const handleAddDistributor = () => {
    if (newDistributor.name && newDistributor.company && newDistributor.contact && newDistributor.email) {
      const distributor: Distributor = {
        id: `dist${Date.now()}`,
        name: newDistributor.name,
        company: newDistributor.company,
        contact: newDistributor.contact,
        email: newDistributor.email,
        status: '대기',
        createdAt: new Date().toISOString().split('T')[0],
        commission: newDistributor.commission,
        memo: newDistributor.memo,
        processor: '관리자',
        slotCount: 0,
        additionalCount: 0
      };
      setDistributors([...distributors, distributor]);
      setNewDistributor({ name: '', company: '', contact: '', email: '', commission: 0, memo: '' });
      alert('새 총판이 추가되었습니다.');
    } else {
      alert('필수 필드를 입력해주세요.');
    }
  };

  const handleStatusChange = (distributorId: string, newStatus: string) => {
    setDistributors(distributors.map(d => 
      d.id === distributorId ? { ...d, status: newStatus } : d
    ));
  };

  const handleSlotAdd = (distributorId: string) => {
    const distributor = distributors.find(d => d.id === distributorId);
    if (distributor) {
      const addCount = prompt('추가할 슬롯 수를 입력하세요:', '1');
      if (addCount && !isNaN(Number(addCount))) {
        setDistributors(distributors.map(d => 
          d.id === distributorId 
            ? { ...d, slotCount: d.slotCount + Number(addCount), additionalCount: d.additionalCount + 1 }
            : d
        ));
        alert(`${addCount}개의 슬롯이 추가되었습니다.`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">총판 관리</h1>
            <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800">
              총판 추가
            </button>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">T</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">전체 총판</dt>
                      <dd className="text-lg font-medium text-gray-900">{distributors.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">승인</dt>
                      <dd className="text-lg font-medium text-gray-900">{distributors.filter(d => d.status === '승인').length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">W</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">대기</dt>
                      <dd className="text-lg font-medium text-gray-900">{distributors.filter(d => d.status === '대기').length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">R</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">거부</dt>
                      <dd className="text-lg font-medium text-gray-900">{distributors.filter(d => d.status === '거부').length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 총판 목록 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순번</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이디</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총판명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">회사명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">휴대폰번호</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입승인</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">처리자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯개수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추가횟수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {distributors.map((distributor, index) => (
                  <tr key={distributor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{distributor.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{distributor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{distributor.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{distributor.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{distributor.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={distributor.memo}
                        onChange={(e) => {
                          setDistributors(distributors.map(d => 
                            d.id === distributor.id ? { ...d, memo: e.target.value } : d
                          ));
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleStatusChange(distributor.id, '승인')}
                          className={`px-3 py-1 text-xs rounded ${
                            distributor.status === '승인' 
                              ? 'bg-black text-white' 
                              : 'bg-gray-100 text-gray-800'
                          } hover:bg-gray-200`}
                        >
                          승인
                        </button>
                        <button 
                          onClick={() => handleStatusChange(distributor.id, '대기')}
                          className={`px-3 py-1 text-xs rounded ${
                            distributor.status === '대기' 
                              ? 'bg-gray-300 text-gray-800' 
                              : 'bg-gray-100 text-gray-800'
                          } hover:bg-gray-200`}
                        >
                          대기
                        </button>
                        <button 
                          onClick={() => handleStatusChange(distributor.id, '거부')}
                          className={`px-3 py-1 text-xs rounded ${
                            distributor.status === '거부' 
                              ? 'bg-red-300 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          } hover:bg-gray-200`}
                        >
                          거부
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{distributor.processor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{distributor.slotCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{distributor.additionalCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(distributor)}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => handleSlotAdd(distributor.id)}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                        >
                          슬롯추가
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {isEditModalOpen && editingDistributor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">총판 정보 수정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">총판명</label>
                  <input
                    type="text"
                    value={editingDistributor.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">회사명</label>
                  <input
                    type="text"
                    value={editingDistributor.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">휴대폰번호</label>
                  <input
                    type="text"
                    value={editingDistributor.contact}
                    onChange={(e) => handleInputChange('contact', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <input
                    type="email"
                    value={editingDistributor.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">메모</label>
                  <input
                    type="text"
                    value={editingDistributor.memo}
                    onChange={(e) => handleInputChange('memo', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
