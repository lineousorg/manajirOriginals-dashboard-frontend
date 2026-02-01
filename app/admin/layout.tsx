"use client";
import { AdminNavbar } from "@/components/layout/AdminNavbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import path from "path";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div
        className={`${pathname === "/admin/login" ? "ml-0" : "ml-70"}  transition-[margin] duration-300`}
      >
        <AdminNavbar />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`${pathname === "/admin/login" ? "p-0" : "p-8"} `}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
