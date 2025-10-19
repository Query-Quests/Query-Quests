"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import XTerminal from "@/components/XTerminal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal as TerminalIcon,
  Server,
  Code,
  Shield,
  Zap,
  Info
} from "lucide-react";

export default function ShellTerminal() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please log in to access the shell terminal.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TerminalIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MySQL Auto-Connect Terminal</h1>
              <p className="text-gray-600">Direct MySQL database connection with auto-login</p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Docker Container</p>
                    <p className="text-xs text-gray-500">MySQL client container</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Real-time</p>
                    <p className="text-xs text-gray-500">WebSocket connection</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Secure</p>
                    <p className="text-xs text-gray-500">Individual sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Code className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Auto-Connect</p>
                    <p className="text-xs text-gray-500">Instant MySQL access</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warning Notice */}
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Auto-Connect MySQL Terminal</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    This terminal automatically connects you to the MySQL database. You&apos;ll be logged in as root user to the &apos;queryquest&apos; database.
                    Type SQL commands directly or &apos;\q&apos; to exit to the container shell.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terminal Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">MySQL Auto-Connect Terminal</CardTitle>
                <CardDescription>
                  Direct MySQL database access with automatic connection
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Connected
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] bg-[#1e1e1e] rounded-b-lg overflow-hidden">
              <XTerminal 
                mode="shell"
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-0 shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-lg">MySQL Commands & Auto-Connect Features</CardTitle>
            <CardDescription>
              Available SQL commands and terminal features (auto-connected to queryquest database)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">SQL Commands (Ready to Use)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">SHOW TABLES;</code>
                    <span className="text-gray-600">List all tables</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">SELECT * FROM users;</code>
                    <span className="text-gray-600">Query users table</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">DESCRIBE challenges;</code>
                    <span className="text-gray-600">Show table structure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">\q</code>
                    <span className="text-gray-600">Exit to container shell</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Terminal Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Ctrl+C</Badge>
                    <span className="text-gray-600">Interrupt current command</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Ctrl/Cmd +/-</Badge>
                    <span className="text-gray-600">Zoom in/out</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Tab</Badge>
                    <span className="text-gray-600">Auto-completion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">↑/↓</Badge>
                    <span className="text-gray-600">Command history</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
