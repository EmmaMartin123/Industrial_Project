"use client";

export default function Footer() {
	return (
		<div>
			{/* Footer */}
			<footer className="footer p-10 bg-base-300 text-base-content">
				<div>
					<p>
						<span className="font-bold">Elevare</span> © {new Date().getFullYear()}
						<br />
						replace with slogan or name or something
					</p>
				</div>
				<div>
					<span className="footer-title">Links</span>
					<a className="link link-hover">Browse Pitches</a>
					<a className="link link-hover">My Portfolio</a>
					<a className="link link-hover">Sign In</a>
				</div>
			</footer>
		</div>
	)
}

