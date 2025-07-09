import React, { useState, useRef, useEffect } from "react";
import { ErrorBoundary } from "@/error-boundary";

// -----------------------------------------------------------------------------
// NOTE
//
//   This component replaces the default starter content shipped with the
//   template. The new implementation provides a fully working "desktop"
//   environment inspired by classic operating systems. It creates a flat
//   grey workspace, a taskbar with a Start button and supports opening simple
//   applications—Calculator, Notepad and Minesweeper—in draggable,
//   resizable windows. The implementation lives entirely on the client and
//   persists Notepad content in localStorage. Feel free to refine and extend
//   this code; everything you need for the basic desktop is contained below.

function AppImpl() {
  // Window description type. Each window stores its type, position, size and
  // unique identifiers for z‑ordering. Additional state (like the Minesweeper
  // board) lives inside the content components.
  type WindowType = "calculator" | "notepad" | "minesweeper";

  interface WindowData {
    id: number;
    type: WindowType;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  }

  // Main state hooks. Manage the collection of open windows and the Start
  // menu visibility.
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const nextId = useRef(1);

  // Clicking the Start button toggles the Start menu. Clicking elsewhere hides it.
  const handleDesktopClick = () => {
    if (showMenu) setShowMenu(false);
  };

  // When opening a new application window, center it on the viewport and give
  // it the highest zIndex.
  const openApp = (type: WindowType) => {
    const id = nextId.current++;
    const defaultWidth = 200;
    const defaultHeight = type === "calculator" ? 220 : 300;
    const newWindow: WindowData = {
      id,
      type,
      x: 100 + windows.length * 20,
      y: 100 + windows.length * 20,
      width: defaultWidth,
      height: defaultHeight,
      zIndex: windows.length + 1,
    };
    setWindows((prev) => [...prev, newWindow]);
    setShowMenu(false);
  };

  // Bring the clicked window to the front by updating its zIndex based on current
  // maximum zIndex. This function is passed to each window and invoked on
  // mousedown within that window.
  const bringToFront = (id: number) => {
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 0);
      return prev.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w));
    });
  };

  // Update individual window position or size. The Window component calls this
  // whenever the user drags or resizes a window.
  const updateWindow = (id: number, changes: Partial<WindowData>) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...changes } : w)));
  };

  // Close a window by removing it from the array.
  const closeWindow = (id: number) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div
      className="relative w-full h-screen bg-gray-200 overflow-hidden"
      onClick={handleDesktopClick}
    >
      {/* Render all open windows. They are absolutely positioned based on state. */}
      {windows.map((w) => (
        <Window
          key={w.id}
          data={w}
          onClose={closeWindow}
          onMouseDown={bringToFront}
          onUpdate={updateWindow}
        />
      ))}

      {/* Taskbar at the bottom of the page. */}
      <div className="absolute bottom-0 left-0 w-full h-12 bg-gray-300 border-t border-gray-400 flex items-center p-2">
        {/* Start button. */}
        <div className="relative">
          <button
            id="start"
            className="bg-gray-100 border border-gray-500 px-4 py-1 shadow-inner focus:outline-none"
            onClick={(e) => {
              e.stopPropagation(); // Prevent desktop click from hiding the menu
              setShowMenu((prev) => !prev);
            }}
          >
            Start
          </button>
          {/* Start menu. */}
          {showMenu && (
            <div
              className="absolute bottom-full left-0 bg-gray-100 border border-gray-500 shadow-md mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="px-4 py-2 hover:bg-gray-300 cursor-pointer"
                onClick={() => openApp("calculator")}
              >
                Calculator
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-300 cursor-pointer"
                onClick={() => openApp("notepad")}
              >
                Notepad
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-300 cursor-pointer"
                onClick={() => openApp("minesweeper")}
              >
                Minesweeper
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Window component
//
// Each window encapsulates its own frame with a title bar, close button and
// content. Dragging on the title bar moves the window and dragging the
// bottom right corner resizes it. The parent (AppImpl) handles updating the
// position, size and zIndex when appropriate.
interface WindowProps {
  data: {
    id: number;
    type: "calculator" | "notepad" | "minesweeper";
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  };
  onClose: (id: number) => void;
  onMouseDown: (id: number) => void;
  onUpdate: (id: number, changes: Partial<any>) => void;
}

const Window: React.FC<WindowProps> = ({ data, onClose, onMouseDown, onUpdate }) => {
  const { id, x, y, width, height, type, zIndex } = data;

  // Dragging logic for moving the window.
  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = x;
    const origY = y;
    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      onUpdate(id, { x: origX + dx, y: origY + dy });
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Resizing logic for the bottom right corner. You could extend this to
  // resize from any edge or corner. For simplicity we only implement the
  // bottom right resize handle here.
  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = width;
    const origH = height;
    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const newW = Math.max(120, origW + dx);
      const newH = Math.max(100, origH + dy);
      onUpdate(id, { width: newW, height: newH });
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Title for each app type
  const getTitle = (): string => {
    if (type === "calculator") return "Calculator";
    if (type === "notepad") return "Notepad";
    if (type === "minesweeper") return "Minesweeper";
    return "";
  };

  // Render specific content based on the type
  const renderContent = () => {
    if (type === "calculator") return <CalculatorContent />;
    if (type === "notepad") return <NotepadContent />;
    if (type === "minesweeper") return <MinesweeperContent />;
    return null;
  };

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: width,
        height: height,
        zIndex: zIndex,
      }}
      className="bg-gray-100 border border-black shadow-lg flex flex-col"
      onMouseDown={() => onMouseDown(id)}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between bg-gray-200 border-b border-black cursor-move select-none"
        style={{ padding: "2px 8px", height: "24px" }}
        onMouseDown={startDrag}
      >
        <span className="font-sans font-medium text-sm">{getTitle()}</span>
        <button
          className="ml-2 text-sm px-1 hover:bg-gray-300"
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }}
        >
          ×
        </button>
      </div>
      {/* Content area */}
      <div className="flex-1 overflow-auto p-2" style={{ minHeight: 0 }}>
        {renderContent()}
      </div>
      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
        onMouseDown={startResize}
      ></div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Calculator
