<script lang="ts">
	import { t } from '#lib/i18n/index.ts';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
</script>

<Title title={t.email.linkTitle} />

<section class="card">
	<img class="logo" src="/logo.png" alt="" width="88" height="88" />
	<h1>{t.email.linkTitle}</h1>
	{#if data.email && !form?.invalid}
		<p>{t.email.linkLead(data.email)}</p>
		<form method="POST">
			<button class="btn">{t.email.linkButton}</button>
		</form>
	{:else}
		<p class="error" role="alert">{t.email.linkInvalid}</p>
		<a class="link" href="/anmelden">{t.email.toSignIn}</a>
	{/if}
</section>

<style>
	.card {
		display: grid;
		justify-items: center;
		gap: var(--space-3);
		max-width: 420px;
		margin: var(--space-6) auto;
		padding: var(--space-6) var(--space-5);
		border: 1px solid var(--border);
		border-radius: var(--radius-l);
		background: var(--surface);
		text-align: center;
	}

	.logo {
		width: 88px;
		height: 88px;
	}

	h1 {
		margin: 0;
	}

	p {
		color: var(--text-muted);
	}

	.error {
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-m);
		background: color-mix(in oklab, var(--danger) 10%, transparent);
		color: var(--text);
	}

	.link {
		color: var(--accent);
		font-weight: 600;
	}
</style>
