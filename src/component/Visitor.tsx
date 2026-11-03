import { useEffect, useState } from "react";

function Visitor() {
	const [count, setCount] = useState<number | null>(null);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		const countVisit = async () => {
			try {
				const response = await fetch("/api/visitor", { method: "POST" });
				if (!response.ok) {
					throw new Error(`Visitor API returned ${response.status}`);
				}

				const result: unknown = await response.json();
				if (
					typeof result !== "object" ||
					result === null ||
					!("count" in result) ||
					typeof result.count !== "number" ||
					!Number.isSafeInteger(result.count) ||
					result.count < 0
				) {
					throw new Error("Visitor API returned an invalid count");
				}

				setCount(result.count);
			} catch (error) {
				console.error("Unable to load visitor count", error);
				setHasError(true);
			}
		};

		void countVisit();
	}, []);

	const label = "تعداد بازدیدکنندگان سایت تقویم من";
	const formattedCount =
		count === null
			? hasError
				? "—"
				: "…"
			: new Intl.NumberFormat("fa-AF").format(count);

	return (
		<span
			className="site-header__visitor"
			role="img"
			aria-label={
				hasError
					? `${label}: شمارنده در دسترس نیست`
					: `${label}: ${formattedCount}`
			}
			title={hasError ? `${label} (در دسترس نیست)` : label}
		>
			<svg
				aria-hidden="true"
				focusable="false"
				viewBox="0 0 24 24"
				className="site-header__visitor-icon"
			>
				<path d="M12 5c-5.2 0-9.3 4.1-10.8 6.2a1.3 1.3 0 0 0 0 1.6C2.7 14.9 6.8 19 12 19s9.3-4.1 10.8-6.2a1.3 1.3 0 0 0 0-1.6C21.3 9.1 17.2 5 12 5Zm0 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
			</svg>
			<span aria-hidden="true">{formattedCount}</span>
		</span>
	);
}

export default Visitor;
