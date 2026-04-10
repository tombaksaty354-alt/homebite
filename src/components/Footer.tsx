"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, supabase } from "@/context/AuthContext";
import { FaStore, FaEnvelope, FaWhatsapp, FaInstagram, FaFacebook, FaHeart } from "react-icons/fa";

interface SiteSettings {
  nama_platform: string;
  email_kontak: string;
  telepon_kontak: string;
  alamat_kontak: string;
  instagram_url: string;
  facebook_url: string;
  whatsapp_number: string;
  footer_description: string;
  copyright_text: string;
}

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .eq("id", 1)
          .single();

        if (!error && data) {
          setSettings(data);
        }
      } catch (err) {
        console.error("Error fetching footer settings:", err);
      }
    }

    fetchSettings();
  }, []);

  const platformName = settings?.nama_platform || "Homebite";
  const email = settings?.email_kontak || "halo@homebite.id";
  const phone = settings?.whatsapp_number || settings?.telepon_kontak || "+62 812-3456-7890";
  const instagramUrl = settings?.instagram_url || "https://instagram.com";
  const facebookUrl = settings?.facebook_url || "https://facebook.com";
  const description = settings?.footer_description || "Marketplace khusus makanan rumahan.";
  const copyright = settings?.copyright_text || "© 2026 Homebite";

  // Extract username from instagram URL
  const instagramUsername = instagramUrl.includes("instagram.com/") 
    ? "@" + instagramUrl.split("instagram.com/")[1].replace("/", "")
    : "@homebite";

  // Format phone number for display
  const phoneDisplay = phone.replace(/\s/g, "").replace(/-/g, "");

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
              <h4 className="fw-bold mb-0">{platformName}</h4>
            </div>
            <p
              className="mb-3"
              style={{
                opacity: 0.8,
                lineHeight: '1.8',
                fontSize: '14px'
              }}
            >
              {description}
            </p>
            <div className="d-flex gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
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
                  title={instagramUsername}
                >
                  <FaInstagram size={18} />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
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
                  title="Facebook"
                >
                  <FaFacebook size={18} />
                </a>
              )}
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
              {email && (
                <li className="mb-3">
                  <div className="d-flex align-items-start gap-2">
                    <FaEnvelope
                      className="mt-1 flex-shrink-0"
                      style={{ color: '#e67e22', fontSize: '14px' }}
                    />
                    <div>
                      <div className="fw-medium mb-1" style={{ fontSize: '14px' }}>Email</div>
                      <a
                        href={`mailto:${email}`}
                        className="text-decoration-none"
                        style={{
                          color: 'rgba(236, 240, 241, 0.8)',
                          fontSize: '13px',
                          transition: 'color 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#e67e22'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 240, 241, 0.8)'}
                      >
                        {email}
                      </a>
                    </div>
                  </div>
                </li>
              )}
              {phone && (
                <li className="mb-3">
                  <div className="d-flex align-items-start gap-2">
                    <FaWhatsapp
                      className="mt-1 flex-shrink-0"
                      style={{ color: '#e67e22', fontSize: '14px' }}
                    />
                    <div>
                      <div className="fw-medium mb-1" style={{ fontSize: '14px' }}>WhatsApp</div>
                      <a
                        href={`https://wa.me/${phoneDisplay}`}
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
                        {phone}
                      </a>
                    </div>
                  </div>
                </li>
              )}
              {instagramUrl && (
                <li>
                  <div className="d-flex align-items-start gap-2">
                    <FaInstagram
                      className="mt-1 flex-shrink-0"
                      style={{ color: '#e67e22', fontSize: '14px' }}
                    />
                    <div>
                      <div className="fw-medium mb-1" style={{ fontSize: '14px' }}>Instagram</div>
                      <a
                        href={instagramUrl}
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
                        {instagramUsername}
                      </a>
                    </div>
                  </div>
                </li>
              )}
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
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
