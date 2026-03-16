import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tableApi, orderApi, paymentApi } from "../services/api";
import { socket } from "../services/socket";
import {
  TableProperties,
  ClipboardList,
  LogOut,
  Plus,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  X,
  Loader2,
  UtensilsCrossed,
  Utensils,
  TextSelect,
  ShieldCheck,
  Banknote,
  CreditCard,
  StickyNote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import CategoryManager from "../components/admin/CategoryManager";
import ProductManager from "../components/admin/ProductManager";
import UserManager from "../components/admin/UserManager";

const STATUS_CFG = {
  available: {
    label: "Trống",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  occupied: {
    label: "Có người",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  reserved: {
    label: "Đã đặt",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
};

const ORDER_STATUS_CFG = {
  placed: {
    label: "Đã đặt",
    icon: Clock,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  pending: {
    label: "Chờ xử lý",
    icon: Clock,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  confirmed: {
    label: "Đã xác nhận",
    icon: CheckCircle2,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  preparing: {
    label: "Đang chuẩn bị",
    icon: UtensilsCrossed,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  ready: {
    label: "Sẵn sàng",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  served: {
    label: "Đã phục vụ",
    icon: CheckCircle2,
    color: "text-teal-600 bg-teal-50 border-teal-200",
  },
  completed: {
    label: "Hoàn thành",
    icon: CheckCircle2,
    color: "text-gray-600 bg-gray-50 border-gray-200",
  },
  cancelled: {
    label: "Đã huỷ",
    icon: X,
    color: "text-red-600 bg-red-50 border-red-200",
  },
};

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all ${active
        ? "bg-[#E86A12] text-white shadow-lg shadow-[#E86A12]/20"
        : "text-[#121212]/50 hover:text-[#121212] hover:bg-[#fff1e7]"
        }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("tables");
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dailyStats, setDailyStats] = useState({ total: 0, bank: 0, cash: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    capacity: 4,
    zone: "",
  });
  const [creating, setCreating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // table-level payment
  const [payMethod, setPayMethod] = useState("cash");
  const [paying, setPaying] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null); // order._id
  const [toasts, setToasts] = useState([]); // { id, tableName, itemCount, code }
  const [selectedOrder, setSelectedOrder] = useState(null); // order detail modal

  // Redirect if not staff/admin
  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "staff") {
      navigate("/");
    }
  }, [user, navigate]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [tabRes, ordRes, statsRes] = await Promise.all([
        tableApi.getAll(),
        orderApi.getAll(),
        paymentApi.getDailyStats().catch(() => ({ data: { total: 0, bank: 0, cash: 0 } })),
      ]);
      setTables(tabRes.data || []);
      setOrders(ordRes.data || []);
      setDailyStats(statsRes.data || { total: 0, bank: 0, cash: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket realtime listener
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) return;

    socket.connect();
    socket.emit("joinStaffRoom");

    const onNewOrder = (data) => {
      console.log("New order received:", data);
      fetchData(true);
      // Show toast notification
      const toast = {
        id: Date.now(),
        tableName: data.tableNameSnapshot || "?",
        itemCount: data.items?.length || 0,
        code: data.code || "",
      };
      setToasts((prev) => [...prev, toast]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== toast.id)),
        6000,
      );
    };
    const onUpdateOrder = (data) => {
      console.log("Order updated:", data);
      fetchData(true);
    };
    const onTableCleared = ({ tableId }) => {
      // Đặt bàn về trống ngay trên UI mà không đợi refetch
      setTables((prev) =>
        prev.map((t) =>
          String(t._id) === tableId ? { ...t, status: "available" } : t,
        ),
      );
      setSelectedTable((prev) =>
        prev && String(prev._id) === tableId
          ? { ...prev, status: "available" }
          : prev,
      );
    };

    socket.on("newOrder", onNewOrder);
    socket.on("updateOrder", onUpdateOrder);
    socket.on("tableCleared", onTableCleared);

    return () => {
      socket.off("newOrder", onNewOrder);
      socket.off("updateOrder", onUpdateOrder);
      socket.off("tableCleared", onTableCleared);
      socket.disconnect();
    };
  }, [user, fetchData]);

  const handlePayment = async () => {
    if (!selectedTable) return;
    setPaying(true);
    try {
      await paymentApi.createByTable({
        tableId: selectedTable._id,
        method: payMethod,
      });
      setShowPaymentModal(false);
      setSelectedTable(null);
      fetchData(true);
    } catch (err) {
      alert(err.message || "Thanh toán thất bại");
    } finally {
      setPaying(false);
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await tableApi.create(createForm);
      setShowCreateTable(false);
      setCreateForm({ name: "", capacity: 4, zone: "" });
      fetchData(true);
    } catch (err) {
      alert(err.message || "Tạo bàn thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTableStatus = async (tableId, status) => {
    try {
      await tableApi.updateStatus(tableId, status);
      fetchData(true);
      setSelectedTable((prev) => (prev ? { ...prev, status } : null));
    } catch (err) {
      alert(err.message);
    }
  };

  const tableOrders = selectedTable
    ? orders.filter((o) => {
      const tid = o.tableId?._id || o.tableId;
      return (
        String(tid) === String(selectedTable._id) &&
        o.paymentStatus !== "paid"
      );
    })
    : [];

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-extrabold text-gray-800 text-base leading-none">
                Staff Panel
              </h1>
              <p className="text-xs text-gray-400 capitalize">
                {user?.role} · {user?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/staff/login");
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-all"
            >
              <LogOut size={15} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
          <TabBtn
            active={tab === "tables"}
            onClick={() => setTab("tables")}
            icon={TableProperties}
            label="Sơ đồ bàn"
          />
          <TabBtn
            active={tab === "orders"}
            onClick={() => setTab("orders")}
            icon={ClipboardList}
            label="Đơn hàng"
          />

          {/* Admin only tabs */}
          {user?.role === "admin" && (
            <>
              <div className="w-px bg-gray-200 mx-2 shrink-0"></div>
              <TabBtn
                active={tab === "menu"}
                onClick={() => setTab("menu")}
                icon={Utensils}
                label="Thực đơn"
              />
              <TabBtn
                active={tab === "categories"}
                onClick={() => setTab("categories")}
                icon={TextSelect}
                label="Danh mục"
              />
              <TabBtn
                active={tab === "staff"}
                onClick={() => setTab("staff")}
                icon={ShieldCheck}
                label="Nhân sự"
              />
            </>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={36} className="text-[#E86A12] animate-spin" />
          </div>
        ) : (
          <>
            {/* TABLES TAB */}
            {tab === "tables" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-extrabold text-gray-800">Sơ đồ bàn</h2>
                  <button
                    onClick={() => setShowCreateTable(true)}
                    className="flex items-center gap-1.5 bg-[#E86A12] hover:bg-[#d45e0f] text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md shadow-[#E86A12]/20 transition-all"
                  >
                    <Plus size={16} /> Thêm bàn
                  </button>
                </div>

                {Object.entries(
                  tables.reduce((acc, t) => {
                    const zone = t.zone || "Khác";
                    if (!acc[zone]) acc[zone] = [];
                    acc[zone].push(t);
                    return acc;
                  }, {})
                )
                  .sort(([a], [b]) => a.localeCompare(b, "vi"))
                  .map(([zone, zoneTables]) => (
                    <div key={zone} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E86A12]" />
                        <h3 className="text-sm font-extrabold text-gray-600 uppercase tracking-wide">
                          {zone}
                        </h3>
                        <span className="text-xs text-gray-400 font-normal">
                          ({zoneTables.length} bàn)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {zoneTables.map((table) => {
                          const cfg =
                            STATUS_CFG[table.status] || STATUS_CFG.available;
                          const tblOrders = orders.filter((o) => {
                            const tid = o.tableId?._id || o.tableId;
                            return String(tid) === String(table._id);
                          });
                          return (
                            <button
                              key={table._id}
                              onClick={() => setSelectedTable(table)}
                              className={`${cfg.bg} ${cfg.border} border-2 rounded-2xl p-4 text-left transition-all hover:shadow-lg active:scale-95 ${selectedTable?._id === table._id ? "ring-2 ring-[#E86A12]" : ""}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl font-extrabold text-gray-800">
                                  {table.name}
                                </span>
                                <span
                                  className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${cfg.text}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                                  />
                                  {cfg.label}
                                </span>
                              </div>
                              {table.capacity && (
                                <p className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                  <Users size={11} /> {table.capacity} người
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* ORDERS TAB */}
            {tab === "orders" && (
              <div className="space-y-3">
                <div className="mb-5 grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-center">
                    <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">Tổng doanh thu ngày</p>
                    <p className="text-xl font-extrabold text-[#E86A12]">{(dailyStats?.total || 0).toLocaleString("vi-VN")}đ</p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col justify-center">
                    <p className="text-xs text-emerald-600/70 font-bold mb-1 uppercase tracking-wider">Tiền mặt</p>
                    <p className="text-xl font-extrabold text-emerald-600">{(dailyStats?.cash || 0).toLocaleString("vi-VN")}đ</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex flex-col justify-center">
                    <p className="text-xs text-blue-600/70 font-bold mb-1 uppercase tracking-wider">Chuyển khoản</p>
                    <p className="text-xl font-extrabold text-blue-600">{(dailyStats?.bank || 0).toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>

                <h2 className="font-extrabold text-gray-800">
                  Tất cả đơn hàng
                </h2>
                {orders.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <ClipboardList
                      size={40}
                      className="mx-auto mb-3 opacity-30"
                    />
                    <p className="font-medium">Chưa có đơn hàng nào</p>
                  </div>
                ) : (
                  orders.map((order) => {
                    const cfg =
                      ORDER_STATUS_CFG[order.status] ||
                      ORDER_STATUS_CFG.pending;
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={order._id}
                        onClick={() => setSelectedOrder(order)}
                        className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#E86A12]/30 transition-all active:scale-[0.99]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-extrabold text-gray-800 text-sm">
                              #
                              {order.code || order._id?.slice(-6).toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-400">
                              Bàn{" "}
                              {order.tableNameSnapshot ||
                                order.table?.name ||
                                "?"}{" "}
                              · {order.items?.length || 0} món
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border ${cfg.color}`}
                            >
                              <Icon size={12} /> {cfg.label}
                            </span>
                            <ChevronRight size={16} className="text-gray-300" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          {(order.items || []).slice(0, 3).map((item, idx) => (
                            <p key={idx} className="text-xs text-gray-500">
                              {item.quantity}x{" "}
                              {item.nameSnapshot || item.productId}
                            </p>
                          ))}
                          {(order.items?.length || 0) > 3 && (
                            <p className="text-xs text-gray-400">
                              +{order.items.length - 3} món khác
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm font-extrabold text-[#E86A12]">
                            {(order.pricing?.total || 0).toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </p>
                          {order.paymentStatus === "paid" ? (
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                              Đã thanh toán
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                              Chưa thanh toán
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* MENU & STAFF TABS */}
            {tab === "menu" && <ProductManager />}
            {tab === "categories" && <CategoryManager />}
            {tab === "staff" && <UserManager />}
          </>
        )}
      </div>

      {/* Table Detail Drawer */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedTable(null)}
          />
          <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div className="flex-1 pr-4">
                <h3 className="font-extrabold text-gray-800">
                  Bàn {selectedTable.name}
                </h3>
                <p className="text-xs text-gray-400">
                  {tableOrders.length} đơn hàng
                </p>
                {selectedTable.qrToken && (
                  <p className="text-[11px] text-[#E86A12] hover:underline mt-1 break-all">
                    <a href={`${import.meta.env.VITE_WEB_LINK || (window.location.origin + '/')}table/${selectedTable.qrToken}`} target="_blank" rel="noopener noreferrer">
                      Link: {import.meta.env.VITE_WEB_LINK || (window.location.origin + '/')}table/{selectedTable.qrToken}
                    </a>
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Status */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Trạng thái bàn
                </p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() =>
                        handleUpdateTableStatus(selectedTable._id, key)
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedTable.status === key
                        ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                        : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
                        }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${selectedTable.status === key ? cfg.dot : "bg-gray-300"}`}
                      />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders for this table */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                  Đơn hàng của bàn
                </p>
                {tableOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ClipboardList
                      size={32}
                      className="mx-auto mb-2 opacity-30"
                    />
                    <p className="text-sm">Chưa có đơn hàng</p>
                  </div>
                ) : (
                  tableOrders.map((order) => {
                    const cfg =
                      ORDER_STATUS_CFG[order.status] || ORDER_STATUS_CFG.placed;
                    const Icon = cfg.icon;
                    const isPaid = order.paymentStatus === "paid";
                    const isExpanded = expandedOrder === order._id;
                    return (
                      <div
                        key={order._id}
                        className="bg-white rounded-2xl mb-3 border border-gray-100 shadow-sm overflow-hidden"
                      >
                        {/* Order header */}
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                          <div>
                            <p className="font-extrabold text-sm text-gray-800">
                              #
                              {order.code || order._id?.slice(-6).toUpperCase()}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {order.items?.length || 0} món ·{" "}
                              {new Date(
                                order.placedAt || order.createdAt,
                              ).toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border ${cfg.color}`}
                            >
                              <Icon size={11} /> {cfg.label}
                            </span>
                            <button
                              onClick={() =>
                                setExpandedOrder(isExpanded ? null : order._id)
                              }
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                            >
                              {isExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Items detail — always show summary, expand for full */}
                        <div className="px-4 pb-2 space-y-2">
                          {(order.items || []).map((item, i) => (
                            <div
                              key={i}
                              className="bg-gray-50 rounded-xl p-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-gray-700 flex-1">
                                  <span className="text-[#E86A12] font-extrabold">
                                    {item.quantity}x
                                  </span>{" "}
                                  {item.nameSnapshot}
                                </p>
                                <p className="text-xs font-extrabold text-gray-600 whitespace-nowrap">
                                  {(item.lineTotal || 0).toLocaleString(
                                    "vi-VN",
                                  )}
                                  đ
                                </p>
                              </div>
                              {/* Options/toppings */}
                              {item.optionsSnapshot?.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.optionsSnapshot.map((opt, j) => (
                                    <span
                                      key={j}
                                      className="text-[10px] bg-[#fff1e7] text-[#d45e0f] font-bold px-1.5 py-0.5 rounded-md"
                                    >
                                      {opt.label}
                                      {opt.priceDelta > 0
                                        ? ` +${opt.priceDelta.toLocaleString("vi-VN")}đ`
                                        : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {/* Note */}
                              {item.note && (
                                <p className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
                                  <StickyNote size={9} /> {item.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Footer: subtotal per order */}
                        <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                          <p className="text-[11px] text-gray-400">
                            Tạm tính đợt này
                          </p>
                          <p className="text-sm font-extrabold text-[#E86A12]">
                            {(order.pricing?.total || 0).toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {/* Sticky pay-all button */}
                {tableOrders.length > 0 && (
                  <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">
                        Tổng {tableOrders.length} đơn chưa thanh toán
                      </span>
                      <span className="font-extrabold text-[#E86A12] text-lg">
                        {tableOrders
                          .reduce((s, o) => s + (o.pricing?.total || 0), 0)
                          .toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setPayMethod("cash");
                        setShowPaymentModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                      <Banknote size={18} /> Thanh toán tất cả
                    </button>
                  </div>
                )}
              </div>
              {/* /orders section */}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedTable && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-extrabold text-gray-800">
                  Thanh toán bàn {selectedTable.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {tableOrders.length} đơn ·{" "}
                  {tableOrders.reduce((s, o) => s + (o.items?.length || 0), 0)}{" "}
                  món
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* All orders summary */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-3 max-h-60 overflow-y-auto">
              {tableOrders.map((order, oi) => (
                <div key={order._id}>
                  {tableOrders.length > 1 && (
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase mb-1">
                      Đợt {oi + 1} ·{" "}
                      {new Date(
                        order.placedAt || order.createdAt,
                      ).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {(order.items || []).map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-sm py-0.5"
                    >
                      <span className="text-gray-600 flex-1 pr-2">
                        {item.quantity}x {item.nameSnapshot}
                        {item.optionsSnapshot?.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {" "}
                            (
                            {item.optionsSnapshot
                              .map((o) => o.label)
                              .join(", ")}
                            )
                          </span>
                        )}
                      </span>
                      <span className="font-bold text-gray-700 whitespace-nowrap">
                        {(item.lineTotal || 0).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  ))}
                  {oi < tableOrders.length - 1 && (
                    <div className="border-b border-dashed border-gray-200 mt-2" />
                  )}
                </div>
              ))}
              <div className="border-t-2 border-gray-200 pt-2 flex justify-between">
                <span className="font-extrabold text-gray-800">Tổng cộng</span>
                <span className="font-extrabold text-[#E86A12] text-lg">
                  {tableOrders
                    .reduce((s, o) => s + (o.pricing?.total || 0), 0)
                    .toLocaleString("vi-VN")}
                  đ
                </span>
              </div>
            </div>

            {/* Payment method */}
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Phương thức thanh toán
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setPayMethod("cash")}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-bold text-sm transition-all ${payMethod === "cash"
                  ? "border-[#E86A12] bg-[#fff1e7] text-[#E86A12]"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                  }`}
              >
                <Banknote size={24} />
                Tiền mặt
              </button>
              <button
                onClick={() => setPayMethod("bank_transfer")}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-bold text-sm transition-all ${payMethod === "bank_transfer"
                  ? "border-[#E86A12] bg-[#fff1e7] text-[#E86A12]"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                  }`}
              >
                <CreditCard size={24} />
                Chuyển khoản
              </button>
            </div>

            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 text-white py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              {paying ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Xác nhận thanh toán
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Create Table Modal */}
      {showCreateTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateTable(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-gray-800">Thêm bàn mới</h3>
              <button
                onClick={() => setShowCreateTable(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Số bàn *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="VD: 5"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#E86A12] focus:ring-2 focus:ring-[#fff1e7] transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Sức chứa
                </label>
                <input
                  type="number"
                  min={1}
                  value={createForm.capacity}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, capacity: +e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#E86A12] focus:ring-2 focus:ring-[#fff1e7] transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Khu vực (Zone)
                </label>
                <input
                  type="text"
                  list="zone-suggestions"
                  value={createForm.zone}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, zone: e.target.value })
                  }
                  placeholder="VD: Tầng 1, Ngoài trời..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#E86A12] focus:ring-2 focus:ring-[#fff1e7] transition-all"
                />
                <datalist id="zone-suggestions">
                  {[...new Set(tables.map((t) => t.zone).filter(Boolean))]
                    .sort()
                    .map((z) => (
                      <option key={z} value={z} />
                    ))}
                </datalist>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-[#E86A12] hover:bg-[#d45e0f] text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-lg shadow-[#E86A12]/20 transition-all flex items-center justify-center gap-2"
              >
                {creating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={16} /> Tạo bàn
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder &&
        (() => {
          const cfg =
            ORDER_STATUS_CFG[selectedOrder.status] || ORDER_STATUS_CFG.placed;
          const Icon = cfg.icon;
          return (
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedOrder(null)}
              />
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                      Chi tiết đơn hàng
                    </p>
                    <h3 className="font-extrabold text-gray-800">
                      {selectedOrder.code}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Meta info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="font-bold">
                        Bàn{" "}
                        {selectedOrder.tableNameSnapshot ||
                          selectedOrder.tableId?.name ||
                          "?"}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span>
                        {new Date(
                          selectedOrder.placedAt || selectedOrder.createdAt,
                        ).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border ${cfg.color}`}
                    >
                      <Icon size={12} /> {cfg.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                      Danh sách món
                    </p>
                    <div className="space-y-2">
                      {(selectedOrder.items || []).map((item, i) => (
                        <div key={i} className="bg-gray-50 rounded-2xl p-3">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-bold text-gray-700 flex-1">
                              <span className="text-[#E86A12] font-extrabold">
                                {item.quantity}x
                              </span>{" "}
                              {item.nameSnapshot}
                            </p>
                            <p className="text-sm font-extrabold text-gray-700 whitespace-nowrap">
                              {(item.lineTotal || 0).toLocaleString("vi-VN")}đ
                            </p>
                          </div>
                          {item.optionsSnapshot?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {item.optionsSnapshot.map((opt, j) => (
                                <span
                                  key={j}
                                  className="text-[10px] bg-[#fff1e7] text-[#d45e0f] font-bold px-2 py-0.5 rounded-md"
                                >
                                  {opt.label}
                                  {opt.priceDelta > 0
                                    ? ` +${opt.priceDelta.toLocaleString("vi-VN")}đ`
                                    : ""}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.note && (
                            <p className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
                              <StickyNote size={9} /> {item.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 flex justify-between items-center">
                    <span className="font-extrabold text-gray-700">
                      Tổng cộng
                    </span>
                    <span className="font-extrabold text-[#E86A12] text-xl">
                      {(selectedOrder.pricing?.total || 0).toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </span>
                  </div>

                  {/* Payment status */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Thanh toán</span>
                    {selectedOrder.paymentStatus === "paid" ? (
                      <span className="flex items-center gap-1 font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-sm">
                        <CheckCircle2 size={14} /> Đã thanh toán
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-extrabold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-sm">
                        <AlertCircle size={14} /> Chưa thanh toán
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Toast notifications */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 bg-white border-l-4 border-[#E86A12] rounded-2xl shadow-2xl px-5 py-4 w-80 animate-[slideIn_0.3s_ease]"
          >
            <div className="w-10 h-10 bg-[#fff1e7] rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-gray-800 text-sm">
                Đơn mới — Bàn {toast.tableName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {toast.itemCount} món · {toast.code}
              </p>
              <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-[#E86A12] rounded-full"
                  style={{ animation: "shrink 6s linear forwards" }}
                />
              </div>
            </div>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="text-gray-300 hover:text-gray-500 flex-shrink-0 self-start"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
