import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class DemoAccount extends Model {}

DemoAccount.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    balance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 10000.00 }, // Starting virtual cash
    equity: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 10000.00 },
    leverage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 } // 1:100 leverage
  },
  { sequelize, modelName: "demo_account", underscored: true }
);
