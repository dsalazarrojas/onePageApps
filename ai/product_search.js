addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Serve main interface
  if (path === '/' || path === '/search') {
    return serveSearchInterface();
  }

  // Handle search requests
  if (path === '/api/search' && request.method === 'POST') {
    return handleProductSearch(request);
  }

  // Handle barcode detection from image
  if (path === '/api/barcode' && request.method === 'POST') {
    return handleBarcodeDetection(request);
  }

  // Handle price comparison
  if (path === '/api/price-compare' && request.method === 'POST') {
    return handlePriceComparison(request);
  }

  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

async function handleProductSearch(request) {
  try {
    const { searchType, query, imageData } = await request.json();
    
    if (!searchType || !query) {
      return new Response(JSON.stringify({ error: 'Missing searchType or query' }), { 
        status: 400, 
        headers: jsonHeaders() 
      });
    }

    let searchQuery = query;

    // If searching from image, extract text first
    if (searchType === 'image_text' && imageData) {
      const extractedText = await extractTextFromImage(imageData);
      if (extractedText && extractedText.trim()) {
        searchQuery = extractedText;
      } else {
        return new Response(JSON.stringify({ error: 'No text found in image' }), { 
          status: 400, 
          headers: jsonHeaders() 
        });
      }
    }

    // If it's a barcode search, clean up the barcode
    if (searchType === 'barcode') {
      searchQuery = searchQuery.replace(/[\s\-\(\)]/g, ''); // Remove spaces, dashes, parentheses
    }

    // Search multiple product databases
    const results = await Promise.allSettled([
      searchAmazon(searchQuery),
      searchGoogleShopping(searchQuery),
      searchEbay(searchQuery),
      searchBestBuy(searchQuery)
    ]);

    const products = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        products.push(...result.value);
      }
    });

    // Remove duplicates based on title similarity
    const uniqueProducts = removeDuplicates(products);

    // Sort by relevance (this would be more sophisticated in production)
    const sortedProducts = uniqueProducts.sort((a, b) => {
      const scoreA = calculateRelevanceScore(a, searchQuery);
      const scoreB = calculateRelevanceScore(b, searchQuery);
      return scoreB - scoreA;
    });

    return new Response(JSON.stringify({ 
      products: sortedProducts.slice(0, 20), // Limit to 20 results
      query: searchQuery,
      searchType,
      totalResults: sortedProducts.length,
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Search failed' }), { 
      status: 500, 
      headers: jsonHeaders() 
    });
  }
}

async function handleBarcodeDetection(request) {
  try {
    const { imageData } = await request.json();
    
    if (!imageData) {
      return new Response(JSON.stringify({ error: 'Missing imageData' }), { 
        status: 400, 
        headers: jsonHeaders() 
      });
    }

    // In a real implementation, you'd use:
    // - Google Vision API for barcode detection
    // - ZXing library
    // - Third-party barcode APIs
    
    // For demo purposes, we'll simulate barcode detection
    const mockBarcodes = [
      '012345678905', // EAN-13 example
      '123456789012',
      '978020137962', // ISBN example
      '4006381333931'
    ];

    // Randomly select a mock barcode (in production, this would be real detection)
    const detectedBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];

    return new Response(JSON.stringify({ 
      barcode: detectedBarcode,
      format: 'EAN-13',
      confidence: 85,
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Barcode detection failed' }), { 
      status: 500, 
      headers: jsonHeaders() 
    });
  }
}

