"use client";

import Navbar from "@/components/dashboard/navbar";
import Sidebar from "@/components/dashboard/sidebar";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="bg-[#F6F6F6] h-screen flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 lg:gap-5 min-h-0 overflow-hidden ">
        <Sidebar />

        <main className="flex-1 rounded-[16px]  lg:py-5 px-3 lg:mr-5 h-full flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}