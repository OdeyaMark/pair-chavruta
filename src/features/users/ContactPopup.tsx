import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Phone, Mail } from 'lucide-react';
import './ContactPopup.css';

interface ContactPopupProps {
  phone?: string;
  email?: string;
}

const ContactPopup: React.FC<ContactPopupProps> = ({ 
  phone = "1-8454288777", 
  email = "li72323@yahoo.com" 
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: 'phone' | 'email') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  useEffect(() => {
    console.log("opening contact popup");
  }, []);


  return (
    <div className="contact-popup">
      {/* Header */}
      <h3 className="contact-header">
        Contact Details
      </h3>

      {/* Contact items */}
      <div className="contact-items">
        {/* Phone */}
        <div className="contact-item">
          <div className="contact-icon">
            <Phone size={18} />
          </div>
          <div className="contact-label">
            <span>Phone</span>
          </div>
          <div className="contact-value-container">
            <span className="contact-value">{phone}</span>
            <button
              onClick={() => copyToClipboard(phone, 'phone')}
              className="copy-button"
              title="Copy phone"
            >
              {copiedItem === 'phone' ? (
                <Check size={16} className="check-icon" />
              ) : (
                <Copy size={16} className="copy-icon" />
              )}
            </button>
          </div>
        </div>

        {/* Email */}
        <div className="contact-item">
          <div className="contact-icon">
            <Mail size={18} />
          </div>
          <div className="contact-label">
            <span>Email</span>
          </div>
          <div className="contact-value-container">
            <span className="contact-value">{email}</span>
            <button
              onClick={() => copyToClipboard(email, 'email')}
              className="copy-button"
              title="Copy email"
            >
              {copiedItem === 'email' ? (
                <Check size={16} className="check-icon" />
              ) : (
                <Copy size={16} className="copy-icon" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Copy feedback */}
      {copiedItem && (
        <div className="copy-feedback">
          <span className="copy-feedback-text">
            {copiedItem === 'phone' ? 'Phone copied!' : 'Email copied!'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ContactPopup;