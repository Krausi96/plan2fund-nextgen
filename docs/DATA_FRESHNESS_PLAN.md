# Plan2Fund Data Freshness Plan

## **Overview**
This document outlines the data freshness strategy for Plan2Fund, ensuring program data remains current and accurate for optimal user experience.

## **Data Sources & Update Frequency**

### **Primary Sources**
1. **FFG (Austrian Research Promotion Agency)**
   - Update Frequency: Weekly
   - Data: Grant programs, deadlines, criteria
   - Source: https://www.ffg.at/en/ecall

2. **WKO (Austrian Chamber of Commerce)**
   - Update Frequency: Monthly
   - Data: Business support programs, loans
   - Source: https://www.wko.at

3. **AWS (Austria Wirtschaftsservice)**
   - Update Frequency: Weekly
   - Data: Startup funding, innovation grants
   - Source: https://www.aws.at

4. **i2b Initiative**
   - Update Frequency: Monthly
   - Data: Business plan templates, guidance
   - Source: https://www.i2b.at

### **Secondary Sources**
- EU funding databases (monthly)
- Bank loan programs (quarterly)
- Regional funding programs (monthly)

## **Data Freshness Workflow**

### **1. Automated Data Collection**
```typescript
// PR Bot Implementation
interface DataFreshnessBot {
  // Check for updates every 6 hours
  checkInterval: '6h';
  
  // Sources to monitor
  sources: {
    ffg: { url: string; lastChecked: Date; };
    wko: { url: string; lastChecked: Date; };
    aws: { url: string; lastChecked: Date; };
  };
  
  // Update detection
  detectChanges(): Promise<Change[]>;
  
  // Create PR for updates
  createUpdatePR(changes: Change[]): Promise<string>;
}
```

### **2. Change Detection Strategy**
- **Content Hashing**: Compare content hashes of program pages
- **Date Parsing**: Extract and compare deadline dates
- **Criteria Comparison**: Detect changes in eligibility criteria
- **Amount Updates**: Track funding amount changes

### **3. Update Process**
1. **Detection**: Bot detects changes in source websites
2. **Validation**: Human reviewer validates changes
3. **Update**: Changes applied to program database
4. **Testing**: Automated tests verify data integrity
5. **Deployment**: Updated data deployed to production

## **Data Quality Checks**

### **Automated Validation**
```typescript
interface DataQualityChecks {
  // Required fields validation
  requiredFields: {
    id: string;
    name: string;
    deadline: Date;
    amount: { min: number; max: number; };
    eligibility: string[];
  };
  
  // Data consistency checks
  consistencyChecks: {
    deadlineNotPassed: boolean;
    amountRangeValid: boolean;
    eligibilityComplete: boolean;
  };
  
  // Format validation
  formatValidation: {
    dateFormat: 'ISO-8601';
    currencyFormat: 'EUR';
    urlFormat: 'https://';
  };
}
```

### **Manual Review Process**
1. **Weekly Review**: Review all detected changes
2. **Monthly Audit**: Full program database audit
3. **Quarterly Cleanup**: Remove expired programs
4. **Annual Refresh**: Complete data source review

## **Monitoring & Alerts**

### **Data Freshness Metrics**
- **Last Updated**: Track when each program was last updated
- **Source Freshness**: Monitor source website update frequency
- **Expired Programs**: Count programs past their deadline
- **Stale Data**: Programs not updated in 30+ days

### **Alert Thresholds**
- **Critical**: Program deadline passed but still active
- **Warning**: Program not updated in 14 days
- **Info**: New programs detected and ready for review

### **Monitoring Dashboard**
```typescript
interface FreshnessDashboard {
  totalPrograms: number;
  updatedLast7Days: number;
  updatedLast30Days: number;
  expiredPrograms: number;
  stalePrograms: number;
  pendingUpdates: number;
}
```

## **Implementation Plan**

### **Phase 1: Basic Monitoring (Week 1)**
- [ ] Set up data freshness tracking
- [ ] Implement basic change detection
- [ ] Create monitoring dashboard
- [ ] Set up alerts for critical issues

### **Phase 2: Automated Updates (Week 2)**
- [ ] Build PR bot for automated updates
- [ ] Implement data validation pipeline
- [ ] Set up automated testing
- [ ] Create review workflow

### **Phase 3: Advanced Features (Week 3)**
- [ ] Machine learning for change detection
- [ ] Predictive analytics for program updates
- [ ] Advanced data quality scoring
- [ ] Integration with external APIs

## **Data Retention Policy**

### **Active Programs**
- Keep all active programs indefinitely
- Update at least monthly
- Archive when deadline passes

### **Expired Programs**
- Archive after 6 months past deadline
- Keep for historical analysis
- Remove after 2 years

### **Historical Data**
- Maintain change history for 2 years
- Use for trend analysis and improvements
- GDPR compliant data handling

## **Success Metrics**

### **Data Quality KPIs**
- **Freshness Rate**: >95% of programs updated in last 30 days
- **Accuracy Rate**: >99% of program data accurate
- **Update Speed**: <24 hours from source change to deployment
- **Error Rate**: <1% of automated updates require manual correction

### **User Impact KPIs**
- **Reduced 0-Match Rate**: <5% of users get no matches
- **Improved Recommendation Quality**: Higher user satisfaction scores
- **Faster User Flows**: Reduced time to find relevant programs

## **Tools & Technologies**

### **Data Collection**
- **Web Scraping**: Puppeteer for dynamic content
- **API Integration**: Direct APIs where available
- **Change Detection**: Content hashing and diff algorithms

### **Data Storage**
- **Airtable**: Primary program database
- **GitHub**: Version control for program data
- **Monitoring**: Custom dashboard with real-time metrics

### **Automation**
- **GitHub Actions**: CI/CD for data updates
- **PR Bot**: Automated pull request creation
- **Slack Integration**: Alerts and notifications

## **Risk Mitigation**

### **Data Source Changes**
- Monitor for website structure changes
- Maintain fallback data sources
- Quick response team for critical updates

### **Data Quality Issues**
- Automated validation before deployment
- Human review for all changes
- Rollback capability for problematic updates

### **Legal Compliance**
- Respect robots.txt and rate limiting
- GDPR compliant data handling
- Regular legal review of data collection practices
