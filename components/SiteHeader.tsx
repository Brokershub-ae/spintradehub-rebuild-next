"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/site-data";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header style={{ background: 'linear-gradient(135deg, #0056D2 0%, #0041A8 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '16px 0', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* Logo & Brand - Centered */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', cursor: 'pointer' }}>
          <div style={{ width: '70px', height: '70px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', color: 'white', border: '2px solid rgba(255,255,255,0.2)' }}>
            🏭
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '40px', fontWeight: 'bold', color: 'white', margin: 0, letterSpacing: '1px' }}>SpinTrade</h1>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#FF8C00', margin: '4px 0 0 0', letterSpacing: '2px' }}>HUB</p>
          </div>
        </Link>

        {/* Navigation - Centered */}
        <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '10px 16px',
                  textDecoration: 'none',
                  color: isActive ? '#FF8C00' : 'rgba(255,255,255,0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderBottom: isActive ? '2px solid #FF8C00' : 'none',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#FF8C00';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
