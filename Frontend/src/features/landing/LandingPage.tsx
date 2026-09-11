import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Check, IndianRupee, BarChart3 } from 'lucide-react';
import '../../styles/landing.css';

export function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLoginOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="landing-page-root">
      {/* ==========================================================================
          1. HEADER (white background, hairline bottom border)
          ========================================================================== */}
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          {/* Left: State Emblem + NALAMS wordmark + vertical divider + 2-line tagline */}
          <div className="landing-header-left">
            <img
              src="/assets/Ashoka emblem.png"
              alt="State Emblem of India"
              className="emblem-img"
            />
            <div className="brand-block">
              <span className="brand-wordmark">LandSync</span>
              <div className="v-divider" />
              <div className="brand-tagline">
                <div>National Land Acquisition</div>
                <div>and Management System</div>
              </div>
            </div>
          </div>

          {/* Right: Three-line ministry text + vertical divider + navy Login button */}
          <div className="landing-header-right">
            <div className="ministry-text-block">
              <div>Ministry of Rural Development</div>
              <div>Department of Land Resources</div>
              <div>Government of India</div>
            </div>

            <div className="v-divider" />

            <div className="login-btn-container" ref={dropdownRef}>
              <button
                type="button"
                className="header-login-btn"
                onClick={() => setLoginOpen(!loginOpen)}
                aria-expanded={loginOpen}
              >
                Login ▾
              </button>

              {loginOpen && (
                <div className="header-dropdown-menu">
                  <button
                    type="button"
                    className="dropdown-option"
                    onClick={() => {
                      setLoginOpen(false);
                      navigate('/login');
                    }}
                  >
                    <span className="dropdown-option-title">Official Login</span>
                    <span className="dropdown-option-sub">(Govt. / Internal Roles)</span>
                  </button>

                  <div style={{ height: '1px', backgroundColor: 'var(--color-border-slate)', margin: '4px 0' }} />

                  <button
                    type="button"
                    className="dropdown-option"
                    onClick={() => {
                      setLoginOpen(false);
                      navigate('/cases');
                    }}
                  >
                    <span className="dropdown-option-title">Track My Case</span>
                    <span className="dropdown-option-sub">(Citizen Access)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* ==========================================================================
            3. HERO (full-width --color-primary-navy background)
            ========================================================================== */}
        <section className="landing-hero">
          <div className="landing-container">
            <div className="hero-columns">
              {/* LEFT COLUMN (66%) */}
              <div>
                <div className="hero-eyebrow">
                  Ministry of Rural Development · Department of Land Resources
                </div>

                <h1 className="hero-headline">
                  One platform to track<br />
                  every land acquisition case —<br />
                  in real time.
                </h1>

                <p className="hero-supporting-text">
                  LandSync provides a unified, transparent and real-time view of land acquisition cases across India, from proposal to possession.
                </p>

                <div className="hero-cta-row">
                  <button
                    type="button"
                    className="btn-hero-primary"
                    onClick={() => navigate('/cases')}
                  >
                    Track My Case →
                  </button>
                  <button
                    type="button"
                    className="btn-hero-secondary"
                    onClick={() => navigate('/login')}
                  >
                    Official Login
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN (34%) */}
              <div className="hero-right-side">
                <div className="hero-pillars">
                  <div className="hero-pillar-text">TRANSPARENT</div>
                  <div className="hero-pillar-text">ACCOUNTABLE</div>
                  <div className="hero-pillar-text">PEOPLE-CENTRIC</div>
                </div>

                <div className="hero-short-divider" />

                <div className="hero-sub-vision">
                  For a fairer and<br />
                  better-informed India.
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM OF HERO: Full-width line-art illustration of Indian monuments */}
          <div className="hero-skyline-wrapper">
            <img
              src="/assets/buildings banner.png"
              alt="Indian Monuments Skyline Silhouette"
              className="hero-skyline-img"
            />
          </div>
        </section>

        {/* ==========================================================================
            4. STATS BAR (white background, 4 equal columns divided by thin hairlines)
            ========================================================================== */}
        <section className="landing-stats-bar">
          <div className="landing-container">
            <div className="stats-grid-4">
              {/* Stat 1 */}
              <div className="stat-box" data-source="pib.gov.in + NHAI annual report">
                <div className="stat-big-number">
                  <span className="kesari-sign">₹</span>[X] Cr+
                </div>
                <div className="stat-primary-label">
                  Land acquisition spend<br />tracked nationally
                </div>
                <div className="stat-dev-comment">
                  {`{/* SOURCE: pib.gov.in press releases + NHAI annual report — total land acquisition spend figure */}`}
                </div>
              </div>

              {/* Stat 2 */}
              <div className="stat-box" data-source="dilrmp.gov.in">
                <div className="stat-big-number">
                  [X]%+
                </div>
                <div className="stat-primary-label">
                  Land records already<br />digitised nationally
                </div>
                <div className="stat-dev-comment">
                  {`{/* SOURCE: dilrmp.gov.in (Digital India Land Records Modernisation Programme) dashboard */}`}
                </div>
              </div>

              {/* Stat 3 */}
              <div className="stat-box" data-source="gatishakti.gov.in">
                <div className="stat-big-number">
                  [X]+
                </div>
                <div className="stat-primary-label">
                  Ministries already on shared<br />govt GIS infrastructure
                </div>
                <div className="stat-dev-comment">
                  {`{/* SOURCE: gatishakti.gov.in press notes */}`}
                </div>
              </div>

              {/* Stat 4 */}
              <div className="stat-box" data-source="platform-live-metrics">
                <div className="stat-big-number">
                  [Live]
                </div>
                <div className="stat-primary-label">
                  Cases &amp; parcels tracked<br />once platform is live
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            5. "THE PROBLEM TODAY" (Challenges)
            ========================================================================== */}
        <section id="problem-section" className="section-challenges">
          <div className="landing-container">
            <div className="challenges-layout">
              {/* Left: Section Header */}
              <div className="sec-header-block">
                <div className="sec-eyebrow-wrap">
                  <span className="sec-eyebrow-text">CHALLENGES</span>
                  <div className="sec-eyebrow-line" />
                </div>
                <h2 className="sec-title">The Problem Today</h2>
                <p className="sec-desc">
                  Land acquisition processes are still fragmented, opaque and heavily manual, leading to delays, disputes and lack of accountability.
                </p>
              </div>

              <div className="sec-v-divider" />

              {/* Middle: 3 Problem Columns */}
              <div className="challenges-cols-grid">
                {/* 01 */}
                <div className="challenge-item">
                  <div className="challenge-num">01</div>
                  <div className="challenge-bar" />
                  <h3 className="challenge-title">No real-time visibility</h3>
                  <p className="challenge-desc">
                    Cases are tracked through phone calls and physical files, with no unified view of status.
                  </p>
                </div>

                {/* 02 */}
                <div className="challenge-item">
                  <div className="challenge-num">02</div>
                  <div className="challenge-bar" />
                  <h3 className="challenge-title">No jurisdiction control</h3>
                  <p className="challenge-desc">
                    No automated check on cross-district access, leading to overlapping approvals and data silos.
                  </p>
                </div>

                {/* 03 */}
                <div className="challenge-item">
                  <div className="challenge-num">03</div>
                  <div className="challenge-bar" />
                  <h3 className="challenge-title">Resettlement tracking gap</h3>
                  <p className="challenge-desc">
                    Post-award family resettlement and rehabilitation goes undocumented.
                  </p>
                </div>
              </div>

              {/* Right: Case Files Photo with Stamped Folder Badge */}
              <div className="case-files-photo-wrap">
                <img
                  src="/assets/case_files_bw.jpg"
                  alt="Land Acquisition Case File"
                  className="case-files-img"
                />
                <div className="case-file-stamp-overlay">
                  <div className="stamp-sub">LAND ACQUISITION</div>
                  <div className="stamp-main">CASE FILE</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            6. "HOW IT WORKS" (Process)
            ========================================================================== */}
        <section id="how-it-works-section" className="section-process">
          <div className="landing-container">
            <div className="process-layout">
              {/* Left: Section Header */}
              <div className="sec-header-block">
                <div className="sec-eyebrow-wrap">
                  <span className="sec-eyebrow-text">PROCESS</span>
                  <div className="sec-eyebrow-line" />
                </div>
                <h2 className="sec-title">How It Works</h2>
                <p className="sec-desc">
                  A simple, transparent and end-to-end process, from proposal to possession, all on one platform.
                </p>
              </div>

              <div className="sec-v-divider" />

              {/* Right: 5 Process Steps with Connected Horizontal Track */}
              <div className="process-steps-track">
                <div className="process-track-line" />

                {/* Step 01 */}
                <div className="process-step-node">
                  <div className="process-step-num">01</div>
                  <div className="step-circle step-circle-navy">
                    <FileText size={20} strokeWidth={2.2} />
                  </div>
                  <h3 className="step-node-title">Submit</h3>
                  <p className="step-node-desc">
                    Project proposal and land details are submitted on the platform.
                  </p>
                </div>

                {/* Step 02 */}
                <div className="process-step-node">
                  <div className="process-step-num">02</div>
                  <div className="step-circle step-circle-teal">
                    <Search size={20} strokeWidth={2.2} />
                  </div>
                  <h3 className="step-node-title">Review</h3>
                  <p className="step-node-desc">
                    Relevant authorities review documents, verify data and conduct necessary checks.
                  </p>
                </div>

                {/* Step 03 */}
                <div className="process-step-node">
                  <div className="process-step-num">03</div>
                  <div className="step-circle step-circle-orange">
                    <Check size={20} strokeWidth={2.5} />
                  </div>
                  <h3 className="step-node-title">Approve &amp; Award</h3>
                  <p className="step-node-desc">
                    Approved cases are notified and awards are issued as per legal provisions.
                  </p>
                </div>

                {/* Step 04 */}
                <div className="process-step-node">
                  <div className="process-step-num">04</div>
                  <div className="step-circle step-circle-blue">
                    <IndianRupee size={20} strokeWidth={2.2} />
                  </div>
                  <h3 className="step-node-title">Compensate</h3>
                  <p className="step-node-desc">
                    Compensation is disbursed to eligible landowners through DBT and recorded.
                  </p>
                </div>

                {/* Step 05 */}
                <div className="process-step-node">
                  <div className="process-step-num">05</div>
                  <div className="step-circle step-circle-pink">
                    <BarChart3 size={20} strokeWidth={2.2} />
                  </div>
                  <h3 className="step-node-title">Track Possession</h3>
                  <p className="step-node-desc">
                    Land possession status is updated in real time with geo-tagged records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            7. "WHO IT'S FOR" (Stakeholders)
            ========================================================================== */}
        <section className="section-stakeholders">
          <div className="landing-container">
            <div className="stakeholders-layout">
              {/* Left: Section Header */}
              <div className="sec-header-block">
                <div className="sec-eyebrow-wrap">
                  <span className="sec-eyebrow-text">STAKEHOLDERS</span>
                  <div className="sec-eyebrow-line" />
                </div>
                <h2 className="sec-title">Who It's For</h2>
                <p className="sec-desc">
                  A single source of truth for all key stakeholders in the land acquisition ecosystem.
                </p>
              </div>

              <div className="sec-v-divider" />

              {/* Right: 3 Split Cards */}
              <div className="stakeholders-cards-grid">
                {/* Card 1: Central Ministries */}
                <div className="stakeholder-card card-blue">
                  <div className="stakeholder-img-wrap">
                    <img
                      src="/assets/parliament_bw.jpg"
                      alt="Central Ministries"
                      className="stakeholder-photo"
                    />
                  </div>
                  <div className="stakeholder-content-wrap">
                    <h3 className="stakeholder-title">Central Ministries</h3>
                    <div className="stakeholder-accent-bar bar-navy" />
                    <p className="stakeholder-desc">
                      National-level dashboards and reports for better planning and coordination.
                    </p>
                  </div>
                </div>

                {/* Card 2: State & District Officials */}
                <div className="stakeholder-card card-mint">
                  <div className="stakeholder-img-wrap">
                    <img
                      src="/assets/district_officials_bw.jpg"
                      alt="State & District Officials"
                      className="stakeholder-photo"
                    />
                  </div>
                  <div className="stakeholder-content-wrap">
                    <h3 className="stakeholder-title">State &amp; District Officials</h3>
                    <div className="stakeholder-accent-bar bar-teal" />
                    <p className="stakeholder-desc">
                      Case management and jurisdiction-based access with real-time updates.
                    </p>
                  </div>
                </div>

                {/* Card 3: Citizens & Landowners */}
                <div className="stakeholder-card card-rose">
                  <div className="stakeholder-img-wrap">
                    <img
                      src="/assets/citizens_bw.jpg"
                      alt="Citizens & Landowners"
                      className="stakeholder-photo"
                    />
                  </div>
                  <div className="stakeholder-content-wrap">
                    <h3 className="stakeholder-title">Citizens &amp; Landowners</h3>
                    <div className="stakeholder-accent-bar bar-rose" />
                    <p className="stakeholder-desc">
                      Track their own case status and compensation transparently.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            8. TRUST & COMPLIANCE BAND (silver-gray bar)
            ========================================================================== */}
        <section id="trust-section" className="section-trust-bar">
          <div className="landing-container">
            <div className="trust-bar-layout">
              {/* Left: Gavel + stacked caption */}
              <div className="trust-left-cluster">
                <img
                  src="/assets/justice_gavel_bw.jpg"
                  alt="Justice Gavel"
                  className="trust-gavel-img"
                />
                <div className="trust-words-stack">
                  <div>JUSTICE</div>
                  <div>TRANSPARENCY</div>
                  <div>FAIR COMPENSATION</div>
                </div>
              </div>

              <div className="trust-v-separator" />

              {/* Center: Statutory text */}
              <div className="trust-center-text">
                Role-based access control and secure data management in compliance with the Right to Fair Compensation and Transparency in Land Acquisition Act, 2013 (RFCTLARR Act, 2013).
              </div>

              <div className="trust-v-separator" />

              {/* Right: Tagline */}
              <div className="trust-right-tag">
                <div className="trust-right-row">
                  <div className="trust-dash-line" />
                  <span className="trust-tag-bold">LAND FOR A</span>
                </div>
                <div className="trust-tag-bold">STRONGER TOMORROW</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ==========================================================================
          9. FOOTER (white background, hairline top border)
          ========================================================================== */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          {/* Left: LandSync + vertical rule + tagline */}
          <div className="footer-left-group">
            <span className="footer-wordmark">LandSync</span>
            <div className="v-divider" />
            <div className="footer-tagline-text">
              <div>National Land Acquisition</div>
              <div>and Management System</div>
            </div>
          </div>

          {/* Right: Links row + Last updated */}
          <div className="footer-right-group">
            <div className="footer-links-row">
              <span className="link-text">RTI / Grievance Redressal</span>
              <span className="footer-pipe">|</span>
              <span className="link-text">Accessibility Options (Screen Reader)</span>
              <span className="footer-pipe">|</span>
              <span className="link-text">Terms</span>
              <span className="footer-pipe">|</span>
              <span className="link-text">Privacy</span>
              <span className="footer-pipe">|</span>
              <span className="link-text">Contact</span>
            </div>
            <div className="footer-last-updated">
              Last updated: 05 Sep 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
