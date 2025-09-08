"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import XTerminal from "@/components/XTerminal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutGrid, 
  Rows, 
  Database, 
  Table, 
  Key, 
  Info,
  Copy,
  Check
} from "lucide-react";

export default function Playground() {
    const [isColumnLayout, setIsColumnLayout] = useState(true);
    const [copiedTable, setCopiedTable] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Sample database schema - in a real app, this would come from your database
    const databaseSchema = {
        tables: [
            {
                name: "users",
                description: "User accounts and profiles",
                columns: [
                    { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTO_INCREMENT"] },
                    { name: "name", type: "VARCHAR(255)", constraints: ["NOT NULL"] },
                    { name: "email", type: "VARCHAR(255)", constraints: ["UNIQUE", "NOT NULL"] },
                    { name: "alias", type: "VARCHAR(100)", constraints: [] },
                    { name: "institution_id", type: "INTEGER", constraints: ["FOREIGN KEY"] },
                    { name: "is_admin", type: "BOOLEAN", constraints: ["DEFAULT FALSE"] },
                    { name: "is_teacher", type: "BOOLEAN", constraints: ["DEFAULT FALSE"] },
                    { name: "points", type: "INTEGER", constraints: ["DEFAULT 0"] },
                    { name: "solved_challenges", type: "INTEGER", constraints: ["DEFAULT 0"] },
                    { name: "created_at", type: "TIMESTAMP", constraints: ["DEFAULT CURRENT_TIMESTAMP"] }
                ]
            },
            {
                name: "challenges",
                description: "SQL challenges and exercises",
                columns: [
                    { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTO_INCREMENT"] },
                    { name: "title", type: "VARCHAR(255)", constraints: ["NOT NULL"] },
                    { name: "statement", type: "TEXT", constraints: ["NOT NULL"] },
                    { name: "solution", type: "TEXT", constraints: ["NOT NULL"] },
                    { name: "level", type: "INTEGER", constraints: ["NOT NULL", "DEFAULT 1"] },
                    { name: "points", type: "INTEGER", constraints: ["NOT NULL", "DEFAULT 100"] },
                    { name: "creator_id", type: "INTEGER", constraints: ["FOREIGN KEY"] },
                    { name: "institution_id", type: "INTEGER", constraints: ["FOREIGN KEY"] },
                    { name: "created_at", type: "TIMESTAMP", constraints: ["DEFAULT CURRENT_TIMESTAMP"] }
                ]
            },
            {
                name: "institutions",
                description: "Educational institutions",
                columns: [
                    { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTO_INCREMENT"] },
                    { name: "name", type: "VARCHAR(255)", constraints: ["NOT NULL", "UNIQUE"] },
                    { name: "address", type: "TEXT", constraints: [] },
                    { name: "created_at", type: "TIMESTAMP", constraints: ["DEFAULT CURRENT_TIMESTAMP"] }
                ]
            },
            {
                name: "user_activity",
                description: "User activity and progress tracking",
                columns: [
                    { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTO_INCREMENT"] },
                    { name: "user_id", type: "INTEGER", constraints: ["FOREIGN KEY", "NOT NULL"] },
                    { name: "challenge_id", type: "INTEGER", constraints: ["FOREIGN KEY"] },
                    { name: "action", type: "VARCHAR(100)", constraints: ["NOT NULL"] },
                    { name: "points_earned", type: "INTEGER", constraints: ["DEFAULT 0"] },
                    { name: "timestamp", type: "TIMESTAMP", constraints: ["DEFAULT CURRENT_TIMESTAMP"] }
                ]
            }
        ]
    };

    const copyTableSchema = (tableName) => {
        const table = databaseSchema.tables.find(t => t.name === tableName);
        if (table) {
            const schema = `CREATE TABLE ${tableName} (\n  ${table.columns.map(col => 
                `${col.name} ${col.type}${col.constraints.length > 0 ? ' ' + col.constraints.join(' ') : ''}`
            ).join(',\n  ')}\n);`;
            navigator.clipboard.writeText(schema);
            setCopiedTable(tableName);
            setTimeout(() => setCopiedTable(null), 2000);
        }
    };

    const getConstraintIcon = (constraint) => {
        if (constraint.includes('PRIMARY KEY')) return <Key className="h-3 w-3 text-yellow-600" />;
        if (constraint.includes('FOREIGN KEY')) return <Database className="h-3 w-3 text-blue-600" />;
        if (constraint.includes('UNIQUE')) return <Info className="h-3 w-3 text-green-600" />;
        return null;
    };

    return (
        <>
            <Header />
            <div className="h-screen">


                {/* Main Content */}
                <div className={`h-[calc(100vh-64px)] ${isMobile ? 'flex flex-col' : (isColumnLayout ? 'grid grid-cols-2' : 'flex flex-col')}`}>
                    {/* Terminal Section */}
                    <div className={`flex flex-col ${!isMobile && isColumnLayout ? 'border-r' : ''}`}>
                        <div className="p-3 bg-gray-50 border-b flex justify-between items-start">
                            <div>
                                <h3 className="flex items-center gap-2 font-semibold">
                                    <Database className="h-5 w-5" />
                                    SQL Terminal
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Execute SQL queries and see results in real-time
                                </p>
                            </div>
                            {!isMobile && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsColumnLayout(!isColumnLayout)}
                                    className="h-8 px-2 mt-1"
                                >
                                    {isColumnLayout ? <Rows className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
                                </Button>
                            )}
                        </div>
                        <div className="flex-1">
                            <XTerminal 
                                mode="playground"
                                className="w-full h-full"
                            />
                        </div>
                    </div>

                    {/* Database Schema Section */}
                    <div className="flex flex-col">
                        <div className="p-3 bg-gray-50 border-b">
                            <h3 className="flex items-center gap-2 font-semibold">
                                <Table className="h-5 w-5" />
                                Database Schema
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Available tables and their structure for your queries
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-4">
                                {databaseSchema.tables.map((table) => (
                                    <div key={table.name} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">{table.name}</h3>
                                                <p className="text-sm text-muted-foreground">{table.description}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyTableSchema(table.name)}
                                                className="flex items-center gap-1"
                                            >
                                                {copiedTable === table.name ? (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                                {copiedTable === table.name ? "Copied!" : "Copy Schema"}
                                            </Button>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {table.columns.map((column) => (
                                                <div key={column.name} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{column.name}</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {column.type}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {column.constraints.map((constraint, index) => (
                                                            <div key={index} className="flex items-center gap-1">
                                                                {getConstraintIcon(constraint)}
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {constraint}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Sample Data Preview */}
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                            <h4 className="font-medium text-sm mb-2">Sample Query:</h4>
                                            <code className="text-xs bg-white p-2 rounded block">
                                                SELECT * FROM {table.name} LIMIT 5;
                                            </code>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
