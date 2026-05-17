import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class DemoTrade extends Model {}

DemoTrade.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    accountId: { type: DataTypes.INTEGER, allowNull: false },
    symbol: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM("buy", "sell"), allowNull: false },
    volume: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, // Lot size
    entryPrice: { type: DataTypes.DECIMAL(15, 5), allowNull: false },
    exitPrice: { type: DataTypes.DECIMAL(15, 5), allowNull: true },
    profit: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    status: { type: DataTypes.ENUM("open", "closed"), defaultValue: "open" },
    openedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    closedAt: { type: DataTypes.DATE, allowNull: true }
  },
  { sequelize, modelName: "demo_trade", underscored: true }
);
