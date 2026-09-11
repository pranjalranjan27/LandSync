/**
 * ParcelSelectStub — Temporary list-based parcel selector.
 * Matches the interface a future <ParcelMap mode="select"> will implement.
 * Swap this entire component without changing the form around it.
 */
import React, { useState } from 'react';
import { MapPin, CheckSquare, Square, Search, Info } from 'lucide-react';
import './ParcelSelectStub.css';

export interface Parcel {
  khasraNumber: string;
  mauza: string;
  soilType: string;
  areaHectares: number;
  ownerName: string;
  circleRatePerSqMtr: number;
  solatiumMultiplier: number;
}

interface ParcelSelectStubProps {
  /** Currently selected khasra numbers (controlled) */
  selected: string[];
  /** Called whenever the selection changes */
  onChange: (selected: string[]) => void;
  /** Optional pool of available parcels — defaults to demo parcels */
  parcels?: Parcel[];
  /** If true the component is view-only */
  readOnly?: boolean;
}

const DEMO_PARCELS: Parcel[] = [
  { khasraNumber: '101/A', mauza: 'Mauza Rampur', soilType: 'Terraced Irrigated (Talaon)', areaHectares: 3.2, ownerName: 'Ramesh Kumar Singh', circleRatePerSqMtr: 1450, solatiumMultiplier: 2.0 },
  { khasraNumber: '101/B', mauza: 'Mauza Rampur', soilType: 'Non-irrigated (Upraon)', areaHectares: 1.8, ownerName: 'Kamala Devi Negi', circleRatePerSqMtr: 950, solatiumMultiplier: 2.0 },
  { khasraNumber: '102/A', mauza: 'Mauza Rampur', soilType: 'Settlement Residential', areaHectares: 0.75, ownerName: 'Govind Ram Bhatt', circleRatePerSqMtr: 2800, solatiumMultiplier: 2.0 },
  { khasraNumber: '103/1',  mauza: 'Mauza Rampur', soilType: 'Pasture / Barren', areaHectares: 5.0, ownerName: 'Gram Sabha Rampur', circleRatePerSqMtr: 600, solatiumMultiplier: 2.0 },
  { khasraNumber: '104/2',  mauza: 'Mauza Kanda', soilType: 'Terraced Irrigated (Talaon)', areaHectares: 2.4, ownerName: 'Suresh Prasad Rawat', circleRatePerSqMtr: 1200, solatiumMultiplier: 2.0 },
  { khasraNumber: '105/A', mauza: 'Mauza Kanda', soilType: 'Forest Adjacent', areaHectares: 4.1, ownerName: 'Parbati Devi', circleRatePerSqMtr: 800, solatiumMultiplier: 2.0 },
  { khasraNumber: '106/3',  mauza: 'Mauza Kanda', soilType: 'Non-irrigated (Upraon)', areaHectares: 1.2, ownerName: 'Mohanlal Rawat', circleRatePerSqMtr: 900, solatiumMultiplier: 2.0 },
  { khasraNumber: '107/B', mauza: 'Mauza Shivpuri', soilType: 'Orchard', areaHectares: 0.9, ownerName: 'Sushila Bisht', circleRatePerSqMtr: 2100, solatiumMultiplier: 2.0 },
];

