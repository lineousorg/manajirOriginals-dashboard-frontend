"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eye,
  ShoppingCart,
  Package,
  User,
  CreditCard,
  Calendar,
  Loader2,
  Download,
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Order, OrderStatus, OrderItem } from "@/types/order";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/modal";
import { Clock, Truck, PackageCheck, Ban } from "lucide-react";

// Order status badge styles
const orderStatusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PAID: "bg-blue-100 text-blue-700 border-blue-200",
  SHIPPED: "bg-purple-100 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        orderStatusStyles[status]
      )}
    >
      {orderStatusLabels[status]}
    </span>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({
  isOpen,
  onClose,
  orderId,
}: {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}) => {
  const { getOrderById } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      const fetchOrderDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await getOrderById(orderId);
          setOrder(data);
        } catch (err) {
          setError("Failed to load order details");
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrderDetails();
    } else {
      setOrder(null);
    }
  }, [isOpen, orderId, getOrderById]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: string) => {
    return parseFloat(amount).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order #${orderId}`}
      description="View order details and items"
      size="xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">{error}</div>
      ) : order ? (
        <div className="space-y-6">
          {/* Order Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Customer */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Customer</span>
              </div>
              <p className="font-medium">{order.user.email}</p>
              {/* <p className="text-sm text-muted-foreground">
                ID: {order.userId}
              </p> */}
            </div>

            {/* Status */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Payment Method */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">Payment Method</span>
              </div>
              <p className="font-medium capitalize">
                {order.paymentMethod.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>

            {/* Date */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Order Date</span>
              </div>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item: OrderItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {item.variant.product.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Variant ID: {item.variantId}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">
                            {item.variant.sku}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-muted rounded text-sm">
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(
                            (parseFloat(item.price) * item.quantity).toString()
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end border-t pt-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(order.total)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

const OrdersPage = () => {
  const { orders, isLoading, updateOrderStatus, downloadReceipt } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const { toast } = useToast();

  // Modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Download receipt state
  const [downloadingReceipt, setDownloadingReceipt] = useState<number | null>(
    null
  );

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toString().includes(searchQuery.toLowerCase()) ||
        order.user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Calculate order stats by status
  const orderStats = useMemo(() => {
    const stats: Record<OrderStatus, number> = {
      PENDING: 0,
      PAID: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    if (Array.isArray(orders)) {
      orders.forEach((order) => {
        if (order.status in stats) {
          stats[order.status]++;
        }
      });
    }
    return stats;
  }, [orders]);

  const handleStatusChange = async (
    orderId: number,
    newStatus: OrderStatus
  ) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      toast({
        title: "Order status updated",
        description: `Order #${orderId} status has been updated to ${orderStatusLabels[newStatus]}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as string) ||
          "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setViewModalOpen(true);
  };

  const handleDownloadReceipt = async (orderId: number) => {
    try {
      setDownloadingReceipt(orderId);
      await downloadReceipt(orderId);
      toast({
        title: "Receipt downloaded",
        description: `Receipt for Order #${orderId} has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: string) => {
    return parseFloat(amount).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const colorVariants = {
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-400",
      textStrong: "text-amber-500",
      accent: "bg-amber-500",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-400",
      textStrong: "text-blue-500",
      accent: "bg-blue-500",
    },
    violet: {
      bg: "bg-violet-50",
      text: "text-violet-400",
      textStrong: "text-violet-500",
      accent: "bg-violet-500",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-400",
      textStrong: "text-emerald-500",
      accent: "bg-emerald-500",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-400",
      textStrong: "text-rose-500",
      accent: "bg-rose-500",
    },
  };
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Quick stats - Minimal Elegant Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              status: "PENDING",
              label: "Pending",
              icon: Clock,
              color: "amber",
            },
            { status: "PAID", label: "Paid", icon: CreditCard, color: "blue" },
            {
              status: "SHIPPED",
              label: "Shipped",
              icon: Truck,
              color: "violet",
            },
            {
              status: "DELIVERED",
              label: "Delivered",
              icon: PackageCheck,
              color: "emerald",
            },
            {
              status: "CANCELLED",
              label: "Cancelled",
              icon: Ban,
              color: "rose",
            },
          ].map(({ status, label, icon: Icon, color }) => (
            <Card
              key={status}
              className="group relative border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
            >
              <CardContent className="p-3 overflow-hidden">
                <div className="flex items-center justify-end relative">
                  {/* Icon */}
                  <div
                    className={`rounded-xl bg-${color}-50 text-${color}-600 absolute -left-7 `}
                  >
                    <Icon size={50} strokeWidth={2} />
                  </div>

                  <div className="mt-4 text-right">
                    <p className={`text-2xl font-semibold text-${color}-700`}>
                      {orderStats[status].toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{label}</p>
                  </div>
                </div>

                {/* Subtle bottom accent */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-${color}-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg`}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header */}
        <FadeIn>
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage your customer orders</p>
          </div>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={0.1} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as OrderStatus | "all")
            }
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={OrderStatus.PAID}>Paid</SelectItem>
              <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
              <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
              <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </FadeIn>

        {/* Table */}
        <FadeIn delay={0.2}>
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Orders will appear here when customers place them"}
              </p>
            </motion.div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-card shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white">
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <span className="font-medium">#{order.id}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.user.email}</p>
                            <p className="text-sm text-muted-foreground">
                              User ID: {order.userId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              handleStatusChange(order.id, value as OrderStatus)
                            }
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue>
                                <OrderStatusBadge status={order.status} />
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value={OrderStatus.PENDING}>
                                <OrderStatusBadge
                                  status={OrderStatus.PENDING}
                                />
                              </SelectItem>
                              <SelectItem value={OrderStatus.PAID}>
                                <OrderStatusBadge status={OrderStatus.PAID} />
                              </SelectItem>
                              <SelectItem value={OrderStatus.SHIPPED}>
                                <OrderStatusBadge
                                  status={OrderStatus.SHIPPED}
                                />
                              </SelectItem>
                              <SelectItem value={OrderStatus.DELIVERED}>
                                <OrderStatusBadge
                                  status={OrderStatus.DELIVERED}
                                />
                              </SelectItem>
                              <SelectItem value={OrderStatus.CANCELLED}>
                                <OrderStatusBadge
                                  status={OrderStatus.CANCELLED}
                                />
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {order.paymentMethod.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(order.total)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadReceipt(order.id)}
                              disabled={downloadingReceipt === order.id}
                              className="hover:bg-accent/10"
                              title="Download Receipt"
                            >
                              {downloadingReceipt === order.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewOrder(order)}
                              className="hover:bg-accent/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </FadeIn>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedOrderId(null);
        }}
        orderId={selectedOrderId}
      />
    </PageTransition>
  );
};

export default OrdersPage;
