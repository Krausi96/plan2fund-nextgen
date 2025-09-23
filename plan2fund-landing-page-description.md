# Plan2Fund Landing Page & Subpages - Complete Description (Enhanced)

## **LANDING PAGE (pages/index.tsx)**

| **Page/Section** | **Component** | **Content** | **CTAs** | **Breadcrumbs** | **Wired** | **Animations** | **Style** |
|------------------|---------------|-------------|----------|-----------------|-----------|----------------|-----------|
| **Landing Page** | **Hero Section** | • Main headline: "Find Your Perfect Funding Match"<br>• Subtitle: "Discover funding programs you qualify for and create a professional business plan in minutes"<br>• Data proof box with statistics | • Primary: "Start Your Plan" → `/editor`<br>• Secondary: "Get Recommendations" → `/reco` | No | Yes - Direct routing | • Fade-in from bottom (y: 30px, duration: 0.8s)<br>• Staggered animations (0.3s, 0.6s delays)<br>• Hover scale effects (1.05x)<br>• Background gradient animations | • Full-screen gradient background (blue to purple)<br>• White text with high contrast<br>• Rounded buttons (xl radius)<br>• Shadow effects on hover<br>• Responsive grid layout |
| **Landing Page** | **Who It's For** | • 4 target audiences: Austrian SMEs, Startups, Creative Professionals, Researchers<br>• Each with icon, title, description, and feature list<br>• Checkmark icons for features | • "Learn more" links → `/reco` | No | Yes - Direct routing | • Fade-in on scroll (y: 30px)<br>• Staggered delays (0.1s intervals)<br>• Icon scale on hover (1.1x)<br>• Card hover effects | • White background<br>• 4-column grid (responsive)<br>• Colored icon backgrounds<br>• Card hover shadows<br>• Green checkmark icons |
| **Landing Page** | **Why Austria** | • 3 key benefits: Innovation Ecosystem, Funding Programs, Business Environment<br>• Statistics and supporting text<br>• Austrian flag emoji | None | No | No | • Fade-in on scroll (y: 20px)<br>• 0.4s delay for content<br>• Icon animations | • White background<br>• 3-column centered layout<br>• Circular icon backgrounds<br>• Color-coded sections (blue, green, purple) |
| **Landing Page** | **How It Works** | • 3-step process: Search, Create, Apply<br>• Step numbers, icons, descriptions | • "Get Started" → `/editor` | No | Yes - Direct routing | • Fade-in on scroll (y: 20px)<br>• Staggered step animations (0.2s delays)<br>• Number badge animations | • Neutral-50 background<br>• 3-column grid<br>• Colored step numbers<br>• Icon backgrounds with colors<br>• Arrow CTA button |
| **Landing Page** | **Why Plan2Fund** | • 3 key features: Traceable Eligibility, Program-Aware Editor, Counterfactuals<br>• Side-by-side layout with icons | None | No | No | • Slide-in from sides (alternating)<br>• 0.1s staggered delays<br>• Icon hover effects | • Gradient background (primary-50 to blue-50)<br>• 2-column layout<br>• Large icon containers<br>• Side-by-side content layout |
| **Landing Page** | **CTA Strip** | • "Ready to find your perfect funding match?"<br>• Subtitle about funding programs | • Primary: "Start Your Plan" → `/editor`<br>• Secondary: "Learn More" → `/features` | No | Yes - Direct routing | • Fade-in on scroll (y: 20px)<br>• 0.6s delay | • Gray-50 background<br>• Centered text<br>• Blue primary button<br>• Outline secondary button |

## **HEADER & FOOTER PAGES**

