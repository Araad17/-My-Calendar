import { useEffect, useState } from "react";
import "../App.css";

const afghanistanGregorianFormatter = new Intl.DateTimeFormat("en-US", {
	calendar: "gregory",
	day: "numeric",
	month: "numeric",
	timeZone: "Asia/Kabul",
	year: "numeric",
});

const calendars = [
	{ id: "gregorian", title: "میلادی", calendar: "gregory" },
	{ id: "solar-hijri", title: "هجری شمسی", calendar: "persian" },
	{ id: "lunar-hijri", title: "هجری قمری", calendar: "islamic-umalqura" },
] as const;

const calendarFormatters = calendars.map(({ calendar, ...details }) => ({
	...details,
	date: new Intl.DateTimeFormat("en-US", {
		calendar,
		day: "numeric",
		month: "numeric",
		timeZone: "Asia/Kabul",
		year: "numeric",
	}),
	month: new Intl.DateTimeFormat("fa-AF", {
		calendar,
		month: "long",
		timeZone: "Asia/Kabul",
	}),
}));

const calendarDayFormatter = new Intl.NumberFormat("fa-AF", {
	useGrouping: false,
});

const weekdayFormatter = new Intl.DateTimeFormat("fa-AF", {
	timeZone: "Asia/Kabul",
	weekday: "short",
});

type CalendarDay = { date: Date; day: number; weekday: number };

type CalendarView = {
	date: { day: string; month: string; year: string };
	monthName: string;
	days: CalendarDay[];
	firstWeekday: number;
	today: number;
};

function getPart(
	parts: Intl.DateTimeFormatPart[],
	type: Intl.DateTimeFormatPartTypes,
) {
	const part = parts.find((item) => item.type === type);
	if (!part) {
		throw new Error(`Missing ${type} part in calendar date`);
	}
	return part.value;
}

function getMonthDays(now: Date, dateFormatter: Intl.DateTimeFormat) {
	// 1. دریافت تاریخ میلادی امروز بر اساس ساعت افغانستان
	const gregorianParts = afghanistanGregorianFormatter.formatToParts(now);

	const year = Number(getPart(gregorianParts, "year"));
	const month = Number(getPart(gregorianParts, "month"));
	const day = Number(getPart(gregorianParts, "day"));

	// 2. ساخت تاریخ مرجع در ساعت 12 ظهر UTC
	// این تاریخ معادل همان روز تقویمی در کابل است.
	const currentDate = new Date(Date.UTC(year, month - 1, day, 12));

	// 3. استخراج سال، ماه و روز در تقویم انتخاب‌شده
	const currentParts = dateFormatter.formatToParts(currentDate);

	const calendarYear = getPart(currentParts, "year");
	const calendarMonth = getPart(currentParts, "month");
	const calendarDay = Number(getPart(currentParts, "day"));

	// 4. تابع بررسی تعلق تاریخ به ماه و سال فعلی
	const isSameMonth = (date: Date) => {
		const parts = dateFormatter.formatToParts(date);

		return (
			getPart(parts, "year") === calendarYear &&
			getPart(parts, "month") === calendarMonth
		);
	};

	const DAY_MS = 24 * 60 * 60 * 1000;

	// 5. پیدا کردن اولین روز ماه با حرکت به عقب
	const firstDay = new Date(currentDate);

	for (let offset = 0; offset < 31; offset += 1) {
		const previousDay = new Date(firstDay.getTime() - DAY_MS);

		if (!isSameMonth(previousDay)) {
			break;
		}

		firstDay.setTime(previousDay.getTime());
	}

	// 6. استخراج تمام روزهای ماه
	const days: CalendarDay[] = [];

	for (let offset = 0; offset < 32; offset += 1) {
		const date = new Date(firstDay.getTime() + offset * DAY_MS);

		if (!isSameMonth(date)) {
			break;
		}

		const parts = dateFormatter.formatToParts(date);

		const dayNumber = Number(getPart(parts, "day"));

		days.push({
			date,
			day: dayNumber,

			// ترتیب هفته از شنبه شروع می‌شود
			// شنبه = 0، یکشنبه = 1، ... جمعه = 6
			weekday: (date.getUTCDay() + 1) % 7,
		});
	}

	// 7. برگرداندن اطلاعات ماه
	return {
		days,
		firstWeekday: days[0]?.weekday ?? 0,
		today: calendarDay,
	};
}

function getStandardCalendarView(
	now: Date,
	dateFormatter: Intl.DateTimeFormat,
	monthFormatter: Intl.DateTimeFormat,
): CalendarView {
	const parts = dateFormatter.formatToParts(now);
	return {
		date: {
			day: getPart(parts, "day"),
			month: getPart(parts, "month"),
			year: getPart(parts, "year"),
		},
		monthName: monthFormatter.format(now),
		...getMonthDays(now, dateFormatter),
	};
}

const weekdays = Array.from({ length: 7 }, (_, index) => {
	const saturday = Date.UTC(2024, 0, 6 + index, 12);
	return weekdayFormatter.format(new Date(saturday));
});

function LiveDate() {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(timer);
	}, []);

	return (
		<section className="calendar-group" dir="rtl" aria-label="تقویم‌های امروز">
			<h2 className="calendar-group__title">تاریخ امروز</h2>
			<div className="calendar-group__grid">
				{calendarFormatters.map(({ id, title, date, month }) => {
					const view = getStandardCalendarView(now, date, month);

					return (
						<fieldset className="calendar-card" key={id}>
							<legend className="calendar-card__title">{title}</legend>
							<div className="calendar-card__header">
								<div className="calendar-card__month-name">
									{view.monthName}
								</div>
								<time className="calendar-card__date" dir="rtl">
									<span dir="ltr">{view.date.day}</span>
									<span aria-hidden="true">/</span>
									<span dir="ltr">{view.date.month}</span>
									<span aria-hidden="true">/</span>
									<span dir="ltr">{view.date.year}</span>
								</time>
							</div>
							<div
								className="calendar-card__grid"
								role="grid"
								aria-label={`تقویم ${title}`}
							>
								{weekdays.map((weekday, index) => (
									<div
										className="calendar-card__weekday"
										key={`${weekday}-${index}`}
										role="columnheader"
									>
										{weekday}
									</div>
								))}
								{Array.from({ length: view.firstWeekday }, (_, index) => (
									<div
										className="calendar-card__empty"
										key={`empty-${index}`}
										role="gridcell"
										aria-hidden="true"
									/>
								))}
								{view.days.map(({ date: dayDate, day, weekday }) => (
									<time
										className={`calendar-card__day${day === view.today ? " calendar-card__day--today" : ""}`}
										dateTime={dayDate.toISOString()}
										key={`${weekday}-${day}`}
										role="gridcell"
										aria-current={day === view.today ? "date" : undefined}
										aria-label={`${weekdays[weekday]} ${calendarDayFormatter.format(day)}`}
									>
										{calendarDayFormatter.format(day)}
									</time>
								))}
							</div>
						</fieldset>
					);
				})}
			</div>
		</section>
	);
}

export default LiveDate;
