<script lang="ts">
	import { enhance } from '$app/forms';
	import { brandColours, contrast, parseColour } from '#lib/branding.ts';
	import { FormState } from '#lib/forms.svelte.ts';
	import { t } from '#lib/i18n/index.ts';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import Title from '#lib/components/Title.svelte';
	import { validLogo } from '#lib/settings.ts';

	let { data, form } = $props();
	const saving = new FormState();

	// After a rejected save without JavaScript, what was typed; otherwise what's saved.
	// svelte-ignore state_referenced_locally
	const values: typeof data.values = (form && 'values' in form ? (form.values as typeof data.values) : undefined) ?? data.values;
	let logo = $state(values.logo);
	let useDefault = $state(!values.accent);
	// svelte-ignore state_referenced_locally
	let accent = $state(values.accent || data.defaults.accent);

	// What the app will look like: the colour as chosen, with the shades derived from it.
	const colours = $derived(brandColours(useDefault ? data.defaults.accent : (parseColour(accent) ?? data.defaults.accent)));
	const ratio = (a: string, b: string) => contrast(a, b).toFixed(1).replace('.', ',');
	// With the default colour, the preset's own light shade, as the app shows it.
	const presetLight = $derived(useDefault ? data.defaults.accentLight : undefined);
	const light = $derived(presetLight ?? colours.light);
	const previewLogo = $derived(validLogo(logo) ?? data.defaults.logo);
	const invalid = (field: string) => !!form && 'field' in form && form.field === field;
</script>

<Title title={t.settings.title} />
<PageHeader title={t.settings.title} lead={t.settings.lead} />