async function handlePriceComparison(request) {
  try {
    const { productIds, platforms } = await request.json();
    
    if (!productIds || !platforms) {
      return new Response(JSON.stringify({ error: 'Missing productIds or platforms' }), { 
        status: 400, 
        headers: jsonHeaders() 
      });
    }

    const comparison = await Promise.all(platforms.map(async platform => {
      const prices = await getPlatformPrices(platform, productIds);
      return {
        platform,
        prices,
        bestDeal: prices.length > 0 ? prices.reduce((min, price) => price.price < min.price ? price : min) : null
      };
    }));

    const summary = {
      totalPlatforms: platforms.length,
      platformsWithData: comparison.filter(p => p.prices.length > 0).length,
      bestOverall: getBestOverallPrice(comparison),
      priceRange: getPriceRange(comparison)
    };

    return new Response(JSON.stringify({ 
      comparison,
      summary,
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Price comparison failed' }), { 
      status: 500, 
      headers: jsonHeaders() 
    });
  }
}

// Mock API functions (in production, these would call real APIs)
async function searchAmazon(query) {
  // Mock Amazon search results
  const mockResults = [
    {
      id: 'amazon_1',
      title: `Amazon: ${query} - Premium Version`,
      price: 29.99,
      currency: 'USD',
      platform: 'Amazon',
      image: 'https://via.placeholder.com/150x150?text=Amazon',
      rating: 4.5,
      reviewCount: 1250,
      availability: 'In Stock',
      shipping: 'Prime Eligible',
      url: `https://amazon.com/s?k=${encodeURIComponent(query)}`,
      features: ['Free shipping', 'Prime eligible', '30-day returns']
    }
  ];
  
  return mockResults;
}

async function searchGoogleShopping(query) {
  // Mock Google Shopping results
  const mockResults = [
    {
      id: 'googleshop_1',
      title: `Google Shopping: ${query}`,
      price: 27.99,
      currency: 'USD',
      platform: 'Google Shopping',
      image: 'https://via.placeholder.com/150x150?text=Google',
      rating: 4.3,
      reviewCount: 890,
      availability: 'In Stock',
      shipping: 'Free shipping',
      url: `https://shopping.google.com/search?q=${encodeURIComponent(query)}`,
      features: ['Free shipping', 'Price comparison']
    }
  ];
  
  return mockResults;
}

async function searchEbay(query) {
  // Mock eBay search results
  const mockResults = [
    {
      id: 'ebay_1',
      title: `eBay: ${query} - Used/Like New`,
      price: 22.50,
      currency: 'USD',
      platform: 'eBay',
      image: 'https://via.placeholder.com/150x150?text=eBay',
      rating: 4.1,
      reviewCount: 567,
      availability: 'Available',
      shipping: 'Calculated at checkout',
      url: `https://ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
      features: ['Auction style', 'Seller ratings', 'Buyer protection']
    }
  ];
  
  return mockResults;
}

async function searchBestBuy(query) {
  // Mock Best Buy search results
  const mockResults = [
    {
      id: 'bestbuy_1',
      title: `Best Buy: ${query} - Geek Squad Certified`,
      price: 31.99,
      currency: 'USD',
      platform: 'Best Buy',
      image: 'https://via.placeholder.com/150x150?text=BestBuy',
      rating: 4.4,
      reviewCount: 234,
      availability: 'In Stock',
      shipping: 'Free pickup',
      url: `https://bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(query)}`,
      features: ['Geek Squad installation', 'Free technical support', '60-day returns']
    }
  ];
  
  return mockResults;
}

async function extractTextFromImage(imageData) {
  const apiKey = OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract any product names, brand names, model numbers, or any text that could be used to search for this product online. Return only the most relevant search terms.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`
              }
            }
          ]
        }
      ]
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await aiResp.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    console.error('Text extraction failed:', e);
    return null;
  }
}

function removeDuplicates(products) {
  const unique = [];
  const seen = new Set();

  products.forEach(product => {
    const normalizedTitle = product.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (!seen.has(normalizedTitle)) {
      seen.add(normalizedTitle);
      unique.push(product);
    }
  });

  return unique;
}

function calculateRelevanceScore(product, query) {
  const titleWords = product.title.toLowerCase().split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/);
  
  let score = 0;
  queryWords.forEach(word => {
    if (titleWords.some(titleWord => titleWord.includes(word))) {
      score += 10;
    }
  });

  // Boost score based on rating and review count
  score += (product.rating || 0) * 2;
  score += Math.log((product.reviewCount || 1)) * 0.5;

  return score;
}

async function getPlatformPrices(platform, productIds) {
  // Mock price tracking data
  const mockPrices = [
    {
      productId: productIds[0] || 'prod_1',
      price: 29.99 + Math.random() * 10,
      historicalLow: 24.99,
      lastUpdated: Date.now() - Math.random() * 86400000, // Random time within last day
      currency: 'USD',
      inStock: true
    }
  ];

  return mockPrices;
}

function getBestOverallPrice(comparison) {
  const allPrices = comparison.flatMap(p => p.prices);
  return allPrices.length > 0 ? allPrices.reduce((min, price) => 
    price.price < min.price ? price : min
  ) : null;
}

function getPriceRange(comparison) {
  const allPrices = comparison.flatMap(p => p.prices);
  if (allPrices.length === 0) return null;

  const prices = allPrices.map(p => p.price);
  return {
    lowest: Math.min(...prices),
    highest: Math.max(...prices),
    average: prices.reduce((sum, price) => sum + price, 0) / prices.length
  };
}

async function serveSearchInterface() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Search & Price Comparison</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .content {
            padding: 40px;
        }

        .search-tabs {
            display: flex;
            margin-bottom: 30px;
            border-radius: 10px;
            overflow: hidden;
            background: #f8f9fa;
        }

        .search-tab {
            flex: 1;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: background-color 0.3s ease;
            border: none;
            background: transparent;
            font-size: 16px;
            font-weight: 600;
        }

        .search-tab.active {
            background: #667eea;
            color: white;
        }

        .search-tab:hover:not(.active) {
            background: #e9ecef;
        }

        .search-section {
            display: none;
        }

        .search-section.active {
            display: block;
        }

        .text-search {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }

        .search-input {
            flex: 1;
            padding: 15px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 16px;
        }

        .search-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
        }

        .image-upload {
            border: 3px dashed #ddd;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            margin-bottom: 20px;
            transition: border-color 0.3s ease;
        }

        .image-upload.dragover {
            border-color: #667eea;
            background: #f0f4ff;
        }

        .image-preview {
            max-width: 300px;
            max-height: 200px;
            border-radius: 10px;
            margin: 20px 0;
            display: none;
        }

        .barcode-result {
            background: #e9ecef;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            display: none;
        }

        .results-section {
            margin-top: 30px;
            display: none;
        }

        .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .product-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
            border-left: 4px solid #667eea;
        }

        .product-card:hover {
            transform: translateY(-5px);
        }

        .product-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 15px;
        }

        .product-title {
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 1.1em;
        }

        .product-price {
            font-size: 1.5em;
            font-weight: bold;
            color: #28a745;
            margin-bottom: 10px;
        }

        .product-platform {
            color: #6c757d;
            font-size: 0.9em;
            margin-bottom: 10px;
        }

        .product-rating {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 10px;
        }

        .stars {
            color: #ffc107;
        }

        .product-features {
            list-style: none;
            margin-bottom: 15px;
        }

        .product-features li {
            font-size: 0.9em;
            color: #666;
            margin: 5px 0;
            padding-left: 15px;
            position: relative;
        }

        .product-features li:before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #28a745;
            font-weight: bold;
        }

        .product-actions {
            display: flex;
            gap: 10px;
        }

        .action-btn {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            text-align: center;
            transition: background-color 0.3s ease;
        }

        .view-btn {
            background: #667eea;
            color: white;
        }

        .view-btn:hover {
            background: #5a6fd8;
        }

        .compare-btn {
            background: #28a745;
            color: white;
        }

        .compare-btn:hover {
            background: #218838;
        }

        .comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .comparison-table th,
        .comparison-table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }

        .comparison-table th {
            background: #667eea;
            color: white;
            font-weight: 600;
        }

        .best-price {
            background: #d4edda;
            color: #155724;
            font-weight: bold;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #667eea;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }

        @media (max-width: 768px) {
            .container { margin: 10px; }
            .header, .content { padding: 20px; }
            .search-tabs { flex-direction: column; }
            .text-search { flex-direction: column; }
            .results-grid { grid-template-columns: 1fr; }
            .product-actions { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛍️ Product Search & Price Comparison</h1>
            <p>Find the best deals across multiple platforms with AI-powered search</p>
        </div>

        <div class="content">
            <div class="search-tabs">
                <button class="search-tab active" onclick="switchTab('text')">Text Search</button>
                <button class="search-tab" onclick="switchTab('barcode')">Barcode Scanner</button>
                <button class="search-tab" onclick="switchTab('image')">Image Search</button>
            </div>

            <!-- Text Search -->
            <div class="search-section active" id="text-search">
                <h3>🔍 Search by Product Name</h3>
                <div class="text-search">
                    <input type="text" id="textQuery" placeholder="Enter product name, brand, or model..." class="search-input">
                    <button class="search-btn" onclick="searchProducts('text')">Search</button>
                </div>
            </div>

            <!-- Barcode Search -->
            <div class="search-section" id="barcode-search">
                <h3>📱 Scan Barcode/QR Code</h3>
                <div class="image-upload" id="barcodeUpload">
                    <p>📷 Take a photo or upload an image with a barcode</p>
                    <input type="file" id="barcodeFile" accept="image/*" capture="environment">
                    <button class="upload-btn" onclick="document.getElementById('barcodeFile').click()">Scan Barcode</button>
                </div>
                <div id="barcodeResult" class="barcode-result"></div>
            </div>

            <!-- Image Search -->
            <div class="search-section" id="image-search">
                <h3>🖼️ Search from Product Image</h3>
                <div class="image-upload" id="imageUpload">
                    <p>Upload a product image to extract text and search for similar items</p>
                    <input type="file" id="imageFile" accept="image/*">
                    <button class="upload-btn" onclick="document.getElementById('imageFile').click()">Upload Image</button>
                    <img id="imagePreview" class="image-preview" alt="Preview">
                </div>
            </div>

            <!-- Loading Indicator -->
            <div id="loading" class="loading" style="display: none;">
                <h3>🔄 Searching across platforms...</h3>
                <p>Comparing prices from Amazon, eBay, Google Shopping, and more</p>
            </div>

            <!-- Error Display -->
            <div id="error" class="error" style="display: none;"></div>

            <!-- Results -->
            <div id="results" class="results-section">
                <h3>Search Results (<span id="resultCount">0</span> products found)</h3>
                <div class="results-grid" id="resultsGrid"></div>
            </div>
        </div>
    </div>

    <script>
        let currentImageData = null;
        let currentTab = 'text';

        function switchTab(tab) {
            currentTab = tab;
            
            // Update tab UI
            document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update section UI
            document.querySelectorAll('.search-section').forEach(s => s.classList.remove('active'));
            document.getElementById(tab + '-search').classList.add('active');
        }

        // Barcode scanning
        document.getElementById('barcodeFile').addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                await processBarcodeImage(file);
            }
        });

        async function processBarcodeImage(file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageData = e.target.result.split(',')[1];
                currentImageData = imageData;
                
                try {
                    showLoading();
                    const response = await fetch('/api/barcode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageData })
                    });

                    const data = await response.json();
                    
                    if (response.ok) {
                        showBarcodeResult(data);
                    } else {
                        throw new Error(data.error);
                    }
                } catch (error) {
                    showError('Barcode detection failed: ' + error.message);
                } finally {
                    hideLoading();
                }
            };
            reader.readAsDataURL(file);
        }

        function showBarcodeResult(data) {
            const resultDiv = document.getElementById('barcodeResult');
            resultDiv.innerHTML = \`
                <h4>📊 Barcode Detected</h4>
                <p><strong>Code:</strong> \${data.barcode}</p>
                <p><strong>Format:</strong> \${data.format}</p>
                <p><strong>Confidence:</strong> \${data.confidence}%</p>
                <button class="search-btn" onclick="searchProducts('barcode', '\${data.barcode}')">Search for this product</button>
            \`;
            resultDiv.style.display = 'block';
        }

        // Image search
        document.getElementById('imageFile').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('imagePreview').src = e.target.result;
                    document.getElementById('imagePreview').style.display = 'block';
                    currentImageData = e.target.result.split(',')[1];
                };
                reader.readAsDataURL(file);
            }
        });

        // Text search
        document.getElementById('textQuery').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts('text');
            }
        });

        async function searchProducts(type, query = null) {
            let searchQuery = query;
            
            if (!searchQuery) {
                if (type === 'text') {
                    searchQuery = document.getElementById('textQuery').value.trim();
                    if (!searchQuery) {
                        showError('Please enter a search term');
                        return;
                    }
                } else if (type === 'barcode' && !currentImageData) {
                    showError('Please scan a barcode first');
                    return;
                } else if (type === 'image_text' && !currentImageData) {
                    showError('Please upload an image first');
                    return;
                }
            }

            try {
                showLoading();
                hideError();

                const requestBody = {
                    searchType: type,
                    query: searchQuery
                };

                if (currentImageData && (type === 'image_text' || type === 'barcode')) {
                    requestBody.imageData = currentImageData;
                }

                const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();

                if (response.ok) {
                    displayResults(data);
                } else {
                    throw new Error(data.error || 'Search failed');
                }
            } catch (error) {
                showError('Search failed: ' + error.message);
            } finally {
                hideLoading();
            }
        }

        function displayResults(data) {
            document.getElementById('resultCount').textContent = data.products.length;
            
            const grid = document.getElementById('resultsGrid');
            grid.innerHTML = data.products.map(product => \`
                <div class="product-card">
                    <img src="\${product.image}" alt="\${product.title}" class="product-image">
                    <div class="product-title">\${product.title}</div>
                    <div class="product-price">\${product.currency} \${product.price}</div>
                    <div class="product-platform">🛒 \${product.platform}</div>
                    <div class="product-rating">
                        <span class="stars">\${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}</span>
                        <span>(\${product.reviewCount} reviews)</span>
                    </div>
                    <div class="product-availability">\${product.availability}</div>
                    <ul class="product-features">
                        \${product.features.map(feature => \`<li>\${feature}</li>\`).join('')}
                    </ul>
                    <div class="product-actions">
                        <a href="\${product.url}" target="_blank" class="action-btn view-btn">View Product</a>
                        <button class="action-btn compare-btn" onclick="comparePrice('\${product.id}')">Track Price</button>
                    </div>
                </div>
            \`).join('');

            document.getElementById('results').style.display = 'block';
            document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        }

        function comparePrice(productId) {
            alert('Price tracking feature would be implemented here. You would receive notifications when prices change.');
        }

        function showLoading() {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            hideError();
        }

        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
        }

        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        function hideError() {
            document.getElementById('error').style.display = 'none';
        }

        // Drag and drop for image uploads
        ['barcodeUpload', 'imageUpload'].forEach(uploadId => {
            const uploadDiv = document.getElementById(uploadId);
            uploadDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadDiv.classList.add('dragover');
            });
            uploadDiv.addEventListener('dragleave', () => {
                uploadDiv.classList.remove('dragover');
            });
            uploadDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadDiv.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    if (uploadId === 'barcodeUpload') {
                        processBarcodeImage(file);
                    } else {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            document.getElementById('imagePreview').src = e.target.result;
                            document.getElementById('imagePreview').style.display = 'block';
                            currentImageData = e.target.result.split(',')[1];
                        };
                        reader.readAsDataURL(file);
                    }
                }
            });
        });
    </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...corsHeaders() };
}

function textHeaders() {
  return { 'Content-Type': 'text/html', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}