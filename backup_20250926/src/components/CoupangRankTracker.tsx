'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Product {
  id: string;
  productId: string;
  keyword: string;
  currentRank: number | null;
  previousRank: number | null;
  lastChecked: string;
  status: 'pending' | 'checking' | 'completed' | 'error';
  productName?: string;
  price?: string;
  image?: string;
}

export default function CoupangRankTracker() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({
    productId: '',
    keyword: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const addProduct = async () => {
    if (!newProduct.productId.trim() || !newProduct.keyword.trim()) {
      alert('상품 ID와 키워드를 모두 입력해주세요.');
      return;
    }

    setIsAdding(true);
    
    // 새 상품 추가 (시뮬레이션)
    const product: Product = {
      id: Date.now().toString(),
      productId: newProduct.productId.trim(),
      keyword: newProduct.keyword.trim(),
      currentRank: null,
      previousRank: null,
      lastChecked: new Date().toISOString(),
      status: 'pending',
      productName: `상품 ${newProduct.productId}`,
      price: '₩0',
      image: '/placeholder-product.jpg'
    };

    setProducts(prev => [product, ...prev]);
    setNewProduct({ productId: '', keyword: '' });
    setIsAdding(false);
  };

  const checkRanking = async (productId: string) => {
    setIsChecking(true);
    
    // 랭킹 체크 시뮬레이션 (실제로는 API 호출)
    setTimeout(() => {
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          const newRank = Math.floor(Math.random() * 100) + 1;
          return {
            ...p,
            previousRank: p.currentRank,
            currentRank: newRank,
            lastChecked: new Date().toISOString(),
            status: 'completed'
          };
        }
        return p;
      }));
      setIsChecking(false);
    }, 2000);
  };

  const checkAllRankings = async () => {
    setIsChecking(true);
    
    // 모든 상품 랭킹 체크
    for (const product of products) {
      if (product.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProducts(prev => prev.map(p => {
          if (p.id === product.id) {
            const newRank = Math.floor(Math.random() * 100) + 1;
            return {
              ...p,
              previousRank: p.currentRank,
              currentRank: newRank,
              lastChecked: new Date().toISOString(),
              status: 'completed'
            };
          }
          return p;
        }));
      }
    }
    setIsChecking(false);
  };

  const removeProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const getRankChange = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return null;
    return current - previous;
  };

  const getRankChangeIcon = (change: number | null) => {
    if (change === null) return '➖';
    if (change < 0) return '🔼'; // 순위 상승 (숫자 감소)
    if (change > 0) return '🔽'; // 순위 하락 (숫자 증가)
    return '➖'; // 변화 없음
  };

  const getRankChangeColor = (change: number | null) => {
    if (change === null) return 'text-gray-500';
    if (change < 0) return 'text-green-600'; // 순위 상승
    if (change > 0) return 'text-red-600'; // 순위 하락
    return 'text-gray-500'; // 변화 없음
  };

  return (
    <div className="space-y-6">
      {/* 새 상품 추가 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">새 상품 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productId">상품 ID</Label>
              <Input
                id="productId"
                placeholder="쿠팡 상품 ID 입력"
                value={newProduct.productId}
                onChange={(e) => setNewProduct(prev => ({ ...prev, productId: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="keyword">검색 키워드</Label>
              <Input
                id="keyword"
                placeholder="검색할 키워드 입력"
                value={newProduct.keyword}
                onChange={(e) => setNewProduct(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </div>
          </div>
          <Button 
            onClick={addProduct} 
            disabled={isAdding}
            className="mt-4 w-full md:w-auto"
          >
            {isAdding ? '추가 중...' : '상품 추가'}
          </Button>
        </CardContent>
      </Card>

      {/* 상품 목록 */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">추적 중인 상품</CardTitle>
              <Button 
                onClick={checkAllRankings} 
                disabled={isChecking}
                variant="outline"
              >
                {isChecking ? '체크 중...' : '전체 체크'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        📦
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{product.productName}</h4>
                        <p className="text-sm text-gray-500">ID: {product.productId}</p>
                        <p className="text-sm text-gray-500">키워드: {product.keyword}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeProduct(product.id)}
                      variant="outline"
                      size="sm"
                    >
                      삭제
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-500">현재 순위</p>
                      <p className="text-lg font-semibold">
                        {product.currentRank ? `${product.currentRank}위` : '미확인'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">이전 순위</p>
                      <p className="text-lg font-semibold">
                        {product.previousRank ? `${product.previousRank}위` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">변화</p>
                      <p className={`text-lg font-semibold ${getRankChangeColor(getRankChange(product.currentRank, product.previousRank))}`}>
                        {getRankChangeIcon(getRankChange(product.currentRank, product.previousRank))}
                        {(() => {
                          const change = getRankChange(product.currentRank, product.previousRank);
                          if (change === null) return '-';
                          if (change === 0) return '0';
                          return Math.abs(change);
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">마지막 체크</p>
                      <p className="text-sm">
                        {new Date(product.lastChecked).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-center">
                    <Button
                      onClick={() => checkRanking(product.id)}
                      disabled={isChecking || product.status === 'checking'}
                      size="sm"
                    >
                      {product.status === 'checking' ? '체크 중...' : '순위 체크'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 빈 상태 */}
      {products.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">추적할 상품이 없습니다</h3>
            <p className="text-gray-500 mb-4">
              위에서 상품 ID와 키워드를 입력하여 첫 번째 상품을 추가해보세요
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
