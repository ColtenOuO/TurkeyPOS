import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Search, Store, Clock, MapPin, Phone, Building2, User, RefreshCw,
    CalendarCheck, CircleAlert, Copy, Check, ChevronLeft
} from 'lucide-react';
import type { ReservationPublic } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const fieldLabel = "block text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1";
const fieldInput = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-base lg:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all";

const STATUS_STEPS = [
    { key: 'reserved', label: '已預定', hint: '門市確認中' },
    { key: 'pending', label: '製作中', hint: '門市已接單' },
    { key: 'completed', label: '已完成', hint: '可取餐 / 已送出' },
];

const ReservationStatus: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const idParam = searchParams.get('id') || "";

    const [inputId, setInputId] = useState(idParam);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [data, setData] = useState<ReservationPublic | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    // 姓名與電話屬個資，只放在 request body，不寫進網址
    const fetchStatus = useCallback(async (id: string, customerName: string, customerPhone: string) => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.post<ReservationPublic>(`${API_BASE}/reservations/lookup`, {
                reservation_id: id.trim(),
                customer_name: customerName.trim(),
                customer_phone: customerPhone.trim(),
            });
            setData(res.data);
        } catch (err: any) {
            setData(null);
            const status = err.response?.status;
            if (status === 429) {
                setError("嘗試次數過多，請稍後再試");
            } else if (status === 404 || status === 422) {
                setError("訂單編號、姓名或電話有誤，請確認後再試");
            } else {
                setError("查詢失敗，請稍後再試");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // 網址帶 ?id= 時預先填入編號，仍需輸入姓名與電話才能查詢
    useEffect(() => {
        if (idParam) setInputId(idParam);
    }, [idParam]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputId.trim() || !name.trim() || !phone.trim()) {
            setError("請完整填寫訂單編號、姓名與電話");
            return;
        }
        setSearchParams({ id: inputId.trim() });
        fetchStatus(inputId, name, phone);
    };

    const copyId = () => {
        if (!data) return;
        navigator.clipboard?.writeText(data.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentStep = data ? STATUS_STEPS.findIndex(s => s.key === data.status) : -1;
    const isCancelled = data?.status === 'cancelled';

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
                <header className="mb-5">
                    <Link to="/reserve" className="inline-flex items-center gap-1 text-slate-400 hover:text-orange-600 font-bold text-sm mb-3 transition-colors">
                        <ChevronLeft size={16} /> 回到線上預定
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 flex items-center gap-2.5 italic tracking-tight">
                        <Search size={26} className="text-orange-600 shrink-0" /> 訂單狀態查詢
                    </h1>
                </header>

                {/* 查詢表單：訂單編號 + 姓名 + 電話 雙重驗證 */}
                <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/70 mb-4 space-y-3">
                    <div>
                        <label className={fieldLabel}>訂單編號 *</label>
                        <input
                            value={inputId}
                            onChange={(e) => setInputId(e.target.value)}
                            placeholder="請輸入訂購時取得的訂單編號"
                            className={`${fieldInput} font-mono`}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <label className={fieldLabel}>訂購人姓名 *</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="王小明"
                                autoComplete="name"
                                className={fieldInput}
                            />
                        </div>
                        <div>
                            <label className={fieldLabel}>訂購人電話 *</label>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="0912345678"
                                inputMode="tel"
                                autoComplete="tel"
                                className={fieldInput}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 shadow-lg shadow-orange-200 active:scale-[0.98] disabled:from-slate-200 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-400 transition-all flex items-center justify-center gap-1.5"
                    >
                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                        查詢訂單
                    </button>
                    <p className="text-[11px] font-bold text-slate-400 text-center">
                        為保護個人資料，需同時核對姓名與電話
                    </p>
                </form>

                {error && (
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200/70 flex flex-col items-center text-center">
                        <CircleAlert size={40} className="text-slate-300 mb-3" />
                        <p className="font-black text-slate-700">{error}</p>
                        <p className="text-slate-400 font-bold text-sm mt-1">姓名與電話需與訂購時填寫的一致</p>
                    </div>
                )}

                {data && !error && (
                    <div className="space-y-4">
                        {/* 狀態 */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/70">
                            <div className="flex items-start justify-between gap-3 mb-5">
                                <div className="min-w-0">
                                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1">訂單編號</div>
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono font-bold text-slate-800 text-sm break-all">{data.id}</code>
                                        <button onClick={copyId} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-orange-600 transition-colors shrink-0" title="複製">
                                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => fetchStatus(data.id, name, phone)} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 shrink-0" title="重新整理">
                                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                                </button>
                            </div>

                            {isCancelled ? (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg py-4 text-center">
                                    <div className="text-xl font-black text-slate-500">此訂單已取消</div>
                                    <p className="text-slate-400 font-bold text-sm mt-1">如有疑問請直接聯繫門市</p>
                                </div>
                            ) : (
                                <div className="flex items-start">
                                    {STATUS_STEPS.map((step, idx) => {
                                        const done = idx <= currentStep;
                                        return (
                                            <React.Fragment key={step.key}>
                                                <div className="flex flex-col items-center gap-1.5 shrink-0 w-20">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all ${done ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-300'}`}>
                                                        {done ? <Check size={18} strokeWidth={3} /> : idx + 1}
                                                    </div>
                                                    <div className={`text-xs font-black text-center ${done ? 'text-slate-800' : 'text-slate-300'}`}>{step.label}</div>
                                                    {idx === currentStep && (
                                                        <div className="text-[10px] font-bold text-orange-500 text-center leading-tight">{step.hint}</div>
                                                    )}
                                                </div>
                                                {idx < STATUS_STEPS.length - 1 && (
                                                    <div className={`flex-1 h-1 rounded-full mt-4 ${idx < currentStep ? 'bg-orange-500' : 'bg-slate-100'}`} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 訂購資訊 */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/70 space-y-2.5 text-sm font-bold text-slate-600">
                            <div className="flex items-center gap-2">
                                <Store size={15} className="text-slate-400 shrink-0" />
                                <span className="text-slate-800">{data.store_name || "未指定分店"}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${data.order_type === 'delivery' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {data.order_type === 'delivery' ? '外送' : '外帶自取'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <User size={15} className="text-slate-400 shrink-0" /> {data.customer_name}
                            </div>
                            {data.customer_unit && (
                                <div className="flex items-center gap-2">
                                    <Building2 size={15} className="text-slate-400 shrink-0" /> {data.customer_unit}
                                </div>
                            )}
                            {data.customer_phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={15} className="text-slate-400 shrink-0" /> {data.customer_phone}
                                </div>
                            )}
                            {data.delivery_address && (
                                <div className="flex items-start gap-2">
                                    <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" /> <span className="leading-snug">{data.delivery_address}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Clock size={15} className="text-slate-400 shrink-0" />
                                {data.pickup_time
                                    ? <>預定取餐 {new Date(data.pickup_time).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</>
                                    : <span className="text-slate-400">未指定取餐時間</span>}
                            </div>
                        </div>

                        {/* 品項 */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/70">
                            <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5 mb-3">
                                <CalendarCheck size={16} className="text-orange-500" /> 訂購內容
                            </h2>
                            <div className="space-y-2.5">
                                {data.items.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="bg-slate-100 text-slate-600 px-1.5 h-6 rounded flex items-center text-xs font-black shrink-0">
                                            {item.quantity}x
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-black text-slate-800 text-sm leading-snug">{item.product_name}</div>
                                            {item.selected_options.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.selected_options.map((opt, i) => (
                                                        <span key={i} className="bg-orange-50 px-1.5 py-0.5 rounded text-[10px] font-black text-orange-600">
                                                            {opt.option_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="font-black text-slate-900 text-sm shrink-0">
                                            ${item.unit_price * item.quantity}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                                <span className="text-slate-400 font-black text-xs uppercase tracking-wide">總金額</span>
                                <span className="text-xl font-black text-slate-900">
                                    <span className="text-sm text-orange-500 mr-0.5">$</span>{data.total_price}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {!data && !error && !loading && (
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200/70 text-center">
                        <Search size={40} className="text-slate-200 mx-auto mb-3" />
                        <p className="font-black text-slate-500">請填寫上方欄位查詢訂單</p>
                        <p className="text-slate-400 font-bold text-sm mt-1">需要訂單編號、訂購人姓名與電話</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReservationStatus;
