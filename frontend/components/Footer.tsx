// components/Footer.tsx

"use client";

export default function Footer() {
	return (
		<div>
			<footer className="footer p-10 bg-base-300 text-base-content">
				<div>
					<p>
						<span className="font-bold">Elevare</span> © {new Date().getFullYear()}
						<br />
						The Future of Pitch Management
					</p>
				</div>
			</footer>
		</div>
	)
}
