import { User } from "./User.js";
import { Transaction } from "./Transaction.js";
import { Budget } from "./Budget.js";
import { BankAccount } from "./BankAccount.js";
import { BankTransaction } from "./BankTransaction.js";
import { Investment } from "./Investment.js";
import { Notification } from "./Notification.js";
import { AuditLog } from "./AuditLog.js";
import { DemoAccount } from "./DemoAccount.js";
import { DemoTrade } from "./DemoTrade.js";

User.hasMany(Transaction, { foreignKey: "user_id" });
Transaction.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Budget, { foreignKey: "user_id" });
Budget.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(BankAccount, { foreignKey: "user_id" });
BankAccount.belongsTo(User, { foreignKey: "user_id" });

BankAccount.hasMany(BankTransaction, { foreignKey: "bank_account_id" });
BankTransaction.belongsTo(BankAccount, { foreignKey: "bank_account_id" });

User.hasMany(Investment, { foreignKey: "user_id" });
Investment.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(DemoAccount, { foreignKey: "user_id" });
DemoAccount.belongsTo(User, { foreignKey: "user_id" });

DemoAccount.hasMany(DemoTrade, { foreignKey: "account_id" });
DemoTrade.belongsTo(DemoAccount, { foreignKey: "account_id" });


