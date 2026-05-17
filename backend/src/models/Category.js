import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class Category extends Model {}

Category.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    type: { type: DataTypes.ENUM("expense", "income"), allowNull: false }
  },
  { sequelize, modelName: "category", underscored: true }
);

