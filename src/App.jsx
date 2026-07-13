import { Editor } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

const App = () => {
  const [editorWidth, setEditorWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [output, setOutput] = useState([]);
  const editorRef = useRef(null);
  const [code, setCode] = useState(`/*
*   Helper Functions:
*
*   arrayToLinkedList([1,2,3]);     Convert Array to Linked List, allowing Linked List to be declared as Array
*
*   linkedListToArray(linkedList)   Convert LinkedList to Array, allowing to easily output the full Linked List with console.log()
*
*/

// FUNCTIONS GO HERE






// CONSOLE LOGS GO HERE





`);

  const formatValue = (value) => {
    if (typeof value === "object" && value !== null) {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return "[Circular]";
      }
    }
    return String(value);
  };

  const runCode = () => {
    const logs = [];
    const originalLog = console.log;

    console.log = (...args) => {
      logs.push(args.map(formatValue).join(" "));
    };

    try {
      const currentCode = editorRef.current.getValue();

      const injectedHelperFunction = `function ListNode(val, next) {
    this.val = val === undefined ? 0 : val;
    this.next = next === undefined ? null : next;
  }

  const arrayToLinkedList = (arr) => {
    if (!arr || arr.length === 0) return null;

    let head = new ListNode(arr[0]);
    let current = head;

    for (let i = 1; i < arr.length; i++) {
      current.next = new ListNode(arr[i]);
      current = current.next;
    }
    return head;
  };

  const linkedListToArray = (head) => {
    const result = [];
    let current = head;
    while (current) {
      result.push(current.val);
      current = current.next;
    }
    return result;
  };`;

      const result = new Function(
        `${injectedHelperFunction}\n${currentCode}`,
      )();

      if (result !== undefined) {
        logs.push(`Return: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      logs.push(`Error: ${err.message}`);
    }

    console.log = originalLog;
    setOutput(logs);
  };

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging) return;

      let newPercentage = (e.clientX / window.innerWidth) * 100;

      if (newPercentage < 20) newPercentage = 20;
      if (newPercentage > 80) newPercentage = 80;

      setEditorWidth(newPercentage);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col h-screen bg-[#252526] text-white overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="p-2 flex w-full h-12 border-b border-gray-700 bg-[#252526] shrink-0">
        <h1 className="px-3 w-1/2 text-[#f48771] text-2xl font-extrabold cursor-default">
          Myg.
          <span className="px-0.5 bg-[#f48771] text-[#252526]">JS</span>
        </h1>
        <div className="relative inline-block group">
          <button
            onClick={runCode}
            className="px-4 py-1 align-middle text-[14px] cursor-pointer bg-green-600 hover:bg-green-700 rounded transition"
          >
            <FontAwesomeIcon icon={faPlay} />
          </button>
          <div className="absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#1e1e1e] px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
            Run (Ctrl + Enter)
          </div>
        </div>
      </div>

      {/* Main Workspace (Editor + Splitter + Console) */}
      <div className="flex flex-1 w-full overflow-hidden min-h-0 relative">
        {/* Left Side: Editor Container */}
        <div
          style={{ width: `${editorWidth}%` }}
          // pointer-events-none during drag stops Monaco from stealing mouse focus
          className={`bg-[#1e1e1e] h-full ${isDragging ? "pointer-events-none" : ""}`}
        >
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value || "")}
            onMount={handleMount}
            theme="vs-dark"
            className="py-3"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              automaticLayout: true, // Forces Monaco to scale cleanly on panel size adjustments
            }}
          />
        </div>

        {/* Resizable Divider Hitbox */}
        <div
          onPointerDown={() => setIsDragging(true)}
          className={`w-1.5 h-full cursor-col-resize z-40 bg-transparent hover:bg-indigo-500 transition-colors duration-150 shrink-0 ${
            isDragging ? "bg-indigo-600 w-1.5" : ""
          }`}
        />

        {/* Right Side: Console Output Container */}
        <div
          style={{ width: `${100 - editorWidth}%` }}
          className="h-full border-l border-gray-700 p-3 font-mono text-sm bg-[#141414] overflow-y-auto"
        >
          {output.length === 0 ? (
            <div className="text-gray-500">&#10095;_</div>
          ) : (
            output.map((line, i) => (
              <div key={i} className="py-0.5 whitespace-pre-wrap">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
