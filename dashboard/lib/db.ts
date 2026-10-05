import { supabase } from './supabase';

export interface SensorReading {
  id?: string;
  user_id?: string;
  device_id: string;
  flow_rate: number;
  total_volume?: number;
  status?: string;
  created_at?: string;
}

/**
 * Store a new sensor reading into the Supabase table.
 * Row Level Security (RLS) automatically attaches or validates the user_id.
 */
export async function insertSensorReading(reading: Omit<SensorReading, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('sensor_readings')
    .insert([reading])
    .select();

  if (error) {
    console.error('Error inserting sensor reading:', error);
    throw error;
  }
  return data?.[0];
}

/**
 * Fetch all sensor readings for the authenticated user.
 */
export async function fetchSensorReadings(limit = 50) {
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching sensor readings:', error);
    throw error;
  }
  return data as SensorReading[];
}

/**
 * Subscribe to realtime sensor readings for live dashboard updates.
 */
export function subscribeToSensorReadings(onNewReading: (reading: SensorReading) => void) {
  const channel = supabase
    .channel('sensor_readings_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
      (payload) => {
        onNewReading(payload.new as SensorReading);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
