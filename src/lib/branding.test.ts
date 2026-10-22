import { describe, expect, it } from 'vitest';
import { brandColours, brandStyle, contrast, parseColour } from './branding.ts';

describe('parseColour', () => {
	it('takes #rrggbb and #rgb, in any case', () => {
		expect(parseColour(' #1D4ED8 ')).toBe('#1d4ed8');
		expect(parseColour('#eb2')).toBe('#eebb22');
	});

	it('refuses anything that could break out of the <style>', () => {
		for (const bad of ['red', 'rgb(0,0,0)', '#12345', '#000;}body{display:none', '', undefined]) expect(parseColour(bad)).toBeUndefined();
	});
});

describe('contrast', () => {
	it('is 21 for black on white and 1 for a colour on itself', () => {
		expect(contrast('#000000', '#ffffff')).toBeCloseTo(21);
		expect(contrast('#ffffff', '#000000')).toBeCloseTo(21);
		expect(contrast('#1d4ed8', '#1d4ed8')).toBe(1);
	});
});

describe('brandColours', () => {
	it('keeps a colour that is readable on both pages', () => {
		const colours = brandColours('#2563eb');
		expect(colours.light).toBe('#2563eb');
		expect(colours.adjusted.light).toBe(false);
	});

	it('darkens a light colour for the light page and keeps it for the dark one', () => {
		const colours = brandColours('#e6b422');
		expect(colours.adjusted).toEqual({ light: true, dark: false });
		expect(contrast(colours.light, '#f4f4f1')).toBeGreaterThanOrEqual(4.5);
		expect(contrast(colours.light, '#ffffff')).toBeGreaterThanOrEqual(4.5);
		expect(colours.ink).toBe('#0b0b0a');
	});

	it('lightens a dark colour for the dark page, with white text on it if that reads better', () => {
		const colours = brandColours('#1e1b4b');
		expect(colours.adjusted.dark).toBe(true);
		expect(contrast(colours.dark, '#0b0b0a')).toBeGreaterThanOrEqual(4.5);
		expect(contrast(colours.dark, colours.ink)).toBeGreaterThanOrEqual(4.5);
	});

	it('writes the custom properties, with a preset shade for the light page when given', () => {
		const colours = brandColours('#e6b422');
		expect(brandStyle(colours)).toBe(`:root:root{--brand:#e6b422;--brand-ink:#0b0b0a;--accent-light:${colours.light};--accent-dark:#e6b422}`);
		expect(brandStyle(colours, 'color-mix(in oklab, #e6b422 44%, #3a1f00)')).toContain('--accent-light:color-mix(in oklab, #e6b422 44%, #3a1f00);');
	});
});
