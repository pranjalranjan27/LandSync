import { ReadOnlyWrapper } from './ReadOnlyWrapper';
import { BarChart3, TrendingUp, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { ExportButton } from '../../components/ExportButton';

export function AnalyticsPage() {
  return (
    <ReadOnlyWrapper isReadOnly={true} roleName="Policy Viewer / Public Auditor">
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>National Land Acquisition Analytics (नीति समीक्षक)</h2>
            <p className="text-caption">
              MoRD, NITI Aayog &amp; Parliamentary Oversight Dashboard on RFCTLARR Act 2013 implementation.
            </p>
          </div>

          <ExportButton resource="cases" label="Export National Report" variant="secondary" size="sm" />
        </div>

        {/* Aggregate KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary-navy)' }}>
              <TrendingUp size={16} />
              <span className="text-caption">AVG DISPUTE DURATION</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: 4 }}>4.2 Months</div>
            <span className="text-caption" style={{ color: 'var(--color-accent-green)' }}>↓ 38% reduction since LandSync rollout</span>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-accent-kesari)' }}>
              <ShieldAlert size={16} />
              <span className="text-caption">OBJECTIONS SETTLED</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: 4 }}>91.4%</div>
            <span className="text-caption">Section 15 Landowner Hearings</span>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-accent-green)' }}>
              <Award size={16} />
              <span className="text-caption">DBT DIRECT BENEFIT</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: 4 }}>₹ 14,890 Cr</div>
            <span className="text-caption">100% Solatium disbursed without cash leak</span>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary-navy)' }}>
              <BarChart3 size={16} />
              <span className="text-caption">ACTIVE STATES</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: 4 }}>28 States &amp; 8 UTs</div>
            <span className="text-caption">Standard GIGW 3.0 API nodes</span>
          </div>
        </div>

        {/* State Breakdown Table */}
        <div className="card">
          <h4 style={{ marginBottom: 'var(--spacing-4)', color: 'var(--color-primary-navy)' }}>
            State-Wise Acquisition &amp; Solatium Performance Ledger
          </h4>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table className="type-table" style={{ minWidth: '580px', width: '100%' }}>
            <thead>
              <tr>
                <th>State / UT</th>
                <th>Active Cases</th>
                <th>Land Area (Ha)</th>
                <th>Total Solatium Disbursed</th>
                <th>Sec 15 Objections</th>
                <th>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Uttarakhand</strong></td>
                <td>142</td>
                <td>4,820</td>
                <td>₹ 820 Cr</td>
                <td>18 Pending</td>
                <td><span className="badge-green">100% Compliant</span></td>
              </tr>
              <tr>
                <td><strong>Maharashtra</strong></td>
                <td>310</td>
                <td>18,400</td>
                <td>₹ 3,450 Cr</td>
                <td>45 Pending</td>
                <td><span className="badge-green">100% Compliant</span></td>
              </tr>
              <tr>
                <td><strong>Uttar Pradesh</strong></td>
                <td>485</td>
                <td>32,100</td>
                <td>₹ 5,890 Cr</td>
                <td>62 Pending</td>
                <td><span className="badge-green">100% Compliant</span></td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </ReadOnlyWrapper>
  );
}