| **Page/Section** | **Component** | **Content** | **CTAs** | **Breadcrumbs** | **Wired** | **Animations** | **Style** |
|------------------|---------------|-------------|----------|-----------------|-----------|----------------|-----------|
| **Header** | **Navigation** | • Logo: "Plan2Fund"<br>• Nav links: How It Works, Pricing, FAQ<br>• User account link (conditional)<br>• Language switcher<br>• Mobile hamburger menu | • "Start Plan" → `/editor`<br>• "How It Works" → `/about`<br>• "Pricing" → `/pricing`<br>• "FAQ" → `/faq`<br>• "My Account" → `/dashboard` (conditional) | No | Yes - All routes functional | • Smooth transitions (0.3s)<br>• Mobile menu slide-down<br>• Focus management for accessibility | • Sticky header (top-0, z-50)<br>• White background with backdrop blur<br>• Border bottom shadow<br>• Blue primary button<br>• Responsive mobile menu |
| **Footer** | **Company Info** | • Company description<br>• Contact details (email, phone, address)<br>• Business hours | None | No | No | • None | • Gray-50 background<br>• 4-column grid layout<br>• Blue accent colors<br>• Icon + text layout |
| **Footer** | **Product Links** | • How it works, Pricing, FAQ links | • "How it works" → `/about`<br>• "Pricing" → `/pricing`<br>• "FAQ" → `/faq` | No | Yes - Direct routing | • Hover color transitions | • Hover blue color effects |
| **Footer** | **Legal Links** | • Privacy Policy, Terms, Legal Notice, Contact | • "Privacy Policy" → `/privacy`<br>• "Terms" → `/terms`<br>• "Legal Notice" → `/legal`<br>• "Contact" → `/contact` | No | Yes - All routes exist | • Hover color transitions | • Hover blue color effects |
| **Footer** | **Bottom Bar** | • Copyright notice<br>• Legal links | • "Privacy" → `/privacy`<br>• "Terms" → `/terms`<br>• "Legal" → `/legal` | No | Yes - All routes exist | • None | • Border top separator<br>• Flex layout with space-between |

## **LEGACY FILES**

| **Page/Section** | **Component** | **Content** | **CTAs** | **Breadcrumbs** | **Wired** | **Animations** | **Style** |
|------------------|---------------|-------------|----------|-----------------|-----------|----------------|-----------|
| **Legacy** | **UseCases** | • 4 use cases: Visa Applications, Grants & Public Funding, Bank Loans, Startup Projects<br>• Emoji icons, descriptions | • "Learn more" → `/reco` | No | Yes - Direct routing | • None | • White background<br>• 4-column grid<br>• Card hover shadows<br>• Blue hover links |
| **Legacy** | **Advantages** | • 4 statistics: Startup Growth (25% YoY), Funding Access (€1B+), New Businesses (30,000+), EU Grants (€500M+)<br>• Grid background pattern | None | No | No | • Fade-in on scroll (y: 20px)<br>• Staggered delays (0.2s intervals) | • Gradient background (white to gray-50)<br>• Grid pattern overlay<br>• 4-column centered grid<br>• White cards with shadows |
| **Legacy** | **Testimonials** | • 6 customer testimonials with ratings<br>• Partner logos section<br>• Quote icons and star ratings | None | No | No | • Fade-in on scroll (y: 30px)<br>• Staggered delays (0.1s intervals)<br>• Card hover effects | • White background<br>• 3-column testimonial grid<br>• Quote icons in corners<br>• Star rating displays<br>• Partner logo grid |
| **Legacy** | **PlanTypes** | • 3 plan types: Custom (15-35 pages), Upgrade & Review, Strategy (4-8 pages)<br>• Descriptions | • "Read more" → `/editor` | No | Yes - Direct routing | • None | • Gray-50 background<br>• 3-column grid<br>• White cards with shadows<br>• Blue hover links |
| **Legacy** | **Quote** | • Inspirational quote about Plan2Fund's purpose<br>• Large quotation marks | None | No | No | • Fade-in on scroll (y: 20px)<br>• 0.6s duration | • Gray-50 background<br>• Centered text<br>• Large decorative quotes<br>• Italic styling |
| **Legacy** | **LazyImage** | • Optimized image loading with intersection observer<br>• Blur placeholder<br>• Loading states | None | No | Yes - Component utility | • Fade-in on load (0.3s)<br>• Intersection observer triggers | • Relative positioning<br>• Smooth opacity transitions<br>• Blur placeholder |

## **PAGES NOT WIRED YET (User Account/Dashboard)**

