import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";
import { useEffect, useState } from "react";
import "../App.css";

type PrayerLocation = {
	name: string;
	country: string;
	latitude: number;
	longitude: number;
	timeZone: string;
};

type PrayerTime = {
	name: string;
	time: string;
	period: string;
};

type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

type PrayerDefinition = {
	key: PrayerKey;
	name: string;
};

const afghanCapitals: PrayerLocation[] = [
	{
		name: "کابل",
		country: "افغانستان",
		latitude: 34.5553,
		longitude: 69.2075,
		timeZone: "Asia/Kabul",
	},
	{
		name: "تیرانا",
		country: "آلبانی",
		latitude: 41.3275,
		longitude: 19.8187,
		timeZone: "Europe/Tirane",
	},
	{
		name: "الجزیره",
		country: "الجزایر",
		latitude: 36.7538,
		longitude: 3.0588,
		timeZone: "Africa/Algiers",
	},
	{
		name: "باکو",
		country: "آذربایجان",
		latitude: 40.4093,
		longitude: 49.8671,
		timeZone: "Asia/Baku",
	},
	{
		name: "منامه",
		country: "بحرین",
		latitude: 26.2285,
		longitude: 50.586,
		timeZone: "Asia/Bahrain",
	},
	{
		name: "داکا",
		country: "بنگلادش",
		latitude: 23.8103,
		longitude: 90.4125,
		timeZone: "Asia/Dhaka",
	},
	{
		name: "پورتو نوو",
		country: "بنین",
		latitude: 6.4969,
		longitude: 2.6289,
		timeZone: "Africa/Porto-Novo",
	},
	{
		name: "بندر سری بگاوان",
		country: "برونئی",
		latitude: 4.9031,
		longitude: 114.9398,
		timeZone: "Asia/Brunei",
	},
	{
		name: "واگادوگو",
		country: "بورکینافاسو",
		latitude: 12.3714,
		longitude: -1.5197,
		timeZone: "Africa/Ouagadougou",
	},
	{
		name: "یائونده",
		country: "کامرون",
		latitude: 3.848,
		longitude: 11.5021,
		timeZone: "Africa/Douala",
	},
	{
		name: "انجامنا",
		country: "چاد",
		latitude: 12.1348,
		longitude: 15.0557,
		timeZone: "Africa/Ndjamena",
	},
	{
		name: "مورونی",
		country: "اتحاد قمر",
		latitude: -11.7172,
		longitude: 43.2473,
		timeZone: "Indian/Comoro",
	},
	{
		name: "یاموسوکرو",
		country: "ساحل عاج",
		latitude: 6.8276,
		longitude: -5.2893,
		timeZone: "Africa/Abidjan",
	},
	{
		name: "جیبوتی",
		country: "جیبوتی",
		latitude: 11.5721,
		longitude: 43.1456,
		timeZone: "Africa/Djibouti",
	},
	{
		name: "قاهره",
		country: "مصر",
		latitude: 30.0444,
		longitude: 31.2357,
		timeZone: "Africa/Cairo",
	},
	{
		name: "لیبرویل",
		country: "گابن",
		latitude: 0.4162,
		longitude: 9.4673,
		timeZone: "Africa/Libreville",
	},
	{
		name: "بانجول",
		country: "گامبیا",
		latitude: 13.4549,
		longitude: -16.579,
		timeZone: "Africa/Banjul",
	},
	{
		name: "کوناکری",
		country: "گینه",
		latitude: 9.6412,
		longitude: -13.5784,
		timeZone: "Africa/Conakry",
	},
	{
		name: "بیسائو",
		country: "گینه بیسائو",
		latitude: 11.8817,
		longitude: -15.6178,
		timeZone: "Africa/Bissau",
	},
	{
		name: "جورج‌تاون",
		country: "گویان",
		latitude: 6.8013,
		longitude: -58.1551,
		timeZone: "America/Guyana",
	},
	{
		name: "جاکارتا",
		country: "اندونزی",
		latitude: -6.2088,
		longitude: 106.8456,
		timeZone: "Asia/Jakarta",
	},
	{
		name: "تهران",
		country: "ایران",
		latitude: 35.6892,
		longitude: 51.389,
		timeZone: "Asia/Tehran",
	},
	{
		name: "بغداد",
		country: "عراق",
		latitude: 33.3152,
		longitude: 44.3661,
		timeZone: "Asia/Baghdad",
	},
	{
		name: "امان",
		country: "اردن",
		latitude: 31.9539,
		longitude: 35.9106,
		timeZone: "Asia/Amman",
	},
	{
		name: "آستانه",
		country: "قزاقستان",
		latitude: 51.1694,
		longitude: 71.4491,
		timeZone: "Asia/Almaty",
	},
	{
		name: "کویت",
		country: "کویت",
		latitude: 29.3759,
		longitude: 47.9774,
		timeZone: "Asia/Kuwait",
	},
	{
		name: "بیشکک",
		country: "قرقیزستان",
		latitude: 42.8746,
		longitude: 74.5698,
		timeZone: "Asia/Bishkek",
	},
	{
		name: "بیروت",
		country: "لبنان",
		latitude: 33.8938,
		longitude: 35.5018,
		timeZone: "Asia/Beirut",
	},
	{
		name: "طرابلس",
		country: "لیبی",
		latitude: 32.8872,
		longitude: 13.1913,
		timeZone: "Africa/Tripoli",
	},
	{
		name: "کوالالامپور",
		country: "مالزی",
		latitude: 3.139,
		longitude: 101.6869,
		timeZone: "Asia/Kuala_Lumpur",
	},
	{
		name: "ماله",
		country: "مالدیو",
		latitude: 4.1755,
		longitude: 73.5093,
		timeZone: "Indian/Maldives",
	},
	{
		name: "باماکو",
		country: "مالی",
		latitude: 12.6392,
		longitude: -8.0029,
		timeZone: "Africa/Bamako",
	},
	{
		name: "نواکشوت",
		country: "موریتانی",
		latitude: 18.0735,
		longitude: -15.9582,
		timeZone: "Africa/Nouakchott",
	},
	{
		name: "رباط",
		country: "مراکش",
		latitude: 34.0209,
		longitude: -6.8416,
		timeZone: "Africa/Casablanca",
	},
	{
		name: "ماپوتو",
		country: "موزامبیک",
		latitude: -25.9692,
		longitude: 32.5732,
		timeZone: "Africa/Maputo",
	},
	{
		name: "نیامی",
		country: "نیجر",
		latitude: 13.5116,
		longitude: 2.1254,
		timeZone: "Africa/Niamey",
	},
	{
		name: "ابوجا",
		country: "نیجریه",
		latitude: 9.0765,
		longitude: 7.3986,
		timeZone: "Africa/Lagos",
	},
	{
		name: "مسقط",
		country: "عمان",
		latitude: 23.588,
		longitude: 58.3829,
		timeZone: "Asia/Muscat",
	},
	{
		name: "اسلام‌آباد",
		country: "پاکستان",
		latitude: 33.6844,
		longitude: 73.0479,
		timeZone: "Asia/Karachi",
	},
	{
		name: "بیت‌المقدس شرقی",
		country: "فلسطین",
		latitude: 31.7683,
		longitude: 35.2137,
		timeZone: "Asia/Hebron",
	},
	{
		name: "دوحه",
		country: "قطر",
		latitude: 25.2854,
		longitude: 51.531,
		timeZone: "Asia/Qatar",
	},
	{
		name: "ریاض",
		country: "عربستان سعودی",
		latitude: 24.7136,
		longitude: 46.6753,
		timeZone: "Asia/Riyadh",
	},
	{
		name: "داکار",
		country: "سنگال",
		latitude: 14.7167,
		longitude: -17.4677,
		timeZone: "Africa/Dakar",
	},
	{
		name: "فری‌تاون",
		country: "سیرالئون",
		latitude: 8.4657,
		longitude: -13.2317,
		timeZone: "Africa/Freetown",
	},
	{
		name: "موگادیشو",
		country: "سومالی",
		latitude: 2.0469,
		longitude: 45.3182,
		timeZone: "Africa/Mogadishu",
	},
	{
		name: "خارطوم",
		country: "سودان",
		latitude: 15.5007,
		longitude: 32.5599,
		timeZone: "Africa/Khartoum",
	},
	{
		name: "پاراماریبو",
		country: "سورینام",
		latitude: 5.852,
		longitude: -55.2038,
		timeZone: "America/Paramaribo",
	},
	{
		name: "دمشق",
		country: "سوریه",
		latitude: 33.5138,
		longitude: 36.2765,
		timeZone: "Asia/Damascus",
	},
	{
		name: "دوشنبه",
		country: "تاجیکستان",
		latitude: 38.5598,
		longitude: 68.787,
		timeZone: "Asia/Dushanbe",
	},
	{
		name: "لومه",
		country: "توگو",
		latitude: 6.1725,
		longitude: 1.2314,
		timeZone: "Africa/Lome",
	},
	{
		name: "تونس",
		country: "تونس",
		latitude: 36.8065,
		longitude: 10.1815,
		timeZone: "Africa/Tunis",
	},
	{
		name: "آنکارا",
		country: "ترکیه",
		latitude: 39.9334,
		longitude: 32.8597,
		timeZone: "Europe/Istanbul",
	},
	{
		name: "عشق‌آباد",
		country: "ترکمنستان",
		latitude: 37.9601,
		longitude: 58.3261,
		timeZone: "Asia/Ashgabat",
	},
	{
		name: "کامپالا",
		country: "اوگاندا",
		latitude: 0.3476,
		longitude: 32.5825,
		timeZone: "Africa/Kampala",
	},
	{
		name: "ابوظبی",
		country: "امارات متحده عربی",
		latitude: 24.4539,
		longitude: 54.3773,
		timeZone: "Asia/Dubai",
	},
	{
		name: "تاشکند",
		country: "ازبکستان",
		latitude: 41.2995,
		longitude: 69.2401,
		timeZone: "Asia/Tashkent",
	},
	{
		name: "صنعا",
		country: "یمن",
		latitude: 15.3694,
		longitude: 44.191,
		timeZone: "Asia/Aden",
	},
];

