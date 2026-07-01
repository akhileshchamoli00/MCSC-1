import { redirect } from "next/navigation";

export default function SettingsPage() {
  // Redirect the main /settings page to the first available settings module
  redirect("/settings/attendance");
}
