<script lang="ts">
	import { enhance } from '$app/forms';
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';

	let { data, form } = $props();
	let busy = $state(false);

	/** Disables the buttons while a change is saved, and keeps the scroll position. */
	const submit = () => {
		busy = true;
		return async ({ update }: { update: (options?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: true });
			busy = false;
		};
	};

	const confirmRemove = (name: string) => (event: SubmitEvent) => {
		if (!confirm(t.admin.confirmRemove(name))) event.preventDefault();
	};

	const rightLabel = (right: string) => data.rights?.find((r) => r.right === right)?.label ?? right;
</script>

<Title title={t.admin.title} />
<PageHeader title={t.admin.title} lead={t.admin.lead} />

{#if data.state === 'off'}
	<p class="notice">{t.auth.notReady} GOOGLE_OAUTH_CLIENT_ID</p>
{:else if data.state === 'not-set-up'}
	<div class="notice">
		<p>{t.admin.notSetUp}</p>
		<a class="link" href="/setup">{t.admin.runSetup}</a>
	</div>
{:else}
	{#if form?.message}
		<p class="message error" role="alert">{form.message}</p>
	{:else if form?.saved}
		<p class="message ok" role="status"><Icon name="check" size={16} />{t.admin.saved}</p>
	{/if}

	<section>
		<h2>{t.admin.requests}</h2>
		{#if data.requests.length}
			<ul class="list">
				{#each data.requests as request (request.email)}
					<li class="row">
						<span class="main">
							<strong>{request.name || request.email}</strong>
							<span class="muted">{request.email}{request.requestedAt ? ` · ${request.requestedAt}` : ''}</span>
						</span>
						<form method="POST" action="?/approve" use:enhance={submit}>
							<input type="hidden" name="email" value={request.email} />
							<button class="button" disabled={busy}>{t.admin.approve}</button>
						</form>
						<form method="POST" action="?/decline" use:enhance={submit}>
							<input type="hidden" name="email" value={request.email} />
							<button class="ghost" disabled={busy}>{t.admin.decline}</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty">{t.admin.noRequests}</p>
		{/if}
	</section>

	<section>
		<h2>{t.admin.members} <span class="count">{data.members.length}</span></h2>
		{#if data.members.length}
			<ul class="list">
				{#each data.members as member (member.email)}
					<li class="row">
						<span class="main">
							<strong>{member.name}</strong>
							<span class="muted">
								{[member.email, member.instrument].filter(Boolean).join(' · ')}
							</span>
							{#if member.groups.length}
								<span class="tags">{#each member.groups as group (group)}<span class="tag">{group}</span>{/each}</span>
							{/if}
						</span>
						<form method="POST" action="?/removeMember" use:enhance={submit} onsubmit={confirmRemove(member.name)}>
							<input type="hidden" name="email" value={member.email} />
							<button class="icon-button" disabled={busy} title={t.admin.remove} aria-label={t.admin.remove}>
								<Icon name="trash" size={16} />
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty">{t.admin.noMembers}</p>
		{/if}

		<form class="add" method="POST" action="?/addMember" use:enhance={submit}>
			<h3>{t.admin.addMember}</h3>
			<label>{t.admin.email}<input name="email" type="email" required autocomplete="off" /></label>
			<label>{t.admin.name}<input name="name" autocomplete="off" /></label>
			<label>{t.admin.instrument}<input name="instrument" autocomplete="off" /></label>
			<label>
				{t.admin.groups}
				<input name="groups" list="group-names" autocomplete="off" placeholder={t.admin.groupsHint} />
			</label>
			<button class="button" disabled={busy}><Icon name="plus" size={16} />{t.admin.add}</button>
		</form>
	</section>

	<section>
		<h2>{t.admin.rightsTitle}</h2>
		<p class="muted lead">{t.admin.rightsLead}</p>
		{#if data.bootstrapAdmins.length}
			<p class="muted small">{t.admin.bootstrap(data.bootstrapAdmins.join(', '))}</p>
		{/if}
		{#if data.grants.length}
			<ul class="list">
				{#each data.grants as grant (grant.who + grant.right)}
					<li class="row">
						<span class="main">
							<strong>{grant.who}</strong>
							<span class="muted">{rightLabel(grant.right)}</span>
						</span>
						<form method="POST" action="?/revoke" use:enhance={submit}>
							<input type="hidden" name="who" value={grant.who} />
							<input type="hidden" name="right" value={grant.right} />
							<button class="ghost" disabled={busy}>{t.admin.revoke}</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty">{t.admin.noGrants}</p>
		{/if}

		<form class="add" method="POST" action="?/grant" use:enhance={submit}>
			<label>
				{t.admin.who}
				<input name="who" list="who-options" required autocomplete="off" />
			</label>
			<label>
				{t.admin.right}
				<select name="right" required>
					{#each data.rights.filter((r) => r.right !== 'ansehen') as option (option.right)}
						<option value={option.right}>{option.label}</option>
					{/each}
				</select>
			</label>
			<button class="button" disabled={busy}><Icon name="plus" size={16} />{t.admin.grant}</button>
		</form>
	</section>

	<datalist id="group-names">
		{#each data.groups as group (group.name)}<option value={group.name}>{group.description}</option>{/each}
	</datalist>
	<datalist id="who-options">
		{#each data.groups as group (group.name)}<option value={group.name}>{group.description}</option>{/each}
		{#each data.members as member (member.email)}<option value={member.email}>{member.name}</option>{/each}
	</datalist>

	{#if data.sheetUrl}
		<a class="link" href={data.sheetUrl} target="_blank" rel="noopener noreferrer">
			<Icon name="external" size={16} />{t.admin.openSheet}
		</a>
	{/if}
{/if}

<style>
	section {
		margin-bottom: var(--space-6);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0 0 var(--space-2) var(--space-1);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	h3 {
		grid-column: 1 / -1;
		margin: 0;
		font-size: 1rem;
	}

	.count {
		padding: 0 var(--space-2);
		border-radius: 999px;
		background: var(--surface-2);
		letter-spacing: 0;
	}

	.lead {
		margin: 0 0 var(--space-2) var(--space-1);
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
		overflow: hidden;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
		padding: var(--space-3) var(--space-4);
	}

	.row + .row {
		border-top: 1px solid var(--border);
	}

	.main {
		display: grid;
		gap: 2px;
		flex: 1;
		min-width: 180px;
	}

	.muted {
		color: var(--text-muted);
		font-size: 0.875rem;
		overflow-wrap: anywhere;
	}

	.small {
		margin: 0 0 var(--space-2) var(--space-1);
		font-size: 0.8125rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.tag {
		padding: 0 var(--space-2);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.empty,
	.notice {
		padding: var(--space-4);
		border: 1px dashed var(--border);
		border-radius: var(--radius-m);
		color: var(--text-muted);
	}

	.notice {
		display: grid;
		gap: var(--space-2);
	}

	.add {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		align-items: end;
		gap: var(--space-3);
		margin-top: var(--space-3);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-m);
		background: var(--surface);
	}

	label {
		display: grid;
		gap: var(--space-1);
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	input,
	select {
		height: 40px;
		padding: 0 var(--space-3);
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--bg);
		color: var(--text);
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 400;
		min-width: 0;
	}

	input:focus,
	select:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.button,
	.ghost,
	.icon-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		height: 36px;
		padding: 0 var(--space-4);
		border-radius: 999px;
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.button {
		border: 0;
		background: var(--accent);
		color: var(--accent-contrast);
	}

	.add .button {
		height: 40px;
	}

	.ghost {
		border: 1px solid var(--border);
		background: none;
		color: var(--text);
	}

	.icon-button {
		width: 36px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--text-muted);
	}

	.icon-button:hover {
		background: color-mix(in oklab, var(--danger) 12%, transparent);
		color: var(--danger);
	}

	button:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.message {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-m);
	}

	.message.ok {
		background: color-mix(in oklab, var(--ok) 12%, transparent);
	}

	.message.error {
		background: color-mix(in oklab, var(--danger) 10%, transparent);
	}

	.link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--accent);
		font-weight: 600;
	}
</style>