const otherAfghanCities: PrayerLocation[] = [
	{
		name: "هرات",
		country: "افغانستان",
		latitude: 34.3529,
		longitude: 62.204,
		timeZone: "Asia/Kabul",
	},
	{
		name: "قندهار",
		country: "افغانستان",
		latitude: 31.6289,
		longitude: 65.7372,
		timeZone: "Asia/Kabul",
	},
	{
		name: "مزارشریف",
		country: "افغانستان",
		latitude: 36.7069,
		longitude: 67.1101,
		timeZone: "Asia/Kabul",
	},
	{
		name: "جلال‌آباد",
		country: "افغانستان",
		latitude: 34.4342,
		longitude: 70.4478,
		timeZone: "Asia/Kabul",
	},
	{
		name: "کندز",
		country: "افغانستان",
		latitude: 36.728,
		longitude: 68.8681,
		timeZone: "Asia/Kabul",
	},
	{
		name: "غزنی",
		country: "افغانستان",
		latitude: 33.5539,
		longitude: 68.4209,
		timeZone: "Asia/Kabul",
	},
	{
		name: "بامیان",
		country: "افغانستان",
		latitude: 34.8216,
		longitude: 67.8273,
		timeZone: "Asia/Kabul",
	},
];

const prayerDefinitions = [
	{ key: "fajr", name: "اذان صبح" },
	{ key: "sunrise", name: "طلوع آفتاب" },
	{ key: "dhuhr", name: "اذان ظهر" },
	{ key: "asr", name: "اذان عصر" },
	{ key: "maghrib", name: "اذان مغرب" },
	{ key: "isha", name: "اذان خفتن" },
] satisfies readonly PrayerDefinition[];

