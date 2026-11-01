import { useState, useEffect } from "react";
import "../App.css";

const afghanistanTimeFormatter = new Intl.DateTimeFormat("en-GB", {
	timeZone: "Asia/Kabul",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hourCycle: "h23",
});

function getTimePart(
	parts: Intl.DateTimeFormatPart[],
	type: Intl.DateTimeFormatPartTypes,
) {
	const part = parts.find((item) => item.type === type);
	if (!part) {
		throw new Error(`Missing ${type} part in Afghanistan time`);
	}
	return part.value;
}

function LiveTimeDate() {
	const [time, setTime] = useState(() => new Date());
	const timeParts = afghanistanTimeFormatter.formatToParts(time);
	const hours = getTimePart(timeParts, "hour");
	const isAm = Number(hours) < 12;

	useEffect(() => {
		const timer = setInterval(() => {
			setTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	return (
		<div
			className="digital-clock mt-5"
			role="timer"
			aria-label="Afghanistan local time"
		>
			<div className="digital-clock__display">
				<div className="digital-clock__time">
					<span>{hours}</span>
					<span className="digital-clock__separator">:</span>
					<span>{getTimePart(timeParts, "minute")}</span>
					<span className="digital-clock__separator">:</span>
					<span>{getTimePart(timeParts, "second")}</span>
				</div>
				<div className="digital-clock__meta">
					<span className="font-morvarid">افغانستان</span>
					<span className="digital-clock__period">{isAm ? "ق ظ" : "ب ظ"}</span>
				</div>
			</div>
		</div>
	);
}

export default LiveTimeDate;
