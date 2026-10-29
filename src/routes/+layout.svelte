<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '../styles/global.scss';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div id="app-root">
	{@render children()}
</div>
