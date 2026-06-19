# Radiant Nexus Website

This is the main website for Radiant Nexus - an autonomous operational intelligence platform for SOC (Security Operations Center).

## Overview

The website is a comprehensive single-page application with multiple pages and features:

- **Main Landing Page** - Hero section with product overview and features
- **Platform Page** - Detailed platform capabilities
- **AI Agents Page** - Information about AI agents
- **Solutions Page** - Enterprise solutions
- **Architecture Page** - Technical architecture
- **Security & Trust Page** - Security features
- **About Page** - Company information
- **Contact Page** - Request demo
- **Waitlist Page** - Join waitlist for pilot program
- **Admin Dashboard** - Admin interface for waitlist management

## Technology Stack

### Frontend
- **HTML5** - Semantic HTML5 markup
- **CSS3** - Custom design system with CSS variables
- **JavaScript** - Modern ES6+ with progressive enhancement
- **SVG** - Icon sprite system
- **Responsive Design** - Mobile-first approach

### Design System
- **CSS Custom Properties** - Design tokens for theming
- **Component Library** - Reusable UI components
- **Animation System** - Scroll reveal and micro-interactions
- **Responsive Grid** - CSS Grid for layout
- **Typography** - System font stack with custom styling

### Features
- **Progressive Enhancement** - Works without JavaScript
- **Scroll Reveal** - IntersectionObserver for animations
- **Navigation** - Fixed top nav with mobile support
- **Counter Animations** - Animated numbers on scroll
- **Form Validation** - Client-side form validation
- **Email Integration** - WhatsApp integration for forms

## Project Structure

```
.
├── index.html                    # Main landing page
├── pages/                        # Inner pages
│   ├── platform.html
│   ├── agents.html
│   ├── solutions.html
│   ├── architecture.html
│   ├── security.html
│   ├── about.html
│   ├── contact.html
│   ├── pricing.html
│   ├── resources.html
│   ├── sectors.html
│   └── services.html
├── admin/                        # Admin dashboard
│   └── index.html
├── waitlist/                     # Waitlist application
│   └── index.html
├── assets/                       # Assets
│   └── logo.png
├── css/                          # Styles
│   └── global.css
├── js/                           # Scripts
│   └── global.js
├── radiant-os.html              # Desktop OS demo
├── anniversary/                  # Anniversary offer
│   └── index.html
├── portfolio/                    # Personal portfolio
│   └── index.html
├── backend/                      # Backend API
│   ├── package.json
│   ├── server.js
│   └── README.md
├── test-backend.js              # Backend tests
└── README.md
```

## Development

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for backend testing)

### Running the Website

Simply open any HTML file in a web browser:

```bash
# Open the main website
open index.html

# Or open specific pages
open pages/about.html
open waitlist/index.html
open admin/index.html
```

### Backend Setup

The website includes a backend API for waitlist management and admin dashboard. To run the backend:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend:
   ```bash
   npm start
   ```

4. The backend will run on `http://localhost:3000`

### Testing the Backend

To test the backend API:

1. Navigate to the project root:
   ```bash
   cd .. (go up one directory)
   ```

2. Run the tests:
   ```bash
   node test-backend.js
   ```

## Features

### Main Website Features

1. **Responsive Design**
   - Mobile-first approach
   - Breakpoints for desktop, tablet, and mobile
   - Flexible grid layouts

2. **Interactive Elements**
   - Scroll reveal animations
   - Hover states and transitions
   - Form validation and feedback
   - Navigation with active states

3. **Content Sections**
   - Hero sections with gradients
   - Feature grids and cards
   - Timeline and process flows
   - Testimonial sections

4. **Technical Features**
   - SVG icon sprite system
   - CSS custom properties for theming
   - IntersectionObserver for performance
   - Progressive enhancement

### Admin Dashboard Features

1. **Authentication**
   - Email-based OTP authentication
   - JWT token management
   - Protected routes

2. **Waitlist Management**
   - View waitlist entries
   - Search and filter
   - Delete entries
   - Export to CSV

3. **Audit Logging**
   - Track all admin actions
   - View audit logs
   - Filter by action type

### Waitlist Features

1. **Form Validation**
   - Client-side validation
   - Real-time feedback
   - Server-side validation

2. **User Experience**
   - Progressive form submission
   - Success states
   - WhatsApp integration

3. **Security**
   - Honeypot field for spam protection
   - Email validation
   - Consent management

## Design System

### Color Tokens

The website uses a dark theme with the following color tokens:

- **Primary**: #3B82F6 (Blue)
- **Secondary**: #6AA2FF (Light Blue)
- **Accent**: #00C8DC (Cyan)
- **Danger**: #F0556B (Red)
- **Success**: #1FD498 (Green)
- **Warning**: #F0B23E (Yellow)

### Typography

