"use client";

export default function Navbar() {
	return (
		<nav className="navbar bg-base-200 shadow">
			<div className="flex-1">
				<a className="btn btn-ghost normal-case text-xl">Elevare</a>
			</div>

			<div className="flex-none hidden md:flex space-x-2">
				<a className="btn btn-ghost">Browse Pitches</a>
				<a className="btn btn-ghost">My Portfolio</a>
				<a className="btn btn-primary rounded-md">Sign In</a>
			</div>
		</nav>
	);
}

