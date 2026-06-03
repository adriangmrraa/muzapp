import "dotenv/config";
import { db } from "../src/db/index";
import { eq } from "drizzle-orm";
import { agentConfig } from "../src/db/schema";

async function check() {
  console.log("Checking agent config...");
  const config = await db.select().from(agentConfig).where(eq(agentConfig.id, 1)).limit(1);
  if (!config || config.length === 0) { console.log("No config found"); return; }
  const c = config[0];
  console.log("businessHours:", JSON.stringify(c.businessHours, null, 2));
  console.log("deliveryEnabled:", c.deliveryEnabled);
  console.log("deliveryStartHour:", c.deliveryStartHour);
  console.log("b2cStartHour:", c.b2cStartHour);
  console.log("isCooking:", c.isCooking);
  console.log("hamburguesasSinStock:", c.hamburguesasSinStock);
  console.log("stockPanDocenas:", c.stockPanDocenas);
  process.exit(0);
}
check().catch(e => { console.error("ERROR:", e); process.exit(1); });
