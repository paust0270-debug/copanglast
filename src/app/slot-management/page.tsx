'use client';
import { useState } from 'react';
import Navigation from '@/components/Navigation';

interface Slot {
  id: string;
  userId: string;
  userName: string;
  slotNumber: string;
  status: string;
  createdAt: string;
  lastUsed: string;
}

export default function SlotManagementPage() {
  const [slots, setSlots] = useState<Slot[]>([
    {
      id: 'slot001',
      userId: 'user001',
      userName: '김철수',
      slotNumber: 'A001',
      status: '활성화',
      createdAt: '2024-01-15',
      lastUsed: '2024-01-20'
    },
    {
      id: 'slot002',
      userId: 'user002',
      userName: '이영희',
      slotNumber: 'B001',
      status: '활성화',
      createdAt: '2024-01-10',
      lastUsed: '2024-01-19'
    },
    {
      id: 'slot003',
      userId: 'user003',
      userName: '박민수',
      slotNumber: 'C001',
      status: '정지',
      createdAt: '2024-01-05',
      lastUsed: '2024-01-18'
    }
  ]);

  const [newSlot, setNewSlot] = useState({
    userId: '',
    userName: '',
    slotNumber: ''
  });

  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (slot: Slot) => {
    setEditingSlot(slot);
    setIsEditModalOpen(true);
  };

  const handleDelete = (slotId: string) => {
    if (confirm('정말로 이 슬롯을 삭제하시겠습니까?')) {
      setSlots(slots.filter(s => s.id !== slotId));
      alert('슬롯이 삭제되었습니다.');
    }
  };

  const handleSaveEdit = () => {
    if (editingSlot) {
      setSlots(slots.map(s => 
        s.id === editingSlot.id ? editingSlot : s
      ));
      setIsEditModalOpen(false);
      setEditingSlot(null);
      alert('슬롯 정보가 수정되었습니다.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingSlot(null);
  };

  const handleInputChange = (field: keyof Slot, value: string) => {
    if (editingSlot) {
      setEditingSlot({
        ...editingSlot,
        [field]: value
      });
    }
  };

  const handleAddSlot = () => {
    if (newSlot.userId && newSlot.userName && newSlot.slotNumber) {
      const slot: Slot = {
        id: `slot${Date.now()}`,
        userId: newSlot.userId,
        userName: newSlot.userName,
        slotNumber: newSlot.slotNumber,
        status: '활성화',
        createdAt: new Date().toISOString().split('T')[0],
        lastUsed: new Date().toISOString().split('T')[0]
      };
      setSlots([...slots, slot]);
      setNewSlot({ userId: '', userName: '', slotNumber: '' });
      alert('새 슬롯이 추가되었습니다.');
    } else {
      alert('모든 필드를 입력해주세요.');
    }
  };

  const handleStatusChange = (slotId: string, newStatus: string) => {
    setSlots(slots.map(s => 
      s.id === slotId ? { ...s, status: newStatus } : s
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">슬롯 관리</h1>
            <p className="mt-2 text-gray-600">사용자별 슬롯을 관리하고 할당할 수 있습니다.</p>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">S</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">전체 슬롯</dt>
                      <dd className="text-lg font-medium text-gray-900">{slots.length}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">활성화</dt>
                      <dd className="text-lg font-medium text-gray-900">{slots.filter(s => s.status === '활성화').length}</dd>
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
                      <span className="text-white text-sm font-medium">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">정지</dt>
                      <dd className="text-lg font-medium text-gray-900">{slots.filter(s => s.status === '정지').length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">I</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">비활성화</dt>
                      <dd className="text-lg font-medium text-gray-900">{slots.filter(s => s.status === '비활성화').length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 새 슬롯 추가 */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">새 슬롯 추가</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="사용자 ID"
                value={newSlot.userId}
                onChange={(e) => setNewSlot({...newSlot, userId: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              <input
                type="text"
                placeholder="사용자명"
                value={newSlot.userName}
                onChange={(e) => setNewSlot({...newSlot, userName: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              <input
                type="text"
                placeholder="슬롯 번호"
                value={newSlot.slotNumber}
                onChange={(e) => setNewSlot({...newSlot, slotNumber: e.target.value})}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              <button
                onClick={handleAddSlot}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                슬롯 추가
              </button>
            </div>
          </div>

          {/* 슬롯 목록 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자 ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯 번호</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 사용</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slots.map((slot) => (
                  <tr key={slot.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.slotNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleStatusChange(slot.id, '활성화')}
                          className={`px-3 py-1 text-xs rounded ${
                            slot.status === '활성화' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          } hover:bg-green-200`}
                        >
                          활성화
                        </button>
                        <button 
                          onClick={() => handleStatusChange(slot.id, '정지')}
                          className={`px-3 py-1 text-xs rounded ${
                            slot.status === '정지' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          } hover:bg-yellow-200`}
                        >
                          정지
                        </button>
                        <button 
                          onClick={() => handleStatusChange(slot.id, '비활성화')}
                          className={`px-3 py-1 text-xs rounded ${
                            slot.status === '비활성화' 
                              ? 'bg-gray-100 text-gray-800' 
                              : 'bg-gray-100 text-gray-800'
                          } hover:bg-gray-200`}
                        >
                          비활성화
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.createdAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.lastUsed}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(slot)}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => handleDelete(slot.id)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          삭제
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
      {isEditModalOpen && editingSlot && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">슬롯 정보 수정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">사용자 ID</label>
                  <input
                    type="text"
                    value={editingSlot.userId}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">사용자명</label>
                  <input
                    type="text"
                    value={editingSlot.userName}
                    onChange={(e) => handleInputChange('userName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">슬롯 번호</label>
                  <input
                    type="text"
                    value={editingSlot.slotNumber}
                    onChange={(e) => handleInputChange('slotNumber', e.target.value)}
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
