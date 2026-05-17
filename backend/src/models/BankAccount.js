import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class BankAccount extends Model {}

BankAccount.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    provider: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "INR" },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM("linked", "syncing"), allowNull: false, defaultValue: "linked" },
    accessToken: { type: DataTypes.STRING, allowNull: true }
  },
  { sequelize, modelName: "bank_account", underscored: true, indexes: [{ fields: ["user_id"] }] }
);

