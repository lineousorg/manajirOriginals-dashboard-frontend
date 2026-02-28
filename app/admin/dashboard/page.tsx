"use client";

import {
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageTransition, FadeIn, ScaleOnHover } from "@/components/ui/motion";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { useUsers } from "@/hooks/useUsers";

export default function DashboardPage() {
  const { products } = useProducts();
  const { orders } = useOrders();
  const { users } = useUsers();

  const stats = [
    {
      title: "Total Products",
      value: `${products.length}`,
      change: "+5",
      isPositive: true,
      icon: Package,
    },
    {
      title: "Total Orders",
      value: `${orders.length}`,
      change: "0%",
      isPositive: true,
      icon: ShoppingCart,
    },
    {
      title: "Total Customers",
      value: `${orders.length}`,
      change: "+0%",
      isPositive: true,
      icon: Users,
    },
    {
      title: "Registered Users",
      value: `${users.length}`,
      change: "0%",
      isPositive: false,
      icon: TrendingUp,
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeIn>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Heres an overview of your store.
          </p>
        </FadeIn>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <FadeIn key={stat.title} delay={0.1 + index * 0.05}>
              <ScaleOnHover>
                <div className="bg-card rounded-lg border p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        stat.isPositive ? "text-success" : "text-destructive"
                      }`}
                    >
                      {stat.isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                </div>
              </ScaleOnHover>
            </FadeIn>
          ))}
        </div>

        {/* Quick Actions / Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <FadeIn delay={0.3}>
            <div className="bg-card rounded-lg border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
              <div className="space-y-4">
                {[].length === 0 ? (
                  <small className="text-center">No orders found</small>
                ) : (
                  [].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          #{i}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Order #100{i}</p>
                          <p className="text-xs text-muted-foreground">
                            2 items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {/* ${(Math.random() * 200 + 50).toFixed(2)} */}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Just now
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="bg-card rounded-lg border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4">Top Products</h2>
              <div className="space-y-4">
                {[].length === 0 ? (
                  <small className="text-center">No products found</small>
                ) : (
                  [].map((product, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{}</p>
                          <p className="text-xs text-muted-foreground">
                            {/* {(Math.random() * 100 + 20).toFixed(0)} sold */}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-success flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          {/* {(Math.random() * 30 + 5).toFixed(1)}% */}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
