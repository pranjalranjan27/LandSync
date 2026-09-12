import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Map as MapIcon,
  Search,
  Crosshair,
  Copy,
  Check,
  Link as LinkIcon,
  ShieldCheck,
  X,
  Compass,
} from 'lucide-react';
import type {
  GeoJSONFeatureCollection,
  GeoJSONFeature,
  ParcelProperties,
  EncroachmentStatus,
  ParcelSearchItem,
} from '../../types/parcel';
import {
  fetchCaseParcels,
  fetchParcels,
  searchKhasra,
  linkParcelToCase,
  updateEncroachmentStatus,
} from '../../lib/api/parcelsApi';
import './CadastralMap.css';

interface CadastralMapProps {
  /** Optional case ID to filter/link parcels */
  caseId?: string | number;
  /** District name (default: Gautam Buddha Nagar) */
  district?: string;
  /** Mauza / village name */
  mauza?: string;
  /** Optional initial khasra numbers to highlight */
  khasraNumbers?: string[];
  /** Callback when a parcel is clicked / selected */
  onSelectParcel?: (parcel: ParcelProperties) => void;
}

export function CadastralMap({
  caseId,
  district = 'Gautam Buddha Nagar',
  mauza,
  khasraNumbers = [],
  onSelectParcel,
}: CadastralMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const highlightLayerRef = useRef<L.Path | null>(null);

  const [parcelsData, setParcelsData] = useState<GeoJSONFeatureCollection | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<ParcelSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<'all' | EncroachmentStatus>('all');

  // Encroachment update modal state
  const [showEncroachModal, setShowEncroachModal] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<EncroachmentStatus>('clear');
  const [evidenceDocId, setEvidenceDocId] = useState<string>('DOC-EVID-2026-001');
  const [encroachRemarks, setEncroachRemarks] = useState<string>('');
  const [isUpdatingEncroachment, setIsUpdatingEncroachment] = useState<boolean>(false);
  const [isLinking, setIsLinking] = useState<boolean>(false);

  // Style generators based on encroachment status
  const getFeatureStyle = useCallback(
    (feature?: any): L.PathOptions => {
      const status: EncroachmentStatus = feature?.properties?.encroachment_status || 'clear';
      if (status === 'encroached') {
        return {
          color: '#dc2626',
          weight: 2,
          opacity: 0.9,
          fillColor: '#ef4444',
          fillOpacity: 0.45,
        };
      }
      if (status === 'disputed') {
        return {
          color: '#d97706',
          weight: 2,
          opacity: 0.9,
          fillColor: '#f59e0b',
          fillOpacity: 0.4,
        };
      }
      // 'clear' default
      return {
        color: '#16a34a',
        weight: 2,
        opacity: 0.9,
        fillColor: '#22c55e',
        fillOpacity: 0.35,
      };
    },
    []
  );

  // Highlight selected feature on map
  const highlightFeature = useCallback((layer: L.Path) => {
    if (highlightLayerRef.current && geoJsonLayerRef.current) {
      geoJsonLayerRef.current.resetStyle(highlightLayerRef.current);
    }
    highlightLayerRef.current = layer;
    layer.setStyle({
      color: '#1B3F75',
      weight: 3.5,
      opacity: 1,
      fillOpacity: 0.65,
    });
    if ((layer as any).bringToFront) {
      (layer as any).bringToFront();
    }
  }, []);

  // Center & fly to coordinates
  const flyToCoordinates = useCallback((lat: number, lng: number, zoom = 16) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], zoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, []);

  // Select parcel handler
  const handleSelectFeature = useCallback(
    (feature: GeoJSONFeature, layer?: L.Path) => {
      setSelectedFeature(feature);
      if (layer) {
        highlightFeature(layer);
      }
      if (onSelectParcel) {
        onSelectParcel(feature.properties);
      }
    },
    [highlightFeature, onSelectParcel]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default centroid for Gautam Buddha Nagar / Jewar region
    const defaultCenter: [number, number] = [28.45, 77.52];
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | LandSync BhuNaksha GIS',
    }).addTo(map);

    mapRef.current = map;

    // Auto resize handling
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Load parcel data
  const loadParcels = useCallback(async () => {
    setLoading(true);
    try {
      let data: GeoJSONFeatureCollection;
      if (caseId) {
        data = await fetchCaseParcels(caseId);
      } else {
        data = await fetchParcels({ district });
      }
      setParcelsData(data);
    } catch (err) {
      console.error('[CadastralMap] Error fetching parcel GeoJSON:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, district]);

  useEffect(() => {
    loadParcels();
  }, [loadParcels]);

  // Render GeoJSON polygons onto Leaflet map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !parcelsData) return;

    // Remove existing layer if present
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    // Filter features if filterStatus is active
    const filteredFeatures =
      filterStatus === 'all'
        ? parcelsData.features
        : parcelsData.features.filter(
            (f) => f.properties.encroachment_status === filterStatus
          );

    const filteredCollection: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: filteredFeatures,
    };

    const layer = L.geoJSON(filteredCollection as any, {
      style: (feature) => getFeatureStyle(feature),
      onEachFeature: (feature: any, featureLayer: L.Layer) => {
        const props: ParcelProperties = feature.properties;
        const pLayer = featureLayer as L.Path;

        // Hover tooltip with cadastral summary
        pLayer.bindTooltip(
          `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #1B3F75;">Khasra ${props.khasra_number}</strong><br/>
            <span>Mauza: ${props.village} (${props.revenue_sheet_no})</span><br/>
            <span>Area: ${props.area_hectares} ha (${props.area_sqm.toLocaleString()} m²)</span><br/>
            <span style="font-weight: 600; text-transform: capitalize; color: ${
              props.encroachment_status === 'clear'
                ? '#15803d'
                : props.encroachment_status === 'disputed'
                ? '#b45309'
                : '#b91c1c'
            };">Status: ${props.encroachment_status}</span>
          </div>
          `,
          { sticky: true, direction: 'top', opacity: 0.95 }
        );

        // Click selection
        pLayer.on('click', () => {
          handleSelectFeature(feature as GeoJSONFeature, pLayer);
        });

        // Hover effects
        pLayer.on('mouseover', () => {
          if (highlightLayerRef.current !== pLayer) {
            pLayer.setStyle({
              weight: 2.8,
              fillOpacity: 0.6,
            });
          }
        });
        pLayer.on('mouseout', () => {
          if (highlightLayerRef.current !== pLayer) {
            layer.resetStyle(pLayer);
          }
        });
      },
    });

    layer.addTo(map);
    geoJsonLayerRef.current = layer;

    // Fit map bounds to polygons if features exist
    if (filteredFeatures.length > 0) {
      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
      } catch (err) {
        console.warn('Bounds calculation error:', err);
      }
    }

    // Auto-select initial match if khasraNumbers supplied
    if (khasraNumbers.length > 0 && !selectedFeature) {
      const match = filteredFeatures.find((f) =>
        khasraNumbers.some(
          (k) =>
            f.properties.khasra_number.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(f.properties.khasra_number.toLowerCase())
        )
      );
      if (match) {
        setSelectedFeature(match);
      }
    }
  }, [parcelsData, filterStatus, getFeatureStyle, handleSelectFeature, khasraNumbers, selectedFeature]);

  // Fit bounds button handler
  const handleFitBounds = useCallback(() => {
    if (mapRef.current && geoJsonLayerRef.current) {
      try {
        const bounds = geoJsonLayerRef.current.getBounds();
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (err) {
        console.warn('Fit bounds error:', err);
      }
    }
  }, []);

  // Search input handler with debounced lookup
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      setIsSearching(true);
      try {
        const results = await searchKhasra(query.trim(), district);
        setSearchSuggestions(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchSuggestions([]);
    }
  };

  // Select suggestion from search dropdown
  const handleSelectSuggestion = (item: ParcelSearchItem) => {
    setSearchQuery(item.khasra_number);
    setSearchSuggestions([]);

    // Find in loaded features
    if (parcelsData) {
      const feature = parcelsData.features.find(
        (f) => f.id === item.id || f.properties.khasra_number === item.khasra_number
      );
      if (feature) {
        setSelectedFeature(feature);
        flyToCoordinates(feature.properties.centroid_lat, feature.properties.centroid_lng, 16);

        // Highlight layer on map
        if (geoJsonLayerRef.current) {
          geoJsonLayerRef.current.eachLayer((l: any) => {
            if (l.feature?.id === feature.id) {
              highlightFeature(l);
            }
          });
        }
        return;
      }
    }

    // If not found in current view, fly to centroid
    flyToCoordinates(item.centroid_lat, item.centroid_lng, 16);
  };

  // Copy coordinates to clipboard
  const handleCopyCoordinates = () => {
    if (!selectedFeature) return;
    const { centroid_lat, centroid_lng } = selectedFeature.properties;
    const text = `${centroid_lat.toFixed(6)}, ${centroid_lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Link parcel to case
  const handleLinkCase = async () => {
    if (!selectedFeature || !caseId) return;
    setIsLinking(true);
    try {
      const updated = await linkParcelToCase(selectedFeature.id, caseId);
      if (updated && parcelsData) {
        // Update feature in local state
        const updatedFeatures = parcelsData.features.map((f) =>
          f.id === selectedFeature.id
            ? { ...f, properties: { ...f.properties, case_id: Number(caseId) } }
            : f
        );
        setParcelsData({ ...parcelsData, features: updatedFeatures });
        setSelectedFeature({
          ...selectedFeature,
          properties: { ...selectedFeature.properties, case_id: Number(caseId) },
        });
      }
    } catch (err) {
      console.error('Link case failed:', err);
    } finally {
      setIsLinking(false);
    }
  };

  // Update encroachment status
  const handleUpdateEncroachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeature) return;
    setIsUpdatingEncroachment(true);

    try {
      const updated = await updateEncroachmentStatus(selectedFeature.id, {
        encroachment_status: newStatus,
        evidence_document_id: evidenceDocId || 'DOC-EVID-2026-001',
        remarks: encroachRemarks,
      });

      if (updated && parcelsData) {
        const updatedFeatures = parcelsData.features.map((f) =>
          f.id === selectedFeature.id
            ? { ...f, properties: { ...f.properties, encroachment_status: newStatus } }
            : f
        );
        setParcelsData({ ...parcelsData, features: updatedFeatures });
        setSelectedFeature({
          ...selectedFeature,
          properties: { ...selectedFeature.properties, encroachment_status: newStatus },
        });
      }
      setShowEncroachModal(false);
    } catch (err) {
      console.error('Encroachment status update failed:', err);
    } finally {
      setIsUpdatingEncroachment(false);
    }
  };

  // Calculate statistics
  const totalParcelsCount = parcelsData?.features.length || 0;
  const totalHectares = (
    (parcelsData?.features.reduce((sum, f) => sum + (f.properties.area_hectares || 0), 0) || 0)
  ).toFixed(2);
  const clearCount =
    parcelsData?.features.filter((f) => f.properties.encroachment_status === 'clear').length || 0;
  const disputedCount =
    parcelsData?.features.filter((f) => f.properties.encroachment_status === 'disputed').length || 0;
  const encroachedCount =
    parcelsData?.features.filter((f) => f.properties.encroachment_status === 'encroached').length || 0;

  return (
    <div className="cadastral-gis-container">
      {/* Header Strip */}
      <div className="cadastral-header-strip">
        <div className="cadastral-header-left">
          <div className="cadastral-title-badge">BhuNaksha GIS</div>
          <h4 className="cadastral-title-text">
            Cadastral Boundary Map — {mauza ? `Mauza ${mauza}, ` : ''}{district}
          </h4>
        </div>
        <div className="cadastral-header-meta">
          <span className="cadastral-pill-count">
            <MapIcon size={14} />
            {loading ? 'Loading...' : `${totalParcelsCount} Parcels • ${totalHectares} ha`}
          </span>
          <span>WGS-84 / PostGIS SRID 4326</span>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="cadastral-toolbar">
        {/* Search Input with fly-to */}
        <div className="cadastral-search-wrapper">
          <Search size={16} className="cadastral-search-icon" />
          <input
            type="text"
            className="cadastral-search-input"
            placeholder="Search Khasra (e.g. 10001, 10026)..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {isSearching && (
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', color: '#94a3b8' }}>
              Searching...
            </span>
          )}
          {searchSuggestions.length > 0 && (
            <div className="cadastral-search-dropdown">
              {searchSuggestions.map((item) => (
                <div
                  key={item.id}
                  className="cadastral-search-item"
                  onClick={() => handleSelectSuggestion(item)}
                >
                  <span style={{ fontWeight: 600, color: 'var(--color-primary-navy, #1B3F75)' }}>
                    {item.khasra_number}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                    {item.village || district}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter chips */}
        <div className="cadastral-toolbar-actions">
          <button
            type="button"
            className={`cadastral-filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({totalParcelsCount})
          </button>
          <button
            type="button"
            className={`cadastral-filter-chip ${filterStatus === 'clear' ? 'active' : ''}`}
            onClick={() => setFilterStatus('clear')}
          >
            <span style={{ color: '#16a34a' }}>●</span> Clear ({clearCount})
          </button>
          <button
            type="button"
            className={`cadastral-filter-chip ${filterStatus === 'disputed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('disputed')}
          >
            <span style={{ color: '#d97706' }}>●</span> Disputed ({disputedCount})
          </button>
          <button
            type="button"
            className={`cadastral-filter-chip ${filterStatus === 'encroached' ? 'active' : ''}`}
            onClick={() => setFilterStatus('encroached')}
          >
            <span style={{ color: '#dc2626' }}>●</span> Encroached ({encroachedCount})
          </button>

          <button
            type="button"
            className="cadastral-btn-secondary"
            onClick={handleFitBounds}
            title="Reset map view to fit all parcels"
          >
            <Crosshair size={14} />
            Fit Bounds
          </button>
        </div>
      </div>

      {/* Main GIS Viewport Grid */}
      <div className="cadastral-viewport-grid">
        {/* Leaflet Map Canvas */}
        <div className="cadastral-map-canvas" ref={mapContainerRef}>
          {/* Status Legend Overlay */}
          <div className="cadastral-map-legend">
            <div className="cadastral-legend-title">Statutory Title Status</div>
            <div className="cadastral-legend-item">
              <div className="cadastral-legend-swatch clear" />
              <span>Clear Title (Nil Encroachment)</span>
            </div>
            <div className="cadastral-legend-item">
              <div className="cadastral-legend-swatch disputed" />
              <span>Disputed Boundary / Title</span>
            </div>
            <div className="cadastral-legend-item">
              <div className="cadastral-legend-swatch encroached" />
              <span>Physical Encroachment Verified</span>
            </div>
          </div>
        </div>

        {/* Inspector Sidebar Panel */}
        <div className="cadastral-inspector-panel">
          {selectedFeature ? (
            <>
              <div className="cadastral-inspector-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="cadastral-khasra-badge">
                    {selectedFeature.properties.khasra_number}
                  </div>
                  <span className={`status-pill ${selectedFeature.properties.encroachment_status}`}>
                    {selectedFeature.properties.encroachment_status}
                  </span>
                </div>
                <div className="cadastral-inspector-sub">
                  Mauza {selectedFeature.properties.village}, Tehsil {selectedFeature.properties.tehsil}
                </div>
              </div>

              {/* Metric Grid */}
              <div className="cadastral-metric-grid">
                <div className="cadastral-metric-box">
                  <span className="cadastral-metric-label">Revenue Sheet No</span>
                  <div className="cadastral-metric-val">
                    Sheet {selectedFeature.properties.revenue_sheet_no}
                  </div>
                </div>

                <div className="cadastral-metric-box">
                  <span className="cadastral-metric-label">Ownership Type</span>
                  <div className="cadastral-metric-val" style={{ textTransform: 'capitalize' }}>
                    {selectedFeature.properties.ownership_type}
                  </div>
                </div>

                <div className="cadastral-metric-box">
                  <span className="cadastral-metric-label">Statutory Area</span>
                  <div className="cadastral-metric-val">
                    {selectedFeature.properties.area_hectares} ha
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>
                      ({selectedFeature.properties.area_sqm.toLocaleString()} m²)
                    </div>
                  </div>
                </div>

                <div className="cadastral-metric-box">
                  <span className="cadastral-metric-label">Acquisition Case</span>
                  <div className="cadastral-metric-val">
                    {selectedFeature.properties.case_id ? (
                      <span style={{ color: '#1B3F75', fontWeight: 700 }}>
                        Case #{selectedFeature.properties.case_id}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Coordinates Box */}
              <div className="cadastral-metric-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="cadastral-metric-label">GPS Centroid (WGS-84)</span>
                  <button
                    type="button"
                    onClick={handleCopyCoordinates}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: copiedCoords ? '#16a34a' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.72rem',
                    }}
                  >
                    {copiedCoords ? <Check size={13} /> : <Copy size={13} />}
                    {copiedCoords ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="cadastral-metric-val" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {selectedFeature.properties.centroid_lat.toFixed(5)}° N,{' '}
                  {selectedFeature.properties.centroid_lng.toFixed(5)}° E
                </div>
              </div>

              {/* Actions Footer */}
              <div className="cadastral-inspector-actions">
                {caseId && String(selectedFeature.properties.case_id) !== String(caseId) && (
                  <button
                    type="button"
                    className="cadastral-action-btn-primary"
                    onClick={handleLinkCase}
                    disabled={isLinking}
                  >
                    <LinkIcon size={14} />
                    {isLinking ? 'Linking...' : `Link to Case #${caseId}`}
                  </button>
                )}

                <button
                  type="button"
                  className="cadastral-action-btn-outline"
                  onClick={() => {
                    setNewStatus(selectedFeature.properties.encroachment_status);
                    setShowEncroachModal(true);
                  }}
                >
                  <ShieldCheck size={14} />
                  Update Encroachment Status
                </button>
              </div>
            </>
          ) : (
            <div className="cadastral-inspector-empty">
              <Compass size={36} color="#cbd5e1" />
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
                Select a Parcel Polygon
              </div>
              <span style={{ fontSize: '0.78rem' }}>
                Click any polygon on the map or search a Khasra number to inspect Cadastral Sheet, Area,
                and Encroachment details.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Encroachment Status Update Modal */}
      {showEncroachModal && selectedFeature && (
        <div className="cadastral-modal-backdrop" onClick={() => setShowEncroachModal(false)}>
          <div className="cadastral-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="cadastral-modal-header">
              <h4>Update Encroachment Status — {selectedFeature.properties.khasra_number}</h4>
              <button
                type="button"
                onClick={() => setShowEncroachModal(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateEncroachment}>
              <div className="cadastral-modal-body">
                <div className="cadastral-form-group">
                  <label className="cadastral-form-label">Statutory Encroachment Status</label>
                  <select
                    className="cadastral-form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as EncroachmentStatus)}
                  >
                    <option value="clear">Clear (Nil Encroachment / Clear Title)</option>
                    <option value="disputed">Disputed (Boundary / Title Contestation)</option>
                    <option value="encroached">Encroached (Unauthorized Physical Occupation)</option>
                  </select>
                </div>

                <div className="cadastral-form-group">
                  <label className="cadastral-form-label">Evidence Document Reference ID *</label>
                  <input
                    type="text"
                    className="cadastral-form-input"
                    value={evidenceDocId}
                    onChange={(e) => setEvidenceDocId(e.target.value)}
                    placeholder="e.g. DOC-EVID-2026-001"
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Statutory audit requires evidentiary report upload reference.
                  </span>
                </div>

                <div className="cadastral-form-group">
                  <label className="cadastral-form-label">Field Inspection Remarks</label>
                  <textarea
                    rows={3}
                    className="cadastral-form-textarea"
                    value={encroachRemarks}
                    onChange={(e) => setEncroachRemarks(e.target.value)}
                    placeholder="Site verification notes or patwari report summary..."
                  />
                </div>
              </div>
              <div className="cadastral-modal-footer">
                <button
                  type="button"
                  className="cadastral-btn-secondary"
                  onClick={() => setShowEncroachModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cadastral-action-btn-primary"
                  style={{ width: 'auto' }}
                  disabled={isUpdatingEncroachment}
                >
                  {isUpdatingEncroachment ? 'Recording in Audit...' : 'Save & Record Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
