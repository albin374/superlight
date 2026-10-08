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

const Footer = () => {
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
              <li><a href="#">Switches & Sockets</a></li>
              <li><a href="#">Electrical Equipment</a></li>
              <li><a href="#">Tools & Hardware</a></li>
              <li><a href="#">Plumbing</a></li>
              <li><a href="#">Offers</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">All Products</a></li>
              <li><a href="#">Brands</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Track Order</a></li>
              <li><a href="#">Delivery & Shipping</a></li>
              <li><a href="#">Returns & Refunds</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Customer Support</h4>
            <ul className="footer-links">
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Help & Support</a></li>
              <li><a href="#">Terms & Conditions</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>

          <div className="footer-col footer-contact">
            <h4 className="footer-title">Contact Information</h4>
            <ul className="contact-info">
              <li><MapPin size={16} className="contact-icon" /> <span>Al Quoz, Dubai, UAE</span></li>
              <li><Phone size={16} className="contact-icon" /> <span>+971 50 123 4567</span></li>
              <li><Mail size={16} className="contact-icon" /> <span>sales@superlight.ae</span></li>
              <li><Clock size={16} className="contact-icon" /> <span>Mon - Sat: 9:00 AM - 6:00 PM</span></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© All Rights Reserved | Developed by Mostech Business Solutions</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