//
// A very simple calculator implementation. Only digits, basic operators and a
// clear function are supported. We build the expression as a string and use
// eval() after replacing the non‑standard symbols. If you extend this component
// feel free to add more functionality like parentheses or decimal values.
const CalculatorContent: React.FC = () => {
  const [expr, setExpr] = useState<string>("");
  const handleButton = (value: string) => {
    if (value === "C") {
      setExpr("");
      return;
    }
    if (value === "=") {
      try {
        // Replace unicode operators with JS equivalents before evaluating.
        // eslint-disable-next-line no-eval
        const result = eval(
          expr
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
        );
        setExpr(String(result));
      } catch {
        setExpr("");
      }
      return;
    }
    setExpr(expr + value);
  };
  const buttons: string[][] = [
    ["7", "8", "9", "+"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "-"],
    ["0", "C", "=", "÷"],
  ];
  return (
    <div className="w-full h-full flex flex-col">
      <div
        className="bg-white border border-black mb-2 text-right px-2"
        style={{ minHeight: "30px", lineHeight: "30px" }}
      >
        <span className="select-all">{expr || ""}</span>
      </div>
      <div className="flex-1 grid grid-cols-4 gap-1">
        {buttons.flat().map((b) => (
          <button
            key={b}
            className="bg-gray-100 border border-black text-lg hover:bg-gray-200"
            onClick={() => handleButton(b)}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Notepad
//
// The text is saved into localStorage whenever the user clicks the Save button.
// On mount we read from localStorage to initialize the textarea. You could
// extend this with examples like autosave or even a very basic formatting
// mechanism.
const NotepadContent: React.FC = () => {
  const [text, setText] = useState<string>("");
  useEffect(() => {
    const saved = localStorage.getItem("notepad-content");
    if (saved) {
      setText(saved);
    }
  }, []);
  const save = () => {
    localStorage.setItem("notepad-content", text);
    // Optionally provide some visual feedback. For simplicity we omit it here.
  };
  return (
    <div className="w-full h-full flex flex-col">
      <textarea
        className="flex-1 border border-black p-1 resize-none bg-white"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end pt-2">
        <button
          onClick={save}
          className="bg-gray-100 border border-black px-3 py-1 hover:bg-gray-200"
        >
          Save
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Minesweeper
//
// A simple Minesweeper implementation. We set up a grid, randomly distribute
// mines and calculate the adjacent counts. Left click reveals a cell. Right
// click toggles a flag. The game ends when all safe cells are exposed or a
// mine is clicked. Feel free to increase the difficulty or add features like
// resetting the game.
const MinesweeperContent: React.FC = () => {
  type Cell = {
    hasBomb: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacent: number;
  };
  const rows = 5;
  const cols = 5;
  const bombs = 5;

  const generateGrid = (): Cell[][] => {
    // Initialize empty grid
    const grid: Cell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < cols; j++) {
        row.push({ hasBomb: false, isRevealed: false, isFlagged: false, adjacent: 0 });
      }
      grid.push(row);
    }
    // Place bombs
    let placed = 0;
    while (placed < bombs) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!grid[r][c].hasBomb) {
        grid[r][c].hasBomb = true;
        placed++;
      }
    }
    // Calculate adjacent counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].hasBomb) {
          grid[r][c].adjacent = -1;
          continue;
        }
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (grid[nr][nc].hasBomb) count++;
            }
          }
        }
        grid[r][c].adjacent = count;
      }
    }
    return grid;
  };
  const [grid, setGrid] = useState<Cell[][]>(generateGrid());
  const [status, setStatus] = useState<string>("");

  const revealCell = (r: number, c: number) => {
    if (status) return;
    const cell = grid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;
    const newGrid = grid.map((row) => row.map((c) => ({ ...c })));
    const floodFill = (rr: number, cc: number) => {
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) return;
      const cur = newGrid[rr][cc];
      if (cur.isRevealed || cur.isFlagged) return;
      cur.isRevealed = true;
      if (cur.adjacent === 0 && !cur.hasBomb) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            floodFill(rr + dr, cc + dc);
          }
        }
      }
    };
    if (cell.hasBomb) {
      // Reveal all bombs
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (newGrid[i][j].hasBomb) {
            newGrid[i][j].isRevealed = true;
          }
        }
      }
      setGrid(newGrid);
      setStatus("You lose");
      return;
    }
    floodFill(r, c);
    setGrid(newGrid);
    // Check win condition: all non-bombs are revealed
    let safeCount = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!newGrid[i][j].hasBomb && newGrid[i][j].isRevealed) safeCount++;
      }
    }
    if (safeCount === rows * cols - bombs) {
      setStatus("You win");
    }
  };

  const toggleFlag = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (status) return;
    const cell = grid[r][c];
    if (cell.isRevealed) return;
    const newGrid = grid.map((row) => row.map((c) => ({ ...c })));
    newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
    setGrid(newGrid);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-5 gap-0.5">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            let cellContent: React.ReactNode = null;
            let textColor = "black";
            if (cell.isRevealed) {
              if (cell.hasBomb) {
                cellContent = "💣";
              } else if (cell.adjacent > 0) {
                cellContent = cell.adjacent;
                // Apply colors per number
                if (cell.adjacent === 1) textColor = "blue";
                if (cell.adjacent === 2) textColor = "green";
                if (cell.adjacent === 3) textColor = "red";
              }
            } else if (cell.isFlagged) {
              cellContent = "🚩";
            }
            return (
              <div
                key={`${r}-${c}`}
                className={`w-8 h-8 border border-gray-500 flex items-center justify-center text-sm select-none ${cell.isRevealed ? "bg-gray-100" : "bg-gray-300"}`}
                onClick={() => revealCell(r, c)}
                onContextMenu={(e) => toggleFlag(r, c, e)}
              >
                <span style={{ color: textColor }}>{cellContent}</span>
              </div>
            );
          }),
        )}
      </div>
      <div className="mt-2 font-medium text-sm">{status}</div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AppImpl />
    </ErrorBoundary>
  );
}

export default App;
