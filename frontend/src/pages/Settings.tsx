import React from "react";
import { useAuth } from "../authContext";

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <section className="space-y-4" aria-label="Account and application settings">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <h1 className="text-sm font-semibold text-white">Profile</h1>
        <dl className="grid gap-4 text-xs text-slate-200 sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Name</dt>
            <dd className="mt-1 text-white">{user?.name || "Unnamed user"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Email</dt>
            <dd className="mt-1 text-white">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Role</dt>
            <dd className="mt-1 text-white">{user?.role}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white">Appearance</h2>
        <p className="text-xs text-slate-300">
          FinTrack Pro is optimized for a single, high-contrast dark theme for comfortable use in trading and low-light environments.
        </p>
      </div>
    </section>
  );
}

