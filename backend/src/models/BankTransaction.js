import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class BankTransaction extends Model {}

BankTransaction.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bankAccountId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    type: { type: DataTypes.ENUM("debit", "credit"), allowNull: false },
    categoryHint: { type: DataTypes.STRING, allowNull: true }
  },
  { sequelize, modelName: "bank_transaction", underscored: true, indexes: [{ fields: ["bank_account_id", "date"] }] }
);

