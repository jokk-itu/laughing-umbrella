<script>
	import { Router } from 'svelte-router-spa'
	import { routes } from './routes'
	import "../node_modules/uikit/dist/css/uikit.min.css"
	import UIkit from "../node_modules/uikit/dist/js/uikit"
	import Icons from "../node_modules/uikit/dist/js/uikit-icons"
	UIkit.use(Icons);
</script>

<main>
	<Router {routes} />
</main>