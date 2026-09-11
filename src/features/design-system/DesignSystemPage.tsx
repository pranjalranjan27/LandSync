import { useState } from 'react';
import { 
  ShieldCheck, 
  Globe, 
  Copy, 
  Check, 
  Layers, 
  Type, 
  FileText
} from 'lucide-react';

interface ColorToken {
  name: string;
  variable: string;
  hex: string;
  role: string;
  defaultPairing: string;
  contrastRatio: string;
  wcagResult: 'AAA' | 'AA' | 'Fails AA' | 'Reference' | 'Fails 3:1';
  flagNote?: string;
  isFillOnly?: boolean;
}

const colorTokens: ColorToken[] = [
  {
    name: 'Primary Navy (Ashoka)',
    variable: '--color-primary-navy',
    hex: '#1B3F75',
    role: 'Headers, primary action buttons, authoritative UI',
    defaultPairing: 'on White #FFFFFF',
    contrastRatio: '10.43:1',
    wcagResult: 'AAA',
    flagNote: 'Core authoritative government tone'
  },
  {
    name: 'Primary Navy (Off-White surface)',
    variable: '--color-primary-navy',
    hex: '#1B3F75',
    role: 'Primary UI on tinted background',
    defaultPairing: 'on #F8F9FA',
    contrastRatio: '9.90:1',
    wcagResult: 'AAA'
  },
  {
    name: 'Accent Saffron (Fill-Only)',
    variable: '--color-accent-saffron',
    hex: '#FF9933',
    role: 'Focus rings, badges, decorative highlights',
    defaultPairing: 'on White #FFFFFF',
    contrastRatio: '2.13:1',
    wcagResult: 'Fails AA',
    flagNote: 'FILL-ONLY color. Fails as text on white. Use only as background with dark Navy/Black text (9.86:1 AAA).',
    isFillOnly: true
  },
  {
    name: 'Accent Kesari (Dark Saffron)',
    variable: '--color-accent-kesari',
    hex: '#E65A00',
    role: 'Active tab underline, pressed states, primary actions',
    defaultPairing: 'on White #FFFFFF',
    contrastRatio: '3.60:1',
    wcagResult: 'AA',
    flagNote: 'AA for large text / UI components only (>=18px or bold >=14px). 5.83:1 with black text.'
  },
  {
    name: 'Accent Green (Tiranga Green)',
    variable: '--color-accent-green',
    hex: '#138808',
    role: 'Success states, "Acquired" status, verified badges',
    defaultPairing: 'on White #FFFFFF',
    contrastRatio: '4.61:1',
    wcagResult: 'AA',
    flagNote: 'Borderline AA. Keep >=14px bold for text, or prefer status badge fill with white text.'
  },
  {
    name: 'Surface Off-White',
    variable: '--color-surface-offwhite',
    hex: '#F8F9FA',
    role: 'Page background & alternating rows',
    defaultPairing: 'Base Surface',
    contrastRatio: '—',
    wcagResult: 'Reference'
  },
  {
    name: 'Surface Card',
    variable: '--color-surface-card',
    hex: '#FFFFFF',
    role: 'Card / panel / modal background',
    defaultPairing: 'Card Surface',
    contrastRatio: '—',
    wcagResult: 'Reference'
  },
  {
    name: 'Border Slate',
    variable: '--color-border-slate',
    hex: '#D1D5DB',
    role: 'Card borders, dividers, subtle section separators',
    defaultPairing: 'on White #FFFFFF',
    contrastRatio: '1.47:1',
    wcagResult: 'Fails 3:1',
    flagNote: 'Acceptable ONLY for decorative/non-essential dividers. Pair with icon/label for required fields.'
  },
  {
    name: 'Text Heading',
    variable: '--color-text-heading',
    hex: '#111827',
    role: 'H1–H4 headings, high authority titles',
    defaultPairing: 'on White #FFFFFF',
    contrastRatio: '17.74:1',
    wcagResult: 'AAA'
  },
  {
    name: 'Text Body',
    variable: '--color-text-body',
    hex: '#1F2937',
    role: 'Primary body copy & inputs',
    defaultPairing: 'on White #FFFFFF',
    contrastRatio: '14.67:1',
    wcagResult: 'AAA'
  },
  {
    name: 'Text Secondary',
    variable: '--color-text-secondary',
    hex: '#4B5563',
    role: 'Secondary copy, metadata labels, captions',
    defaultPairing: 'on White #FFFFFF',
    contrastRatio: '7.56:1',
    wcagResult: 'AAA'
  },
  {
    name: 'Text Disabled',
    variable: '--color-text-disabled',
    hex: '#9CA3AF',
    role: 'Disabled elements & placeholders only',
    defaultPairing: 'on White #FFFFFF',
    contrastRatio: '2.54:1',
    wcagResult: 'Fails AA',
    flagNote: 'Acceptable under WCAG 1.4.3 inactive UI exemption. Never reuse for active text.'
  },
  {
    name: 'High Contrast Base',
    variable: '--hc-base-black',
    hex: '#000000',
    role: 'High-contrast mode page base',
    defaultPairing: 'Dark Canvas',
    contrastRatio: '—',
    wcagResult: 'Reference'
  },
  {
    name: 'High Contrast Yellow',
    variable: '--hc-text-yellow',
    hex: '#FFFF00',
    role: 'High-contrast text & accents on black',
    defaultPairing: 'on Black #000000',
    contrastRatio: '19.56:1',
    wcagResult: 'AAA'
  }
];

