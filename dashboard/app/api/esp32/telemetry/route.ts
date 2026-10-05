import { NextResponse } from 'next/server';

async function fetchFromEndpoint(url: string, timeoutMs = 1500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedIp = searchParams.get('ip');

  // Candidate endpoints to probe
  const endpoints = requestedIp
    ? [requestedIp.startsWith('http') ? `${requestedIp}/data` : `http://${requestedIp}/data`]
    : [
        process.env.NEXT_PUBLIC_ESP32_IP
          ? (process.env.NEXT_PUBLIC_ESP32_IP.startsWith('http')
              ? `${process.env.NEXT_PUBLIC_ESP32_IP}/data`
              : `http://${process.env.NEXT_PUBLIC_ESP32_IP}/data`)
          : 'http://192.168.1.105/data',
        'http://192.168.4.1/data', // Fallback ESP32 SoftAP hotspot IP
      ];

  for (const targetUrl of endpoints) {
    const data = await fetchFromEndpoint(targetUrl);
    if (data && typeof data === 'object') {
      const dist = typeof data.waterDistance === 'number' ? data.waterDistance : (data.distance ?? 0);
      const tankH = data.tankHeight ?? 15.0;
      const heightCm = typeof data.waterHeight === 'number' ? data.waterHeight : Math.max(0, tankH - dist);
      const pct = typeof data.waterPercentage === 'number' ? data.waterPercentage : Math.round((heightCm / tankH) * 100);

      return NextResponse.json({
        success: true,
        source: 'esp32_direct',
        endpoint: targetUrl,
        timestamp: new Date().toISOString(),
        data: {
          distance_cm: dist,
          water_height_cm: heightCm,
          water_level_percent: pct,
          water_status: data.waterStatus,
          flow_rate_lpm: data.flowRate ?? 0,
          total_liters: data.totalLiters ?? 0,
          flow_detected: data.flowDetected ?? false,
          flow_duration_ms: data.flowDuration ?? 0,
          leak_alarm: data.leakAlarm ?? false,
          high_water_alarm: data.highWaterAlarm ?? false,
          continuous_flow_alarm: data.continuousFlowAlarm ?? false,
          flow_alarm: data.continuousFlowAlarm ?? data.flowAlarm ?? false,
          system_alarm: data.systemAlarm ?? false,
        },
      });
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: 'ESP32 not reachable at tested endpoints (' + endpoints.join(', ') + ')',
      endpoints,
    },
    { status: 504 }
  );
}
