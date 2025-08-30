"use client";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./sidebar"; // Adjust path if needed
import { cn } from "@/lib/utils"; // optional utility for merging classes

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="block sm:hidden">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-fredoka text-lg font-semibold">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="p-4">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