export function ParcelSelectStub({
  selected,
  onChange,
  parcels = DEMO_PARCELS,
  readOnly = false,
}: ParcelSelectStubProps) {
  const [query, setQuery] = useState('');

  const filtered = parcels.filter(
    (p) =>
      p.khasraNumber.toLowerCase().includes(query.toLowerCase()) ||
      p.mauza.toLowerCase().includes(query.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(query.toLowerCase())
  );

  const totalSelected = parcels.filter((p) => selected.includes(p.khasraNumber));
  const totalArea = totalSelected.reduce((sum, p) => sum + p.areaHectares, 0);

  const toggleParcel = (khasra: string) => {
    if (readOnly) return;
    if (selected.includes(khasra)) {
      onChange(selected.filter((k) => k !== khasra));
    } else {
      onChange([...selected, khasra]);
    }
  };

  const toggleAll = () => {
    if (readOnly) return;
    if (filtered.every((p) => selected.includes(p.khasraNumber))) {
      onChange(selected.filter((k) => !filtered.find((p) => p.khasraNumber === k)));
    } else {
      const toAdd = filtered
        .map((p) => p.khasraNumber)
        .filter((k) => !selected.includes(k));
      onChange([...selected, ...toAdd]);
    }
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.includes(p.khasraNumber));

  return (
    <div className="parcel-select-stub">
      {/* Header */}
      <div className="pss-header">
        <div className="pss-header-left">
          <MapPin size={16} className="pss-icon" />
          <span className="pss-title">Cadastral Parcel Selection</span>
          <span className="pss-stub-badge">GIS Stub</span>
        </div>
        <div className="pss-info-tip">
          <Info size={13} />
          <span>BhuNaksha integration coming in Phase 2</span>
        </div>
      </div>

      {/* Search */}
      {!readOnly && (
        <div className="pss-search-row">
          <div className="pss-search-wrap">
            <Search size={14} className="pss-search-icon" />
            <input
              type="text"
              className="pss-search-input"
              placeholder="Search Khasra No., Mauza or owner name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {!readOnly && (
            <button type="button" className="pss-select-all" onClick={toggleAll}>
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      )}

      {/* Summary strip */}
      {selected.length > 0 && (
        <div className="pss-summary">
          <strong>{selected.length}</strong> parcel{selected.length !== 1 ? 's' : ''} selected &nbsp;•&nbsp;
          <strong>{totalArea.toFixed(2)} Ha</strong> total area
        </div>
      )}

      {/* Parcel list */}
      <div className="pss-list">
        {filtered.length === 0 && (
          <div className="pss-empty">No parcels match your search criteria.</div>
        )}
        {filtered.map((parcel) => {
          const isSelected = selected.includes(parcel.khasraNumber);
          return (
            <div
              key={parcel.khasraNumber}
              className={`pss-row${isSelected ? ' pss-row--selected' : ''}${readOnly ? ' pss-row--readonly' : ''}`}
              onClick={() => toggleParcel(parcel.khasraNumber)}
              role={readOnly ? 'listitem' : 'checkbox'}
              aria-checked={isSelected}
              tabIndex={readOnly ? -1 : 0}
              onKeyDown={(e) => {
                if (!readOnly && (e.key === ' ' || e.key === 'Enter')) {
                  e.preventDefault();
                  toggleParcel(parcel.khasraNumber);
                }
              }}
            >
              {/* Checkbox indicator */}
              {!readOnly && (
                <div className="pss-check">
                  {isSelected
                    ? <CheckSquare size={18} className="pss-check-icon pss-check-icon--on" />
                    : <Square size={18} className="pss-check-icon pss-check-icon--off" />}
                </div>
              )}

              {/* Khasra badge */}
              <div className="pss-khasra">
                <span className="khasra-badge">{parcel.khasraNumber}</span>
                <span className="pss-mauza">{parcel.mauza}</span>
              </div>

              {/* Metadata columns */}
              <div className="pss-meta">
                <span className="pss-meta-label">Owner</span>
                <span className="pss-meta-value">{parcel.ownerName}</span>
              </div>
              <div className="pss-meta">
                <span className="pss-meta-label">Type</span>
                <span className="pss-meta-value">{parcel.soilType}</span>
              </div>
              <div className="pss-meta pss-meta--num">
                <span className="pss-meta-label">Area</span>
                <span className="pss-meta-value pss-meta-value--bold">{parcel.areaHectares} Ha</span>
              </div>
              <div className="pss-meta pss-meta--num">
                <span className="pss-meta-label">Circle Rate</span>
                <span className="pss-meta-value">₹{parcel.circleRatePerSqMtr}/m²</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
