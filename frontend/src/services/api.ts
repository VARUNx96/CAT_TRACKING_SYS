// src/services/api.ts
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

export type EquipmentStatus = 'Available' | 'Rented' | 'Maintenance' | 'Flagged';
export type AlertType = 'OVERDUE' | 'EXPIRING_SOON' | 'ANOMALY_IDLE' | 'ANOMALY_HOURS' | 'MAINTENANCE_DUE';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DashboardSummary {
  total_equipment: number;
  rented: number;
  available: number;
  maintenance: number;
  flagged: number;
  active_alerts: number;
  expiring_soon: number;
  overdue: number;
}

export interface EquipmentDashboardRow {
  id: string;
  equipment_id: string;
  name: string;
  model?: string;
  type: string;
  location: string;
  site_id: string | null;
  status: string;
  client: string;
  last_operator_id: string | null;
  utilization_pct_7d: number | null;
  idle_ratio_7d: number | null;
  active_alert_count: number;
}

export interface EquipmentDetail {
  equipment_id: string;
  name?: string;
  model?: string;
  serial_number?: string;
  client_name?: string;
  type: string;
  site_id: string | null;
  status: string;
  created_at: string;
}

export interface CheckEvent {
  id: number;
  equipment_id: string;
  site_id: string | null;
  operator_id: string | null;
  client_name?: string | null;
  check_out_date: string;
  expected_return_date: string | null;
  check_in_date: string | null;
  qr_token: string | null;
}

export interface QRPayload {
  qr_token: string;
  qr_image_base64: string;
}

export interface CheckOutPayload {
  equipment_id: string;
  site_id?: string;
  operator_id?: string;
  client_name?: string;
  check_out_date: string; // YYYY-MM-DD
  expected_return_date?: string; // YYYY-MM-DD
}

export interface CheckInPayload {
  qr_token?: string;
  equipment_id?: string;
  check_in_date: string; // YYYY-MM-DD
}

export interface UsageLogPayload {
  equipment_id: string;
  log_date: string; // YYYY-MM-DD
  engine_hours_day: number;
  idle_hours_day: number;
  operating_days_cumulative?: number;
  last_operator_id?: string;
}

export interface UsageLog {
  id: number;
  equipment_id: string;
  log_date: string;
  engine_hours_day: number;
  idle_hours_day: number;
  operating_days_cumulative: number;
  last_operator_id: string | null;
  idle_ratio: number;
}

export interface UtilizationSummary {
  equipment_id: string;
  days: number;
  total_engine_hours: number;
  total_idle_hours: number;
  utilization_pct: number;
  idle_ratio: number;
}

export interface Alert {
  id: number;
  equipment_id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  confidence: number | null;
  resolved: boolean;
  created_at: string;
}

export interface ForecastPoint {
  period: string;
  predicted_demand: number;
  confidence_low: number;
  confidence_high: number;
}

export interface ForecastResponse {
  equipment_type: string;
  site_id: string | null;
  horizon_periods: number;
  method: string;
  points: ForecastPoint[];
  recommendation: string;
}

export interface AnomalyResult {
  equipment_id: string;
  log_date: string;
  is_anomaly: boolean;
  anomaly_score: number;
  reason_codes: string[];
  confidence: number;
}

export interface Recommendation {
  recommendation_type: 'reallocate' | 'next_best_asset' | 'extend_contract' | 'maintenance';
  equipment_id: string;
  message: string;
  score: number;
  metadata: Record<string, any>;
}

