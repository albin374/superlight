import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import './Footer.css';

const Facebook = ({size}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

const Instagram = ({size}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const Linkedin = ({size}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);

const Youtube = ({size}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
);

const Footer = ({ goToCompanyOverview, goToAdhesivesToolsHardware, goToElectricalAccessories, goToPlumbingMaterials, goToHomeAutomation }) => {
  return (
    <footer className="footer-section">
      <div className="container">
        <div className="footer-grid">
          
          <div className="footer-col footer-about">
            <img src="/Superlight-Logo-Footer.svg" alt="Super Light Logo" className="footer-logo" />
            <p className="footer-desc">
              Your trusted partner for electrical, lighting and building materials in the UAE. Quality products, leading brands and reliable service for every project.
            </p>
            <div className="footer-socials">
              <a href="#" className="social-link"><Facebook size={16} /></a>
              <a href="#" className="social-link"><Instagram size={16} /></a>
              <a href="#" className="social-link"><Linkedin size={16} /></a>
              <a href="#" className="social-link"><Youtube size={16} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Shop Categories</h4>
            <ul className="footer-links">
              <li><a href="#">Lighting</a></li>
              <li><a href="#">Wires & Cables</a></li>
              <li><a href="#electrical-accessories" onClick={(e) => { e.preventDefault(); goToElectricalAccessories && goToElectricalAccessories(); }}>Electrical Accessories</a></li>
              <li><a href="#home-automation" onClick={(e) => { e.preventDefault(); goToHomeAutomation && goToHomeAutomation(); }}>Home Automation</a></li>
              <li><a href="#tools-hardware" onClick={(e) => { e.preventDefault(); goToAdhesivesToolsHardware && goToAdhesivesToolsHardware(); }}>Tools & Hardware</a></li>
              <li><a href="#plumbing-materials" onClick={(e) => { e.preventDefault(); goToPlumbingMaterials && goToPlumbingMaterials(); }}>Plumbing Materials</a></li>
              <li><a href="#">Offers</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#" onClick={(e) => { e.preventDefault(); goToCompanyOverview && goToCompanyOverview(); }}>Company Overview</a></li>
              <li><a href="/about-us">About Us</a></li>
              <li><a href="/faqs">FAQ</a></li>
              <li><a href="/contact-us">Contact Us</a></li>
              <li><a href="https://cableshouse-me.com/en/" target="_blank" rel="noopener noreferrer">Parent Company (Cables House)</a></li>
              <li><a href="/my-orders">Track Order / My Orders</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Customer Support</h4>
            <ul className="footer-links">
              <li><a href="/cart">Shopping Cart</a></li>
              <li><a href="/wishlist">My Wishlist</a></li>
              <li><a href="/my-orders">My Orders</a></li>
              <li><a href="/contact-us">Contact Us</a></li>
              <li><a href="/faqs">Help & Support</a></li>
              <li><a href="#">Terms & Conditions</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>

          <div className="footer-col footer-contact">
            <h4 className="footer-title">Contact Information</h4>
            <ul className="contact-info">
              <li>
                <MapPin size={16} className="contact-icon" /> 
                <a 
                  href="https://maps.app.goo.gl/obHWpxCkidafsqLu5" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                  title="View on Google Maps"
                >
                  Superlight Electricals, Rafi Centre, Naif - Deira, Dubai
                </a>
              </li>
              <li><Phone size={16} className="contact-icon" /> <span>+971 43298869</span></li>
              <li><Mail size={16} className="contact-icon" /> <span>sales@superlight.ae</span></li>
              <li><Clock size={16} className="contact-icon" /> <span>Mon - Sat: 07:00AM - 10:00PM</span></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <p>
            © All Rights Reserved | Developed by{' '}
            <a 
              href="https://mostech.ae/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-developer-link"
            >
              Mostech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
