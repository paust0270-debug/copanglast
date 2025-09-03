'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CoupangAppProduct {
  id: string;
  userId: string;
  keyword: string;
  linkAddress: string;
  currentRank: number | null;
  initialRank: number | null;
  usedSlots: number;
  days: number;
  registrationDate: string;
  status: 'active' | 'completed' | 'expired';
}

export default function CoupangAppRankTracker() {
  const [products, setProducts] = useState<CoupangAppProduct[]>([]);
  const [singleProduct, setSingleProduct] = useState({
    keyword: '',
    linkAddress: '',
    usedSlots: 1,
    days: 30
  });
  const [bulkInput, setBulkInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  const addSingleProduct = async () => {
    if (!singleProduct.keyword.trim() || !singleProduct.linkAddress.trim()) {
      alert('검색어와 링크주소를 모두 입력해주세요.');
      return;
    }

    setIsAdding(true);
    
    // 새 상품 추가 (시뮬레이션)
    const product: CoupangAppProduct = {
      id: Date.now().toString(),
      userId: `user${Math.floor(Math.random() * 1000) + 1}`,
      keyword: singleProduct.keyword.trim(),
      linkAddress: singleProduct.linkAddress.trim(),
      currentRank: Math.floor(Math.random() * 100) + 1,
      initialRank: Math.floor(Math.random() * 100) + 1,
      usedSlots: singleProduct.usedSlots,
      days: singleProduct.days,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    setProducts(prev => [product, ...prev]);
    setSingleProduct({ keyword: '', linkAddress: '', usedSlots: 1, days: 30 });
    setIsAdding(false);
  };

  const addBulkProducts = async () => {
    if (!bulkInput.trim()) {
      alert('대량 등록 입력을 입력해주세요.');
      return;
    }

    setIsBulkAdding(true);
    
    const lines = bulkInput.trim().split('\n').filter(line => line.trim());
    const newProducts: CoupangAppProduct[] = [];

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length === 4) {
        const [keyword, linkAddress, slots, days] = parts;
        const product: CoupangAppProduct = {
          id: Date.now().toString() + Math.random(),
          userId: `user${Math.floor(Math.random() * 1000) + 1}`,
          keyword: keyword,
          linkAddress: linkAddress,
          currentRank: Math.floor(Math.random() * 100) + 1,
          initialRank: Math.floor(Math.random() * 100) + 1,
          usedSlots: parseInt(slots) || 1,
          days: parseInt(days) || 30,
          registrationDate: new Date().toISOString().split('T')[0],
          status: 'active'
        };
        newProducts.push(product);
      }
    }

    setProducts(prev => [...newProducts, ...prev]);
    setBulkInput('');
    setIsBulkAdding(false);
  };

  const removeProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'completed': return '완료';
      case 'expired': return '만료';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Coupang APP Ranking Tracker
        </h1>
        <p className="text-gray-600">
          Track and manage product rankings on the Coupang mobile app
        </p>
      </div>

      {/* Single Item Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Single Item Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="keyword">검색어(상품키워드)</Label>
              <Input
                id="keyword"
                placeholder="예: 전자렌지 선반"
                value={singleProduct.keyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSingleProduct(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="linkAddress">링크주소(쿠팡 실제 URL)</Label>
              <Input
                id="linkAddress"
                placeholder="https://www.coupang.com/vp/products/..."
                value={singleProduct.linkAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSingleProduct(prev => ({ ...prev, linkAddress: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="usedSlots">사용슬롯(개수)</Label>
              <Input
                id="usedSlots"
                type="number"
                min="1"
                value={singleProduct.usedSlots}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSingleProduct(prev => ({ ...prev, usedSlots: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <Label htmlFor="days">일수</Label>
              <Input
                id="days"
                type="number"
                min="1"
                value={singleProduct.days}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSingleProduct(prev => ({ ...prev, days: parseInt(e.target.value) || 30 }))}
              />
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <Button 
              onClick={addSingleProduct} 
              disabled={isAdding}
              className="bg-black hover:bg-gray-800"
            >
              {isAdding ? '등록 중...' : '등록'}
            </Button>
            <Button 
              onClick={addBulkProducts} 
              disabled={isBulkAdding}
              variant="outline"
            >
              {isBulkAdding ? '등록 중...' : '대량 등록'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Registration Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bulk Registration Input</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="bulkInput">
            대량 등록 입력 (한 줄당: 키워드 | URL | 슬롯 | 일수)
          </Label>
          <textarea
            id="bulkInput"
            placeholder="예) 전자렌지 선반 | https://www.coupang.com/vp/products/8470784672 | 1 | 30"
            value={bulkInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkInput(e.target.value)}
            rows={6}
            className="mt-2 flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="mt-4">
            <Button 
              onClick={addBulkProducts} 
              disabled={isBulkAdding}
              className="bg-black hover:bg-gray-800"
            >
              {isBulkAdding ? '대량 등록 중...' : '대량 등록'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">순번</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">사용자ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">검색어</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">링크주소</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">현재순위</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">최초 시작순위</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">사용슬롯</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">일수</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">등록일</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">상태</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-2">{product.userId}</td>
                      <td className="border border-gray-300 px-4 py-2">{product.keyword}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="max-w-xs truncate" title={product.linkAddress}>
                          {product.linkAddress}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {product.currentRank ? `${product.currentRank}위` : '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {product.initialRank ? `${product.initialRank}위` : '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{product.usedSlots}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{product.days}</td>
                      <td className="border border-gray-300 px-4 py-2">{product.registrationDate}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge className={getStatusColor(product.status)}>
                          {getStatusText(product.status)}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Button
                          onClick={() => removeProduct(product.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 빈 상태 */}
      {products.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 상품이 없습니다</h3>
            <p className="text-gray-500 mb-4">
              위에서 상품 정보를 입력하여 첫 번째 상품을 등록해보세요
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