export const api = {
  dashboard: {
    getSummary: async (): Promise<DashboardSummary> => {
      const res = await fetch(`${BASE_URL}/equipment/stats/summary`);
      if (!res.ok) throw new Error('Failed to fetch dashboard summary');
      return res.json();
    },
  },

  assets: {
    getFleet: async (site_id?: string, type?: string): Promise<EquipmentDashboardRow[]> => {
      const params = new URLSearchParams();
      if (site_id) params.append('site_id', site_id);
      if (type) params.append('type', type);
      const res = await fetch(`${BASE_URL}/equipment?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch fleet equipment');
      return res.json();
    },

    getById: async (equipment_id: string): Promise<EquipmentDetail> => {
      const res = await fetch(`${BASE_URL}/equipment/${equipment_id}`);
      if (!res.ok) throw new Error(`Failed to fetch equipment ${equipment_id}`);
      return res.json();
    },

    getTimeline: async (equipment_id: string): Promise<CheckEvent[]> => {
      const res = await fetch(`${BASE_URL}/equipment/${equipment_id}/timeline`);
      if (!res.ok) throw new Error(`Failed to fetch timeline for ${equipment_id}`);
      return res.json();
    },

    create: async (payload: {
      equipment_id: string;
      type: string;
      site_id?: string;
      name?: string;
      model?: string;
      serial_number?: string;
      client_name?: string;
    }): Promise<EquipmentDetail> => {
      const res = await fetch(`${BASE_URL}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create equipment');
      return res.json();
    },
  },

  rentals: {
    checkOut: async (payload: CheckOutPayload): Promise<CheckEvent> => {
      const res = await fetch(`${BASE_URL}/checkinout/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    checkIn: async (payload: CheckInPayload): Promise<CheckEvent> => {
      const res = await fetch(`${BASE_URL}/checkinout/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    getQRCode: async (qrToken: string): Promise<QRPayload> => {
      const res = await fetch(`${BASE_URL}/checkinout/qr/${qrToken}`);
      if (!res.ok) throw new Error('Failed to load QR image');
      return res.json();
    },

    getExtensionNudges: async (): Promise<Recommendation[]> => {
      const res = await fetch(`${BASE_URL}/anomalies/recommendations/extensions`);
      if (!res.ok) throw new Error('Failed to load extension recommendations');
      return res.json();
    },
  },

  telemetry: {
    logUsage: async (payload: UsageLogPayload): Promise<UsageLog> => {
      const res = await fetch(`${BASE_URL}/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to log telemetry usage');
      return res.json();
    },

    getHistory: async (equipment_id: string, days = 30): Promise<UsageLog[]> => {
      const res = await fetch(`${BASE_URL}/usage/${equipment_id}?days=${days}`);
      if (!res.ok) throw new Error(`Failed to load history for ${equipment_id}`);
      return res.json();
    },

    getUtilization: async (equipment_id: string, days = 7): Promise<UtilizationSummary> => {
      const res = await fetch(`${BASE_URL}/usage/${equipment_id}/utilization?days=${days}`);
      if (!res.ok) throw new Error(`Failed to load utilization for ${equipment_id}`);
      return res.json();
    },
  },

  alerts: {
    getActive: async (equipment_id?: string): Promise<Alert[]> => {
      const url = equipment_id ? `${BASE_URL}/alerts?equipment_id=${equipment_id}` : `${BASE_URL}/alerts`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load active alerts');
      return res.json();
    },

    resolve: async (alert_id: number): Promise<Alert> => {
      const res = await fetch(`${BASE_URL}/alerts/${alert_id}/resolve`, { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to resolve alert ${alert_id}`);
      return res.json();
    },

    triggerScan: async (): Promise<{ alerts_created: number }> => {
      const res = await fetch(`${BASE_URL}/alerts/scan`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trigger scan');
      return res.json();
    },
  },

  ai: {
    getDemandForecast: async (equipment_type: string, site_id?: string, horizon_days = 7): Promise<ForecastResponse> => {
      const params = new URLSearchParams({ horizon_days: horizon_days.toString() });
      if (site_id) params.append('site_id', site_id);
      const res = await fetch(`${BASE_URL}/forecast/${equipment_type}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load demand forecast');
      return res.json();
    },

    getRecentAnomalies: async (days = 14): Promise<AnomalyResult[]> => {
      const res = await fetch(`${BASE_URL}/anomalies/recent?days=${days}`);
      if (!res.ok) throw new Error('Failed to load recent anomalies');
      return res.json();
    },

    getReallocations: async (): Promise<Recommendation[]> => {
      const res = await fetch(`${BASE_URL}/anomalies/recommendations/reallocate`);
      if (!res.ok) throw new Error('Failed to load reallocation recommendations');
      return res.json();
    },

    getNextBestAsset: async (equipment_type: string, site_id?: string): Promise<Recommendation[]> => {
      const params = new URLSearchParams({ equipment_type });
      if (site_id) params.append('site_id', site_id);
      const res = await fetch(`${BASE_URL}/anomalies/recommendations/next-best-asset?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load next-best asset');
      return res.json();
    },
  },
};
