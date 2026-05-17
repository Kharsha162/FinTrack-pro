import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    actorEmail: { type: DataTypes.STRING, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false }
  },
  { sequelize, modelName: "audit_log", underscored: true }
);

