import { Transaction } from "../models/Transaction.js";
import { Notification } from "../models/Notification.js";
import { Op } from "sequelize";

export const fraudService = {
  /**
   * Run fraud checks on a new transaction
   * @param {number} userId 
   * @param {object} transaction 
   */
  checkTransaction: async (userId, transaction) => {
    try {
      const alerts = [];
      const { amount, category, date } = transaction;
      const numAmount = Number(amount);

      // Rule 1: Large Transaction
      // Threshold: 50,000 INR
      if (numAmount > 50000) {
        alerts.push({
          type: "FRAUD_ALERT",
          message: `High value transaction detected: ₹${numAmount} in ${category}. Please verify.`,
          priority: "high"
        });
      }

      // Rule 2: High Frequency (Velocity Check)
      // Check transactions in the last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentCount = await Transaction.count({
        where: {
          userId,
          createdAt: {
            [Op.gte]: tenMinutesAgo
          }
        }
      });

      if (recentCount >= 5) {
        alerts.push({
          type: "FRAUD_ALERT",
          message: `Unusual activity: ${recentCount} transactions in the last 10 minutes.`,
          priority: "high"
        });
      }

      // Rule 3: Category Spike
      // Check if this amount is significantly higher than average for this category
      // (Skip if it's the first few transactions)
      const categoryStats = await Transaction.findAll({
        where: {
          userId,
          category,
          id: { [Op.ne]: transaction.id } // Exclude current
        },
        limit: 20,
        order: [["date", "DESC"]]
      });

      if (categoryStats.length >= 3) {
        const total = categoryStats.reduce((sum, t) => sum + Number(t.amount), 0);
        const avg = total / categoryStats.length;
        
        // If amount is > 3x average and amount > 1000 (to avoid noise on small items)
        if (numAmount > avg * 3 && numAmount > 1000) {
          alerts.push({
            type: "FRAUD_ALERT",
            message: `Unusual spending in ${category}: ₹${numAmount} is significantly higher than your average of ₹${avg.toFixed(2)}.`,
            priority: "medium"
          });
        }
      }

      // Create Notifications for Alerts
      for (const alert of alerts) {
        await Notification.create({
          userId,
          type: alert.type,
          message: alert.message,
          priority: alert.priority,
          read: false
        });
        console.log(`[FraudService] Alert created for user ${userId}: ${alert.message}`);
      }

      return alerts;
    } catch (err) {
      console.error("[FraudService] Error running checks:", err);
      return [];
    }
  }
};