| **Page/Section** | **Component** | **Content** | **CTAs** | **Breadcrumbs** | **Wired** | **Animations** | **Style** |
|------------------|---------------|-------------|----------|-----------------|-----------|----------------|-----------|
| **Dashboard** | **Header** | • Welcome message with user segment<br>• Account status indicator | None | No | Partial - Basic layout only | • None | • 3xl font size<br>• Gray text hierarchy |
| **Dashboard** | **Stats Cards** | • 4 metric cards: Total Plans, Completed, Active Applications, Success Rate<br>• Icons and numbers | None | No | Partial - Static data only | • None | • 4-column grid<br>• White cards with shadows<br>• Colored icons (blue, green, purple, orange) |
| **Dashboard** | **Recent Plans** | • List of user's business plans<br>• Progress bars, status badges | • "New Plan" → `/editor`<br>• "Create Your First Plan" → `/editor` | No | Partial - Links work, data from localStorage | • None | • White card container<br>• Progress bar animations<br>• Status color coding<br>• Hover effects on items |
| **Dashboard** | **Active Applications** | • List of funding applications<br>• Status tracking, deadlines | • "Find More" → `/reco`<br>• "Find Funding Opportunities" → `/reco` | No | Partial - Links work, data from localStorage | • None | • White card container<br>• Status badges with colors<br>• Deadline highlighting |
| **Dashboard** | **Quick Actions** | • 3 action buttons: Find Funding, Create Plan, Get Help | • "Find Funding" → `/reco`<br>• "Create Plan" → `/editor`<br>• "Get Help" → `/contact` | No | Yes - All routes functional | • None | • 3-column grid<br>• Outline button style<br>• Icon + text vertical layout |

## **OTHER FUNCTIONAL PAGES**

| **Page/Section** | **Component** | **Content** | **CTAs** | **Breadcrumbs** | **Wired** | **Animations** | **Style** |
|------------------|---------------|-------------|----------|-----------------|-----------|----------------|-----------|
| **Pricing** | **Hero** | • "Choose Your Plan" title<br>• Subtitle description | None | Yes - SiteBreadcrumbs | Yes - Full page | • None | • HeroLite component<br>• Centered text |
| **Pricing** | **Plan Cards** | • 3 pricing tiers: Strategy (€99), Upgrade (€149), Custom (€299)<br>• Feature lists, pricing | • "Choose Strategy" → `/confirm?plan=strategy&mode=strategy`<br>• "Upload & Review" → `/confirm?plan=upgrade&mode=upgrade`<br>• "Choose Custom" → `/confirm?plan=custom&mode=custom` | Yes - SiteBreadcrumbs | Yes - All routes functional | • None | • 3-column grid<br>• Featured plan highlighting<br>• Checkmark feature lists<br>• Blue primary buttons |
| **Pricing** | **CTA Strip** | • "Ready to start your funding journey?" | • "Start Your Plan" → `/reco`<br>• "Learn More" → `/features` | Yes - SiteBreadcrumbs | Yes - Direct routing | • Fade-in on scroll (y: 20px)<br>• 0.6s delay | • Gray-50 background<br>• Centered text<br>• Blue primary button<br>• Outline secondary button |
| **FAQ** | **Header** | • "Frequently Asked Questions"<br>• Help icon and description | None | Yes - SiteBreadcrumbs | Yes - Full page | • None | • Centered layout<br>• Blue icon background |
| **FAQ** | **Category Filter** | • 8 category buttons: All, General, Security, Billing, etc. | None | Yes - SiteBreadcrumbs | Yes - Filter functionality | • None | • Flex wrap layout<br>• Blue active state<br>• Rounded pill buttons |
| **FAQ** | **FAQ Items** | • Expandable Q&A pairs<br>• Chevron icons | None | Yes - SiteBreadcrumbs | Yes - Expand/collapse functionality | • Smooth height transitions<br>• Chevron rotation | • White cards<br>• Hover effects<br>• Border separators |
| **FAQ** | **Contact CTA** | • "Still have questions?" | • "Contact Support" → `/contact`<br>• "Learn More" → `/about` | Yes - SiteBreadcrumbs | Yes - Direct routing | • None | • Blue-50 background<br>• Centered layout<br>• Blue primary button |
| **Contact** | **Contact Form** | • Name, email, subject, message fields<br>• Form validation | • "Send Message" (form submission) | Yes - SiteBreadcrumbs | Partial - Form UI only, no backend | • None | • 2-column form layout<br>• Blue primary button<br>• Form field styling |
| **Contact** | **Contact Info** | • Email, phone, address, hours<br>• Icon + text layout | None | Yes - SiteBreadcrumbs | No | • None | • Card container<br>• Icon + text layout<br>• Blue accent colors |
| **Contact** | **Quick Help** | • FAQ, Live Chat, Support Email links | • "Browse FAQ" → `/faq` | Yes - SiteBreadcrumbs | Yes - Direct routing | • None | • Card container<br>• Icon + text layout |
| **Contact** | **FAQ Section** | • 4 common questions with answers | None | Yes - SiteBreadcrumbs | No | • None | • 2-column grid<br>• White cards with shadows |
| **About** | **Mission/Vision** | • 2-column cards with icons<br>• Company mission and vision | None | Yes - SiteBreadcrumbs | Yes - Full page | • None | • 2-column grid<br>• Card hover effects<br>• Icon + text layout |
| **About** | **Features Grid** | • 6 feature cards with icons<br>• Descriptions and links | • "Start Guide" → `/reco`<br>• "View Templates" → `/editor`<br>• "Browse Programs" → `/advanced-search` | Yes - SiteBreadcrumbs | Yes - All routes functional | • Card hover shadows | • 3-column grid<br>• Circular icon backgrounds<br>• Hover shadow effects |
| **About** | **Team Section** | • 3 team member cards<br>• Photos, names, roles, descriptions | None | Yes - SiteBreadcrumbs | No | • None | • 3-column grid<br>• Circular placeholder images<br>• Centered text layout |
| **About** | **Stats Section** | • 4 impact metrics<br>• Large numbers, descriptions | None | Yes - SiteBreadcrumbs | No | • None | • 4-column grid<br>• Colored numbers<br>• Gray-50 background |
| **About** | **CTA Strip** | • "Ready to start your funding journey?" | • "Find Your Funding" → `/reco`<br>• "Get in Touch" → `/contact` | Yes - SiteBreadcrumbs | Yes - Direct routing | • Fade-in on scroll (y: 20px)<br>• 0.6s delay | • Gray-50 background<br>• Centered text<br>• Blue primary button<br>• Outline secondary button |

