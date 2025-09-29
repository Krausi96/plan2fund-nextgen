# Manual Requirements Collection Guide

## Why Manual Collection First?

GPT was right - you should manually collect and verify requirements before building any automated system. This ensures:
- ✅ Data accuracy
- ✅ Complete information
- ✅ Understanding of what's actually needed
- ✅ Validation of the requirements structure

## Step-by-Step Process

### 1. Choose Programs to Collect
Start with 3-5 key programs:
- **aws Preseed** (most important)
- **FFG Basic Research** 
- **Bank loan** (e.g., Raiffeisen)
- **Equity program** (e.g., Speedinvest)
- **Visa program** (e.g., RWR)

### 2. Use the Collection Tool
1. Open `testrec/manual-collection/requirements-collector.html` in your browser
2. Click "Load Sample Data" to see how it works
3. Clear the data and start collecting for your first program

### 3. For Each Program, Collect:

#### Basic Information
- Program name
- Program type (grant/loan/equity/visa)
- Source URL (official website)
- Funding amount limits
- Project duration

#### Eligibility Requirements
- Who can apply?
- Company stage requirements
- Geographic requirements
- Industry/sector requirements
- Team requirements

#### Document Requirements
- Business plan requirements
- Financial statements needed
- Legal documents required
- Technical documentation
- CVs and team information

#### Financial Requirements
- Funding amount limits
- Co-financing requirements
- Financial projections needed
- Budget breakdown requirements
- Use of funds specification

#### Technical Requirements
- Technology readiness level
- Innovation requirements
- Technical feasibility
- Intellectual property requirements

#### Questions to Ask Users
- What questions help determine eligibility?
- What questions assess program fit?
- What questions identify gaps?

#### Business Plan Sections
- What sections should be included?
- What content is required for each section?
- What formatting is needed?

### 4. Verification Process

For each program you collect:

1. **Visit the official website** and verify all information
2. **Check program guidelines** for detailed requirements
3. **Look for application forms** to see what's actually asked
4. **Verify funding amounts** and deadlines
5. **Check eligibility criteria** carefully

### 5. Quality Checklist

Before considering a program "collected":

- [ ] All basic information is accurate
- [ ] Eligibility requirements are complete
- [ ] Document requirements are specific
- [ ] Financial requirements are clear
- [ ] Questions are relevant and useful
- [ ] Editor sections are comprehensive
- [ ] Source URL is verified
- [ ] Information is up-to-date

### 6. Export and Review

1. Use the "Export as JSON" button
2. Review the exported data
3. Save it as `[program_name]_requirements.json`
4. Store in `testrec/manual-collection/collected/`

## Example: aws Preseed Collection

### Basic Information
- **Program Name**: aws Preseed – Innovative Solutions
- **Type**: Grant
- **Source**: https://www.aws.at/en/aws-preseed-innovative-solutions/
- **Amount**: €100,000 max
- **Duration**: 12 months

### Eligibility Requirements
1. **Company Stage**: Natural persons (teams) or companies ≤6 months after registration
2. **Location**: Project location in Austria
3. **Innovation**: High degree of innovation with scalable market potential
4. **Focus Areas**: Diversity, environment/climate, health/care, education, mobility, urban development

### Document Requirements
1. **Business Plan**: Follow programme document & templates
2. **Project Description**: Detailed technical approach
3. **Team CVs**: All team members
4. **Budget Breakdown**: Detailed use of funds

### Questions to Ask Users
1. "What is your company stage?" (Just an idea, Recently started, Established)
2. "Will your project be executed in Austria?" (Yes/No)
3. "How much funding are you seeking?" (Number input)
4. "What is your technology readiness level?" (TRL 1-9)

### Editor Sections
1. **Executive Summary**: Brief overview, funding request, expected outcomes
2. **Project Description**: Technical approach, innovation aspects, timeline
3. **Financial Planning**: Funding request, budget breakdown, projections
4. **Team**: Qualifications, experience, roles

## Tips for Collection

### 1. Be Specific
Instead of "Business plan required", collect:
- "Business plan, 15-25 pages, following program guidelines"
- "Include executive summary, project description, financial projections"
- "Must address innovation and market potential"

### 2. Include Examples
- "Company stage: GmbH registered 3 months ago, Einzelunternehmen, Team of individuals"
- "TRL levels: TRL 3 (proof of concept), TRL 4 (lab validation), TRL 5 (prototype)"

### 3. Note Requirements vs Preferences
- **Required**: Must have this to apply
- **Preferred**: Helps with scoring but not mandatory
- **Optional**: Nice to have but not necessary

### 4. Capture Guidance
- "Check company registration date or team formation date"
- "Provide Austrian address and confirm project execution location"
- "Clearly articulate what makes your solution innovative"

## Next Steps After Collection

1. **Review collected data** for completeness and accuracy
2. **Test the requirements structure** with sample data
3. **Validate with real users** if possible
4. **Build the enhanced system** based on collected data
5. **Iterate and improve** based on feedback

## Files to Create

After collecting each program, save as:
- `testrec/manual-collection/collected/aws_preseed_requirements.json`
- `testrec/manual-collection/collected/ffg_basic_research_requirements.json`
- `testrec/manual-collection/collected/raiffeisen_loan_requirements.json`
- etc.

This manual collection process ensures you have high-quality, verified data before building any automated system.
