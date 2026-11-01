import { useCallback, useEffect, useRef, useState } from "react";
import "../App.css";

type MarketId = "usd-afn" | "eur-afn" | "bitcoin" | "gold";
type Quote = {
	price: number;
	change24h: number | null;
	updatedAt: Date;
};
type MarketCardState = { quote?: Quote; error?: string; loading: boolean };
type MarketState = Record<MarketId, MarketCardState>;

type MarketCardConfig = {
	id: MarketId;
	title: string;
	symbol: string;
	changePeriod: "24h" | "daily";
	format: (value: number) => string;
};

const cards: MarketCardConfig[] = [
	{
		id: "usd-afn",
		title: "دلار آمریکا به افغانی افغانستان",
		symbol: "USD / AFN",
		changePeriod: "daily",
		format: (value) =>
			`${value.toLocaleString("en-US", { maximumFractionDigits: 3 })} AFN`,
	},
	{
		id: "eur-afn",
		title: "یورو به افغانی افغانستان",
		symbol: "EUR / AFN",
		changePeriod: "daily",
		format: (value) =>
			`${value.toLocaleString("en-US", { maximumFractionDigits: 3 })} AFN`,
	},
	{
		id: "bitcoin",
		title: "بیت‌کوین",
		symbol: "BTC / USD",
		changePeriod: "24h",
		format: (value) =>
			new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
				maximumFractionDigits: 2,
			}).format(value),
	},
	{
		id: "gold",
		title: "طلای جهانی · هر اونس تروا",
		symbol: "XAU / USD",
		changePeriod: "24h",
		format: (value) =>
			new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
				maximumFractionDigits: 2,
			}).format(value),
	},
];

const initialMarketState: MarketState = {
	"usd-afn": { loading: true },
	"eur-afn": { loading: true },
	bitcoin: { loading: true },
	gold: { loading: true },
};

const timeFormatter = new Intl.DateTimeFormat("fa-AF", {
	dateStyle: "medium",
	timeStyle: "short",
	timeZone: "Asia/Kabul",
});
async function fetchJson(url: string): Promise<unknown> {
	const response = await fetch(url, {
		headers: { Accept: "application/json" },
	});
	if (!response.ok) {
		throw new Error(`سرویس داده با خطای HTTP ${response.status} پاسخ داد.`);
	}
	return response.json();
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getPositiveNumber(value: unknown, label: string) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
		throw new Error(`اطلاعات ${label} از سرویس معتبر نیست.`);
	}
	return value;
}

function getCurrencyRate(data: unknown, base: "usd" | "eur") {
	if (
		!isRecord(data) ||
		typeof data.date !== "string" ||
		!isRecord(data[base])
	) {
		throw new Error("پاسخ سرویس نرخ ارز معتبر نیست.");
	}
	const rate = getPositiveNumber(
		data[base].afn,
		`${base.toUpperCase()}/AFN rate`,
	);
	return { date: data.date, rate };
}

