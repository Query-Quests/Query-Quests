"use client";

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';

// Import xterm.js CSS
import '@xterm/xterm/css/xterm.css';

const XTerminal = ({ 
  mode = 'shell', // 'shell', 'database', or 'playground'
  challengeId = null,
  onQueryResult = null,
  onQueryError = null,
  className = "w-full h-full"
}) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: fontSize,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        selection: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff'
      },
      cols: 80,
      rows: 24,
      scrollback: 1000,
      tabStopWidth: 4,
      allowTransparency: false
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    
    fitAddonRef.current = fitAddon;
    xtermRef.current = terminal;

    // Open terminal
    terminal.open(terminalRef.current);
    
    // Fit terminal to container
    fitAddon.fit();

    // Handle resize
    const handleResize = () => {
      if (fitAddon) {
        fitAddon.fit();
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Handle keyboard shortcuts
    terminal.onKey(({ key, domEvent }) => {
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

    // Handle input based on mode
    terminal.onData((data) => {
      if (mode === 'shell') {
        handleShellInput(data, terminal);
      } else {
        handleDatabaseInput(data, terminal);
      }
    });

    // Initialize connection based on mode
    if (mode === 'shell') {
      initializeShellConnection(terminal);
    } else if (mode === 'database') {
      initializeDatabaseConnection(terminal);
    } else {
      initializePlaygroundMode(terminal);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (terminal) {
        terminal.dispose();
      }
    };
  }, [mode, challengeId]); // Removed fontSize from dependencies

  const handleZoom = (action, customSize = null) => {
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
      case 'custom':
        newSize = customSize || 14;
        break;
    }
    
    if (newSize !== fontSize && xtermRef.current) {
      console.log(`🔍 [BROWSER] Changing font size from ${fontSize}px to ${newSize}px`);
      
      // Update state
      setFontSize(newSize);
      
      // Update terminal font size directly
      xtermRef.current.options.fontSize = newSize;
      
      // Refit the terminal after a short delay to allow font change to take effect
      setTimeout(() => {
        if (fitAddonRef.current && xtermRef.current) {
          try {
            fitAddonRef.current.fit();
            console.log(`✅ [BROWSER] Terminal refitted with ${newSize}px font`);
          } catch (error) {
            console.error('Error refitting terminal:', error);
          }
        }
      }, 50);
    }
  };

  const initializeShellConnection = (terminal) => {
    terminal.writeln('\x1b[1;32m🐚 MySQL Shell Terminal\x1b[0m');
    terminal.writeln('\x1b[33mConnecting to MySQL container...\x1b[0m');
    terminal.writeln('');

    // Connect to shell WebSocket
    connectToShell(terminal);
  };

  const initializeDatabaseConnection = (terminal) => {
    terminal.writeln('\x1b[1;32m🗄️ Database Terminal\x1b[0m');
    terminal.writeln('\x1b[33mConnecting to database...\x1b[0m');
    terminal.writeln('');

    // Connect to database Socket.io
    connectToDatabase(terminal);
  };

  const initializePlaygroundMode = (terminal) => {
    terminal.writeln('\x1b[1;32m🎮 Playground Terminal\x1b[0m');
    terminal.writeln('\x1b[33mWelcome to the playground!\x1b[0m');
    terminal.writeln('');
    terminal.write('playground> ');
  };

  const connectToShell = (terminal) => {
    try {
      console.log('🐚 [BROWSER] Connecting to shell WebSocket server...');
      const socket = new WebSocket('ws://localhost:3002');
      
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('✅ [BROWSER] Shell WebSocket connected!');
        setIsConnected(true);
        terminal.writeln('\x1b[32m✓ Connected to shell server\x1b[0m');
        terminal.writeln('\x1b[33mEstablishing direct MySQL connection...\x1b[0m');
        terminal.writeln('');
      };

      socket.onmessage = (event) => {
        try {
          terminal.write(event.data);
        } catch (error) {
          console.error('Error writing to terminal:', error);
          terminal.write('\r\n[Error displaying output]\r\n');
        }
      };

      socket.onclose = (event) => {
        console.log('❌ [BROWSER] Shell WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        terminal.writeln('\r\n\x1b[31m✗ Shell connection closed\x1b[0m');
      };

      socket.onerror = (error) => {
        console.error('💥 [BROWSER] Shell WebSocket error:', error);
        terminal.writeln('\r\n\x1b[31m✗ Shell connection error\x1b[0m');
      };

    } catch (error) {
      console.error('Error connecting to shell:', error);
      terminal.writeln('\x1b[31m✗ Failed to connect to shell\x1b[0m');
    }
  };

  const connectToDatabase = (terminal) => {
    try {
      console.log('🗄️ [BROWSER] Connecting to database Socket.io server...');
      
      // Import socket.io-client dynamically
      import('socket.io-client').then((io) => {
        const socket = io.default('http://localhost:3001', {
          transports: ['websocket', 'polling']
        });
        
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('✅ [BROWSER] Database Socket.io connected!');
          setIsConnected(true);
          terminal.writeln('\x1b[32m✓ Connected to database server\x1b[0m');
          terminal.writeln('\x1b[33mReady to execute SQL queries...\x1b[0m');
          terminal.writeln('');
          terminal.write('mysql> ');
        });

        socket.on('query_result', (data) => {
          console.log('📊 [BROWSER] Received query result:', data);
          
          // Display result in terminal
          if (data.success) {
            terminal.writeln(`\r\n\x1b[32m✓ Query executed successfully\x1b[0m`);
            
            if (data.data && data.data.length > 0) {
              // Display table headers
              const headers = Object.keys(data.data[0]);
              terminal.writeln(`\x1b[36m${headers.join('\t')}\x1b[0m`);
              terminal.writeln('\x1b[90m' + headers.map(() => '--------').join('\t') + '\x1b[0m');
              
              // Display rows
              data.data.forEach(row => {
                terminal.writeln(Object.values(row).join('\t'));
              });
              
              terminal.writeln(`\n\x1b[33m(${data.data.length} row${data.data.length !== 1 ? 's' : ''})\x1b[0m`);
            } else {
              terminal.writeln('\x1b[33mQuery executed successfully (no results)\x1b[0m');
            }
          } else {
            terminal.writeln(`\r\n\x1b[31m✗ Query failed: ${data.error}\x1b[0m`);
          }
          
          terminal.writeln('');
          terminal.write('mysql> ');
          
          // Call callback if provided
          if (onQueryResult) {
            onQueryResult(data);
          }
        });

        socket.on('query_error', (error) => {
          console.error('💥 [BROWSER] Database query error:', error);
          terminal.writeln(`\r\n\x1b[31m✗ Error: ${error.error}\x1b[0m`);
          terminal.writeln('');
          terminal.write('mysql> ');
          
          // Call error callback if provided
          if (onQueryError) {
            onQueryError(error);
          }
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ [BROWSER] Database Socket.io disconnected:', reason);
          setIsConnected(false);
          terminal.writeln('\r\n\x1b[31m✗ Database connection lost\x1b[0m');
        });

        socket.on('connect_error', (error) => {
          console.error('💥 [BROWSER] Database Socket.io connection error:', error);
          terminal.writeln('\r\n\x1b[31m✗ Failed to connect to database\x1b[0m');
        });

      }).catch((error) => {
        console.error('Error importing socket.io-client:', error);
        terminal.writeln('\x1b[31m✗ Failed to load socket.io client\x1b[0m');
      });

    } catch (error) {
      console.error('Error connecting to database:', error);
      terminal.writeln('\x1b[31m✗ Failed to connect to database\x1b[0m');
    }
  };

  const handleShellInput = (data, terminal) => {
    // In shell mode, send all input directly to the shell
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  };

  const handleDatabaseInput = (data, terminal) => {
    // Handle database input - collect SQL queries and execute them
    if (socketRef.current && socketRef.current.connected) {
      // Handle special key combinations
      if (data === '\r' || data === '\n') {
        // Enter key - execute query
        terminal.writeln('');
        const currentLine = getCurrentLine(terminal);
        
        if (currentLine.trim()) {
          console.log('🔍 [BROWSER] Executing SQL query:', currentLine);
          
          // Send query to database server
          socketRef.current.emit('execute_query', {
            query: currentLine.trim(),
            challengeId: challengeId
          });
        } else {
          terminal.write('mysql> ');
        }
      } else if (data === '\u0003') {
        // Ctrl+C - cancel current input
        terminal.writeln('^C');
        terminal.write('mysql> ');
      } else if (data === '\u007f' || data === '\b') {
        // Backspace
        const cursor = terminal.buffer.active.cursorX;
        if (cursor > 7) { // Don't delete the "mysql> " prompt
          terminal.write('\b \b');
        }
      } else if (data >= ' ' && data <= '~') {
        // Printable characters
        terminal.write(data);
      }
    } else {
      // Not connected, just echo the character
      terminal.write(data);
    }
  };

  // Helper function to get current line content
  const getCurrentLine = (terminal) => {
    const buffer = terminal.buffer.active;
    const currentRow = buffer.viewportY + buffer.cursorY;
    const line = buffer.getLine(currentRow);
    
    if (line) {
      const lineText = line.translateToString(true);
      // Remove the "mysql> " prompt
      return lineText.substring(7);
    }
    
    return '';
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
        className="w-full h-full bg-[#1e1e1e] rounded overflow-hidden"
        style={{ 
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: `${fontSize}px`
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
