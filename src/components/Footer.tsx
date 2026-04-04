"use client";

import Link from "next/link";
import { FaStore, FaEnvelope, FaWhatsapp, FaInstagram, FaFacebook, FaHeart } from "react-icons/fa";

export default function Footer() {
  return (
    <footer 
      className="pt-5 pb-4"
      style={{ 
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: '#ecf0f1'
      }}
    >
      <div className="container">
        <div className="row g-4 mb-4">
          {/* Brand Section */}
          <div className="col-lg-5 mb-4 mb-lg-0">
            <div className="d-flex align-items-center mb-3">
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle me-3"
                style={{ 
                  width: '45px', 
                  height: '45px',
                  background: 'linear-gradient(135deg, #e67e22 0%, #f39c12 100%)'
                }}
              >
                <FaStore style={{ color: 'white', fontSize: '20px' }} />
              </div>
              <h4 className="fw-bold mb-0">Homebite</h4>
            </div>
            <p 
              className="mb-3"
              style={{ 
                opacity: 0.8,
                lineHeight: '1.8',
                fontSize: '14px'
              }}
            >
              Marketplace khusus makanan rumahan. Dukung UMKM lokal dengan menikmati cita rasa autentik dari dapur para mitra kami.
            </p>
            <div className="d-flex gap-3">
              {[
                { icon: FaInstagram, url: 'https://instagram.com', label: '@homebite.id' },
                { icon: FaFacebook, url: 'https://facebook.com', label: 'Homebite Indonesia' }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#e67e22',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e67e22';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = '#e67e22';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  title={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-4">
            <h6 className="fw-bold mb-3 text-uppercase" style={{ fontSize: '13px', letterSpacing: '1px' }}>
              Menu
            </h6>
            <ul className="list-unstyled mb-0">
              {[
                { label: 'Beranda', href: '/' },
                { label: 'Produk', href: '/produk' },
                { label: 'Jadi Mitra', href: '/mitra' },
                { label: 'Tentang Kami', href: '/tentang' }
              ].map((link, index) => (
                <li key={index} className="mb-2">
                  <Link 
                    href={link.href}
                    className="text-decoration-none"
                    style={{ 
                      color: 'rgba(236, 240, 241, 0.8)',
                      fontSize: '14px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#e67e22';
                      e.currentTarget.style.paddingLeft = '8px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(236, 240, 241, 0.8)';
                      e.currentTarget.style.paddingLeft = '0';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="col-lg-2 col-md-4">
            <h6 className="fw-bold mb-3 text-uppercase" style={{ fontSize: '13px', letterSpacing: '1px' }}>
              Bantuan
            </h6>
            <ul className="list-unstyled mb-0">
              {[
                { label: 'FAQ', href: '/faq' },
                { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
                { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
                { label: 'Hubungi Kami', href: '/chat/support' }
              ].map((link, index) => (
                <li key={index} className="mb-2">
                  <Link 
                    href={link.href}
                    className="text-decoration-none"
                    style={{ 
                      color: 'rgba(236, 240, 241, 0.8)',
                      fontSize: '14px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#e67e22';
                      e.currentTarget.style.paddingLeft = '8px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(236, 240, 241, 0.8)';
                      e.currentTarget.style.paddingLeft = '0';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-lg-3 col-md-4">
            <h6 className="fw-bold mb-3 text-uppercase" style={{ fontSize: '13px', letterSpacing: '1px' }}>
              Kontak
            </h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-3">
                <div className="d-flex align-items-start gap-2">
                  <FaEnvelope 
                    className="mt-1 flex-shrink-0" 
                    style={{ color: '#e67e22', fontSize: '14px' }} 
                  />
                  <div>
                    <div className="fw-medium mb-1" style={{ fontSize: '14px' }}>Email</div>
                    <a 
                      href="mailto:halo@homebite.id"
                      className="text-decoration-none"
                      style={{ 
                        color: 'rgba(236, 240, 241, 0.8)',
                        fontSize: '13px',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#e67e22'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 240, 241, 0.8)'}
                    >
                      halo@homebite.id
                    </a>
                  </div>
                </div>
              </li>
              <li className="mb-3">
                <div className="d-flex align-items-start gap-2">
                  <FaWhatsapp 
                    className="mt-1 flex-shrink-0" 
                    style={{ color: '#e67e22', fontSize: '14px' }} 
                  />
                  <div>
                    <div className="fw-medium mb-1" style={{ fontSize: '14px' }}>WhatsApp</div>
                    <a 
                      href="https://wa.me/6281234567890"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                      style={{ 
                        color: 'rgba(236, 240, 241, 0.8)',
                        fontSize: '13px',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#e67e22'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 240, 241, 0.8)'}
                    >
                      +62 812-3456-7890
                    </a>
                  </div>
                </div>
              </li>
              <li>
                <div className="d-flex align-items-start gap-2">
                  <FaInstagram 
                    className="mt-1 flex-shrink-0" 
                    style={{ color: '#e67e22', fontSize: '14px' }} 
                  />
                  <div>
                    <div className="fw-medium mb-1" style={{ fontSize: '14px' }}>Instagram</div>
                    <a 
                      href="https://instagram.com/homebite.id"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                      style={{ 
                        color: 'rgba(236, 240, 241, 0.8)',
                        fontSize: '13px',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#e67e22'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 240, 241, 0.8)'}
                    >
                      @homebite.id
                    </a>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div 
          className="mb-4"
          style={{ 
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
          }}
        />

        {/* Copyright */}
        <div className="text-center">
          <p className="mb-0" style={{ opacity: 0.7, fontSize: '13px' }}>
            © 2026 Homebite. Dibuat dengan <FaHeart style={{ color: '#e74c3c', fontSize: '12px' }} /> untuk UMKM Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
