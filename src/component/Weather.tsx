import { useEffect, useState } from "react";
import "../App.css";

type ForecastDay = {
	date: string;
	code: number;
	maxTemperature: number;
	minTemperature: number;
};

type Forecast = {
	days: ForecastDay[];
	updatedAt: Date;
	timeZone: string;
	locationName: string;
	locationWarning: string;
};

const weatherDescriptions: Record<
	number,
	{ description: string; icon: string }
> = {
	0: { description: "آسمان صاف", icon: "☀" },
	1: { description: "تقریباً صاف", icon: "🌤" },
	2: { description: "نیمه‌ابری", icon: "⛅" },
	3: { description: "ابری", icon: "☁" },
	45: { description: "مه‌آلود", icon: "🌫" },
	48: { description: "مه یخ‌زده", icon: "🌫" },
	51: { description: "باران نم‌نم خفیف", icon: "🌦" },
	53: { description: "باران نم‌نم متوسط", icon: "🌦" },
	55: { description: "باران نم‌نم شدید", icon: "🌧" },
	56: { description: "باران یخ‌زده خفیف", icon: "🌧" },
	57: { description: "باران یخ‌زده شدید", icon: "🌧" },
	61: { description: "باران خفیف", icon: "🌦" },
	63: { description: "باران متوسط", icon: "🌧" },
	65: { description: "باران شدید", icon: "🌧" },
	66: { description: "باران یخ‌زده خفیف", icon: "🌧" },
	67: { description: "باران یخ‌زده شدید", icon: "🌧" },
	71: { description: "برف خفیف", icon: "🌨" },
	73: { description: "برف متوسط", icon: "🌨" },
	75: { description: "برف شدید", icon: "❄" },
	77: { description: "دانه‌های برف", icon: "❄" },
	80: { description: "رگبار خفیف", icon: "🌦" },
	81: { description: "رگبار متوسط", icon: "🌧" },
	82: { description: "رگبار شدید", icon: "⛈" },
	85: { description: "رگبار برف خفیف", icon: "🌨" },
	86: { description: "رگبار برف شدید", icon: "❄" },
	95: { description: "رعدوبرق", icon: "⛈" },
	96: { description: "رعدوبرق و تگرگ خفیف", icon: "⛈" },
	99: { description: "رعدوبرق و تگرگ شدید", icon: "⛈" },
};

const temperatureFormatter = new Intl.NumberFormat("fa-AF", {
	maximumFractionDigits: 0,
});

function isNumberArray(value: unknown): value is number[] {
	return (
		Array.isArray(value) &&
		value.every((item) => typeof item === "number" && Number.isFinite(item))
	);
}

function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((item) => typeof item === "string")
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getCurrentPosition() {
	return new Promise<GeolocationPosition>((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error("مرورگر شما از تشخیص موقعیت مکانی پشتیبانی نمی‌کند."));
			return;
		}

		navigator.geolocation.getCurrentPosition(resolve, reject, {
			enableHighAccuracy: false,
			maximumAge: 10 * 60 * 1000,
			timeout: 15_000,
		});
	});
}

function getLocationError(error: unknown) {
	if (!isRecord(error) || typeof error.code !== "number") {
		return error instanceof Error
			? error.message
			: "دریافت موقعیت مکانی ناموفق بود.";
	}

	switch (error.code) {
		case 1:
			return "دسترسی به موقعیت مکانی رد شد. اجازهٔ مکان را در مرورگر فعال کنید.";
		case 2:
			return "موقعیت فعلی شما در دسترس نیست.";
		case 3:
			return "زمان دریافت موقعیت مکانی به پایان رسید. دوباره تلاش کنید.";
		default:
			return "دریافت موقعیت مکانی ناموفق بود.";
	}
}

async function fetchForecast(
	latitude: number,
	longitude: number,
): Promise<Forecast> {
	const params = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
		daily: "weather_code,temperature_2m_max,temperature_2m_min",
		temperature_unit: "celsius",
		timezone: "auto",
		forecast_days: "4",
	});
	const response = await fetch(
		`https://api.open-meteo.com/v1/forecast?${params}`,
	);
	if (!response.ok) {
		throw new Error(`سرویس هواشناسی با خطای HTTP ${response.status} پاسخ داد.`);
	}

	const data: unknown = await response.json();
	if (!isRecord(data) || !isRecord(data.daily)) {
		throw new Error("اطلاعات پیش‌بینی هواشناسی معتبر نیست.");
	}
	const daily = data.daily;
	if (
		!isStringArray(daily.time) ||
		!isNumberArray(daily.weather_code) ||
		!isNumberArray(daily.temperature_2m_max) ||
		!isNumberArray(daily.temperature_2m_min)
	) {
		throw new Error("اطلاعات پیش‌بینی هواشناسی معتبر نیست.");
	}

	const dates = daily.time;
	const weatherCodes = daily.weather_code;
	const maximumTemperatures = daily.temperature_2m_max;
	const minimumTemperatures = daily.temperature_2m_min;
	const length = Math.min(
		4,
		dates.length,
		weatherCodes.length,
		maximumTemperatures.length,
		minimumTemperatures.length,
	);
	if (length < 4) {
		throw new Error("پیش‌بینی چهار روزه از سرویس دریافت نشد.");
	}

	if (typeof data.timezone !== "string" || data.timezone.length === 0) {
		throw new Error("منطقهٔ زمانی موقعیت شما از سرویس دریافت نشد.");
	}

	return {
		days: Array.from({ length }, (_, index) => ({
			date: dates[index],
			code: weatherCodes[index],
			maxTemperature: maximumTemperatures[index],
			minTemperature: minimumTemperatures[index],
		})),
		updatedAt: new Date(),
		timeZone: data.timezone,
		locationName: "",
		locationWarning: "",
	};
}