const typeScaleRows = [
  { level: 'H1', size: '2.5rem / 40px', weight: '700', lh: '1.2', ls: '-0.02em', sampleEn: 'Land Acquisition Portal', sampleHi: 'भूमि अधिग्रहण पोर्टल' },
  { level: 'H2', size: '2rem / 32px', weight: '700', lh: '1.25', ls: '-0.01em', sampleEn: 'National Case Registry', sampleHi: 'राष्ट्रीय मामला पंजी' },
  { level: 'H3', size: '1.5rem / 24px', weight: '600', lh: '1.3', ls: '0', sampleEn: 'Khasra Survey Verification', sampleHi: 'खसरा सर्वेक्षण सत्यापन' },
  { level: 'H4', size: '1.25rem / 20px', weight: '600', lh: '1.35', ls: '0', sampleEn: 'Rehabilitation & Resettlement', sampleHi: 'पुनर्वास एवं पुनर्व्यवस्था' },
  { level: 'H5', size: '1.125rem / 18px', weight: '600', lh: '1.4', ls: '0', sampleEn: 'Fair Compensation Award', sampleHi: 'उचित मुआवजा अधिनिर्णय' },
  { level: 'H6', size: '1rem / 16px', weight: '600', lh: '1.4', ls: '0', sampleEn: 'District Collector Notification', sampleHi: 'जिला कलेक्टर अधिसूचना' },
  { level: 'Body', size: '1rem / 16px', weight: '400', lh: '1.6', ls: '0', sampleEn: 'LandSync provides an end-to-end transparent workflow from section 4 proposal to possession.', sampleHi: 'लैंडसिंक धारा 4 प्रस्ताव से लेकर भूमि कब्जे तक एक पारदर्शी कार्यप्रवाह प्रदान करता है।' },
  { level: 'Body Small', size: '0.875rem / 14px', weight: '400', lh: '1.5', ls: '0', sampleEn: 'Verified against State Revenue cadastral survey records.', sampleHi: 'राज्य राजस्व भू-अभिलेख के अनुसार सत्यापित।' },
  { level: 'Caption', size: '0.75rem / 12px', weight: '500', lh: '1.4', ls: '0.02em', sampleEn: 'RFCTLARR ACT 2013 • SECTION 11(1) GAZETTE', sampleHi: 'आरएफसीटीएलएआरआर अधिनियम 2013 • धारा 11(1) राजपत्र' }
];

