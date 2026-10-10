import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import './Faq.css';

const Faq = () => {
  const [activeFaq, setActiveFaq] = useState(0);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Will I receive the same product that I see in the picture?",
      answer: "Yes, you will receive the exact product as shown in the picture. We ensure that all product images on our website are accurate and represent the actual items. However, slight variations in color may occur due to screen settings."
    },
    {
      question: "Where can I view my sales receipt?",
      answer: "You can view and download your sales receipts from your account dashboard under 'Order History'. A copy is also emailed to you right after the purchase."
    },
    {
      question: "How can I return an item?",
      answer: "To return an item, please visit our returns page and follow the simple step-by-step instructions. Items must be returned within 14 days of delivery."
    },
    {
      question: "Will you restock items indicated as “out of stock”?",
      answer: "Yes, we regularly restock our popular items. You can click 'Notify Me' on the product page to receive an email when the item is back in stock."
    },
    {
      question: "Where can I ship my order?",
      answer: "We currently ship to all emirates within the UAE and selected GCC countries. Delivery fees may vary depending on the location."
    }
  ];

  return (
    <div className="faq-page">
      <div className="container faq-container">
        <div className="faq-content">
          <div className="faq-header">
            <span className="faq-subtitle">FREQUENTLY ASKED QUESTIONS</span>
            <h1 className="faq-title">Have Any <span className="pink-text">Questions?</span></h1>
            <p className="faq-desc">Find quick answers to common questions. If you need further assistance, feel free to contact our team.</p>
          </div>

          <div className="faq-accordion">
            {faqs.map((faq, index) => {
              const isActive = activeFaq === index;
              return (
                <div key={index} className={`faq-item-card ${isActive ? 'active' : ''}`} onClick={() => toggleFaq(index)}>
                  <div className="faq-question-row">
                    <div className="faq-q-icon">Q</div>
                    <h3 className="faq-q-text">{faq.question}</h3>
                    <div className="faq-toggle-icon">
                      {isActive ? <Minus size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
                    </div>
                  </div>
                  {isActive && (
                    <div className="faq-answer-row">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faq;
