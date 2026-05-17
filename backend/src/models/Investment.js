import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class Investment extends Model {}

Investment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    symbol: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    avgBuyPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "INR" },
    currentPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }
  },
  { sequelize, modelName: "investment", underscored: true, indexes: [{ fields: ["user_id", "symbol"] }] }
);

