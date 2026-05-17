import React, { useEffect, useState } from "react";
import { api } from "../api";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  lastLogin?: string;
  lockUntil?: string;
  failedLoginAttempts: number;
}

interface AuditLog {
  id: number;
  actorEmail: string;
  action: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  activeSessions: number;
}

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [usersRes, logsRes, statsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/audit"),
        api.get("/admin/stats")
      ]);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError("Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (user: User) => {
    try {
      await api.post(`/admin/users/${user.id}/role`, {
        role: user.role === "admin" ? "user" : "admin"
      });
      load();
    } catch (err) {
      // Handle error
    }
  };

  const toggleStatus = async (user: User) => {
    try {
      await api.post(`/admin/users/${user.id}/toggle-status`);
      load();
    } catch (err) {
      // Handle error
    }
  };

  const unlockUser = async (user: User) => {
    try {
      await api.post(`/admin/users/${user.id}/unlock`);
      load();
    } catch (err) {
      // Handle error
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-4 md:p-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-slate-100">Admin Command Center</h1>
          <p className="text-slate-400 text-sm">System oversight and user management</p>
        </div>
        <button 
          onClick={load}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-70" />
          <h3 className="text-slate-400 text-sm font-medium">Total Users</h3>
          <p className="text-4xl font-bold text-white mt-2">{stats?.totalUsers}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-70" />
          <h3 className="text-slate-400 text-sm font-medium">Active Accounts</h3>
          <p className="text-4xl font-bold text-white mt-2">{stats?.activeUsers}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-70" />
          <h3 className="text-slate-400 text-sm font-medium">Active Sessions (30m)</h3>
          <p className="text-4xl font-bold text-white mt-2">{stats?.activeSessions}</p>
        </motion.div>
      </div>

      {/* User Management */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">User Management</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Last Login</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-xs">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      user.role === "admin" ? "bg-yellow-500/20 text-yellow-500" : "bg-slate-700/50 text-slate-400"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {user.isActive ? (
                        <span className="text-green-400 text-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active
                        </span>
                      ) : (
                        <span className="text-red-400 text-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Disabled
                        </span>
                      )}
                      {user.lockUntil && new Date(user.lockUntil) > new Date() && (
                         <span className="text-orange-400 text-xs flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Locked
                         </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {user.lockUntil && new Date(user.lockUntil) > new Date() && (
                      <button 
                        onClick={() => unlockUser(user)}
                        className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded hover:bg-orange-500/30 transition-colors"
                      >
                        Unlock
                      </button>
                    )}
                    <button 
                      onClick={() => toggleStatus(user)}
                      className={`text-xs px-3 py-1 rounded transition-colors ${
                        user.isActive 
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" 
                          : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {user.isActive ? "Disable" : "Enable"}
                    </button>
                    <button 
                      onClick={() => toggleRole(user)}
                      className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded hover:bg-slate-600 transition-colors"
                    >
                      {user.role === "admin" ? "Demote" : "Promote"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Audit Logs */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">System Audit Log</h2>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase tracking-wider text-xs sticky top-0">
              <tr>
                <th className="p-4 font-medium">Timestamp</th>
                <th className="p-4 font-medium">Actor</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-slate-300">{log.actorEmail}</td>
                  <td className="p-4 text-white">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.section>
  );
}
