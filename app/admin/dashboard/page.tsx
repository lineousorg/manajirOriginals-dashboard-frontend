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
import { Skeleton } from "@/components/ui/skeleton";
import { Order, OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

// Helper to format currency
const formatCurrency = (amount: string | number) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
  }).format(num);
};

// Helper to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-BD", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Helper to get status color
const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return "bg-yellow-100 text-yellow-800";
    case OrderStatus.PAID:
      return "bg-blue-100 text-blue-800";
    case OrderStatus.SHIPPED:
      return "bg-purple-100 text-purple-800";
    case OrderStatus.DELIVERED:
      return "bg-green-100 text-green-800";
    case OrderStatus.CANCELLED:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function DashboardPage() {
  const { products, pagination: productsPagination } = useProducts();
  const { orders, pagination: ordersPagination } = useOrders();
  const { users } = useUsers();

  const isLoading = productsPagination.total === 0 && ordersPagination.total === 0;

  // Calculate total orders this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const ordersThisMonth = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  }).length;

  const stats = [
    {
      title: "Total Products",
      value: `${productsPagination.total}`,
      change: "+5",
      isPositive: true,
      icon: Package,
    },
    {
      title: "Total Orders",
      value: `${ordersPagination.total}`,
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
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-card rounded-lg border p-6 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="w-16 h-4" />
                </div>
                <div className="mt-4">
                  <Skeleton className="w-24 h-4 mb-2" />
                  <Skeleton className="w-16 h-8" />
                </div>
              </div>
            ))
          ) : (
            stats.map((stat, index) => (
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
            ))
          )}
        </div>

        {/* Quick Actions / Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <FadeIn delay={0.3}>
            <div className="bg-card rounded-lg border p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <span className="text-sm font-medium text-primary">
                  {ordersThisMonth} this month
                </span>
              </div>
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No orders found</p>
                ) : (
                  orders.slice(0, 5).map((order: Order, index: number) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items?.length || 0} items • {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getStatusColor(order.status))}>
                          {order.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(order.createdAt)}
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
                {products.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No products found</p>
                ) : (
                  products.slice(0, 3).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.category?.name || "Uncategorized"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-success flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          {product.variants?.length || 0} variants
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
