"use client";

import React, { useEffect, useState } from "react";
import { 
  Megaphone, 
  Calendar, 
  User, 
  Loader2, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnnouncementsBulletin() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;

    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          setAnnouncements(await response.json());
        }
      } catch (err) {
        console.error("Error loading announcements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Checking bulletin boards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-primary" /> Announcements Bulletin
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Stay informed on system schedules, public holidays, corporate policies, and service notes from MCS Consulting.
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/80 rounded-2xl bg-white/5 backdrop-blur-md">
          <Megaphone className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-bold text-lg text-foreground">No Bulletins Posted</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            There are currently no announcements or updates posted for client portal viewing. Please check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const isExpanded = expandedIds[ann.id] || false;
            
            return (
              <Card key={ann.id} className="border-border/40 bg-background/50 backdrop-blur-md transition-all hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                      {ann.title}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-primary/70" />
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-primary/70" />
                        System Administrator
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className={`text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap ${!isExpanded && "line-clamp-3"}`}>
                    {ann.content}
                  </p>
                  
                  {ann.content.length > 200 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleExpand(ann.id)} 
                      className="text-xs text-primary p-0 h-auto hover:bg-transparent hover:underline"
                    >
                      {isExpanded ? (
                        <span className="flex items-center gap-1">Show Less <ChevronUp className="h-3 w-3" /></span>
                      ) : (
                        <span className="flex items-center gap-1">Read Full Announcement <ChevronDown className="h-3 w-3" /></span>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
