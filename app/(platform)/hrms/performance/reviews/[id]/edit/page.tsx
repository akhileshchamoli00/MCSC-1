"use client";

import { useParams } from "next/navigation";
import ReviewForm from "../../ReviewForm";

export default function EditReviewPage() {
  const params = useParams();
  const id = params.id as string;
  
  return <ReviewForm reviewId={id} />;
}
