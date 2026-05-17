import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class Notification extends Model {}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    priority: { type: DataTypes.ENUM("low", "medium", "high"), allowNull: false, defaultValue: "low" },
    read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  },
  { sequelize, modelName: "notification", underscored: true, indexes: [{ fields: ["user_id"] }] }
);