const timeFormatter = new Intl.NumberFormat("fa-AF", {
	minimumIntegerDigits: 2,
	useGrouping: false,
});

function getLocalDate(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-US", {
		calendar: "gregory",
		day: "numeric",
		month: "numeric",
		timeZone,
		year: "numeric",
	}).formatToParts(date);
	const getPart = (type: Intl.DateTimeFormatPartTypes) => {
		const part = parts.find((item) => item.type === type);
		if (!part) {
			throw new Error("تاریخ محلی شهر انتخاب‌شده دریافت نشد.");
		}
		return Number(part.value);
	};
	return new Date(getPart("year"), getPart("month") - 1, getPart("day"));
}

function calculatePrayerTimes(location: PrayerLocation, date: Date) {
	const coordinates = new Coordinates(location.latitude, location.longitude);
	const parameters = CalculationMethod.MuslimWorldLeague();
	parameters.madhab = Madhab.Hanafi;
	const prayerTimes = new PrayerTimes(
		coordinates,
		getLocalDate(date, location.timeZone),
		parameters,
	);
	const localTimeFormatter = new Intl.DateTimeFormat("en-US", {
		timeZone: location.timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	});

	return prayerDefinitions.map(({ key, name }) => {
		const prayerDate = prayerTimes[key];
		if (Number.isNaN(prayerDate.getTime())) {
			throw new Error(`محاسبهٔ ${name} برای این موقعیت ممکن نشد.`);
		}
		const parts = localTimeFormatter.formatToParts(prayerDate);
		const hour = Number(parts.find((part) => part.type === "hour")?.value);
		const minute = Number(parts.find((part) => part.type === "minute")?.value);
		if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
			throw new Error(`زمان ${name} برای این موقعیت معتبر نیست.`);
		}
		return {
			name,
			time: `${timeFormatter.format(hour % 12 || 12)}:${timeFormatter.format(minute)}`,
			period: hour < 12 ? "قبل‌ازظهر" : "بعدازظهر",
		};
	});
}

