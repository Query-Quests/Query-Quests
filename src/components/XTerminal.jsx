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
  className = "w-full h-full"
}) => {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance following the tutorial approach
    const term = new Terminal({
      cursorBlink: true,
      fontSize: fontSize,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e2e', // Catppuccin Mocha Base
        foreground: '#cdd6f4', // Catppuccin Mocha Text
        cursor: '#f5e0dc',     // Catppuccin Mocha Rosewater
        selection: '#585b70',  // Catppuccin Mocha Surface2
        black: '#45475a',      // Catppuccin Mocha Surface1
        red: '#f38ba8',        // Catppuccin Mocha Pink
        green: '#a6e3a1',      // Catppuccin Mocha Green
        yellow: '#f9e2af',     // Catppuccin Mocha Yellow
        blue: '#89b4fa',       // Catppuccin Mocha Blue
        magenta: '#cba6f7',    // Catppuccin Mocha Mauve
        cyan: '#94e2d5',       // Catppuccin Mocha Teal
        white: '#bac2de',      // Catppuccin Mocha Subtext1
        brightBlack: '#585b70', // Catppuccin Mocha Surface2
        brightRed: '#f38ba8',   // Catppuccin Mocha Pink
        brightGreen: '#a6e3a1', // Catppuccin Mocha Green
        brightYellow: '#f9e2af', // Catppuccin Mocha Yellow
        brightBlue: '#89b4fa',   // Catppuccin Mocha Blue
        brightMagenta: '#cba6f7', // Catppuccin Mocha Mauve
        brightCyan: '#94e2d5',    // Catppuccin Mocha Teal
        brightWhite: '#a6adc8'    // Catppuccin Mocha Subtext0
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
    initializeWebSocket(term);

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

  const initializeWebSocket = (term) => {
    try {
      // Connect to WebSocket following tutorial pattern
      const socket = new WebSocket('ws://localhost:3002');
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('✅ Connected to shell server');
        setIsConnected(true);
        term.write('\r\n\x1b[32m✅ Connected to shell server\x1b[0m\r\n');
      };

      // Handle messages from server - following tutorial approach
      socket.onmessage = (event) => {
        term.write(event.data);
      };

      socket.onclose = (event) => {
        console.log('❌ Shell connection closed');
        setIsConnected(false);
        term.write('\r\n\x1b[31m❌ Shell connection closed\x1b[0m\r\n');
        
        // Simple reconnection logic
        setTimeout(() => {
          if (!isConnected) {
            term.write('\x1b[33m🔄 Attempting to reconnect...\x1b[0m\r\n');
            initializeWebSocket(term);
          }
        }, 3000);
      };

      socket.onerror = (error) => {
        console.log('Shell server connection failed');
        setIsConnected(false);
        term.write('\r\n\x1b[31m❌ Failed to connect to shell server\x1b[0m\r\n');
        term.write('\x1b[33m💡 Make sure shell server is running: npm run shell\x1b[0m\r\n');
      };

      // Handle user input - following tutorial approach
      term.onData((data) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      });

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      term.write('\r\n\x1b[31m❌ Shell connection error\x1b[0m\r\n');
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
      <div className="absolute top-2 right-2 z-10">
        <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Terminal container */}
      <div 
        ref={terminalRef} 
        className="w-full h-full rounded overflow-hidden"
        style={{ 
          backgroundColor: '#1e1e2e', // Catppuccin Mocha Base
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: `${fontSize}px`,
          minHeight: '400px'
        }}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-2 right-2 z-10">
        <div className="flex items-center gap-1 bg-black/50 rounded px-2 py-1">
          <button
            onClick={() => handleZoom('out')}
            className="text-white/70 hover:text-white text-xs px-1"
            title="Zoom out (Ctrl/Cmd + -)"
          >
            -
          </button>
          <span className="text-white/70 text-xs px-1">{fontSize}px</span>
          <button
            onClick={() => handleZoom('in')}
            className="text-white/70 hover:text-white text-xs px-1"
            title="Zoom in (Ctrl/Cmd + +)"
          >
            +
          </button>
          <button
            onClick={() => handleZoom('reset')}
            className="text-white/70 hover:text-white text-xs px-1 ml-1"
            title="Reset zoom (Ctrl/Cmd + 0)"
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
};

export default XTerminal;