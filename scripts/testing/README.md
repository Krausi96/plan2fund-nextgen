# Layer 1 Testing Scripts

This directory contains comprehensive test scripts for Layer 1 (Data Collection) functionality.

## 🚀 Quick Start

### 1. Quick Test (2 minutes)
```bash
npm run test:layer1
```
**What it tests:**
- API endpoints accessibility
- URL discovery (sitemaps)
- Requirements extraction patterns
- Rate limiting compliance
- Basic functionality

### 2. Full Test Suite (10 minutes)
```bash
npm run test:layer1:full
```
**What it tests:**
- Complete Layer 1 flow
- All enhanced features
- Error handling
- Health monitoring
- End-to-end functionality

## 📋 Test Categories

### 1. URL Discovery Tests
- **Sitemap Parsing** - Tests XML sitemap accessibility
- **Link Discovery** - Tests main page accessibility
- **Pattern Matching** - Tests common funding page patterns

### 2. Source Discovery Tests
- **Auto-Discovery** - Tests automatic source finding
- **Source Validation** - Tests source validation logic
- **Domain Filtering** - Tests government source filtering

### 3. Requirements Extraction Tests
- **Pattern Matching** - Tests AI-powered pattern recognition
- **Evidence Collection** - Tests text snippet capture
- **Confidence Scoring** - Tests accuracy rating
- **Funding Amounts** - Tests monetary value extraction
- **Deadlines** - Tests deadline detection

### 4. Rate Limiting Tests
- **Rate Limit Config** - Tests source-specific limits
- **Robots.txt Compliance** - Tests website rule respect
- **Request Delays** - Tests timing compliance

### 5. Data Validation Tests
- **Required Fields** - Tests field completeness
- **URL Validation** - Tests URL format validation
- **Requirements Validation** - Tests requirement structure
- **Funding Validation** - Tests monetary value validation

### 6. Health Monitoring Tests
- **Health Status** - Tests monitoring system
- **Error Tracking** - Tests error counting
- **Performance Metrics** - Tests response time tracking

### 7. End-to-End Tests
- **Complete Flow** - Tests entire Layer 1 process
- **Integration** - Tests component integration
- **Real Data** - Tests with actual examples

## 🎯 Expected Results

### Quick Test
- ✅ **4-5 tests should pass**
- ✅ **API endpoints accessible**
- ✅ **Pattern matching working**
- ✅ **Basic functionality confirmed**

### Full Test Suite
- ✅ **20+ tests should pass**
- ✅ **All features working**
- ✅ **Error handling confirmed**
- ✅ **Production readiness verified**

## 🔧 Troubleshooting

### Common Issues

1. **API Not Running**
   ```bash
   npm run dev
   # Then run tests in another terminal
   ```

2. **Network Issues**
   - Check internet connection
   - Some tests require external website access

3. **Permission Issues**
   - Ensure scripts are executable
   - Check file permissions

### Debug Mode
```bash
# Run with detailed logging
DEBUG=1 npm run test:layer1:full
```

## 📊 Test Results

### Success Indicators
- ✅ **All tests pass**
- ✅ **Real data returned**
- ✅ **No errors in logs**
- ✅ **Performance within limits**

### Failure Indicators
- ❌ **API endpoints not accessible**
- ❌ **Pattern matching failing**
- ❌ **Network timeouts**
- ❌ **Validation errors**

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - Layer 1 is production ready
   - Run the scraper: `curl -X POST http://localhost:3000/api/scraper/run`
   - Check results: `curl http://localhost:3000/api/programs`

2. **If tests fail:**
   - Check error messages
   - Verify API is running
   - Check network connectivity
   - Review configuration

## 📝 Test Files

- `quick-layer1-test.js` - Fast basic tests
- `test-layer1-complete.js` - Comprehensive test suite
- `run-layer1-test.js` - Test runner
- `README.md` - This documentation

## 🎉 Success!

When all tests pass, Layer 1 is confirmed to be:
- ✅ **Functionally complete**
- ✅ **Production ready**
- ✅ **Error handling robust**
- ✅ **Performance optimized**
- ✅ **Monitoring active**

**Layer 1 is ready for real-world data collection!** 🚀
