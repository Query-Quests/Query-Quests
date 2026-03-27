"use client";

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';

// Import xterm.js CSS
import '@xterm/xterm/css/xterm.css';

const XTerminal = ({
  challengeId = null,
  onQueryResult = null,
  onQueryError = null,
  className = "w-full h-full",
  databaseName = "practice"
}) => {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance with QueryQuest theme
    const term = new Terminal({
      cursorBlink: true,
      fontSize: fontSize,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#030914',   // Navy dark (matches design system)
        foreground: '#e2e8f0',   // Light gray text
        cursor: '#19aa59',       // Green accent cursor
        cursorAccent: '#030914', // Cursor text color
        selection: '#19aa5940', // Green selection with transparency
        black: '#0a1628',        // Darker navy for black
        red: '#f87171',          // Red for errors
        green: '#19aa59',        // Primary green accent
        yellow: '#fbbf24',       // Amber for warnings
        blue: '#60a5fa',         // Blue
        magenta: '#a78bfa',      // Violet
        cyan: '#22d3ee',         // Cyan
        white: '#e2e8f0',        // Light gray
        brightBlack: '#1e293b',  // Brighter navy
        brightRed: '#fca5a5',    // Bright red
        brightGreen: '#4ade80',  // Bright green
        brightYellow: '#fcd34d', // Bright yellow
        brightBlue: '#93c5fd',   // Bright blue
        brightMagenta: '#c4b5fd', // Bright violet
        brightCyan: '#67e8f9',   // Bright cyan
        brightWhite: '#f8fafc'   // White
      },
      cols: 80,
      rows: 24,
      scrollback: 1000,
      tabStopWidth: 4
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    
    // Store references
    terminalInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    // Open terminal in the DOM element
    term.open(terminalRef.current);
    
    // Fit terminal to container after a brief delay to ensure DOM is ready
    setTimeout(() => {
      try {
        if (fitAddon && term.element && terminalRef.current) {
          fitAddon.fit();
        }
      } catch (error) {
        console.error('Error fitting terminal on initialization:', error);
      }
    }, 100);

    // Handle resize with proper checks
    const handleResize = () => {
      if (fitAddon && term && term.element && term.element.parentElement) {
        try {
          // Check if terminal has dimensions before fitting
          if (term.cols > 0 && term.rows > 0) {
            fitAddon.fit();
          }
        } catch (error) {
          console.error('Error fitting terminal on resize:', error);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Initialize WebSocket connection
    initializeWebSocket(term, databaseName);

    // Handle keyboard shortcuts for zoom
    term.onKey(({ key, domEvent }) => {
      if (domEvent.ctrlKey || domEvent.metaKey) {
        switch (key) {
          case '+':
          case '=':
            domEvent.preventDefault();
            handleZoom('in');
            break;
          case '-':
            domEvent.preventDefault();
            handleZoom('out');
            break;
          case '0':
            domEvent.preventDefault();
            handleZoom('reset');
            break;
        }
      }
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (term) {
        term.dispose();
      }
    };
  }, []);

  const initializeWebSocket = (term, dbName) => {
    try {
      // Connect to WebSocket following tutorial pattern
      const socket = new WebSocket(`ws://localhost:3002?database=${dbName}`);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Connected to shell server');
        setIsConnected(true);
        term.write('\r\n\x1b[38;2;25;170;89m[Connected to SQL shell]\x1b[0m\r\n');
        term.write('\x1b[38;2;148;163;184mType your SQL queries below...\x1b[0m\r\n\r\n');
      };

      // Handle messages from server - following tutorial approach
      socket.onmessage = (event) => {
        term.write(event.data);
      };

      socket.onclose = (event) => {
        console.log('[Shell connection closed]');
        setIsConnected(false);
        term.write('\r\n\x1b[38;2;248;113;113m[Connection closed]\x1b[0m\r\n');

        // Simple reconnection logic
        setTimeout(() => {
          if (!isConnected) {
            term.write('\x1b[38;2;251;191;36m[Reconnecting...]\x1b[0m\r\n');
            initializeWebSocket(term, dbName);
          }
        }, 3000);
      };

      socket.onerror = (error) => {
        console.log('[Shell server connection failed]');
        setIsConnected(false);
        term.write('\r\n\x1b[38;2;248;113;113m[Connection failed]\x1b[0m\r\n');
        term.write('\x1b[38;2;148;163;184mMake sure shell server is running: \x1b[38;2;25;170;89mnpm run shell\x1b[0m\r\n');
      };

      // Handle user input - following tutorial approach
      term.onData((data) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      });

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      term.write('\r\n\x1b[31m[Shell connection error]\x1b[0m\r\n');
    }
  };

  const handleZoom = (action) => {
    let newSize = fontSize;
    
    switch (action) {
      case 'in':
        newSize = Math.min(fontSize + 2, 32);
        break;
      case 'out':
        newSize = Math.max(fontSize - 2, 8);
        break;
      case 'reset':
        newSize = 14;
        break;
    }
    
    if (newSize !== fontSize && terminalInstanceRef.current) {
      setFontSize(newSize);
      terminalInstanceRef.current.options.fontSize = newSize;
      
      // Refit terminal after font change
      setTimeout(() => {
        if (fitAddonRef.current && terminalInstanceRef.current && terminalInstanceRef.current.element) {
          try {
            // Check if terminal has valid dimensions
            if (terminalInstanceRef.current.cols > 0 && terminalInstanceRef.current.rows > 0) {
              fitAddonRef.current.fit();
            }
          } catch (error) {
            console.error('Error refitting terminal:', error);
          }
        }
      }, 50);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Connection status indicator */}
      <div className="absolute top-3 right-3 z-10">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm ${
          isConnected
            ? 'bg-[#19aa59]/20 text-[#19aa59] border border-[#19aa59]/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-[#19aa59] animate-pulse' : 'bg-red-500'
          }`}></div>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Terminal container */}
      <div
        ref={terminalRef}
        className="w-full h-full overflow-hidden"
        style={{
          backgroundColor: '#030914',
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: `${fontSize}px`,
          minHeight: '400px'
        }}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 z-10">
        <div className="flex items-center gap-1 bg-[#0a1628]/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-700/50">
          <button
            onClick={() => handleZoom('out')}
            className="text-gray-400 hover:text-[#19aa59] text-sm px-1.5 transition-colors"
            title="Zoom out (Ctrl/Cmd + -)"
          >
            −
          </button>
          <span className="text-gray-500 text-xs px-2 min-w-[40px] text-center">{fontSize}px</span>
          <button
            onClick={() => handleZoom('in')}
            className="text-gray-400 hover:text-[#19aa59] text-sm px-1.5 transition-colors"
            title="Zoom in (Ctrl/Cmd + +)"
          >
            +
          </button>
          <div className="w-px h-4 bg-gray-700 mx-1"></div>
          <button
            onClick={() => handleZoom('reset')}
            className="text-gray-300 hover:text-[#19aa59] text-xs px-2 py-0.5 rounded bg-gray-700/50 hover:bg-[#19aa59]/10 transition-all"
            title="Reset zoom (Ctrl/Cmd + 0)"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default XTerminal;