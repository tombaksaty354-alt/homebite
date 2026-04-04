import { Suspense } from "react";
import ChatContent from "./ChatContent";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="container py-5 text-center">Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
