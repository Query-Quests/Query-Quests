import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#19aa59] border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-gray-500">Loading challenge...</p>
        </div>
      </div>
    </div>
  );
}

export function NotFoundState({ error }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-[#030914] mb-2">Challenge Not Found</h1>
              <p className="text-gray-500 mb-6">
                {error || "The challenge you're looking for doesn't exist."}
              </p>
              <Button asChild className="bg-[#19aa59] hover:bg-[#15934d] text-white">
                <Link href="/challenges">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Challenges
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