## **BREADCRUMB SYSTEM**

| **Component** | **Usage** | **Wired** | **Style** |
|---------------|-----------|-----------|-----------|
| **SiteBreadcrumbs** | Used on all non-landing pages | Yes - Functional | • Gray background<br>• Home → Current page<br>• Hover effects |
| **Breadcrumbs** | Used in flow pages (results, editor, preview, etc.) | Yes - Functional | • Flow-specific navigation<br>• Step indicators |
| **InPageBreadcrumbs** | Used within complex pages | Yes - Functional | • Section navigation<br>• Anchor links |

## **KEY DESIGN PATTERNS**

### **CTAs:**
- Primary: Blue buttons with white text
- Secondary: Outline buttons with blue text
- Hover: Scale effects and color changes
- All major CTAs route to functional pages

### **Breadcrumbs:**
- SiteBreadcrumbs: Home → Current page
- Flow Breadcrumbs: Step-by-step process navigation
- All breadcrumb systems are fully functional

### **Wiring Status:**
- ✅ Fully Wired: Landing page, Header/Footer, Pricing, FAQ, About, Contact
- ⚠️ Partially Wired: Dashboard (UI complete, data from localStorage)
- ❌ Not Wired: Backend form submissions, real user data

### **Animations:**
- Framer Motion for scroll-triggered animations
- Staggered delays for sequential reveals
- Hover scale effects (1.05x, 1.1x)
- Smooth transitions (0.3s duration)
- Fade-in from bottom (y: 20-30px)

### **Color Scheme:**
- Primary: Blue (#2563eb)
- Secondary: Green, Purple, Orange accents
- Backgrounds: White, Gray-50, Gradient overlays
- Text: Gray-900 (primary), Gray-600 (secondary)

### **Layout Patterns:**
- Container max-width constraints
- Responsive grid systems (2, 3, 4 columns)
- Card-based design with shadows
- Centered text alignment
- Icon + text combinations

### **Interactive Elements:**
- Hover state transitions
- Focus management for accessibility
- Mobile-responsive navigation
- Form validation states
- Loading spinners and states