function previousDate(date: string) {
	const timestamp = Date.parse(`${date}T00:00:00Z`);
	if (!Number.isFinite(timestamp)) {
		throw new Error("تاریخ نرخ ارز دریافتی معتبر نیست.");
	}
	return new Date(timestamp - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function fetchCurrencyQuote(base: "usd" | "eur"): Promise<Quote> {
	const endpoint = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api";
	const latestData = await fetchJson(
		`${endpoint}@latest/v1/currencies/${base}.json`,
	);
	const latest = getCurrencyRate(latestData, base);
	const historicData = await fetchJson(
		`${endpoint}@${previousDate(latest.date)}/v1/currencies/${base}.json`,
	);
	const historic = getCurrencyRate(historicData, base);
	const change24h = ((latest.rate - historic.rate) / historic.rate) * 100;

	return {
		price: latest.rate,
		change24h,
		updatedAt: new Date(),
	};
}

async function fetchBitcoinQuote(): Promise<Quote> {
	const data = await fetchJson(
		"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
	);
	if (!isRecord(data) || !isRecord(data.bitcoin)) {
		throw new Error("پاسخ سرویس قیمت بیت‌کوین معتبر نیست.");
	}

	const bitcoin = data.bitcoin;
	const price = getPositiveNumber(bitcoin.usd, "Bitcoin price");
	if (
		typeof bitcoin.usd_24h_change !== "number" ||
		!Number.isFinite(bitcoin.usd_24h_change)
	) {
		throw new Error("تغییر ۲۴ساعتهٔ بیت‌کوین از سرویس دریافت نشد.");
	}

	return {
		price,
		change24h: bitcoin.usd_24h_change,
		updatedAt: new Date(),
	};
}

async function fetchGoldQuote(): Promise<Quote> {
	const data = await fetchJson("https://api.gold-api.com/price/XAU");
	if (!isRecord(data) || typeof data.updatedAt !== "string") {
		throw new Error("پاسخ سرویس قیمت طلا معتبر نیست.");
	}
	const sourceTimestamp = Date.parse(data.updatedAt);
	if (!Number.isFinite(sourceTimestamp)) {
		throw new Error("زمان به‌روزرسانی قیمت طلا معتبر نیست.");
	}

	return {
		price: getPositiveNumber(data.price, "gold price"),
		change24h: null,
		updatedAt: new Date(),
	};
}

function Currency() {
	const [market, setMarket] = useState(initialMarketState);
	const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
	const goldSnapshots = useRef<{ timestamp: number; price: number }[]>([]);

	const loadCard = useCallback(
		async (id: MarketId, loadQuote: () => Promise<Quote>) => {
			try {
				const quote = await loadQuote();
				if (id === "gold") {
					const now = Date.now();
					const snapshots = goldSnapshots.current.filter(
						(snapshot) => now - snapshot.timestamp <= 25 * 60 * 60 * 1000,
					);
					const baseline = snapshots
						.filter(
							(snapshot) => now - snapshot.timestamp >= 24 * 60 * 60 * 1000,
						)
						.sort(
							(first, second) =>
								Math.abs(now - first.timestamp - 24 * 60 * 60 * 1000) -
								Math.abs(now - second.timestamp - 24 * 60 * 60 * 1000),
						)[0];
					if (baseline) {
						quote.change24h =
							((quote.price - baseline.price) / baseline.price) * 100;
					}
					snapshots.push({ timestamp: now, price: quote.price });
					goldSnapshots.current = snapshots;
				}

				setMarket((previous) => ({
					...previous,
					[id]: { quote, loading: false },
				}));
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "دریافت اطلاعات بازار ناموفق بود.";
				setMarket((previous) => ({
					...previous,
					[id]: { ...previous[id], error: message, loading: false },
				}));
			}
		},
		[],
	);

	useEffect(() => {
		let active = true;
		const refresh = async () => {
			if (!active) {
				return;
			}
			setLastRefresh(new Date());
			await Promise.all([
				loadCard("usd-afn", () => fetchCurrencyQuote("usd")),
				loadCard("eur-afn", () => fetchCurrencyQuote("eur")),
				loadCard("bitcoin", fetchBitcoinQuote),
				loadCard("gold", fetchGoldQuote),
			]);
		};

		void refresh();
		const timer = setInterval(() => void refresh(), 5 * 60 * 1000);
		return () => {
			active = false;
			clearInterval(timer);
		};
	}, [loadCard]);

	return (
		<section
			className="market-dashboard"
			dir="rtl"
			aria-labelledby="market-dashboard-title"
		>
			<header className="market-dashboard__header">
				<div>
					<p className="market-dashboard__eyebrow">نمای کلی بازار</p>
					<h2 id="market-dashboard-title">نرخ زنده ارز و قیمت بازار</h2>
					<p className="market-dashboard__description">
						قیمت‌های بازار و نرخ‌های مرجع ارز
					</p>
				</div>
				<div className="market-dashboard__refresh" aria-live="polite">
					<span className="market-dashboard__live-dot" aria-hidden="true" />
					<span>
						{lastRefresh
							? `آخرین بررسی: ${timeFormatter.format(lastRefresh)}`
							: "در حال اتصال به داده‌های بازار..."}
					</span>
				</div>
			</header>

			<div className="market-dashboard__grid">
				{cards.map((card) => {
					const { quote, error, loading } = market[card.id];
					const trend =
						quote?.change24h == null
							? "neutral"
							: quote.change24h > 0
								? "up"
								: quote.change24h < 0
									? "down"
									: "neutral";

					return (
						<article className="market-card" key={card.id}>
							<div className="market-card__top">
								<div>
									<p className="market-card__symbol">{card.symbol}</p>
									<h3 className="market-card__title">{card.title}</h3>
								</div>
								<span
									className={`market-card__badge market-card__badge--${card.id}`}
									dir="ltr"
									aria-hidden="true"
								>
									{card.id === "bitcoin"
										? "₿"
										: card.id === "gold"
											? "Au"
											: card.id === "usd-afn"
												? "$"
												: "€"}
								</span>
							</div>

							{quote ? (
								<>
									<p className="market-card__price" dir="ltr">
										{card.format(quote.price)}
									</p>
									<div
										className={`market-card__change market-card__change--${trend}`}
									>
										<span aria-hidden="true">
											{trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
										</span>
										{quote.change24h === null ? (
											<span>هنوز دادهٔ ۲۴ساعته ثبت نشده</span>
										) : (
											<span>
												{quote.change24h.toLocaleString("fa-AF", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
													signDisplay: "exceptZero",
												})}
												%{" "}
												<span className="market-card__period">
													{card.changePeriod === "daily" ? "روزانه" : "۲۴ ساعت"}
												</span>
											</span>
										)}
									</div>
									<p className="market-card__updated">
										زمان دریافت: {timeFormatter.format(quote.updatedAt)}
									</p>
								</>
							) : (
								<p
									className={`market-card__status${error ? " market-card__status--error" : ""}`}
								>
									{error
										? `دریافت اطلاعات ناموفق بود: ${error}`
										: loading
											? "در حال دریافت آخرین قیمت..."
											: "اطلاعاتی در دسترس نیست."}
								</p>
							)}

							{error && quote && (
								<footer className="market-card__footer">
									<span className="market-card__stale" title={error}>
										به‌روزرسانی ناموفق · نمایش آخرین قیمت
									</span>
								</footer>
							)}
						</article>
					);
				})}
			</div>
			<p className="market-dashboard__note">
				نرخ ارز، نرخ مرجع روزانه است. تغییر ۲۴ساعتهٔ طلا پس از جمع‌آوری قیمت به‌مدت
				یک شبانه‌روز نمایش داده می‌شود.
			</p>
		</section>
	);
}

export default Currency;
