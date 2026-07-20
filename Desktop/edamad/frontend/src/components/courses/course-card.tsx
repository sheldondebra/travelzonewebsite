import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Course } from "@/types";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="overflow-hidden border-[#002B7F]/10 shadow-sm">
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#002B7F] to-[#0B5FFF]">
        <BookOpen className="h-12 w-12 text-white/90" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-base text-[#002B7F]">
          {course.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {course.description ?? "No description yet."}
        </p>
        <p className="mt-3 text-sm font-semibold text-[#0B5FFF]">
          ₦{Number(course.price).toLocaleString()}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-[#002B7F] hover:bg-[#0B5FFF]">
          <Link href={`/courses/${course.id}`}>View Course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
