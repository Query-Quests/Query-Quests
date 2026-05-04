"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';

import '@xterm/xterm/css/xterm.css';

const THEME = {
  background: '#030914',
  foreground: '#e2e8f0',
  cursor: '#19aa59',
  cursorAccent: '#030914',
  selection: '#19aa5940',
  black: '#0a1628',
  red: '#f87171',
  green: '#19aa59',
  yellow: '#fbbf24',
  blue: '#60a5fa',
  magenta: '#a78bfa',
  cyan: '#22d3ee',
  white: '#e2e8f0',
  brightBlack: '#1e293b',
  brightRed: '#fca5a5',
  brightGreen: '#4ade80',
  brightYellow: '#fcd34d',
  brightBlue: '#93c5fd',
  brightMagenta: '#c4b5fd',
  brightCyan: '#67e8f9',
  brightWhite: '#f8fafc'
};

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
  const inputBufferRef = useRef('');
  // Cursor offset within inputBufferRef (0..length). Lets the user navigate
  // mid-line with the arrow keys instead of having to delete back to a typo.
  const cursorPosRef = useRef(0);
  const modeRef = useRef(null); // 'ws' or 'api'
  // Shell-style history. historyIndex points at the slot the user is viewing;
  // historyIndex === history.length means "fresh line" (the in-progress draft).
  const historyRef = useRef([]);
  const historyIndexRef = useRef(0);
  const draftRef = useRef('');
  const [isConnected, setIsConnected] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  const formatTable = useCallback((columns, rows) => {
    if (!columns.length) return '';
    const widths = columns.map((col, i) => {
      const vals = rows.map(r => String(r[col] ?? 'NULL'));
      return Math.max(col.length, ...vals.map(v => v.length));
    });
    const sep = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
    const header = '|' + columns.map((c, i) => ` ${c.padEnd(widths[i])} `).join('|') + '|';
    const body = rows.map(r =>
      '|' + columns.map((c, i) => ` ${String(r[c] ?? 'NULL').padEnd(widths[i])} `).join('|') + '|'
    );
    return [sep, header, sep, ...body, sep, `${rows.length} row${rows.length !== 1 ? 's' : ''} in set`].join('\r\n');
  }, []);

  const executeViaAPI = useCallback(async (query, term) => {
    try {
      const res = await fetch('/api/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, database: databaseName }),
      });
      const data = await res.json();
      if (data.error) {
        term.write(`\r\n\x1b[31mERROR: ${data.error}\x1b[0m\r\n`);
        if (onQueryError) onQueryError(data.error);
      } else {
        const table = formatTable(data.columns, data.rows);
        term.write(`\r\n${table}\r\n`);
        if (onQueryResult) onQueryResult({ ...data, query });
      }
    } catch (err) {
      term.write(`\r\n\x1b[31mERROR: ${err.message}\x1b[0m\r\n`);
    }
    term.write(`\r\nmysql> `);
  }, [databaseName, formatTable, onQueryResult, onQueryError]);

  const initAPIMode = useCallback((term) => {
    modeRef.current = 'api';
    setIsConnected(true);
    term.write('\x1b[38;2;25;170;89m[Connected to SQL shell (HTTP mode)]\x1b[0m\r\n');
    term.write(`\x1b[38;2;148;163;184mDatabase: ${databaseName} | Read-only mode\x1b[0m\r\n\r\n`);
    term.write('mysql> ');

    const replaceInputLine = (value) => {
      // Clear the current line and redraw the prompt with `value` as input.
      term.write('\r\x1b[2Kmysql> ' + value);
      inputBufferRef.current = value;
      cursorPosRef.current = value.length;
    };

    term.onData((data) => {
      if (modeRef.current !== 'api') return;

      if (data === '\r') {
        const query = inputBufferRef.current.trim();
        inputBufferRef.current = '';
        cursorPosRef.current = 0;
        term.write('\r\n');
        if (query) {
          const last = historyRef.current[historyRef.current.length - 1];
          if (last !== query) {
            historyRef.current.push(query);
            if (historyRef.current.length > 100) historyRef.current.shift();
          }
          historyIndexRef.current = historyRef.current.length;
          draftRef.current = '';
          executeViaAPI(query, term);
        } else {
          historyIndexRef.current = historyRef.current.length;
          draftRef.current = '';
          term.write('mysql> ');
        }
      } else if (data === '\x1b[A' || data === '\x1bOA') {
        // Up arrow — walk backward through history.
        if (historyRef.current.length === 0) return;
        if (historyIndexRef.current === historyRef.current.length) {
          draftRef.current = inputBufferRef.current;
        }
        if (historyIndexRef.current > 0) {
          historyIndexRef.current -= 1;
          replaceInputLine(historyRef.current[historyIndexRef.current]);
        }
      } else if (data === '\x1b[B' || data === '\x1bOB') {
        // Down arrow — walk forward; falling off the end restores the draft.
        if (historyIndexRef.current >= historyRef.current.length) return;
        historyIndexRef.current += 1;
        if (historyIndexRef.current === historyRef.current.length) {
          replaceInputLine(draftRef.current);
        } else {
          replaceInputLine(historyRef.current[historyIndexRef.current]);
        }
      } else if (data === '\x1b[D' || data === '\x1bOD') {
        // Left arrow — move cursor one cell left within the input.
        if (cursorPosRef.current > 0) {
          cursorPosRef.current -= 1;
          term.write('\x1b[D');
        }
      } else if (data === '\x1b[C' || data === '\x1bOC') {
        // Right arrow — move cursor one cell right within the input.
        if (cursorPosRef.current < inputBufferRef.current.length) {
          cursorPosRef.current += 1;
          term.write('\x1b[C');
        }
      } else if (
        data === '\x1b[H' || data === '\x1bOH' || data === '\x1b[1~' || data === '\x01'
      ) {
        // Home / Ctrl+A — jump to the start of the input.
        if (cursorPosRef.current > 0) {
          term.write(`\x1b[${cursorPosRef.current}D`);
          cursorPosRef.current = 0;
        }
      } else if (
        data === '\x1b[F' || data === '\x1bOF' || data === '\x1b[4~' || data === '\x05'
      ) {
        // End / Ctrl+E — jump to the end of the input.
        const remaining = inputBufferRef.current.length - cursorPosRef.current;
        if (remaining > 0) {
          term.write(`\x1b[${remaining}C`);
          cursorPosRef.current = inputBufferRef.current.length;
        }
      } else if (data === '\x7f' || data === '\b') {
        // Backspace — delete the char before the cursor and reflow the tail.
        const pos = cursorPosRef.current;
        if (pos === 0) return;
        const buf = inputBufferRef.current;
        const tail = buf.slice(pos);
        inputBufferRef.current = buf.slice(0, pos - 1) + tail;
        cursorPosRef.current = pos - 1;
        // \b moves cursor back, then we redraw the tail, wipe the orphaned
        // last char with a space, and step the cursor back into place.
        term.write('\b' + tail + ' ' + `\x1b[${tail.length + 1}D`);
      } else if (data === '\x03') {
        inputBufferRef.current = '';
        cursorPosRef.current = 0;
        historyIndexRef.current = historyRef.current.length;
        draftRef.current = '';
        term.write('^C\r\nmysql> ');
      } else if (data >= ' ') {
        // Insert printable input at the cursor position. When the cursor is
        // at the end this collapses to a plain echo; mid-line, we redraw the
        // tail so the existing characters shift right visibly.
        const pos = cursorPosRef.current;
        const buf = inputBufferRef.current;
        const tail = buf.slice(pos);
        inputBufferRef.current = buf.slice(0, pos) + data + tail;
        cursorPosRef.current = pos + data.length;
        if (tail.length === 0) {
          term.write(data);
        } else {
          term.write(data + tail + `\x1b[${tail.length}D`);
        }
      }
    });
  }, [databaseName, executeViaAPI]);

  const initializeWebSocket = useCallback((term, dbName) => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_SHELL_WS_URL || `ws://localhost:3002`;
      const socket = new WebSocket(`${wsUrl}?database=${dbName}`);
      socketRef.current = socket;

      const wsTimeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          console.log('WebSocket timeout, falling back to API mode');
          initAPIMode(term);
        }
      }, 3000);

      socket.onopen = () => {
        clearTimeout(wsTimeout);
        modeRef.current = 'ws';
        setIsConnected(true);
        term.write('\r\n\x1b[38;2;25;170;89m[Connected to SQL shell]\x1b[0m\r\n');
        term.write('\x1b[38;2;148;163;184mType your SQL queries below...\x1b[0m\r\n\r\n');
      };

      socket.onmessage = (event) => {
        term.write(event.data);
      };

      socket.onclose = () => {
        if (modeRef.current === 'ws') {
          setIsConnected(false);
          term.write('\r\n\x1b[38;2;248;113;113m[Connection closed]\x1b[0m\r\n');
        }
      };

      socket.onerror = () => {
        clearTimeout(wsTimeout);
        if (modeRef.current !== 'api') {
          console.log('WebSocket error, falling back to API mode');
          initAPIMode(term);
        }
      };

      term.onData((data) => {
        if (modeRef.current === 'ws' && socket.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      });
    } catch (error) {
      console.log('WebSocket unavailable, using API mode');
      initAPIMode(term);
    }
  }, [initAPIMode]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: THEME,
      cols: 80,
      rows: 24,
      scrollback: 1000,
      tabStopWidth: 4
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    terminalInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    term.open(terminalRef.current);

    setTimeout(() => {
      try {
        if (fitAddon && term.element && terminalRef.current) fitAddon.fit();
      } catch (e) {}
    }, 100);

    const handleResize = () => {
      if (fitAddon && term?.element?.parentElement) {
        try { if (term.cols > 0 && term.rows > 0) fitAddon.fit(); } catch (e) {}
      }
    };
    window.addEventListener('resize', handleResize);

    // Refit when the container itself resizes (e.g., the QueryResults panel
    // appearing/disappearing below). Window-level resize alone misses these.
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && terminalRef.current) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(terminalRef.current);
    }

    // Skip the WebSocket attempt entirely — it's never up in this
    // environment and the connection-refused noise drowns the console.
    // The HTTP path through /api/shell is the canonical transport.
    initAPIMode(term);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
      if (socketRef.current) { socketRef.current.close(); socketRef.current = null; }
      if (term) term.dispose();
    };
  }, []);

  const handleZoom = (action) => {
    let newSize = fontSize;
    if (action === 'in') newSize = Math.min(fontSize + 2, 32);
    else if (action === 'out') newSize = Math.max(fontSize - 2, 8);
    else newSize = 14;

    if (newSize !== fontSize && terminalInstanceRef.current) {
      setFontSize(newSize);
      terminalInstanceRef.current.options.fontSize = newSize;
      setTimeout(() => {
        try { fitAddonRef.current?.fit(); } catch (e) {}
      }, 50);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-3 right-3 z-10">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm ${
          isConnected
            ? 'bg-[#19aa59]/20 text-[#19aa59] border border-[#19aa59]/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-[#19aa59] animate-pulse' : 'bg-red-500'
          }`}></div>
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      <div
        ref={terminalRef}
        className="w-full h-full overflow-hidden"
        style={{
          backgroundColor: '#030914',
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: `${fontSize}px`,
        }}
      />

      <div className="absolute bottom-3 right-3 z-10">
        <div className="flex items-center gap-1 bg-[#0a1628]/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-700/50">
          <button onClick={() => handleZoom('out')} className="text-gray-400 hover:text-[#19aa59] text-sm px-1.5 transition-colors" title="Zoom out">−</button>
          <span className="text-gray-500 text-xs px-2 min-w-[40px] text-center">{fontSize}px</span>
          <button onClick={() => handleZoom('in')} className="text-gray-400 hover:text-[#19aa59] text-sm px-1.5 transition-colors" title="Zoom in">+</button>
          <div className="w-px h-4 bg-gray-700 mx-1"></div>
          <button onClick={() => handleZoom('reset')} className="text-gray-300 hover:text-[#19aa59] text-xs px-2 py-0.5 rounded bg-gray-700/50 hover:bg-[#19aa59]/10 transition-all" title="Reset zoom">Reset</button>
        </div>
      </div>
    </div>
  );
};

export default XTerminal;