function Azan() {
	const [location, setLocation] = useState(afghanCapitals[0]);
	const [prayerTimes, setPrayerTimes] = useState<PrayerTime[] | null>(null);
	const [currentDate, setCurrentDate] = useState(() => new Date());
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [retry, setRetry] = useState(0);

	useEffect(() => {
		let active = true;
		const loadPrayerTimes = () => {
			const requestDate = new Date();
			setCurrentDate(requestDate);
			setLoading(true);
			setError("");
			setPrayerTimes(null);
			try {
				const result = calculatePrayerTimes(location, requestDate);
				if (active) {
					setPrayerTimes(result);
				}
			} catch (loadError) {
				if (active) {
					setError(
						loadError instanceof Error
							? loadError.message
							: "محاسبهٔ اوقات شرعی ناموفق بود.",
					);
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		};

		loadPrayerTimes();
		const timer = setInterval(() => void loadPrayerTimes(), 6 * 60 * 60 * 1000);
		return () => {
			active = false;
			clearInterval(timer);
		};
	}, [location, retry]);

	const dateFormatter = new Intl.DateTimeFormat("fa-AF", {
		calendar: "gregory",
		day: "numeric",
		month: "long",
		timeZone: location.timeZone,
		year: "numeric",
	});
	const updateTimeFormatter = new Intl.DateTimeFormat("fa-AF", {
		timeZone: location.timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h12",
	});

	return (
		<section
			id="azan"
			className="azan-dashboard"
			dir="rtl"
			aria-labelledby="azan-title"
		>
			<header className="azan-dashboard__header">
				<div>
					<p className="azan-dashboard__eyebrow">
						اوقات شرعی پایتخت‌های کشورهای عضو سازمان همکاری اسلامی
					</p>
					<h2 id="azan-title">اوقات نماز</h2>
					<p className="azan-dashboard__description">
						{location.name}، {location.country} ·{" "}
						{dateFormatter.format(currentDate)}
					</p>
				</div>
				<label className="azan-dashboard__city">
					<span>انتخاب شهر</span>
					<select
						value={`${location.country}-${location.name}`}
						onChange={(event) => {
							const selectedLocation = [
								...afghanCapitals,
								...otherAfghanCities,
							].find(
								(item) => `${item.country}-${item.name}` === event.target.value,
							);
							if (selectedLocation) {
								setLocation(selectedLocation);
							}
						}}
					>
						<optgroup label="پایتخت کشورهای عضو سازمان همکاری اسلامی">
							{afghanCapitals.map((item) => (
								<option
									key={`${item.country}-${item.name}`}
									value={`${item.country}-${item.name}`}
								>
									{item.name} — {item.country}
								</option>
							))}
						</optgroup>
						<optgroup label="شهرهای دیگر افغانستان">
							{otherAfghanCities.map((item) => (
								<option
									key={`${item.country}-${item.name}`}
									value={`${item.country}-${item.name}`}
								>
									{item.name} — {item.country}
								</option>
							))}
						</optgroup>
					</select>
				</label>
			</header>

			{loading && !prayerTimes && (
				<p className="azan-dashboard__message" role="status">
					در حال دریافت اوقات شرعی...
				</p>
			)}
			{error && (
				<div className="azan-dashboard__error" role="alert">
					<p className="azan-dashboard__message azan-dashboard__message--error">
						{error}
					</p>
					<button
						className="azan-dashboard__retry"
						type="button"
						disabled={loading}
						onClick={() => setRetry((previous) => previous + 1)}
					>
						{loading ? "در حال تلاش..." : "تلاش دوباره"}
					</button>
				</div>
			)}
			{prayerTimes && (
				<div className="azan-dashboard__grid">
					{prayerTimes.map((prayer) => (
						<article className="azan-card" key={prayer.name}>
							<span className="azan-card__icon" aria-hidden="true">
								☾
							</span>
							<h3>{prayer.name}</h3>
							<time className="azan-card__time" dir="ltr">
								{prayer.time}{" "}
								<span className="azan-card__period" dir="rtl">
									{prayer.period}
								</span>
							</time>
						</article>
					))}
				</div>
			)}

			<p className="azan-dashboard__note">
				اوقات با کتابخانهٔ Adhan، روش محاسباتی MWL و فقه حنفی محاسبه می‌شود؛ برای
				افغانستان ساعت جهانی UTC+4:30 اعمال شده است و ممکن است با تقویم مسجد محل
				اندکی تفاوت داشته باشد.
				{prayerTimes && (
					<span> · به‌روزرسانی: {updateTimeFormatter.format(currentDate)}</span>
				)}
			</p>
		</section>
	);
}

export default Azan;
