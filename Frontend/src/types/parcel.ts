/**
 * Cadastral Parcel & GeoJSON Types
 * RFC 7946 Compliant Types for PostGIS LandSync Cadastral GIS
 */

export type EncroachmentStatus = 'clear' | 'disputed' | 'encroached';
export type OwnershipType = 'private' | 'government' | 'community';

export interface ParcelProperties {
  id: string;
  khasra_number: string;
  village: string;
  tehsil: string;
  district: string;
  state: string;
  revenue_sheet_no: string;
  centroid_lat: number;
  centroid_lng: number;
  area_sqm: number;
  area_hectares: number;
  encroachment_status: EncroachmentStatus;
  ownership_type: OwnershipType;
  case_id: number | string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GeoJSONGeometry {
  type: 'Polygon';
  coordinates: number[][][]; // [ [ [lng, lat], [lng, lat], ... ] ]
}

export interface GeoJSONFeature {
  type: 'Feature';
  id: string;
  geometry: GeoJSONGeometry;
  properties: ParcelProperties;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface ParcelSearchItem {
  id: string;
  khasra_number: string;
  centroid_lat: number;
  centroid_lng: number;
  village?: string;
  district?: string;
}

export interface ParcelEncroachmentUpdatePayload {
  encroachment_status: EncroachmentStatus;
  evidence_document_id: string | number;
  remarks?: string;
}
