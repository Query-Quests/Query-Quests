"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Calendar,
  User,
  ArrowRight,
  GraduationCap,
  Clock,
  Sparkles
} from "lucide-react";
import Link from "next/link";

// Lesson Card Component
function LessonCard({ lesson, index }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGradientColor = (index) => {
    const gradients = [
      "from-[#19aa59] to-emerald-600",
      "from-blue-500 to-indigo-600",
      "from-violet-500 to-purple-600",
      "from-amber-500 to-orange-600",
      "from-rose-500 to-pink-600",
      "from-cyan-500 to-teal-600",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <Link href={`/lessons/${lesson.id}`}>
      <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Icon Section */}
            <div className={`bg-gradient-to-br ${getGradientColor(index)} p-6 flex items-center justify-center sm:w-24`}>
              <BookOpen className="h-8 w-8 text-white" />
            </div>

            {/* Content Section */}
            <div className="flex-1 p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#030914] text-lg group-hover:text-[#19aa59] transition-colors mb-1">
                    {lesson.title}
                  </h3>
                  {lesson.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {lesson.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      <span>{lesson.creator.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(lesson.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center">
                  <Button
                    className="bg-[#19aa59] hover:bg-[#15934d] text-white group-hover:shadow-md transition-all"
                  >
                    Read Lesson
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserAndLessons();
  }, []);

  const fetchUserAndLessons = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);

        const url = user.institution_id
          ? `/api/lessons?institutionId=${user.institution_id}&published=true`
          : '/api/lessons?published=true';

        const response = await fetch(url);
        if (response.ok) {
          const lessonsData = await response.json();
          setLessons(lessonsData);
        }
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter(lesson =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#19aa59] border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg text-gray-500">Loading lessons...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#19aa59] to-emerald-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-[#030914]">
                    Database Lessons
                  </h1>
                </div>
              </div>
              <p className="text-lg text-gray-500 max-w-2xl">
                Master SQL and database concepts through comprehensive, hands-on lessons designed by experts.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#19aa59]">{lessons.length}</div>
                <div className="text-sm text-gray-500">Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#030914]">
                  {new Set(lessons.map(l => l.creator.name)).size}
                </div>
                <div className="text-sm text-gray-500">Authors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search lessons by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base border-gray-200 focus:border-[#19aa59] focus:ring-[#19aa59]/20 rounded-xl"
            />
          </div>
        </div>

        {/* Lessons Grid */}
        {filteredLessons.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-[#030914] mb-2">
                  {searchTerm ? 'No lessons found' : 'No lessons available'}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchTerm
                    ? 'Try adjusting your search terms or browse all lessons.'
                    : 'Check back later for new lessons from your instructors.'}
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    className="mt-4 border-[#19aa59]/30 text-[#19aa59] hover:bg-[#19aa59]/10"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLessons.map((lesson, index) => (
              <LessonCard key={lesson.id} lesson={lesson} index={index} />
            ))}
          </div>
        )}

        {/* Motivational Footer */}
        {filteredLessons.length > 0 && (
          <div className="mt-12 text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#19aa59]/10 text-[#19aa59] text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Learning is a journey!
            </div>
            <p className="text-gray-500 max-w-md mx-auto">
              Complete lessons to build a solid foundation, then test your skills with hands-on challenges.
            </p>
            <Link href="/challenges">
              <Button className="mt-4 bg-[#19aa59] hover:bg-[#15934d] text-white">
                Try Challenges
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