async function fetchLocationName(latitude: number, longitude: number) {
	const params = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
		localityLanguage: "fa",
	});
	const response = await fetch(
		`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
	);
	if (!response.ok) {
		throw new Error(
			`سرویس تشخیص نام شهر با خطای HTTP ${response.status} پاسخ داد.`,
		);
	}

	const data: unknown = await response.json();
	if (!isRecord(data)) {
		throw new Error("پاسخ سرویس نام شهر معتبر نیست.");
	}

	for (const field of ["city", "locality", "principalSubdivision"]) {
		const name = data[field];
		if (typeof name === "string" && name.trim()) {
			return name.trim();
		}
	}

	throw new Error("نام شهر برای موقعیت فعلی پیدا نشد.");
}

function Weather() {
	const [forecast, setForecast] = useState<Forecast | null>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [retry, setRetry] = useState(0);

	useEffect(() => {
		let active = true;
		const load = async () => {
			setLoading(true);
			setError("");
			let position: GeolocationPosition;
			try {
				position = await getCurrentPosition();
			} catch (locationError) {
				if (active) {
					setError(getLocationError(locationError));
					setLoading(false);
				}
				return;
			}
			if (!active) {
				return;
			}

			try {
				const result = await fetchForecast(
					position.coords.latitude,
					position.coords.longitude,
				);
				const locationResult = await fetchLocationName(
					position.coords.latitude,
					position.coords.longitude,
				).then(
					(locationName) => ({ locationName, error: "" }),
					(locationError: unknown) => ({
						locationName: "",
						error:
							locationError instanceof Error
								? locationError.message
								: "تشخیص نام شهر ناموفق بود.",
					}),
				);
				if (active) {
					setForecast({
						...result,
						locationName: locationResult.locationName,
						locationWarning: locationResult.error,
					});
				}
			} catch (loadError) {
				if (active) {
					setError(
						loadError instanceof Error
							? loadError.message
							: "دریافت وضعیت هوا ناموفق بود.",
					);
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		};

		void load();
		const timer = setInterval(() => void load(), 30 * 60 * 1000);
		return () => {
			active = false;
			clearInterval(timer);
		};
	}, [retry]);

	const locationTimeZone = forecast?.timeZone ?? "UTC";
	const dateFormatter = new Intl.DateTimeFormat("fa-AF", {
		weekday: "long",
		day: "numeric",
		month: "long",
		timeZone: locationTimeZone,
	});
	const updateTimeFormatter = new Intl.DateTimeFormat("fa-AF", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: locationTimeZone,
	});

	return (
		<section
			className="weather-dashboard"
			dir="rtl"
			aria-labelledby="weather-title"
		>
			<header className="weather-dashboard__header">
				<div>
					<p className="weather-dashboard__eyebrow">پیش‌بینی آب‌وهوا</p>
					<h2 id="weather-title">
						{forecast?.locationName || "موقعیت فعلی شما"}
					</h2>
					<p className="weather-dashboard__description">
						پیش‌بینی برای موقعیت فعلی شما · دما بر حسب درجهٔ سانتی‌گراد
					</p>
				</div>
				{forecast && (
					<p className="weather-dashboard__updated" aria-live="polite">
						به‌روزرسانی: {updateTimeFormatter.format(forecast.updatedAt)}
					</p>
				)}
			</header>

			{loading && !forecast && (
				<p className="weather-dashboard__message" role="status">
					در حال دریافت پیش‌بینی هوا...
				</p>
			)}
			{error && (
				<div className="weather-dashboard__error" role="alert">
					<p className="weather-dashboard__message weather-dashboard__message--error">
						{error}
					</p>
					<button
						className="weather-dashboard__retry"
						type="button"
						disabled={loading}
						onClick={() => setRetry((previous) => previous + 1)}
					>
						{loading ? "در حال تلاش..." : "تلاش دوباره"}
					</button>
				</div>
			)}
			{forecast && (
				<>
					{forecast.locationWarning && (
						<p className="weather-dashboard__location-warning" role="status">
							{forecast.locationWarning}
						</p>
					)}
					<div className="weather-dashboard__grid">
						{forecast.days.map((day, index) => {
							const conditions = weatherDescriptions[day.code] ?? {
								description: "وضعیت نامشخص",
								icon: "☁",
							};
							const date = new Date(`${day.date}T12:00:00Z`);

							return (
								<article className="weather-card" key={day.date}>
									<p className="weather-card__date">
										{index === 0 ? "امروز" : dateFormatter.format(date)}
									</p>
									<span className="weather-card__icon" aria-hidden="true">
										{conditions.icon}
									</span>
									<p className="weather-card__condition">
										{conditions.description}
									</p>
									<div className="weather-card__temperatures">
										<p className="weather-card__temperature">
											<span className="weather-card__temperature-label">
												بالاترین
											</span>
											<span aria-label="بالاترین دما">
												{temperatureFormatter.format(day.maxTemperature)}°C
											</span>
										</p>
										<p className="weather-card__temperature weather-card__temperature--low">
											<span className="weather-card__temperature-label">
												پایین‌ترین
											</span>
											<span aria-label="پایین‌ترین دما">
												{temperatureFormatter.format(day.minTemperature)}°C
											</span>
										</p>
									</div>
								</article>
							);
						})}
					</div>
				</>
			)}
		</section>
	);
}

export default Weather;
