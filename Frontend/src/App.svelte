<script>
	import { Router } from 'svelte-router-spa'
	import { routes } from './routes'
	import "../node_modules/uikit/dist/css/uikit.min.css"
	import "../node_modules/uikit/dist/js/uikit"
	import "../node_modules/uikit/dist/js/uikit-icons"
</script>

<main>
	<Router {routes} />
</main>