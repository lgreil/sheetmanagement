<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data } = $props();

	const rows = $derived([
		{ label: t.status.account, check: data.checks.account },
		{ label: t.status.drive, check: data.checks.drive },
		{ label: t.status.calendar, check: data.checks.calendar },
		{ label: t.status.sheet, check: data.checks.sheet },
		{ label: t.status.signIn, check: data.checks.signIn },
		{ label: t.status.look, check: data.checks.look }
	]);

	const icons: Record<string, IconName> = { ok: 'check', error: 'alert', missing: 'minus' };
</script>

<Title title={t.status.title} />
<PageHeader title={t.status.title} lead={t.status.lead} />

<ul class="checks">
	{#each rows as { label, check } (label)}
		<li class="check {check.state}">
			<span class="icon"><Icon name={icons[check.state]} size={18} /></span>
			<div class="body">
				<div class="head">
					<strong>{label}</strong>
					<span class="pill">{t.status[check.state]}</span>
				</div>
				{#each check.details as detail (detail)}<p>{detail}</p>{/each}
				{#if check.problem}<p class="problem">{check.problem}</p>{/if}
				{#if check.hint}<p class="hint">{check.hint}</p>{/if}
			</div>
		</li>
	{/each}
</ul>

<div class="actions">
	{#if data.checks.drive.state === 'ok'}
		<a class="button" href="?refresh" data-sveltekit-reload>
			<Icon name="refresh" size={16} />
			{t.status.refresh}
		</a>
	{/if}
	{#if data.checks.account.state === 'ok'}
		<a class="link" href="/setup">{t.status.setupSheet}</a>
	{/if}
	<a class="link" href="https://github.com/lgreil/sheetmanagement/blob/main/docs/setup-google.md">{t.status.setupGuide}</a>
</div>
<p class="version">{t.nav.appName} v{__APP_VERSION__}</p>

<style>
	.version {
		margin-top: var(--space-5);
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.checks {
		display: grid;
		gap: var(--space-3);
		margin: 0 0 var(--space-5);
		padding: 0;
		list-style: none;
	}

	.check {
		--state: var(--text-muted);
		display: flex;
		gap: var(--space-4);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	.check.ok {
		--state: var(--ok);
	}

	.check.error {
		--state: var(--danger);
	}

	.icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		color: var(--state);
		background: color-mix(in oklab, var(--state) 14%, transparent);
	}

	.body {
		display: grid;
		gap: var(--space-1);
		min-width: 0;
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}

	.pill {
		padding: 1px var(--space-2);
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--state);
		background: color-mix(in oklab, var(--state) 12%, transparent);
	}

	p {
		color: var(--text-muted);
		font-size: 0.9375rem;
		overflow-wrap: anywhere;
	}

	.problem {
		color: var(--text);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-4);
	}

	.button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-contrast);
		font-weight: 600;
	}

	.link {
		color: var(--accent);
		font-weight: 500;
	}
</style>
