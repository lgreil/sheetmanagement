<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '#lib/forms.svelte.ts';
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import MemberFields from '#lib/components/MemberFields.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
	const saving = new FormState();
	const name = $derived(data.member?.name || data.user?.name || '');
	const feeds = new FormState();

	// Chrome and Android offer installing through an event; Safari only through its share menu.
	type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
	let installPrompt = $state<InstallPrompt | null>(null);
	let installed = $state(false);
	$effect(() => {
		installed = matchMedia('(display-mode: standalone)').matches;
		const offer = (event: Event) => {
			event.preventDefault();
			installPrompt = event as InstallPrompt;
		};
		addEventListener('beforeinstallprompt', offer);
		return () => removeEventListener('beforeinstallprompt', offer);
	});
	async function install() {
		await installPrompt?.prompt();
		if ((await installPrompt?.userChoice)?.outcome === 'accepted') installed = true;
		installPrompt = null;
	}
	let copied = $state(false);
	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2500);
		} catch {
			// The field below is selectable as a fallback.
		}
	}
</script>

<Title title={t.profile.title} />
<PageHeader title={t.profile.title} lead={t.profile.lead} />

<div class="stack">
	<!-- Who is signed in, and where their choices show up. -->
	<section class="ui-card account">
		<span class="avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
		<div class="who">
			<strong>{name}</strong>
			<span>{data.email}</span>
		</div>
		<a class="btn secondary" href="/meine-noten"><Icon name="user" size={16} />{t.nav.myParts}</a>
	</section>

	{#if !data.member}
		<p class="msg info">{t.profile.notMember}</p>
	{:else}
		<form class="ui-card card" method="POST" action="?/save" use:enhance={saving.submit()}>
			<!-- Rebuilt after saving, so the form shows what's in the sheet now. -->
			{#key JSON.stringify(data.member)}
				<MemberFields member={data.member} instruments={data.instruments} common={data.common} orchestras={data.orchestras} />
			{/key}

			{#if data.member.groups.length}
				<p class="groups">
					<span class="muted">{t.profile.groups}</span>
					{#each data.member.groups as group (group)}<span class="tag">{group}</span>{/each}
					<span class="muted small">{t.profile.groupsHint}</span>
				</p>
			{/if}

			{#if form?.message}<p class="msg error" role="alert">{form.message}</p>{/if}
			<div class="actions">
				<button class="btn" disabled={saving.busy}><Icon name="check" size={16} />{t.profile.save}</button>
				{#if form?.saved}<span class="saved" role="status"><Icon name="check" size={16} />{t.profile.saved}</span>{/if}
			</div>
		</form>
	{/if}

	{#if data.member && data.feed}
		<!-- The member's dates in their own calendar app (#122). -->
		<section class="ui-card feed" id="kalender">
			<h2><Icon name="calendar" size={18} />{t.feed.title}</h2>
			<p class="muted">{t.feed.lead}</p>
			{#if form && 'feedMessage' in form && form.feedMessage}<p class="msg error" role="alert">{form.feedMessage}</p>{/if}
			{#if data.feed.state === 'not-set-up'}
				<p class="msg info">{t.feed.notSetUp}</p>
			{:else if data.feed.state === 'none'}
				<form method="POST" action="?/feed" use:enhance={feeds.submit()}>
					<button class="btn" disabled={feeds.busy}><Icon name="link" size={16} />{t.feed.create}</button>
				</form>
			{:else}
				<div class="feed-actions">
					<a class="btn" href={data.feed.webcal}><Icon name="calendar" size={16} />{t.feed.subscribe}</a>
					<button class="btn ghost" type="button" onclick={() => copy(data.feed?.state === 'active' ? data.feed.url : '')}>
						<Icon name={copied ? 'check' : 'link'} size={16} />{copied ? t.feed.copied : t.feed.copy}
					</button>
				</div>
				<input class="feed-url" readonly value={data.feed.url} aria-label={t.feed.title} onfocus={(event) => event.currentTarget.select()} />
				<p class="muted small">{t.feed.hint}</p>
				<div class="ui-actions">
					<form method="POST" action="?/feed" use:enhance={feeds.submit()} onsubmit={(event) => confirm(t.feed.confirmRenew) || event.preventDefault()}>
						<button disabled={feeds.busy}>{t.feed.renew}</button>
					</form>
					<form method="POST" action="?/feedRevoke" use:enhance={feeds.submit()} onsubmit={(event) => confirm(t.feed.confirmRevoke) || event.preventDefault()}>
						<button disabled={feeds.busy}>{t.feed.revoke}</button>
					</form>
				</div>
			{/if}
		</section>
	{/if}

	<section>
		<h2 class="ui-label">{t.profile.settings}</h2>
		<div class="ui-list settings">
			<div class="setting">
				<span>{t.theme.label}</span>
				<ThemeToggle />
			</div>
			<!-- On the home screen it opens like an app and works offline in the rehearsal hall (#62). -->
			{#if !installed}
				<div class="setting">
					<span>{t.pwa.install}<small class="muted">{installPrompt ? t.pwa.installHint : t.pwa.installManual}</small></span>
					{#if installPrompt}<button class="btn small secondary" onclick={install}><Icon name="download" size={14} />{t.pwa.installButton}</button>{/if}
				</div>
			{/if}
			<form class="setting" method="POST" action="/auth/logout">
				<span>{t.auth.signedInAs(data.email)}</span>
				<button class="logout"><Icon name="logout" size={16} />{t.auth.logout}</button>
			</form>
		</div>
	</section>
</div>

<style>
	.feed {
		display: grid;
		gap: var(--space-3);
	}

	.feed h2 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
		font-size: 1.0625rem;
	}

	.feed-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.feed-url {
		width: 100%;
		padding: 8px var(--space-3);
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--bg);
		color: var(--text-muted);
		font: inherit;
		font-size: 0.8125rem;
	}

	.stack {
		display: grid;
		gap: var(--space-5);
		max-width: 640px;
	}

	.account {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3) var(--space-4);
	}

	.avatar {
		display: grid;
		place-items: center;
		flex: none;
		width: 52px;
		height: 52px;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 1.375rem;
		font-weight: 700;
	}

	.who {
		display: grid;
		flex: 1;
		min-width: 0;
	}

	.who strong {
		font-size: 1.125rem;
	}

	.who span {
		overflow: hidden;
		color: var(--text-muted);
		font-size: 0.875rem;
		text-overflow: ellipsis;
	}

	.card {
		display: grid;
		gap: var(--space-5);
	}

	.groups {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.small {
		flex-basis: 100%;
		font-size: 0.8125rem;
	}

	.tag {
		padding: 0 var(--space-2);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.saved {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--ok);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.setting {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2) var(--space-3);
		min-height: 60px;
		padding: var(--space-3) var(--space-4);
	}

	.setting > span {
		display: grid;
		flex: 1;
		gap: 2px;
		min-width: min(100%, 220px);
	}

	.setting small {
		font-size: 0.8125rem;
	}

	.setting + .setting {
		border-top: 1px solid var(--hairline);
	}

	.setting span {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	form.setting span {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.logout {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 36px;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: 10px;
		background: color-mix(in oklab, var(--danger) 10%, transparent);
		color: var(--danger);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	@media (max-width: 480px) {
		.account .btn {
			width: 100%;
		}
	}
</style>
