import { useEffect, useRef, useState } from "react";
import "./App.css";
import LiveTimeDate from "./component/LiveTimeDate";
import LiveDate from "./component/LiveDate";
import DateConverter from "./component/DateConverter";
import Currency from "./component/Currency";
import Weather from "./component/Weather";
import Azan from "./component/Azan";

type ContactIconName =
	| "website"
	| "linkedin"
	| "email"
	| "github"
	| "telegram"
	| "copy";

function ContactIcon({ name }: { name: ContactIconName }) {
	const paths: Record<ContactIconName, string> = {
		website:
			"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3.1a15.7 15.7 0 0 0-1.4-6 8 8 0 0 1 4.5 6ZM12 4c1.1 1.6 1.8 4.1 1.9 7h-3.8c.1-2.9.8-5.4 1.9-7ZM4.1 13h3.1c.2 2.3.7 4.4 1.4 6a8 8 0 0 1-4.5-6Zm3.1-2H4.1a8 8 0 0 1 4.5-6c-.7 1.6-1.2 3.7-1.4 6Zm2.9 2h3.8c-.1 2.9-.8 5.4-1.9 7-1.1-1.6-1.8-4.1-1.9-7Zm4.3 6c.7-1.6 1.2-3.7 1.4-6h3.1a8 8 0 0 1-4.5 6Z",
		linkedin:
			"M5.2 3.5a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2ZM3.4 9h3.7v11H3.4V9Zm5.9 0h3.5v1.5h.1A3.8 3.8 0 0 1 16.3 8c3.9 0 4.6 2.5 4.6 5.8V20h-3.7v-5.5c0-1.3 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V20H9.3V9Z",
		email:
			"M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.2L20 7H4l8 5.2Zm0 2.4L4 9.4V17h16V9.4l-8 5.2Z",
		github:
			"M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.5-1.1-4.5-5A3.9 3.9 0 0 1 6.7 9c-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.8 1.1a9.7 9.7 0 0 1 5.1 0c2-1.4 2.8-1.1 2.8-1.1.6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1.1 2.7c0 3.9-2.3 4.7-4.5 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z",
		telegram:
			"M21.8 4.2 18.6 20c-.2 1.1-.8 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.8-8c.4-.3-.1-.5-.6-.2L6.5 13.8l-4.6-1.4c-1-.3-1-1 .2-1.5L20 4.1c.8-.3 1.6.2 1.8.1Z",
		copy: "M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z",
	};

	return (
		<svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 24 24"
			className="site-footer__icon"
		>
			<path d={paths[name]} />
		</svg>
	);
}

const afghanistanWeekdayFormatter = new Intl.DateTimeFormat("fa-AF", {
	timeZone: "Asia/Kabul",
	weekday: "long",
});

