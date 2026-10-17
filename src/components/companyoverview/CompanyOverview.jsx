import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyBanner from './CompanyBanner';
import { 
  Building2, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Cpu, 
  Wrench, 
  Lightbulb, 
  Box, 
  Mail, 
  MapPin, 
  Clock,
  Sparkles
} from 'lucide-react';
import './CompanyOverview.css';

const CompanyOverview = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const productCategories = [
    {
      id: '01',
      title: 'Wires & Cables',
      image: '/Assorted Cable Reels and Cross-Sections.png',
      alt: 'Wires & Cables',
      path: '/wires-cables'
    },
    {
      id: '02',
      title: 'LED Lighting & Special Lamp',
      image: '/Modern LED Lighting Fixture Collection.png',
      alt: 'LED Lighting & Special Lamp',
      path: '/led-lighting-special-lamp'
    },
    {
      id: '03',
      title: 'Switches, Sockets & Electrical Accessories',
      image: '/UK Sockets and Circuit Breakers Display.png',
      alt: 'Switches, Sockets & Electrical Accessories',
      path: '/switches-sockets-electrical-accessories'
    },
    {
      id: '04',
      title: 'Switchgear & Control Panel Products',
      image: '/Industrial Switchgear and Control Panel Components.png',
      alt: 'Switchgear & Control Panel Products',
      path: '/switchgear-control-panel-products'
    },
    {
      id: '05',
      title: 'Building Materials',
      image: '/DIY Hardware and Paint Supplies.png',
      alt: 'Building Materials',
      path: '/building-materials'
    },
    {
      id: '06',
      title: 'Safety Products',
      image: '/Complete Construction Safety Gear Collection.png',
      alt: 'Safety Products',
      path: '/safety-products'
    }
  ];

  const industries = [
    { title: 'Commercial & Corporate Towers', desc: 'Energy-compliant lighting, power distribution, and structured cabling for office developments.' },
    { title: 'Residential & Luxury Villas', desc: 'Architectural lighting, designer smart switches, and fire-safe electrical infrastructure.' },
    { title: 'Industrial & Warehousing', desc: 'Heavy-duty high bays, weatherproof switchgear, and robust industrial cable management.' },
    { title: 'Hospitality & Luxury Resorts', desc: 'Warm hospitality illumination, aesthetic wiring accessories, and automated controls.' },
    { title: 'MEP Infrastructure Projects', desc: 'Full-scope certified electrical supplies for government and private utilities.' },
    { title: 'Retail & Mixed-Use Malls', desc: 'High-CRI accent lighting, flexible track fixtures, and emergency lighting systems.' }
  ];

  return (
    <div className="company-overview-page">
      
      {/* 1. Grand Showcase Banner matching user reference image */}
      <CompanyBanner />

      {/* 3. Executive Overview / Who We Are */}
      <section className="co-intro-section">
        <div className="container">
          <div className="co-intro-grid">
            <div className="co-intro-text">
              <div className="co-badge-tag">
                <Sparkles size={16} />
                <span>SUPER LIGHT ELECTRICAL TRADING L.L.C.</span>
              </div>
              <h2 className="co-section-title">
                Illuminating & Powering the UAE's <br />
                <span className="title-magenta">Architectural Future</span>
              </h2>
              
              <p className="co-intro-paragraph">
                Established in <strong>2020 in Dubai</strong>, Super Light Electrical Trading L.L.C. has 
                rapidly emerged as one of the United Arab Emirates’ premier stockists and specialized 
                distributors of electrical equipment, lighting systems, power cables, and essential 
                building materials.
              </p>
              
              <p className="co-intro-paragraph">
                From our state-of-the-art warehousing and headquarters in <strong>Al Quoz, Dubai</strong>, 
                we provide seamless supply chain solutions for MEP contractors, engineering consultants, 
                facility managers, interior designers, and commercial builders. We ensure every product 
                adheres to strict UAE Civil Defense and international safety certifications.
              </p>

              <div className="co-intro-check-grid">
                <div className="co-check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>100% Genuine, Certified Global Brands</span>
                </div>
                <div className="co-check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>Immediate Same-Day & Next-Day UAE Dispatch</span>
                </div>
                <div className="co-check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>In-House Technical & Lighting Design Support</span>
                </div>
                <div className="co-check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>Competitive Bulk & Tender Wholesale Pricing</span>
                </div>
              </div>
            </div>

            <div className="co-intro-visual">
              <div className="co-visual-card">
                <img 
                  src="/Modern Superlight Corporate Building.png" 
                  alt="Super Light Headquarters & Logistics Facility in Dubai" 
                  className="co-building-img" 
                />
                <div className="co-visual-badge">
                  <div className="visual-badge-dot"></div>
                  <div>
                    <strong>Dubai Headquarters & Hub</strong>
                    <span>Al Quoz Industrial Area, UAE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Portfolio & Solutions / Product Categories */}
      <section className="co-portfolio-section">
        <div className="container">
          <div className="co-portfolio-header">
            <div className="co-portfolio-header-left">
              <div className="co-portfolio-subtitle-wrap">
                <span className="co-portfolio-subtitle">PORTFOLIO & SOLUTIONS</span>
                <span className="co-portfolio-pink-line"></span>
              </div>
              <h2 className="co-portfolio-title">
                Explore Our <span className="title-pink">Product Range</span>
              </h2>
            </div>
            <div className="co-portfolio-header-right">
              <button 
                className="co-portfolio-view-all" 
                onClick={() => navigate('/')}
              >
                <span>View All Products</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="co-portfolio-grid">
            {productCategories.map((cat) => (
              <div 
                key={cat.id} 
                className="co-portfolio-card"
                onClick={() => navigate(cat.path || '/')}
              >
                <div className="co-portfolio-img-box">
                  <img 
                    src={cat.image} 
                    alt={cat.alt} 
                    className="co-portfolio-img" 
                  />
                </div>
                <div className="co-portfolio-bar">
                  <div className="co-portfolio-bar-left">
                    <span className="co-portfolio-num">{cat.id}</span>
                    <span className="co-portfolio-card-title">{cat.title}</span>
                  </div>
                  <div className="co-portfolio-arrow-btn" aria-hidden="true">
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Industries We Serve */}
      <section className="co-industries-section">
        <div className="container">
          <div className="co-section-header">
            <span className="co-section-subtitle">EXPERTISE ACROSS VERTICALS</span>
            <h2 className="co-section-title">
              Industries & <span className="title-magenta">Sectors We Power</span>
            </h2>
          </div>

          <div className="co-industries-grid">
            {industries.map((ind, idx) => (
              <div key={idx} className="co-industry-item">
                <div className="co-industry-bullet">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="co-industry-title">{ind.title}</h4>
                  <p className="co-industry-desc">{ind.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Build Together Showcase Section (Before Footer) */}
      <section className="build-together-section" aria-label="Let's Build Together Showcase">
        <div className="build-together-wrapper">
          <div className="build-together-content">
            
            <div className="build-together-tag-row">
              <span className="build-together-tag">LET'S BUILD TOGETHER</span>
              <span className="build-together-pink-line"></span>
            </div>

            <h2 className="build-together-title">
              Powering a Brighter <br />
              <span className="title-pink">Tomorrow</span>
            </h2>

            <p className="build-together-desc">
              Explore our extensive range of electrical products, lighting solutions, 
              tools, sanitary products, and more. Our team is here to support your 
              projects with the right products and reliable service.
            </p>

            <button className="btn-build-together" onClick={() => navigate('/')}>
              <span>Explore Our Products</span>
              <ArrowRight size={18} />
            </button>

          </div>
        </div>
      </section>

    </div>
  );
};

export default CompanyOverview;
