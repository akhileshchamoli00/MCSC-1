"use client";

import { useParams } from "next/navigation";
import GoalForm from "../../GoalForm";

export default function EditGoalPage() {
  const params = useParams();
  const id = params.id as string;
  
  return <GoalForm goalId={id} />;
}
