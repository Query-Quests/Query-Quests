"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  User,
  ArrowLeft,
  ArrowRight,
  Target,
  Clock,
  ChevronRight,
  Home
} from "lucide-react";
import MDEditor from '@uiw/react-md-editor';
import Link from "next/link";

export default function LessonDetail() {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const router = useRouter();

  const fetchLesson = useCallback(async () => {
    try {
      const response = await fetch(`/api/lessons/${params.id}`);
      if (response.ok) {
        const lessonData = await response.json();
        setLesson(lessonData);
      } else {
        setError("Lesson not found");
      }
    } catch (error) {
      console.error("Error fetching lesson:", error);
      setError("Failed to load lesson");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#19aa59] border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg text-gray-500">Loading lesson...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold text-[#030914] mb-2">Lesson Not Found</h1>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {error || "The lesson you're looking for doesn't exist or may have been removed."}
                </p>
                <Button asChild className="bg-[#19aa59] hover:bg-[#15934d] text-white">
                  <Link href="/lessons">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Lessons
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/home" className="text-gray-500 hover:text-[#19aa59] transition-colors flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <Link href="/lessons" className="text-gray-500 hover:text-[#19aa59] transition-colors">
              Lessons
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="text-[#030914] font-medium truncate max-w-[200px]">
              {lesson.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Lesson Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#19aa59] to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-[#030914] mb-2">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="text-gray-500 text-lg mb-4">
                  {lesson.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>By <span className="text-[#030914] font-medium">{lesson.creator.name}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(lesson.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lesson Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8 lg:p-10">
            <div className="prose prose-lg max-w-none
              [&_.w-md-editor]:!bg-transparent
              [&_.w-md-editor]:!text-gray-700
              [&_pre]:!bg-[#030914]
              [&_pre]:!text-gray-100
              [&_pre]:!rounded-xl
              [&_pre]:!p-4
              [&_pre]:!overflow-x-auto
              [&_code]:!bg-gray-100
              [&_code]:!text-[#19aa59]
              [&_code]:!px-1.5
              [&_code]:!py-0.5
              [&_code]:!rounded
              [&_code]:!text-sm
              [&_code]:!font-mono
              [&_pre_code]:!bg-transparent
              [&_pre_code]:!text-gray-100
              [&_pre_code]:!p-0
              [&_h1]:!text-3xl
              [&_h1]:!font-bold
              [&_h1]:!text-[#030914]
              [&_h1]:!border-b
              [&_h1]:!border-gray-200
              [&_h1]:!pb-3
              [&_h1]:!mb-6
              [&_h2]:!text-2xl
              [&_h2]:!font-semibold
              [&_h2]:!text-[#030914]
              [&_h2]:!mt-10
              [&_h2]:!mb-4
              [&_h3]:!text-xl
              [&_h3]:!font-semibold
              [&_h3]:!text-[#030914]
              [&_h3]:!mt-8
              [&_h3]:!mb-3
              [&_h4]:!text-lg
              [&_h4]:!font-medium
              [&_h4]:!text-gray-700
              [&_h4]:!mt-6
              [&_h4]:!mb-2
              [&_p]:!text-gray-600
              [&_p]:!leading-relaxed
              [&_p]:!mb-4
              [&_ul]:!text-gray-600
              [&_ol]:!text-gray-600
              [&_li]:!mb-2
              [&_a]:!text-[#19aa59]
              [&_a]:!no-underline
              [&_a:hover]:!underline
              [&_blockquote]:!border-l-4
              [&_blockquote]:!border-[#19aa59]
              [&_blockquote]:!bg-[#19aa59]/5
              [&_blockquote]:!pl-4
              [&_blockquote]:!py-2
              [&_blockquote]:!rounded-r-lg
              [&_blockquote]:!italic
              [&_blockquote]:!text-gray-600
              [&_table]:!w-full
              [&_th]:!bg-gray-100
              [&_th]:!px-4
              [&_th]:!py-2
              [&_th]:!text-left
              [&_th]:!font-semibold
              [&_th]:!text-[#030914]
              [&_td]:!px-4
              [&_td]:!py-2
              [&_td]:!border-b
              [&_td]:!border-gray-100
              [&_hr]:!border-gray-200
              [&_hr]:!my-8
            ">
              <MDEditor.Markdown
                source={lesson.content}
                style={{
                  padding: 0,
                  backgroundColor: 'transparent',
                  color: '#374151'
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Footer */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            variant="outline"
            asChild
            className="border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          >
            <Link href="/lessons">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Lessons
            </Link>
          </Button>
          <Button
            asChild
            className="bg-[#19aa59] hover:bg-[#15934d] text-white shadow-md hover:shadow-lg transition-all"
          >
            <Link href="/challenges">
              <Target className="h-4 w-4 mr-2" />
              Practice with Challenges
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Related Content Suggestion */}
        <Card className="border-0 shadow-sm mt-8 bg-gradient-to-r from-[#19aa59]/5 to-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#19aa59] to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-[#030914] mb-1">Ready to test your knowledge?</h3>
                <p className="text-sm text-gray-500">
                  Apply what you've learned by solving real SQL challenges and climb the leaderboard.
                </p>
              </div>
              <Button asChild className="bg-[#19aa59] hover:bg-[#15934d] text-white whitespace-nowrap">
                <Link href="/challenges">
                  Start Challenge
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