function App() {
	const [now, setNow] = useState(() => new Date());
	const [currentYear] = useState(() => new Date().getFullYear());
	const [emailCopyMessage, setEmailCopyMessage] = useState("");
	const [backMessage, setBackMessage] = useState("");
	const lastBackPressAt = useRef(0);

	const copyEmail = async () => {
		try {
			await navigator.clipboard.writeText("yasin.araad@gmail.com");
			setEmailCopyMessage("آدرس ایمیل کپی شد.");
		} catch {
			setEmailCopyMessage("ایمیل: yasin.araad@gmail.com");
		}
	};

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		const addBackGuard = () => {
			window.history.pushState({ backGuard: true }, "", window.location.href);
		};

		if (!window.history.state?.backGuard) {
			addBackGuard();
		}

		const handlePopState = () => {
			addBackGuard();

			const now = Date.now();
			if (now - lastBackPressAt.current <= 2000) {
				lastBackPressAt.current = 0;
				setBackMessage(
					"مرورگر اجازهٔ بستن خودکار تب را نمی‌دهد؛ لطفاً تب را ببندید.",
				);
				window.close();
				return;
			}

			lastBackPressAt.current = now;
			setBackMessage("برای خروج، یک بار دیگر دکمهٔ بازگشت را فشار دهید.");
		};

		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	return (
		<div className="app-shell" dir="rtl">
			{backMessage && (
				<div className="back-exit-message" role="status" aria-live="polite">
					{backMessage}
				</div>
			)}
			<header className="site-header">
				<a
					className="site-header__brand"
					href="#home"
					aria-label="تقویم من، صفحهٔ اصلی"
				>
					<span className="site-header__logo" aria-hidden="true">
						◷
					</span>
					<span>
						<strong>تقویم من</strong>
						<small>زمان، تاریخ و اطلاعات روزانه</small>
					</span>
				</a>
				<nav className="site-header__nav" aria-label="ناوبری اصلی">
					<a href="#calendar">تقویم</a>
					<a href="#date-converter">تبدیل تاریخ</a>
					<a href="#markets">بازار</a>
					<a href="#weather">آب‌وهوا</a>
					<a href="#azan">اوقات نماز</a>
				</nav>
			</header>

			<main className="site-main" id="home">
				<div className="hero text-amber-200 font-morvarid">
					<div
						className="text-green-500 font-morvarid w-full min-h-48 py-6
        mx-auto mt-15 text-center flex flex-col items-center justify-center text-1xl font-bold"
					>
						<div>{afghanistanWeekdayFormatter.format(now)} شما مبارک</div>
						<LiveTimeDate />
						<div id="calendar" className="site-section-anchor">
							<LiveDate />
						</div>
						<div id="date-converter" className="site-section-anchor">
							<DateConverter />
						</div>
						<div id="markets" className="site-section-anchor">
							<Currency />
						</div>
						<div id="weather" className="site-section-anchor">
							<Weather />
						</div>
						<Azan />
					</div>
				</div>
			</main>

			<footer className="site-footer">
				<div className="site-footer__content">
					<div className="site-footer__brand">
						<strong>تقویم من</strong>
					</div>
					<nav className="site-footer__contacts" aria-label="راه‌های ارتباطی">
						<span>ارتباط با من</span>
						<a
							className="site-footer__contact-icon"
							href="https://react-portfolio-araad.vercel.app?_vercel_share=Sxzi1PJLROBR9X6OXrthYsadbASVYgdH"
							target="_blank"
							rel="noreferrer"
							aria-label="وب‌سایت شخصی"
							title="وب‌سایت شخصی"
						>
							<ContactIcon name="website" />
						</a>
						<a
							className="site-footer__contact-icon"
							href="https://www.linkedin.com/in/yasin-araad-a6ba79254"
							target="_blank"
							rel="noreferrer"
							aria-label="لینکدین"
							title="لینکدین"
						>
							<ContactIcon name="linkedin" />
						</a>
						<a
							className="site-footer__contact-icon"
							href="mailto:yasin.araad@gmail.com"
							aria-label="ارسال ایمیل به yasin.araad@gmail.com"
							title="ارسال ایمیل"
						>
							<ContactIcon name="email" />
						</a>
						<a
							className="site-footer__contact-icon"
							href="https://github.com/yourusername"
							target="_blank"
							rel="noreferrer"
							aria-label="گیت‌هاب"
							title="گیت‌هاب"
						>
							<ContactIcon name="github" />
						</a>
						<a
							className="site-footer__contact-icon"
							href="https://t.me/Arad1722"
							target="_blank"
							rel="noreferrer"
							aria-label="تلگرام، آیدی Arad1722"
							title="تلگرام: @Arad1722"
						>
							<ContactIcon name="telegram" />
						</a>
						<button
							className="site-footer__contact-icon site-footer__copy-email"
							type="button"
							onClick={() => void copyEmail()}
							aria-label="کپی آدرس ایمیل"
							title="کپی آدرس ایمیل"
						>
							<ContactIcon name="copy" />
						</button>
						{emailCopyMessage && (
							<span className="site-footer__copy-status" role="status">
								{emailCopyMessage}
							</span>
						)}
					</nav>
				</div>
				<div className="site-footer__bottom">
					<span>
						اطلاعات بازار و هواشناسی ممکن است با تأخیر به‌روزرسانی شوند.
					</span>
					<span>© {currentYear} تقویم من</span>
				</div>
			</footer>
		</div>
	);
}

export default App;
