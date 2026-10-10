import React from 'react';
import { 
  Headphones, Users, ShieldCheck, Gem, 
  MapPin, Phone, Mail, Clock, ArrowRight, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import './ContactUs.css';

const ContactUs = () => {
  const brands = [
    { name: "DeWalt", src: "/logo/DeWalt_Logo.svg" },
    { name: "Ducab", src: "/logo/Ducab.png" },
    { name: "Fluke", src: "/logo/Fluke_Logo2.webp" },
    { name: "Legrand", src: "/logo/Legrand.png" },
    { name: "Schneider Electric", src: "/logo/Schneider Electric.png" },
    { name: "Belden", src: "/logo/belden.png" },
    { name: "Makita", src: "/logo/makitha.png" },
    { name: "Osram", src: "/logo/osram.png" },
    { name: "Philips", src: "/logo/philips.png" }
  ];

  return (
    <div className="contact-page">
      {/* Hero Banner */}
      <div className="contact-hero">
        <div className="contact-hero-bg">
          <img src="/Modern Superlight Showroom Exterior.png" alt="Superlight Showroom" className="hero-showroom-img" />
          <div className="hero-gradient-overlay"></div>
        </div>
        <div className="container contact-hero-inner">
          <div className="contact-hero-content">
            <span className="hero-tag">GET IN TOUCH</span>
            <h1>Contact <span>Us</span></h1>
            <p>We will answer any questions you may have about our products, services, online sales, or partnership opportunities. Our team is here to assist you.</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container contact-features">
        <div className="feature-card">
          <div className="icon-wrap"><Headphones size={24} strokeWidth={1.5} /></div>
          <div className="feature-text">
            <h4>Quick Response</h4>
            <p>We value your time and ensure prompt replies</p>
          </div>
        </div>
        <div className="feature-card">
          <div className="icon-wrap"><Users size={24} strokeWidth={1.5} /></div>
          <div className="feature-text">
            <h4>Expert Support</h4>
            <p>Our team is ready to assist you</p>
          </div>
        </div>
        <div className="feature-card">
          <div className="icon-wrap"><ShieldCheck size={24} strokeWidth={1.5} /></div>
          <div className="feature-text">
            <h4>Reliable Service</h4>
            <p>Trusted support for all your requirements</p>
          </div>
        </div>
        <div className="feature-card">
          <div className="icon-wrap"><Gem size={24} strokeWidth={1.5} /></div>
          <div className="feature-text">
            <h4>Partnership Opportunities</h4>
            <p>Let's grow together</p>
          </div>
        </div>
      </div>

      {/* Main Content (Contact Details & Form) */}
      <div className="container contact-main">
        <div className="contact-details-col">
          <h2>Our <span>Contact Details</span></h2>
          <p className="section-subtitle">You can reach us through the following channels. We are always happy to assist you.</p>
          
          <div className="detail-item">
            <div className="icon-wrap"><MapPin size={24} strokeWidth={1.5} /></div>
            <div className="detail-text">
               <h4>Address</h4>
               <p>Superlight Electricals, Rafi Centre,<br/>Naif - Deira, Dubai, UAE</p>
            </div>
          </div>
          
          <div className="detail-item">
            <div className="icon-wrap"><Phone size={24} strokeWidth={1.5} /></div>
            <div className="detail-text">
               <h4>Phone</h4>
               <p>+971 43298869</p>
            </div>
          </div>

          <div className="detail-item">
            <div className="icon-wrap"><Mail size={24} strokeWidth={1.5} /></div>
            <div className="detail-text">
               <h4>Email</h4>
               <p>sales1@superlight.ae</p>
            </div>
          </div>

          <div className="detail-item">
            <div className="icon-wrap"><Clock size={24} strokeWidth={1.5} /></div>
            <div className="detail-text">
               <h4>Working Hours</h4>
               <p>Monday - Saturday<br/>9:00 AM – 6:00 PM<br/><span style={{fontSize: '0.85rem', color: '#9ca3af'}}>(Except Public Holidays)</span></p>
            </div>
          </div>
        </div>

        <div className="contact-form-col">
           <h2>Send Us a <span>Message</span></h2>
           <p className="section-subtitle">Fill out the form and our team will get back to you as soon as possible.</p>
           
           <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
             <div className="form-row">
                <div className="form-group">
                   <label>Your Name <span>*</span></label>
                   <input type="text" placeholder="Enter your name" required />
                </div>
                <div className="form-group">
                   <label>Your Email <span>*</span></label>
                   <input type="email" placeholder="Enter your email" required />
                </div>
             </div>
             
             <div className="form-row">
                <div className="form-group">
                   <label>Phone Number</label>
                   <input type="text" placeholder="Enter your phone number" />
                </div>
                <div className="form-group">
                   <label>Subject <span>*</span></label>
                   <select required defaultValue="">
                     <option value="" disabled>Select a subject</option>
                     <option value="general">General Inquiry</option>
                     <option value="sales">Sales & Quotations</option>
                     <option value="support">Technical Support</option>
                     <option value="partnership">Partnership</option>
                   </select>
                </div>
             </div>

             <div className="form-group full-width">
                <label>Your Message <span>*</span></label>
                <textarea placeholder="Type your message here..." rows="5" required></textarea>
             </div>

             <button type="submit" className="submit-btn">
               Send Message <ArrowRight size={18} />
             </button>
           </form>
        </div>
      </div>

      {/* Map Section */}
      <div className="contact-map-container container">
        <div className="map-wrapper">
           <iframe 
             src="https://maps.google.com/maps?q=Rafi%20Centre,%20Naif%20-%20Deira,%20Dubai&t=&z=15&ie=UTF8&iwloc=&output=embed" 
             width="100%" 
             height="400" 
             style={{ border: 0 }} 
             allowFullScreen="" 
             loading="lazy" 
             referrerPolicy="no-referrer-when-downgrade"
             title="Superlight Electricals Location Map"
           ></iframe>
        </div>
      </div>

      {/* Brands Section */}
      <div className="container contact-brands">
         <h2>Our <span>Associated Brands</span></h2>
         <p className="brands-subtitle">We work with leading global brands to provide high-quality electrical and sanitary products.</p>
         
         <div className="brands-carousel-wrapper">
            <div className="brands-list marquee-track">
               {[...brands, ...brands].map((brand, i) => (
                 <div key={i} className="brand-logo-card">
                   <img src={brand.src} alt={brand.name} className="brand-logo-img" />
                 </div>
               ))}
            </div>
         </div>
      </div>



      {/* Immediate Assistance Banner */}
      <div className="immediate-assistance">
         <div className="container ia-content">
            <div className="ia-text">
               <h2>Need Immediate <span>Assistance?</span></h2>
               <p>Call us now or send an email — our team is always ready to support you.</p>
            </div>
            <div className="ia-buttons">
               <button className="ia-btn"><Phone size={18} /> +971 43298869</button>
               <button className="ia-btn"><Mail size={18} /> sales1@superlight.ae</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ContactUs;
