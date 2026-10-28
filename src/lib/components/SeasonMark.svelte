<script lang="ts" module>
	import type { Season } from '#lib/seasons.ts';

	// Drawn on a 24 grid with round strokes in the text colour, like a pencil mark in the margin.
	const drawings: Record<Season, string> = {
		// A star for Advent.
		advent: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>',
		// A burst of sparks for New Year.
		newYear:
			'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="1.2"/>',
		// A snowflake: three strokes through the middle, each end with a small fork.
		winter:
			'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.8 4.6L12 6.4l2.2-1.8M9.8 19.4L12 17.6l2.2 1.8M4.6 10.2l2.6-.5-.9-2.6M19.4 13.8l-2.6.5.9 2.6M6.3 16.4l.9-2.6-2.6-.5M17.7 7.6l-.9 2.6 2.6.5"/>',
		// A blossom with five petals.
		spring:
			'<circle cx="12" cy="7" r="3"/><circle cx="16.8" cy="10.5" r="3"/><circle cx="15" cy="16" r="3"/><circle cx="9" cy="16" r="3"/><circle cx="7.2" cy="10.5" r="3"/><circle cx="12" cy="12" r="1.3"/>',
		// The sun.
		summer: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
		// A falling leaf with its vein.
		autumn: '<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z"/><path d="M5 19L14 10M9.5 14.5h3.5M12 12V9"/>',
		// A pumpkin with its stem.
		halloween:
			'<path d="M12 8c-4.5 0-7.5 2.6-7.5 6s3 6 7.5 6 7.5-2.6 7.5-6-3-6-7.5-6z"/><path d="M12 8c-2 0-3 2.7-3 6s1 6 3 6 3-2.7 3-6-1-6-3-6z"/><path d="M12 8V5.5c0-.8.6-1.5 1.5-1.5"/>'
	};
</script>

<script lang="ts">
	import { page } from '$app/state';

	/** The season's drawing, or nothing when the feature is off (page.data.season is then null). */
	let { size = 20, season = page.data.season as Season | null | undefined }: { size?: number; season?: Season | null } = $props();
</script>

{#if season}
	<svg
		class="season"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.6"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
		data-season={season}
	>
		<!-- The drawings above, never anything typed in. -->
		{@html drawings[season]}
	</svg>
{/if}