- **Headings**: Inter font family
- **Body Text**: Inter font family
- **Code/Mono**: JetBrains Mono font family
- **Display**: Custom font weights and sizes

### Spacing

- **Base Unit**: 4px
- **Container Padding**: 48px (desktop), 24px (mobile)
- **Component Spacing**: 8px - 32px
- **Section Spacing**: 80px - 120px

## Accessibility

The website follows WCAG 2.1 AA guidelines:

1. **Semantic HTML**
   - Proper heading hierarchy
   - Descriptive alt text for images
   - ARIA labels and roles

2. **Keyboard Navigation**
   - Focus management
   - Skip links
   - Keyboard-accessible components

3. **Screen Reader Support**
   - ARIA attributes
   - Screen reader announcements
   - High contrast mode support

## Performance

1. **Image Optimization**
   - Responsive images
   - Lazy loading
   - WebP format support

2. **Asset Management**
   - Minified CSS/JS
   - Bundle optimization
   - CDN integration

3. **Caching**
   - Service worker support
   - Cache strategies
   - ETag support

## SEO

The website is optimized for search engines:

1. **Meta Tags**
   - Descriptive title tags
   - Meta descriptions
   - Open Graph tags
   - Twitter Card tags

2. **Content Structure**
   - Semantic HTML
   - Proper heading hierarchy
   - Descriptive links
   - Alt text for images

3. **Technical SEO**
   - robots.txt
   - sitemap.xml
   - Schema markup
   - Mobile-friendly design

## Backend API

The website includes a backend API for:

1. **Waitlist Management**
   - Submit new entries
   - Validate form data
   - Send confirmation emails

2. **Admin Dashboard**
   - Authentication
   - Waitlist management
   - Audit logging
   - Export functionality

3. **API Endpoints**
   - `POST /api/waitlist/submit` - Submit waitlist form
   - `POST /api/admin/auth/request-otp` - Request OTP
   - `POST /api/admin/auth/verify-otp` - Verify OTP
   - `GET /api/admin/waitlist` - Get waitlist entries
   - `DELETE /api/admin/waitlist/:id` - Delete entry
   - `GET /api/admin/waitlist/export` - Export CSV
   - `GET /api/admin/logs` - Get audit logs
   - `GET /api/health` - Health check

## Deployment

### Static Hosting

The website can be deployed to any static hosting service:

1. **GitHub Pages**
   - Push to gh-pages branch
   - Configure GitHub Actions

2. **Netlify**
   - Connect Git repository
   - Configure build settings

3. **Vercel**
   - Import Git repository
   - Configure build settings

4. **AWS S3 + CloudFront**
   - Configure S3 bucket
   - Set up CloudFront distribution

### Backend Deployment

The backend can be deployed to:

1. **Heroku**
   - Docker support
   - Environment variables
   - Health check endpoints

2. **AWS ECS**
   - Container service
   - Load balancing
   - Auto scaling

3. **Google Cloud Run**
   - Serverless deployment
   - Automatic scaling
   - Managed infrastructure

4. **Azure App Service**
   - Windows/Linux containers
   - App Service plans
   - Deployment slots

## Testing

### Frontend Testing

The website can be tested using:

1. **Browser DevTools**
   - Console debugging
   - Network analysis
   - Performance analysis

2. **Browser Testing Tools**
   - Chrome DevTools
   - Firefox Developer Tools
   - Safari Web Inspector

3. **Automated Testing**
   - Unit tests (if added)
   - Integration tests (if added)
   - End-to-end tests (if added)

### Backend Testing

Run the backend tests:

```bash
node test-backend.js
```

## Support

For issues, please contact:
- Email: support@radiantinnovatech.com
- GitHub Issues: https://github.com/RadiantSeraph1/Radiant-Nexus/issues

## License

This project is licensed under the MIT License.

## Acknowledgments

- **Design System**: Custom design system with CSS variables
- **Components**: Reusable UI components
- **Animations**: Smooth scroll reveal and micro-interactions
- **Icons**: SVG icon sprite system
- **Forms**: Client-side validation and feedback
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for speed and efficiency
- **SEO**: Search engine optimization
- **Backend**: RESTful API with authentication

## Future Enhancements

1. **Advanced Features**
   - Dark/Light theme toggle
   - Advanced filtering
   - Real-time updates
   - WebSocket support

2. **Performance Improvements**
   - Code splitting
   - Tree shaking
   - Image optimization
   - Caching strategies

3. **New Features**
   - Blog system
   - Documentation
   - Case studies
   - Customer testimonials

4. **Integration**
   - Analytics integration
   - Marketing tools
   - CRM integration
   - Email marketing

## Contact

For questions or support, please contact:
- Email: support@radiantinnovatech.com
- GitHub: https://github.com/RadiantSeraph1/Radiant-Nexus

---

*Created by Radiant InnovaTech*
*Version 1.0.0*
*2026*