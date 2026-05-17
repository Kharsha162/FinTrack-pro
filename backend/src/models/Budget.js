import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class Budget extends Model {}

Budget.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    limit: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    spent: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    period: { type: DataTypes.ENUM("monthly", "yearly"), allowNull: false, defaultValue: "monthly" },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "INR" }
  },
  { sequelize, modelName: "budget", underscored: true, indexes: [{ fields: ["user_id", "category"] }] }
);

