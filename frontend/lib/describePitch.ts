import { NewPitch } from "@/lib/types/pitch";

export function describePitch(pitch: NewPitch): string {
	const {
		title,
		elevator_pitch,
		detailed_pitch,
		target_amount,
		status,
		profit_share_percent,
		investment_start_date,
		investment_end_date,
		investment_tiers,
	} = pitch;

	const tierDescriptions = investment_tiers.map((tier, i) => {
		const maxText = tier.max_amount ? `up to $${tier.max_amount.toLocaleString()}` : "and above";
		return `Tier ${i + 1}: "${tier.name}" — from $${tier.min_amount.toLocaleString()} ${maxText}, multiplier ${tier.multiplier}x.`;
	});

	const description = `
Pitch Title: ${title}

Elevator Pitch:
${elevator_pitch}

Detailed Pitch:
${detailed_pitch}

Target Amount: $${target_amount.toLocaleString()}
Status: ${status}
Profit Share: ${profit_share_percent}%

Investment Window: ${new Date(investment_start_date).toLocaleDateString()} → ${new Date(investment_end_date).toLocaleDateString()}

Investment Tiers:
${tierDescriptions.join("\n")}
`;

	return description.trim();
}


