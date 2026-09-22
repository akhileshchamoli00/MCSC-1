"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

interface TeamViewDialogProps {
  viewingTeam: any | null
  onClose: () => void
}

export function TeamViewDialog({ viewingTeam, onClose }: TeamViewDialogProps) {
  return (
    <Dialog open={!!viewingTeam} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/10 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2" style={{ color: viewingTeam?.color || "inherit" }}>
            <Users className="h-5 w-5" /> {viewingTeam?.name} ({viewingTeam?.code})
          </DialogTitle>
          <DialogDescription className="mt-1">
            {viewingTeam?.description || "No description provided for this team."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Team Leader */}
          <div className="flex items-center gap-2.5 bg-muted/40 p-3 rounded-xl border border-border/30">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0 border border-primary/20">
              {viewingTeam?.leader ? `${viewingTeam.leader.first_name?.[0] || ""}${viewingTeam.leader.last_name?.[0] || ""}` : "TL"}
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground/60 block font-bold uppercase tracking-wider">Team Leader</span>
              <span className="text-xs font-semibold text-foreground">
                {viewingTeam?.leader ? `${viewingTeam.leader.first_name} ${viewingTeam.leader.last_name}` : "Unassigned"}
              </span>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Team Members ({viewingTeam?.members?.length || 0})</h4>
            {(!viewingTeam?.members || viewingTeam.members.length === 0) ? (
              <p className="text-xs text-muted-foreground italic">No members assigned to this team.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {viewingTeam.members.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-2.5 p-2 hover:bg-muted/30 rounded-lg transition-colors border border-border/20 bg-background/50">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary shrink-0 border border-primary/15">
                      {member.first_name?.[0] || ""}{member.last_name?.[0] || ""}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-foreground block truncate">{member.first_name} {member.last_name}</span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {member.job_title || "Consultant"} • {member.department?.name || "General"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/60 bg-muted/5 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto font-semibold">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