{#if data.sheet === 'not-configured'}
	<p class="msg info">{t.settings.notConfigured}</p>
{:else if data.sheet === 'failed'}
	<p class="msg error" role="alert">{t.settings.readFailed}</p>
{:else}
	<form method="POST" use:enhance={saving.submit()}>
		<p class="muted intro">{t.settings.emptyIsDefault}</p>

		<section class="ui-card card" aria-labelledby="name">
			<h2 id="name"><Icon name="text" size={18} />{t.settings.identity}</h2>
			<label class="field"
				>{t.settings.name}
				<input name="name" value={values.name} placeholder={data.defaults.name} maxlength="80" aria-invalid={invalid('name')} />
			</label>
			<label class="field"
				>{t.settings.shortName}
				<input
					name="shortName"
					value={values.shortName}
					placeholder={data.defaults.shortName}
					maxlength="24"
					aria-describedby="short-hint"
					aria-invalid={invalid('shortName')}
				/>
				<span id="short-hint" class="hint">{t.settings.shortNameHint}</span>
			</label>
		</section>

		<section class="ui-card card" aria-labelledby="logo">
			<h2 id="logo"><Icon name="file" size={18} />{t.settings.logo}</h2>
			<div class="logo-row">
				<label class="field grow"
					>{t.settings.logoField}
					<input
						name="logo"
						bind:value={logo}
						placeholder={data.defaults.logo}
						inputmode="url"
						aria-describedby="logo-hint"
						aria-invalid={invalid('logo')}
					/>
					<span id="logo-hint" class="hint">{t.settings.logoHint}</span>
				</label>
				<figure class="logo-preview">
					<img src={previewLogo} alt="" width="56" height="56" />
					<figcaption class="hint">{t.settings.logoPreview}</figcaption>
				</figure>
			</div>
		</section>

		<section class="ui-card card" aria-labelledby="colour">
			<h2 id="colour"><Icon name="palette" size={18} />{t.settings.colour}</h2>
			<label class="check">
				<input type="checkbox" name="accentDefault" bind:checked={useDefault} />
				{t.settings.accentDefault(data.defaults.accent)}
			</label>
			<label class="field colour" class:off={useDefault}
				>{t.settings.accent}
				<span class="colour-input">
					<input type="color" bind:value={accent} disabled={useDefault} aria-label={t.settings.accent} />
					<input name="accent" bind:value={accent} disabled={useDefault} maxlength="7" spellcheck="false" aria-invalid={invalid('accent')} />
				</span>
			</label>
			<p class="hint">{t.settings.colourHint}</p>
			<div class="previews">
				<div class="preview" style="background:#f4f4f1;color:#161512">
					<span class="preview-label">{t.settings.light}</span>
					<span class="sample" style="background:{light};color:#fff">{t.settings.sample}</span>
					<span style="color:{light};font-weight:650">{t.settings.link}</span>
					{#if !presetLight}<span class="ratio">{t.settings.ratio(ratio(colours.light, '#f4f4f1'))}</span>{/if}
				</div>
				<div class="preview" style="background:#0b0b0a;color:#f2eee4">
					<span class="preview-label">{t.settings.dark}</span>
					<span class="sample" style="background:{colours.dark};color:{colours.ink}">{t.settings.sample}</span>
					<span style="color:{colours.dark};font-weight:650">{t.settings.link}</span>
					<span class="ratio">{t.settings.ratio(ratio(colours.dark, '#0b0b0a'))}</span>
				</div>
			</div>
		</section>

		<section class="ui-card card" aria-labelledby="features">
			<h2 id="features"><Icon name="list" size={18} />{t.settings.features}</h2>
			<p class="hint">{t.settings.featuresLead}</p>
			{#if !data.featuresStored}<p class="hint">{t.settings.featuresFromDefault}</p>{/if}
			<ul class="features">
				{#each data.features as feature (feature.key)}
					<li>
						<label class="check">
							<input type="checkbox" name="features" value={feature.key} checked={feature.on} />
							<span>
								<strong>{t.features[feature.key]}</strong>
								<span class="hint">{t.settings.describe[feature.key]}</span>
							</span>
						</label>
					</li>
				{/each}
			</ul>
		</section>

		{#if form?.message}<p class="msg error" role="alert">{form.message}</p>{/if}
		<div class="actions">
			<button class="btn" disabled={saving.busy}><Icon name="check" size={16} />{t.settings.save}</button>
			{#if form?.saved}<span class="saved" role="status"><Icon name="check" size={16} />{t.settings.saved}</span>{/if}
		</div>
		<p class="hint">{t.settings.stored}</p>
	</form>
{/if}

<style>
	form {
		display: grid;
		gap: var(--space-5);
	}

	.intro {
		margin: 0;
	}

	.card {
		display: grid;
		gap: var(--space-4);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
		font-size: 1.0625rem;
	}

	.hint {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 400;
	}

	[aria-invalid='true'] {
		border-color: var(--danger) !important;
	}

	.logo-row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: var(--space-4);
	}

	.grow {
		flex: 1 1 260px;
	}

	.logo-preview {
		display: grid;
		justify-items: center;
		gap: var(--space-1);
		margin: 0;
	}

	.logo-preview img {
		border-radius: var(--radius-s);
		object-fit: contain;
		background: var(--surface-2);
	}

	.check {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		min-height: var(--tap);
		padding-top: var(--space-2);
		cursor: pointer;
	}

	.check input {
		width: 20px;
		height: 20px;
		margin: 1px 0 0;
		accent-color: var(--accent);
		flex: none;
	}

	.check > span {
		display: grid;
		gap: 2px;
	}

	.colour.off {
		opacity: 0.55;
	}

	.colour-input {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.colour-input input[type='color'] {
		width: 52px;
		height: 42px;
		padding: 4px;
		cursor: pointer;
	}

	.colour-input input:not([type='color']) {
		width: 12ch;
		font-family: ui-monospace, monospace;
	}

	.previews {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--space-3);
	}

	.preview {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-m);
	}

	.preview-label {
		width: 100%;
		font-size: 0.75rem;
		font-weight: 650;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		opacity: 0.75;
	}

	.sample {
		padding: 6px 14px;
		border-radius: 999px;
		font-size: 0.875rem;
		font-weight: 650;
	}

	.ratio {
		font-size: 0.8125rem;
		opacity: 0.8;
	}

	.features {
		display: grid;
		gap: var(--space-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
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
</style>
