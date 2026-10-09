import React from 'react';
import './AboutUs.css';
import { Calendar, Users, Handshake, Store, Award, ClipboardCheck, ArrowRight, Target, Eye } from 'lucide-react';

const AboutUs = () => {
  const stats = [
    { id: 1, icon: <Calendar size={28} strokeWidth={1.5} />, number: '2020', label: 'Established Year' },
    { id: 2, icon: <Users size={28} strokeWidth={1.5} />, number: '800', label: 'Happy Customers' },
    { id: 3, icon: <Handshake size={28} strokeWidth={1.5} />, number: '600', label: 'Companies Work With Us' },
    { id: 4, icon: <Store size={28} strokeWidth={1.5} />, number: '3', label: 'Outlets' },
    { id: 5, icon: <Award size={28} strokeWidth={1.5} />, number: '21', label: 'Team Members' },
    { id: 6, icon: <ClipboardCheck size={28} strokeWidth={1.5} />, number: '750', label: 'Projects Completed' },
  ];

  return (
    <section id="about-us" className="about-us-section">
      <div className="container about-us-container">
        {/* Left Content */}
        <div className="about-us-content">
          <div className="about-subtitle-wrapper">
            <span className="about-subtitle">SUPER LIGHT ELECTRICAL TRADING LLC</span>
            <div className="subtitle-line"></div>
          </div>
          <h2 className="about-title">
            <span className="title-dark">About</span> <span className="title-pink">Us</span>
          </h2>
          
          <div className="about-text">
            <p>
              Super Light Electrical Trading is a firm established in 2020 as the 
              stockiest supplier of all electrical and sanitary products in the UAE.
            </p>
            <p>
              Over the years Super Light has steadily developed into a professionally 
              managed organisation, wholly dedicated to the most exacting standards 
              of quality, customer service and consistently motivated by end-user 
              to ensure total product statisfaction.
            </p>
            <p>
              We are dealers of top brands such as Philips, Quanta, SKILLTECH, ALMANIA, 
              MODI, Osram, FSL, NOVEX, Schneider, KDK, Legrand, ABB, Belden, RR Kabel, 
              Ramcro, Ducab, Dewalt, Makita and many more.
            </p>
          </div>

          <button className="learn-more-btn">
            Learn More <ArrowRight size={18} />
          </button>
        </div>

        {/* Right Stats Grid */}
        <div className="about-us-stats">
          {stats.map(stat => (
            <div key={stat.id} className="stat-card">
              <div className="stat-icon-wrapper">
                {stat.icon}
              </div>
              <h3 className="stat-number">{stat.number}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission and Vision Section */}
      <div className="container mission-vision-container">
        <div className="mv-card mission-card">
          <div className="mv-icon-wrapper">
            <Target size={32} strokeWidth={1.5} />
          </div>
          <div className="mv-line"></div>
          <h2 className="mv-title">
            <span className="title-dark">Our</span> <span className="title-pink">Mission</span>
          </h2>
          <p className="mv-text">
            Ensuring quality standard services in all forms. Provide quality products. Welcoming new ideas and concepts to implement for better growth and premium services to clients.
          </p>
        </div>

        <div className="mv-card vision-card">
          <div className="mv-icon-wrapper">
            <Eye size={32} strokeWidth={1.5} />
          </div>
          <div className="mv-line"></div>
          <h2 className="mv-title">
            <span className="title-dark">Our</span> <span className="title-pink">Vision</span>
          </h2>
          <p className="mv-text">
            To become a dominant and most reputed distributor and supplier of electrical products and sanitary materials in the UAE.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
