"use client";

import React, { use } from "react";
import CreateOrEditAnnouncementPage from "../../new/page";

export default function EditAnnouncementPageRoute({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  // Re-use CreateOrEditAnnouncementPage with query or pass context
  return <CreateOrEditAnnouncementPage />;
}
