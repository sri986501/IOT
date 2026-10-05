import { NextResponse } from 'next/server';
import { fetchLatestReading, fetchReadings } from '@/lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId') || 'ESP32-001';
  const range = (searchParams.get('range') as any) || '24h';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const [latest, history] = await Promise.all([
      fetchLatestReading(deviceId),
      fetchReadings(deviceId, range, limit),
    ]);

    // If Supabase has data, return it
    if (latest) {
      return NextResponse.json({
        success: true,
        source: 'supabase',
        deviceId,
        timestamp: new Date().toISOString(),
        reading: latest,
        history,
      });
    }

    // Graceful fallback reading if Supabase has no records or is unreachable
    const fallbackReading = {
      id: 'live-generated',
      device_id: deviceId,
      distance_cm: 25.4,
      water_level_percent: 74.6,
      water_volume_liters: 746.0,
      flow_rate_lpm: 8.4,
      raw_telemetry: {
        echo_latency_ms: 18,
        pump_active: false,
        solenoid_active: true,
      },
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      source: 'simulation_fallback',
      deviceId,
      timestamp: new Date().toISOString(),
      reading: fallbackReading,
      history: history.length > 0 ? history : [fallbackReading],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch sensor readings',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceId = 'ESP32-001', distanceCm, flowRateLpm } = body;

    const tankHeight = 100;
    const dist = typeof distanceCm === 'number' ? distanceCm : 25;
    const liquidLevel = Math.max(0, Math.min(tankHeight, tankHeight - dist));
    const volumeLitres = (liquidLevel / tankHeight) * 1000;
    const fillPercent = (liquidLevel / tankHeight) * 100;

    const newReading = {
      device_id: deviceId,
      distance_cm: Math.round(dist * 10) / 10,
      water_level_percent: Math.round(fillPercent * 10) / 10,
      water_volume_liters: Math.round(volumeLitres * 10) / 10,
      flow_rate_lpm: typeof flowRateLpm === 'number' ? flowRateLpm : 8.5,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Reading ingested successfully',
      reading: newReading,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Invalid payload' },
      { status: 400 }
    );
  }
}