export function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'typography' | 'bilingual' | 'components'>('tokens');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [langToggle, setLangToggle] = useState<'en' | 'hi'>('en');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>LandSync Design Tokens &amp; Typography System</h2>
          <p className="text-caption">
            Official Companion to LandSync Build Spec • GIGW 3.0 &amp; WCAG 2.1 AAA Standard
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={`tab-item ${activeTab === 'tokens' ? 'active' : ''}`} onClick={() => setActiveTab('tokens')}>
            <Layers size={14} style={{ marginRight: 4 }} /> Color Tokens
          </button>
          <button className={`tab-item ${activeTab === 'typography' ? 'active' : ''}`} onClick={() => setActiveTab('typography')}>
            <Type size={14} style={{ marginRight: 4 }} /> Typography Scale
          </button>
          <button className={`tab-item ${activeTab === 'bilingual' ? 'active' : ''}`} onClick={() => setActiveTab('bilingual')}>
            <Globe size={14} style={{ marginRight: 4 }} /> 5 Bilingual Rules
          </button>
          <button className={`tab-item ${activeTab === 'components' ? 'active' : ''}`} onClick={() => setActiveTab('components')}>
            <ShieldCheck size={14} style={{ marginRight: 4 }} /> UI Library
          </button>
        </div>
      </div>

      {activeTab === 'tokens' && (
        <div className="showcase-grid">
          {colorTokens.map((token, idx) => (
            <div key={idx} className="swatch-card">
              <div 
                className="swatch-preview" 
                style={{ 
                  backgroundColor: token.hex, 
                  color: token.hex === '#FFFFFF' || token.hex === '#F8F9FA' || token.hex === '#D1D5DB' || token.hex === '#FFFF00' ? '#111827' : '#FFFFFF' 
                }}
              >
                <span>{token.hex}</span>
                {token.isFillOnly && (
                  <span style={{ position: 'absolute', top: 6, right: 6, background: '#111827', color: '#FF9933', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 2 }}>
                    FILL ONLY
                  </span>
                )}
              </div>
              <div className="swatch-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="swatch-token-name">{token.variable}</span>
                  <button onClick={() => copyToClipboard(`var(${token.variable})`)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    {copiedToken === `var(${token.variable})` ? <Check size={14} color="#138808" /> : <Copy size={14} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{token.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{token.role}</div>
                <div className="swatch-meta" style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--color-border-slate)' }}>
                  <span>Pairing: {token.defaultPairing}</span>
                  <span className={`wcag-pill ${token.wcagResult === 'AAA' ? 'wcag-pass-aaa' : token.wcagResult === 'AA' ? 'wcag-pass-aa' : token.wcagResult === 'Reference' ? '' : 'wcag-flag-fail'}`}>
                    {token.contrastRatio !== '—' && `${token.contrastRatio} `}{token.wcagResult}
                  </span>
                </div>
                {token.flagNote && (
                  <div style={{ marginTop: 6, fontSize: '0.72rem', color: token.isFillOnly ? '#c2410c' : 'var(--color-text-secondary)', background: 'var(--color-surface-offwhite)', padding: '4px 6px', borderRadius: 2 }}>
                    {token.flagNote}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'typography' && (
        <div>
          <table className="type-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Size / Px</th>
                <th>Weight</th>
                <th>LH</th>
                <th>Spacing</th>
                <th>Latin Render (Noto Sans)</th>
                <th>Devanagari Render (Noto Sans Devanagari)</th>
              </tr>
            </thead>
            <tbody>
              {typeScaleRows.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.level}</strong></td>
                  <td><code>{row.size}</code></td>
                  <td><code>{row.weight}</code></td>
                  <td><code>{row.lh}</code></td>
                  <td><code>{row.ls}</code></td>
                  <td style={{ fontSize: row.size.split('/')[0].trim(), fontWeight: Number(row.weight), lineHeight: Number(row.lh), letterSpacing: row.ls }}>
                    {row.sampleEn}
                  </td>
                  <td lang="hi" className="script-devanagari" style={{ fontSize: row.size.split('/')[0].trim(), fontWeight: Number(row.weight), lineHeight: Math.max(1.5, Number(row.lh)), letterSpacing: 0 }}>
                    {row.sampleHi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="card" style={{ marginTop: 'var(--spacing-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--spacing-2)' }}>
              <FileText size={18} color="var(--color-primary-navy)" />
              <h4>Monospace Fixed-Width Identifiers (JetBrains Mono)</h4>
            </div>
            <p className="text-caption">Khasra numbers, SHA-256 ledger hashes, and Case IDs rendered with fixed-width clarity.</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--spacing-3)' }}>
              <span className="khasra-badge">KHASRA 442/19-A</span>
              <span className="text-mono-id" style={{ color: 'var(--color-primary-navy)', fontWeight: 600 }}>UK-PAURI-2026-00192</span>
              <span className="text-mono-id" style={{ color: 'var(--color-text-secondary)' }}>SHA-256: 7f83b1657ff1fc53b92dc181...</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bilingual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div className="card">
            <span className="badge-saffron">RULE 1</span>
            <h4 style={{ margin: '6px 0' }}>Line-Height Headroom</h4>
            <p className="text-caption">Devanagari matras extend above/below. Minimum line-height 1.5 enforced; 1.65 default.</p>
          </div>
          <div className="card">
            <span className="badge-saffron">RULE 2</span>
            <h4 style={{ margin: '6px 0' }}>Visual Size Parity (~6% Reduction)</h4>
            <p className="text-caption">Optical parity achieved by scaling Devanagari span down by 6% when side-by-side with Latin.</p>
            <div className="bilingual-pair" style={{ marginTop: 8, fontSize: '1.2rem' }}>
              <span style={{ fontWeight: 600 }}>Preliminary Gazette:</span>
              <span lang="hi" className="hi-label" style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>प्रारंभिक राजपत्र</span>
            </div>
          </div>
          <div className="card">
            <span className="badge-saffron">RULE 3</span>
            <h4 style={{ margin: '6px 0' }}>Vertical Alignment: Baseline Only</h4>
            <p className="text-caption">Baseline alignment ensures consistent font baseline without jumping.</p>
          </div>
          <div className="card">
            <span className="badge-saffron">RULE 4</span>
            <h4 style={{ margin: '6px 0' }}>No Layout Shift on Language Toggle</h4>
            <button className="btn btn-secondary" style={{ margin: '8px 0' }} onClick={() => setLangToggle(langToggle === 'en' ? 'hi' : 'en')}>
              Toggle Language: {langToggle === 'en' ? 'English' : 'हिन्दी'}
            </button>
            <div className="i18n-toggle-container" style={{ border: '1px dashed var(--color-primary-navy)', padding: '8px' }}>
              {langToggle === 'en' ? 'Section 11 gazette notification published in Mauza Rampur.' : <span lang="hi" className="script-devanagari">मौजा रामपुर में धारा 11 राजपत्र अधिसूचना प्रकाशित।</span>}
            </div>
          </div>
          <div className="card">
            <span className="badge-saffron">RULE 5</span>
            <h4 style={{ margin: '6px 0' }}>Don't Italicize Devanagari</h4>
            <p className="text-caption">Devanagari uses SemiBold / Bold weight instead of artificial browser italics.</p>
          </div>
        </div>
      )}

      {activeTab === 'components' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-6)' }}>
          <div className="card">
            <h4>Buttons</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary">Primary Navy (AAA 10.43:1)</button>
              <button className="btn btn-accent-kesari">Accent Kesari Action</button>
              <button className="btn btn-secondary">Secondary Hairline</button>
            </div>
          </div>

          <div className="card">
            <h4>Status Badges</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <div><span className="badge-saffron">⚠️ Saffron Fill-Only (Navy text AAA)</span></div>
              <div><span className="badge-green">✓ Green Fill (White text AA)</span></div>
              <div><span className="badge-green-subtle">● Award Disbursed: ₹4.82 Cr</span></div>
              <div><span className="khasra-badge">KHASRA 442/19-A</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
