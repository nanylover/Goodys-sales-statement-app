/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { formatWonValueOnly } from "../utils";

interface EditableCellProps {
  value: string | number;
  type: "text" | "number";
  onChange: (val: any) => void;
  className?: string;
  colorClass?: string;
  placeholder?: string;
}

export function EditableCell({
  value,
  type,
  onChange,
  className = "",
  colorClass = "text-slate-800",
  placeholder = "입력",
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string>(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync temp value when props change
  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (type === "number") {
      const parsed = parseFloat(tempValue);
      onChange(isNaN(parsed) ? 0 : parsed);
    } else {
      onChange(tempValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setTempValue(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type === "number" ? "number" : "text"}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full h-8 px-1.5 py-0.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-indigo-500 dark:border-indigo-400 rounded-none ring-2 ring-indigo-100 dark:ring-indigo-900/30 outline-none transition-all ${
          type === "number" ? "text-right font-mono" : "text-left"
        }`}
      />
    );
  }

  // Format the display output
  let displayValue = value.toString();
  if (type === "number") {
    displayValue = formatWonValueOnly(Number(value));
  }

  // Fallback styling for empty texts
  const isEmptyVal = !value && value !== 0;

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`group relative min-h-8 flex items-center px-2 py-1 text-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-none cursor-pointer transition-all ${
        type === "number" ? "justify-end text-right font-mono" : "justify-start text-left"
      } ${className}`}
    >
      <span className={isEmptyVal ? "text-slate-400 dark:text-slate-500 italic" : colorClass}>
        {type === "number" && Number(value) === 0 ? "0" : displayValue || placeholder}
      </span>
      <span className="absolute right-1.5 top-2 text-[9px] text-indigo-400 dark:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
        ✏️
      </span>
    </div>
  );
}
