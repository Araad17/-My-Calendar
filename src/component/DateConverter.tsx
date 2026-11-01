import { useState, type FormEvent } from "react";
import "../App.css";

const calendars = [
	{
		id: "gregorian",
		title: "میلادی",
		intlCalendar: "gregory",
		estimateGregorianYear: (year: number) => year,
	},
	{
		id: "solar-hijri",
		title: "هجری شمسی",
		intlCalendar: "persian",
		estimateGregorianYear: (year: number) => year + 621,
	},
	{
		id: "lunar-hijri",
		title: "هجری قمری",
		intlCalendar: "islamic-umalqura",
		estimateGregorianYear: (year: number) =>
			Math.floor(622 + ((year - 1) * 354.367) / 365.2425),
	},
] as const;

type CalendarId = (typeof calendars)[number]["id"];

function isCalendarId(value: string): value is CalendarId {
	return calendars.some(({ id }) => id === value);
}

const dateFormatters = calendars.map(({ id, intlCalendar }) => ({
	id,
	date: new Intl.DateTimeFormat("en-US-u-nu-latn", {
		calendar: intlCalendar,
		day: "numeric",
		month: "numeric",
		timeZone: "UTC",
		year: "numeric",
	}),
	display: new Intl.DateTimeFormat("fa-AF", {
		calendar: intlCalendar,
		day: "numeric",
		month: "long",
		timeZone: "UTC",
		year: "numeric",
	}),
}));

function getPart(
	parts: Intl.DateTimeFormatPart[],
	type: Intl.DateTimeFormatPartTypes,
) {
	const part = parts.find((item) => item.type === type);
	if (!part) {
		throw new Error(`Missing ${type} part in converted date`);
	}
	return part.value;
}

function makeUtcDate(year: number, month: number, day: number) {
	const date = new Date(0);
	date.setUTCHours(12, 0, 0, 0);
	date.setUTCFullYear(year, month, day);
	return date;
}

function convertDate(
	calendarId: CalendarId,
	year: number,
	month: number,
	day: number,
) {
	const calendar = calendars.find(({ id }) => id === calendarId);
	const formatter = dateFormatters.find(({ id }) => id === calendarId)?.date;
	if (!calendar || !formatter) {
		throw new Error(`Unsupported calendar: ${calendarId}`);
	}

	const approximateGregorianYear = calendar.estimateGregorianYear(year);
	const firstDate = makeUtcDate(approximateGregorianYear - 3, 0, 1);
	const lastDate = makeUtcDate(approximateGregorianYear + 4, 0, 1);

	for (
		const date = new Date(firstDate);
		date < lastDate;
		date.setUTCDate(date.getUTCDate() + 1)
	) {
		const parts = formatter.formatToParts(date);
		if (
			Number(getPart(parts, "year")) === year &&
			Number(getPart(parts, "month")) === month &&
			Number(getPart(parts, "day")) === day
		) {
			return date;
		}
	}

	return null;
}

function DateConverter() {
	const [sourceCalendar, setSourceCalendar] =
		useState<CalendarId>("solar-hijri");
	const [targetCalendar, setTargetCalendar] = useState<CalendarId>("gregorian");
	const [year, setYear] = useState("");
	const [month, setMonth] = useState("");
	const [day, setDay] = useState("");
	const [convertedDate, setConvertedDate] = useState<Date | null>(null);
	const [error, setError] = useState("");

	const clearResult = () => {
		setConvertedDate(null);
		setError("");
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		clearResult();

		const numericYear = Number(year);
		const numericMonth = Number(month);
		const numericDay = Number(day);
		if (
			!Number.isInteger(numericYear) ||
			numericYear < 1 ||
			numericYear > 9999 ||
			!Number.isInteger(numericMonth) ||
			numericMonth < 1 ||
			numericMonth > 12 ||
			!Number.isInteger(numericDay) ||
			numericDay < 1 ||
			numericDay > 31
		) {
			setError("لطفاً تاریخ معتبر را وارد کنید.");
			return;
		}

		const result = convertDate(
			sourceCalendar,
			numericYear,
			numericMonth,
			numericDay,
		);
		if (!result) {
			setError("این تاریخ در تقویم انتخاب‌شده وجود ندارد.");
			return;
		}

		setConvertedDate(result);
	};

	const resultFormatter = dateFormatters.find(
		({ id }) => id === targetCalendar,
	)?.display;
	const targetTitle = calendars.find(({ id }) => id === targetCalendar)?.title;

	return (
		<section
			className="date-converter"
			dir="rtl"
			aria-labelledby="date-converter-title"
		>
			<h2 className="date-converter__title" id="date-converter-title">
				مبدل تاریخ شمسی-میلادی-هجری
			</h2>
			<form className="date-converter__form" onSubmit={handleSubmit}>
				<div className="date-converter__calendars">
					<label className="date-converter__field">
						<span className="date-converter__sr-only">تقویم مبدا</span>
						<select
							aria-label="تقویم مبدا"
							value={sourceCalendar}
							onChange={(event) => {
								if (isCalendarId(event.target.value)) {
									setSourceCalendar(event.target.value);
									clearResult();
								}
							}}
						>
							{calendars.map(({ id, title }) => (
								<option key={id} value={id}>
									{title}
								</option>
							))}
						</select>
					</label>
					<label className="date-converter__field">
						<span className="date-converter__sr-only">تقویم مقصد</span>
						<select
							aria-label="تقویم مقصد"
							value={targetCalendar}
							onChange={(event) => {
								if (isCalendarId(event.target.value)) {
									setTargetCalendar(event.target.value);
									clearResult();
								}
							}}
						>
							{calendars.map(({ id, title }) => (
								<option key={id} value={id}>
									{title}
								</option>
							))}
						</select>
					</label>
				</div>
				<div className="date-converter__date-fields">
					<label className="date-converter__field">
						<span className="date-converter__sr-only">سال</span>
						<input
							aria-label="سال"
							placeholder="سال"
							type="number"
							min="1"
							max="9999"
							required
							value={year}
							onChange={(event) => {
								setYear(event.target.value);
								clearResult();
							}}
						/>
					</label>
					<label className="date-converter__field">
						<span className="date-converter__sr-only">ماه</span>
						<input
							aria-label="ماه"
							placeholder="ماه"
							type="number"
							min="1"
							max="12"
							required
							value={month}
							onChange={(event) => {
								setMonth(event.target.value);
								clearResult();
							}}
						/>
					</label>
					<label className="date-converter__field">
						<span className="date-converter__sr-only">روز</span>
						<input
							aria-label="روز"
							placeholder="روز"
							type="number"
							min="1"
							max="31"
							required
							value={day}
							onChange={(event) => {
								setDay(event.target.value);
								clearResult();
							}}
						/>
					</label>
				</div>
				<button className="date-converter__submit" type="submit">
					تبدیل
				</button>
			</form>
			<div className="date-converter__output" aria-live="polite">
				{error && (
					<p className="date-converter__error" role="alert">
						{error}
					</p>
				)}
				{convertedDate && resultFormatter && (
					<p className="date-converter__result">
						{targetTitle}:{" "}
						<time dateTime={convertedDate.toISOString()}>
							{resultFormatter.format(convertedDate)}
						</time>
					</p>
				)}
			</div>
		</section>
	);
}

export default DateConverter;
