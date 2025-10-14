import requests
import time
import re
import json
from datetime import datetime
from urllib.parse import quote

class OptimizedCoupangRankChecker:
    def __init__(self):
        self.session = requests.Session()
        self.setup_headers()
        
    def setup_headers(self):
        """PC web headers setup"""
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        })
    
    def get_current_ip(self):
        """Check current IP info"""
        try:
            response = requests.get('https://ipinfo.io/json', timeout=10)
            ip_info = response.json()
            print(f"Current IP: {ip_info.get('ip')}")
            print(f"ISP: {ip_info.get('org')}")
            return ip_info
        except Exception as e:
            print(f"IP check failed: {e}")
            return None
    
    def search_products_with_retry(self, keyword, max_retries=3):
        """Search products with retry logic"""
        print(f"\nSearching for: {keyword}")
        
        for attempt in range(max_retries):
            try:
                # Coupang search URL
                search_url = f"https://www.coupang.com/np/search?q={quote(keyword)}"
                print(f"Attempt {attempt + 1}: {search_url}")
                
                # Increase timeout for each attempt
                timeout = 30 + (attempt * 15)  # 30, 45, 60 seconds
                
                start_time = time.time()
                response = self.session.get(search_url, timeout=timeout)
                end_time = time.time()
                
                response_time = round((end_time - start_time) * 1000, 2)
                
                if response.status_code == 200:
                    print(f"SUCCESS: {response.status_code} ({response_time}ms) - {len(response.text)} bytes")
                    
                    # Extract product info
                    products = self.extract_product_info(response.text)
                    return products
                else:
                    print(f"HTTP ERROR: {response.status_code} ({response_time}ms)")
                    
            except requests.exceptions.Timeout:
                print(f"TIMEOUT: Attempt {attempt + 1} timed out after {timeout}s")
            except requests.exceptions.ConnectionError:
                print(f"CONNECTION ERROR: Attempt {attempt + 1} failed")
            except Exception as e:
                print(f"ERROR: Attempt {attempt + 1} - {e}")
            
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 5  # 5, 10, 15 seconds
                print(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
        
        print("All attempts failed")
        return []
    
    def extract_product_info(self, html_content):
        """Extract product info from HTML"""
        products = []
        
        # Product link pattern
        product_pattern = r'/products/(\d+)'
        product_ids = re.findall(product_pattern, html_content)
        
        # Product title pattern (more flexible)
        title_patterns = [
            r'<dt class="name">.*?<a[^>]*>([^<]+)</a>',
            r'<a[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)</a>',
            r'data-product-id="[^"]*"[^>]*>([^<]+)</a>'
        ]
        
        titles = []
        for pattern in title_patterns:
            found_titles = re.findall(pattern, html_content, re.DOTALL)
            if found_titles:
                titles = found_titles
                break
        
        # Price pattern (more flexible)
        price_patterns = [
            r'<strong class="price-value">([^<]+)</strong>',
            r'<span class="price-value">([^<]+)</span>',
            r'data-price="([^"]*)"'
        ]
        
        prices = []
        for pattern in price_patterns:
            found_prices = re.findall(pattern, html_content)
            if found_prices:
                prices = found_prices
                break
        
        # Review count pattern
        review_pattern = r'<span class="rating-total-count">\(([^)]+)\)</span>'
        reviews = re.findall(review_pattern, html_content)
        
        # Combine product info
        max_items = min(len(product_ids), len(titles), len(prices))
        
        for i in range(max_items):
            product_info = {
                'rank': i + 1,
                'product_id': product_ids[i],
                'title': titles[i].strip() if i < len(titles) else 'N/A',
                'price': prices[i].strip() if i < len(prices) else 'N/A',
                'reviews': reviews[i].strip() if i < len(reviews) else '0',
                'timestamp': datetime.now().isoformat()
            }
            
            products.append(product_info)
        
        return products
    
    def check_rank(self, keyword):
        """Check product rank for keyword"""
        print(f"\nRank check started: {keyword}")
        
        # Check IP
        self.get_current_ip()
        
        # Search products with retry
        products = self.search_products_with_retry(keyword)
        
        if not products:
            print("No products found.")
            return None
        
        # Display results
        print(f"\nSearch results (Total {len(products)} products):")
        print("-" * 80)
        print(f"{'Rank':<4} {'Product ID':<12} {'Title':<40} {'Price':<10} {'Reviews':<8}")
        print("-" * 80)
        
        for product in products[:20]:  # Show top 20 only
            title = product['title'][:37] + "..." if len(product['title']) > 40 else product['title']
            print(f"{product['rank']:<4} {product['product_id']:<12} {title:<40} {product['price']:<10} {product['reviews']:<8}")
        
        return products
    
    def save_rank_data(self, keyword, products, filename=None):
        """Save rank data"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"rank_data_{keyword}_{timestamp}.json"
        
        data = {
            'keyword': keyword,
            'timestamp': datetime.now().isoformat(),
            'total_products': len(products),
            'products': products
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Rank data saved: {filename}")
        return filename

def main():
    """Main execution function"""
    print("Optimized Hybrid Coupang Rank Checker System")
    print("=" * 60)
    
    checker = OptimizedCoupangRankChecker()
    
    # Test keywords
    test_keywords = [
        "mouse",
        "keyboard"
    ]
    
    for keyword in test_keywords:
        try:
            # Check rank
            products = checker.check_rank(keyword)
            
            if products:
                # Save data
                checker.save_rank_data(keyword, products)
            
            print("\n" + "="*60)
            time.sleep(5)  # Wait between keywords
            
        except Exception as e:
            print(f"Error searching {keyword}: {e}")
            continue
    
    print("Optimized hybrid rank check completed!")

if __name__ == "__main__":
    main()










