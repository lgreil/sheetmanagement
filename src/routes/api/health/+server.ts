/** Lightweight check that the deployment is up. */
export function GET() {
	return Response.json({ ok: true });
}
