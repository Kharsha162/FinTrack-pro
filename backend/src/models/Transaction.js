import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class Transaction extends Model {}

Transaction.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM("expense", "income"), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "INR" },
    category: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    isRecurring: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    source: { type: DataTypes.ENUM("manual", "bank"), allowNull: false, defaultValue: "manual" }
  },
  { sequelize, modelName: "transaction", underscored: true, indexes: [{ fields: ["user_id", "date"] }, { fields: ["category"] }] }
);

