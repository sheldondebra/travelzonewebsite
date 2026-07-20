import { Suspense } from "react";
import { VideoUploadView } from "@/components/edamad/video-upload-view";

export default function VideoUploadPage() {
  return (
    <Suspense fallback={<div className="ed-card p-8 text-center text-[#6B7280]">Loading upload tools...</div>}>
      <VideoUploadView />
    </Suspense>
  );
}
