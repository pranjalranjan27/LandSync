import type { AffectedFamily } from '../../types/case';
import { IndianRupee } from 'lucide-react';

const mockFamilies: AffectedFamily[] = [
  {
    id: 'fam-01',
    headName: 'Surendra Singh Rawat',
    aadharHash: 'XXXX-XXXX-8921',
    category: 'GENERAL',
    landAreaAcres: 3.1,
    structuresLost: ['1-Storey Pucca House', 'Cattle Shed'],
    displacementStatus: 'DISPLACED',
    compensationAmount: 4850000,
    rehabilitationPackage: 'Constructed Resettlement House + ₹5L One-time Grant',
    paymentStatus: 'DISBURSED'
  },
  {
    id: 'fam-02',
    headName: 'Govind Ram Bhatt',
    aadharHash: 'XXXX-XXXX-3419',
    category: 'GENERAL',
    landAreaAcres: 2.0,
    structuresLost: ['Boundary Wall', 'Borewell'],
    displacementStatus: 'AFFECTED_NON_DISPLACED',
    compensationAmount: 2600000,
    rehabilitationPackage: 'Subsistence Allowance for 12 months',
    paymentStatus: 'APPROVED'
  },
  {
    id: 'fam-03',
    headName: 'Kalyan Singh Arya',
    aadharHash: 'XXXX-XXXX-1102',
    category: 'SC',
    landAreaAcres: 1.2,
    structuresLost: ['Pucca Residential Unit'],
    displacementStatus: 'DISPLACED',
    compensationAmount: 3200000,
    rehabilitationPackage: 'Mandatory Resettlement Land + Annuity Policy',
    paymentStatus: 'PENDING'
  }
];

export function FamilyStatusTable() {
  return (
    <div className="card" style={{ overflowX: 'auto', padding: 'var(--spacing-4)' }}>
      <h4 style={{ marginBottom: 'var(--spacing-3)', color: 'var(--color-primary-navy)' }}>
        R&amp;R Family Beneficiary Registry (RFCTLARR Second Schedule)
      </h4>
      <table className="type-table">
        <thead>
          <tr>
            <th>Family Head / ID</th>
            <th>Category</th>
            <th>Displacement</th>
            <th>Structures Affected</th>
            <th>Compensation</th>
            <th>R&amp;R Scheme Package</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {mockFamilies.map((fam) => (
            <tr key={fam.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{fam.headName}</div>
                <span className="text-mono-id" style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                  Aadhaar: {fam.aadharHash}
                </span>
              </td>
              <td>
                <span className="khasra-badge">{fam.category}</span>
              </td>
              <td>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: fam.displacementStatus === 'DISPLACED' ? 'var(--color-accent-kesari)' : 'var(--color-text-secondary)' }}>
                  {fam.displacementStatus === 'DISPLACED' ? 'Displaced Family' : 'Land Affected'}
                </span>
              </td>
              <td style={{ fontSize: '0.78rem' }}>
                {fam.structuresLost.join(', ')}
              </td>
              <td style={{ fontWeight: 600, color: 'var(--color-primary-navy)' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IndianRupee size={13} /> {(fam.compensationAmount / 100000).toFixed(2)} Lakh
                </div>
              </td>
              <td style={{ fontSize: '0.78rem' }}>{fam.rehabilitationPackage}</td>
              <td>
                <span className={fam.paymentStatus === 'DISBURSED' ? 'badge-green' : fam.paymentStatus === 'APPROVED' ? 'badge-saffron' : 'khasra-badge'}>
                  {fam.paymentStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
