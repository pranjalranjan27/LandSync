import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Users, Calendar, MapPin } from 'lucide-react';

interface LogHearingFormProps {
  onSuccess: () => void;
}

export function LogHearingForm({ onSuccess }: LogHearingFormProps) {
  const [village, setVillage] = useState('Mauza Rampur');
  const [attendees, setAttendees] = useState(120);
  const [minutes, setMinutes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Public hearing in ${village} recorded with ${attendees} attendee signatures.`);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
      <h4 style={{ color: 'var(--color-primary-navy)' }}>Log Social Impact Public Hearing (Section 5)</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
            <MapPin size={12} /> Mauza / Gram Panchayat
          </label>
          <input
            type="text"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
            <Users size={12} /> Affected Family Attendees
          </label>
          <input
            type="number"
            value={attendees}
            onChange={(e) => setAttendees(Number(e.target.value))}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
          <Calendar size={12} /> Hearing Minutes &amp; Community Feedback
        </label>
        <textarea
          rows={3}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          placeholder="Record villagers' objections regarding crop compensation, school access, drinking water wells..."
          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="primary" size="sm">
          Save Hearing Record
        </Button>
      </div>
    </form>
  );
}
