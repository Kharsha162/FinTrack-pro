import { AuditLog } from "../models/AuditLog.js";

export async function recordAudit(actorEmail, action) {
  try {
    await AuditLog.create({ actorEmail, action });
  } catch {}
}

