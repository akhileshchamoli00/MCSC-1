"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  WALLPAPER_PRESETS,
  WallpaperSettings,
  DEFAULT_WALLPAPER_SETTINGS,
  getSavedWallpaperSettings,
  saveWallpaperSettings
} from "./wallpaper";
import { Check, Sparkles, Sliders, Image, RotateCcw, X, Trees, Palette } from "lucide-react";
import { toast } from "sonner";

interface WallpaperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: WallpaperSettings) => void;
}

export function WallpaperDialog({ isOpen, onClose, onSettingsChange }: WallpaperDialogProps) {
  const initialSettingsRef = useRef<WallpaperSettings>(DEFAULT_WALLPAPER_SETTINGS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_WALLPAPER_SETTINGS.id);
  const [opacity, setOpacity] = useState<number>(DEFAULT_WALLPAPER_SETTINGS.opacity);
  const [activeCategory, setActiveCategory] = useState<"all" | "nature" | "art" | "ambient">("all");

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedWallpaperSettings();
      initialSettingsRef.current = saved;
      setSelectedId(saved.id);
      setOpacity(saved.opacity);
    }
  }, [isOpen]);

  const updateAndBroadcast = (id: string, op: number) => {
    const newSettings: WallpaperSettings = {
      id,
      opacity: op
    };
    saveWallpaperSettings(newSettings);
    if (onSettingsChange) onSettingsChange(newSettings);
  };

  const handleSelectPreset = (id: string) => {
    setSelectedId(id);
    updateAndBroadcast(id, opacity);
  };

  const handleOpacityChange = (val: number) => {
    setOpacity(val);
    updateAndBroadcast(selectedId, val);
  };

  const handleSave = () => {
    const finalSettings: WallpaperSettings = {
      id: selectedId,
      opacity
    };
    saveWallpaperSettings(finalSettings);
    initialSettingsRef.current = finalSettings;
    if (onSettingsChange) onSettingsChange(finalSettings);
    toast.success("Chat wallpaper saved successfully");
    onClose();
  };

  const handleCancel = () => {
    // Revert to initial settings before opening
    saveWallpaperSettings(initialSettingsRef.current);
    if (onSettingsChange) onSettingsChange(initialSettingsRef.current);
    onClose();
  };

  const handleReset = () => {
    setSelectedId(DEFAULT_WALLPAPER_SETTINGS.id);
    setOpacity(DEFAULT_WALLPAPER_SETTINGS.opacity);
    saveWallpaperSettings(DEFAULT_WALLPAPER_SETTINGS);
    if (onSettingsChange) onSettingsChange(DEFAULT_WALLPAPER_SETTINGS);
    toast.info("Wallpaper reset to default");
  };

  const activePreset = WALLPAPER_PRESETS.find(p => p.id === selectedId) || WALLPAPER_PRESETS[0];

  const filteredPresets = WALLPAPER_PRESETS.filter((p) => {
    if (activeCategory === "all") return true;
    return p.category === activeCategory;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="dark fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4 select-none" style={{ colorScheme: "dark" }}>
          {/* Dimmed backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
          />

          {/* Dialog Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.25, bounce: 0.15 }}
            className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#14161D] border border-white/15 text-[#F4F4F8] shadow-2xl rounded-2xl p-5 z-[90] flex flex-col pointer-events-auto"
            style={{
              scrollbarWidth: "thin"
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">Chat Wallpaper & Scenic Backdrop</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose from natural landscapes, celestial skies, anime art, or ambient textures.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close wallpaper dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Bubble Contrast Preview Strip */}
            <div className="my-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-0.5">
                <span>Live Bubble Contrast Preview</span>
                <span className="text-[10px] font-mono opacity-80">{activePreset.name} • {Math.round(opacity * 100)}% opacity</span>
              </div>

              <div
                className="relative h-28 w-full rounded-xl overflow-hidden border border-border/60 dark:border-white/15 flex flex-col justify-center px-4 py-2 gap-2 select-none shadow-inner"
                style={{
                  backgroundColor: "#0B0D13"
                }}
              >
                {/* Wallpaper background layer */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={{
                    ...activePreset.style,
                    opacity
                  }}
                />

                {/* Readability dim overlay */}
                <div className="absolute inset-0 bg-black/25 pointer-events-none" />

                {/* Simulated chat bubbles */}
                <div className="relative z-10 flex items-start gap-2 max-w-[80%]">
                  <div className="h-5 w-5 rounded-full bg-zinc-700 text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                    CL
                  </div>
                  <div
                    className="px-2.5 py-1.5 rounded-xl border backdrop-blur-md text-[11px] font-medium leading-tight shadow-md"
                    style={{
                      backgroundColor: activePreset.palette.otherBubbleBg,
                      borderColor: activePreset.palette.otherBubbleBorder,
                      color: activePreset.palette.otherText,
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.70)"
                    }}
                  >
                    Hello! Final review docs are prepared for client signoff.
                  </div>
                </div>

                <div className="relative z-10 flex items-start gap-2 max-w-[80%] ml-auto flex-row-reverse">
                  <div className="h-5 w-5 rounded-full bg-purple-600 text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                    ME
                  </div>
                  <div
                    className="px-2.5 py-1.5 rounded-xl border backdrop-blur-md text-[11px] font-medium leading-tight shadow-md"
                    style={{
                      backgroundColor: activePreset.palette.clientBubbleBg,
                      borderColor: activePreset.palette.clientBubbleBorder,
                      color: activePreset.palette.clientText,
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.70)"
                    }}
                  >
                    Approved and notarization verified. Moving to delivery!
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter Tabs & Header */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5 text-muted-foreground" />
                  Select Wallpaper
                </label>

                {/* Category Pill Filters */}
                <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                      activeCategory === "all"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({WALLPAPER_PRESETS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("nature")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeCategory === "nature"
                        ? "bg-emerald-600 text-white shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Trees className="h-3 w-3" />
                    Nature & Scenic
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("art")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeCategory === "art"
                        ? "bg-purple-600 text-white shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Palette className="h-3 w-3" />
                    Art & Sci-Fi
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("ambient")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeCategory === "ambient"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sliders className="h-3 w-3" />
                    Ambient & Tech
                  </button>
                </div>
              </div>

              {/* Wallpaper Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedId === preset.id;
                  const isPhoto = preset.category === "nature" || preset.category === "art";
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`group relative text-left rounded-xl p-2 border transition-all cursor-pointer flex flex-col justify-between h-28 overflow-hidden ${
                        isSelected
                          ? "border-purple-500 ring-2 ring-purple-500/40 bg-purple-500/5 dark:bg-purple-950/20 shadow-md"
                          : "border-border/60 dark:border-white/10 hover:border-border dark:hover:border-white/25 bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      {/* Thumbnail pattern / photo background */}
                      <div
                        className={`absolute inset-0 transition-all pointer-events-none ${
                          isPhoto
                            ? "opacity-85 group-hover:opacity-100 group-hover:scale-105 duration-300"
                            : "opacity-45 group-hover:opacity-65"
                        }`}
                        style={preset.thumbnailStyle}
                      />

                      {/* Header badge & checkmark */}
                      <div className="relative z-10 flex items-center justify-between w-full">
                        {preset.badge ? (
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 font-mono backdrop-blur-xs border-white/20 ${
                              isPhoto ? "bg-black/60 text-white" : "bg-background/80"
                            }`}
                          >
                            {preset.badge}
                          </Badge>
                        ) : <span />}

                        {isSelected && (
                          <span className="h-4.5 w-4.5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>

                      {/* Preset Title & Description */}
                      <div className="relative z-10 mt-auto bg-black/65 dark:bg-black/75 backdrop-blur-md -mx-2 -mb-2 p-1.5 border-t border-white/15">
                        <div className="font-semibold text-xs text-white truncate">{preset.name}</div>
                        <div className="text-[9.5px] text-zinc-300 line-clamp-1">{preset.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pattern & Glow Intensity Slider */}
            <div className="space-y-2 mt-4 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
                  Scenic Wallpaper Opacity
                </span>
                <span className="font-mono text-muted-foreground text-[11px]">{Math.round(opacity * 100)}%</span>
              </div>

              <input
                type="range"
                min="0.05"
                max="0.65"
                step="0.05"
                value={opacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-1.5 bg-muted rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-0.5">
                <span>Subtle (High Contrast)</span>
                <span>Balanced (35%)</span>
                <span>Vivid Landscape</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Reset Default
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Apply Wallpaper
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
