import { createClient } from "@supabase/supabase-js";

const allowedStatuses = ["HIGH", "NORMAL", "LOW", "SENSOR_ERROR", "STARTING"];

function getDatabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function validReading(d) {
  if (!d || typeof d !== "object") return false;

  const numbers = [
    "distance_cm",
    "water_height_cm",
    "water_percentage",
    "flow_rate_l_min",
    "total_liters"
  ];

  const booleans = [
    "flow_detected",
    "high_water_alarm",
    "leak_alarm",
    "system_alarm"
  ];

  return (
    numbers.every((k) =>
      typeof d[k] === "number" && Number.isFinite(d[k])
    ) &&
    d.distance_cm >= -1 &&
    d.water_height_cm >= 0 &&
    d.water_percentage >= 0 &&
    d.water_percentage <= 100 &&
    d.flow_rate_l_min >= 0 &&
    d.total_liters >= 0 &&
    booleans.every((k) => typeof d[k] === "boolean") &&
    allowedStatuses.includes(d.water_status)
  );
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = getDatabase();

    if (req.method === "POST") {
      const expectedToken = process.env.DEVICE_TOKEN;
      const suppliedToken = req.headers["x-device-token"];

      if (!expectedToken) {
        return res.status(500).json({
          error: "Device authentication is not configured"
        });
      }

      if (
        typeof suppliedToken !== "string" ||
        suppliedToken !== expectedToken
      ) {
        return res.status(401).json({ error: "Invalid device token" });
      }

      if (!validReading(req.body)) {
        return res.status(400).json({ error: "Invalid sensor payload" });
      }

      const d = req.body;

      const { error } = await db
        .from("water_readings")
        .insert({
          distance_cm: d.distance_cm,
          water_height_cm: d.water_height_cm,
          water_percentage: d.water_percentage,
          water_status: d.water_status,
          flow_rate_l_min: d.flow_rate_l_min,
          total_liters: d.total_liters,
          flow_detected: d.flow_detected,
          high_water_alarm: d.high_water_alarm,
          leak_alarm: d.leak_alarm,
          system_alarm: d.system_alarm
        });

      if (error) {
        console.error("Database insert failed:", error.message);
        return res.status(502).json({ error: "Could not store reading" });
      }

      return res.status(201).json({ ok: true });
    }

    const { data, error } = await db
      .from("water_readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Database read failed:", error.message);
      return res.status(502).json({ error: "Could not read telemetry" });
    }

    const reading = data?.[0] ?? null;

    return res.status(200).json({
      connected: Boolean(reading),
      reading
    });
  } catch (error) {
    console.error("Telemetry API error:", error.message);
    return res.status(500).json({ error: "Server configuration error" });
  }
}
