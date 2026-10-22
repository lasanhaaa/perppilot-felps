import type { Metadata } from "next";
import { CourseView } from "@/components/course/course-view";

export const metadata: Metadata = { title: "Course" };

export default function CoursePage() {
  return <CourseView />;
}
