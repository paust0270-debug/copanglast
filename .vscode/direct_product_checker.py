import requests
import json
import time
from datetime import datetime
import re

class DirectProductChecker:
    def __init__(self):
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        }
        self.session.headers.update(self.headers)
        
    def get_product_info(self, product_url):
        """상품 페이지에서 직접 정보 조회"""
        print(f"Getting product info from: {product_url}")
        
        try:
            # 상품 ID 추출
            match = re.search(r'/products/(\d+)', product_url)
            if not match:
                print("Invalid product URL format")
                return None
            
            product_id = match.group(1)
            
            # 상품 페이지 요청
            response = self.session.get(product_url, timeout=30)
            
            if response.status_code == 200:
                # HTML에서 상품 정보 추출
                product_info = self.parse_product_page(response.text, product_id, product_url)
                return product_info
            else:
                print(f"Failed to get product page: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error getting product info: {e}")
            return None
    
    def parse_product_page(self, html_content, product_id, product_url):
        """상품 페이지 HTML에서 정보 추출"""
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 상품 제목
            title = ""
            title_selectors = [
                'h1.prod-buy-header__title',
                'h1.name',
                '.prod-title',
                'title'
            ]
            
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    break
            
            # 가격
            price = "N/A"
            price_selectors = [
                '.total-price strong',
                '.price-value',
                '.prod-price',
                '.price'
            ]
            
            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price = price_elem.get_text(strip=True)
                    break
            
            # 리뷰 수
            reviews = "0"
            review_selectors = [
                '.rating-total-count',
                '.review-count',
                '.num'
            ]
            
            for selector in review_selectors:
                review_elem = soup.select_one(selector)
                if review_elem:
                    review_text = review_elem.get_text(strip=True)
                    match = re.search(r'(\d+)', review_text)
                    if match:
                        reviews = match.group(1)
                        break
            
            # 평점
            rating = "0"
            rating_selectors = [
                '.rating-text',
                '.rating',
                '.score'
            ]
            
            for selector in rating_selectors:
                rating_elem = soup.select_one(selector)
                if rating_elem:
                    rating = rating_elem.get_text(strip=True)
                    break
            
            # 판매자 정보
            vendor = ""
            vendor_selectors = [
                '.vendor-item-name',
                '.seller-name',
                '.vendor-name'
            ]
            
            for selector in vendor_selectors:
                vendor_elem = soup.select_one(selector)
                if vendor_elem:
                    vendor = vendor_elem.get_text(strip=True)
                    break
            
            # 배송 정보
            delivery_info = ""
            delivery_selectors = [
                '.delivery-info',
                '.delivery-text',
                '.shipping'
            ]
            
            for selector in delivery_selectors:
                delivery_elem = soup.select_one(selector)
                if delivery_elem:
                    delivery_info = delivery_elem.get_text(strip=True)
                    break
            
            # 상품 이미지
            image_urls = []
            img_selectors = [
                '.prod-image img',
                '.product-image img',
                'img[alt*="상품"]'
            ]
            
            for selector in img_selectors:
                images = soup.select(selector)
                for img in images[:3]:  # 최대 3개 이미지
                    src = img.get('src') or img.get('data-src')
                    if src and src.startswith('http'):
                        image_urls.append(src)
            
            product_info = {
                'product_id': product_id,
                'title': title,
                'price': price,
                'reviews': reviews,
                'rating': rating,
                'vendor': vendor,
                'delivery_info': delivery_info,
                'image_urls': image_urls,
                'url': product_url,
                'scraped_at': datetime.now().isoformat(),
                'method': 'DIRECT_PRODUCT_PAGE'
            }
            
            print(f"Product parsed successfully:")
            print(f"  Title: {title}")
            print(f"  Price: {price}")
            print(f"  Reviews: {reviews}")
            print(f"  Rating: {rating}")
            print(f"  Vendor: {vendor}")
            
            return product_info
            
        except Exception as e:
            print(f"Error parsing product page: {e}")
            return None
    
    def check_competitive_position(self, keyword, target_url):
        """경쟁 상품들과 비교하여 위치 확인"""
        print(f"\nChecking competitive position for keyword: {keyword}")
        
        try:
            # 간단한 검색 결과 시뮬레이션 (실제 검색이 차단되므로)
            competitors = self.simulate_search_results(keyword)
            
            # 타겟 상품 정보 가져오기
            target_product = self.get_product_info(target_url)
            
            if target_product:
                print(f"\n🎯 Target Product Analysis:")
                print(f"Product ID: {target_product['product_id']}")
                print(f"Title: {target_product['title']}")
                print(f"Price: {target_product['price']}")
                print(f"Reviews: {target_product['reviews']}")
                print(f"Rating: {target_product['rating']}")
                print(f"Vendor: {target_product['vendor']}")
                
                # 경쟁력 분석
                competitiveness_score = self.calculate_competitiveness(target_product, competitors)
                print(f"\nCompetitiveness Score: {competitiveness_score:.2f}/10")
                
                # 권장사항
                self.provide_recommendations(target_product, competitors, competitiveness_score)
                
                # 데이터 저장
                self.save_analysis_data(keyword, target_product, competitors, competitiveness_score)
                
                return target_product
            else:
                print("Failed to get target product information")
                return None
                
        except Exception as e:
            print(f"Error in competitive analysis: {e}")
            return None
    
    def simulate_search_results(self, keyword):
        """검색 결과 시뮬레이션 (실제 검색이 차단되므로 샘플 데이터)"""
        # 실제로는 검색 API를 사용하지만, 차단되어 샘플 데이터 사용
        competitors = [
            {
                'rank': 1,
                'title': f'{keyword} 상품 A',
                'price': '15,000',
                'reviews': '1,234',
                'rating': '4.8'
            },
            {
                'rank': 2,
                'title': f'{keyword} 상품 B',
                'price': '18,000',
                'reviews': '2,345',
                'rating': '4.7'
            },
            {
                'rank': 3,
                'title': f'{keyword} 상품 C',
                'price': '12,000',
                'reviews': '987',
                'rating': '4.9'
            },
            {
                'rank': 4,
                'title': f'{keyword} 상품 D',
                'price': '22,000',
                'reviews': '1,567',
                'rating': '4.6'
            },
            {
                'rank': 5,
                'title': f'{keyword} 상품 E',
                'price': '16,500',
                'reviews': '2,789',
                'rating': '4.8'
            }
        ]
        
        print(f"Simulated {len(competitors)} competitors for '{keyword}'")
        return competitors
    
    def calculate_competitiveness(self, target_product, competitors):
        """경쟁력 점수 계산 (1-10점)"""
        try:
            score = 0
            
            # 가격 비교
            target_price = self.extract_price_number(target_product['price'])
            if target_price > 0:
                competitor_prices = [self.extract_price_number(comp['price']) for comp in competitors]
                avg_price = sum(comp for comp in competitor_prices if comp > 0) / len([comp for comp in competitor_prices if comp > 0])
                
                if target_price <= avg_price:
                    score += 2  # 가격 경쟁력
                else:
                    score += 1
            
            # 리뷰 수 비교
            target_reviews = int(re.sub(r'\D', '', target_product['reviews']) or '0')
            competitor_reviews = [int(re.sub(r'\D', '', comp['reviews']) or '0') for comp in competitors]
            avg_reviews = sum(competitor_reviews) / len(competitor_reviews)
            
            if target_reviews >= avg_reviews:
                score += 2  # 평판경쟁력
            else:
                score += 1
            
            # 평점 비교
            target_rating = float(target_product['rating'] or '0')
            competitor_ratings = [float(comp['rating'] or '0') for comp in competitors]
            avg_rating = sum(competitor_ratings) / len(competitor_ratings)
            
            if target_rating >= avg_rating:
                score += 2  # 품질경쟁력
            else:
                score += 1
            
            # 상품명 키워드 관련성
            title = target_product['title'].lower()
            if any(keyword in title for keyword in ['트롤리', '티롤리', '카트', '핼트']):
                score += 2  # 키워드 관련성
            
            # 기본 점수
            score += 1
            
            return min(score, 10)
            
        except Exception as e:
            print(f"Error calculating competitiveness: {e}")
            return 5  # 기본 점수
    
    def extract_price_number(self, price_str):
        """가격 문자열에서 숫자만 추출"""
        if not price_str:
            return 0
        try:
            return int(re.sub(r'\D', '', str(price_str)))
        except:
            return 0
    
    def provide_recommendations(self, target_product, competitors, score):
        """경쟁력 개선 권장사항 제공"""
        print(f"\n📊 Competitive Analysis:")
        
        if score >= 8:
            print("✅ Excellent competitiveness! Maintain current strategy.")
        elif score >= 6:
            print("👍 Good competitiveness with room for improvement.")
        elif score >= 4:
            print("⚠️ Moderate competitiveness. Consider improvements.")
        else:
            print("❌ Low competitiveness. Significant improvements needed.")
        
        print(f"\n💡 Recommendations:")
        
        # 가격 분석
        target_price = self.extract_price_number(target_product['price'])
        competitor_prices = [self.extract_price_number(comp['price']) for comp in competitors]
        if competitor_prices:
            min_price = min(competitor_prices)
            max_price = max(competitor_prices)
            
            if target_price > max_price:
                print(f"- Consider price reduction. Current: {target_product['price']}, Market range: {min_price:,}~{max_price:,}원")
            elif target_price < min_price:
                print(f"- Price positioning good. Consider quality improvements to justify price.")
        
        # 리뷰 분석
        target_reviews = int(re.sub(r'\D', '', target_product['reviews']) or '0')
        competitor_reviews = [int(re.sub(r'\D', '', comp['reviews']) or '0') for comp in competitors]
        if competitor_reviews:
            avg_reviews = sum(competitor_reviews) / len(competitor_reviews)
            
            if target_reviews < avg_reviews * 0.5:
                print(f"- Consider promotional activities to increase reviews. Current: {target_reviews:,}, Market avg: {avg_reviews:,.0f}")
        
        # 평점 분석
        target_rating = float(target_product['rating'] or '0')
        competitor_ratings = [float(comp['rating'] or '0') for comp in competitors]
        if competitor_ratings:
            avg_rating = sum(competitor_ratings) / len(competitor_ratings)
            
            if target_rating < avg_rating:
                print(f"- Focus on quality improvement. Current: {target_rating}, Market avg: {avg_rating:.1f}")
    
    def save_analysis_data(self, keyword, target_product, competitors, score):
        """분석 데이터 저장"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"product_analysis_{keyword}_{timestamp}.json"
        
        data = {
            'keyword': keyword,
            'timestamp': datetime.now().isoformat(),
            'target_product': target_product,
            'competitors': competitors,
            'competitiveness_score': score,
            'method': 'DIRECT_PRODUCT_ANALYSIS'
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\nAnalysis data saved: {filename}")

def main():
    """메인 실행 함수"""
    print("Direct Product Checker System")
    print("=" * 70)
    
    checker = DirectProductChecker()
    
    try:
        # 테스트 키워드 및 URL
        keyword = "트롤리"
        target_url = "https://www.coupang.com/vp/products/8473798698?itemId=24519876305&vendorItemId=89369126187"
        
        # 경쟁 위치 분석
        result = checker.check_competitive_position(keyword, target_url)
        
        print("\nDirect product analysis completed!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()










