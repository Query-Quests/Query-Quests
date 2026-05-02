"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SettingsFormCard, SettingsFormField } from "./SettingsForm";

/**
 * Integrations tab — currently exposes the Anthropic API key used by the
 * in-app Query Quest Assistant chatbot. The key is fetched and saved
 * directly against /api/admin/integrations (it is not part of the
 * shared in-memory `settings` state used by the other tabs, because it
 * needs to actually persist).
 */
export function IntegrationsSettingsForm() {
  const [status, setStatus] = useState({
    configured: false,
    source: "none",
    masked: "",
  });
  const [keyInput, setKeyInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatus(data.anthropicApiKey);
    } catch (e) {
      console.error("Failed to load integrations", e);
      toast.error("Could not load integrations status");
    } finally {
      setIsLoading(false);
    }
  }

  async function save() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ anthropicApiKey: keyInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setStatus(data.anthropicApiKey);
      setKeyInput("");
      toast.success(
        keyInput
          ? "Anthropic API key saved. The chatbot is now active."
          : "Anthropic API key cleared."
      );
    } catch (e) {
      console.error("Failed to save integrations", e);
      toast.error(e.message || "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SettingsFormCard
      title="Anthropic (Query Quest Assistant)"
      description="Configure the API key used by the in-app AI tutor. Get a key at console.anthropic.com."
    >
      <SettingsFormField
        label="Status"
        description="Where the active key currently comes from"
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking…
          </div>
        ) : status.configured ? (
          <div className="flex flex-col gap-1">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[12px] font-semibold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Configured · {status.source === "database" ? "from admin panel" : "from environment"}
            </span>
            <span className="font-mono text-xs text-gray-500">{status.masked}</span>
          </div>
        ) : (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[12px] font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Not configured · chatbot disabled
          </span>
        )}
      </SettingsFormField>

      <SettingsFormField
        label="API key"
        description="Starts with sk-ant-. Leave empty and save to remove the stored key."
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={revealed ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck={false}
              className="w-full pl-3.5 pr-10 py-2.5 text-sm text-[#030914] font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20 font-mono"
            />
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? "Hide API key" : "Show API key"}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-[#030914]"
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={isSaving || isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#19aa59] hover:bg-[#15934d] px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSaving ? "Saving…" : "Save key"}
          </button>
        </div>
      </SettingsFormField>
    </SettingsFormCard>
  );
}
