import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const allowedStatuses = ['HIGH', 'NORMAL', 'LOW', 'SENSOR_ERROR', 'STARTING'];

const DEFAULT_SUPABASE_URL = 'https://fylyrgpqylbrjokptedo.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bHlyZ3BxeWxicmpva3B0ZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMTEyMzEsImV4cCI6MjEwMjc4NzIzMX0.xq4d215VYZEFVNuO4-cxFZbjO3Y9qkXrcmLMh7XnTpI';
const DEFAULT_DEVICE_TOKEN = '-yo1_XimjeNxK2NaDF2uFAvLSWCkji6T0_JR44Ktyc4';

// In-memory cache for ultra-fast response & fallback
let latestCachedReading: any = null;

function getDatabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function validReading(d: any): boolean {
  if (!d || typeof d !== 'object') return false;

  const numbers = [
    'distance_cm',
    'water_height_cm',
    'water_percentage',
    'flow_rate_l_min',
    'total_liters',
  ];

  const booleans = [
    'flow_detected',
    'high_water_alarm',
    'leak_alarm',
    'system_alarm',
  ];

  return (
    numbers.every(
      (k) => typeof d[k] === 'number' && Number.isFinite(d[k])
    ) &&
    d.distance_cm >= -1 &&
    d.water_height_cm >= 0 &&
    d.water_percentage >= 0 &&
    d.water_percentage <= 100 &&
    d.flow_rate_l_min >= 0 &&
    d.total_liters >= 0 &&
    booleans.every((k) => typeof d[k] === 'boolean') &&
    allowedStatuses.includes(d.water_status)
  );
}

export async function GET() {
  try {
    const db = getDatabase();

    if (db) {
      const { data, error } = await db
        .from('water_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        latestCachedReading = data[0];
      }
    }

    const reading = latestCachedReading ?? null;

    return NextResponse.json(
      {
        connected: Boolean(reading),
        reading,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Telemetry GET error:', error?.message);
    if (latestCachedReading) {
      return NextResponse.json({
        connected: true,
        reading: latestCachedReading,
      });
    }
    return NextResponse.json({
      connected: false,
      reading: null,
      error: 'Unable to retrieve telemetry',
    });
  }
}

export async function POST(request: Request) {
  try {
    const expectedToken = process.env.DEVICE_TOKEN || DEFAULT_DEVICE_TOKEN;
    const suppliedToken = request.headers.get('x-device-token');

    if (suppliedToken !== expectedToken) {
      return NextResponse.json({ error: 'Invalid device token' }, { status: 401 });
    }

    const body = await request.json();

    if (!validReading(body)) {
      return NextResponse.json({ error: 'Invalid sensor payload' }, { status: 400 });
    }

    const record = {
      distance_cm: body.distance_cm,
      water_height_cm: body.water_height_cm,
      water_percentage: body.water_percentage,
      water_status: body.water_status,
      flow_rate_l_min: body.flow_rate_l_min,
      total_liters: body.total_liters,
      flow_detected: body.flow_detected,
      high_water_alarm: body.high_water_alarm,
      leak_alarm: body.leak_alarm,
      system_alarm: body.system_alarm,
      created_at: new Date().toISOString(),
    };

    latestCachedReading = record;

    const db = getDatabase();
    if (db) {
      const { error } = await db.from('water_readings').insert(record);
      if (error) {
        console.error('Database insert failed:', error.message);
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: any) {
    console.error('Telemetry POST error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Server configuration error' }, { status: 500 });
  }
}
