<script lang="ts">
	import { HttpClient } from './HttpClient';
	import { AuthService } from './AuthService';
	import type { IAuthService } from './AuthService';
	import config from './config';
	import Menu from './components/Menu.svelte';

	const _client : HttpClient = new HttpClient();
	const _authService : IAuthService = new AuthService(config.auth);

	async function graph() 
	{
		const token = await _authService.getToken(['user.read']).then(result => { return result.accessToken; });
		const url = new URL('https://graph.microsoft.com/v1.0/me');
		_client.getJSON(url, token)
		.done(data => { console.log(data) })
		.fail(error => { console.error(error) });
	}

	async function api()
	{
		const token = await _authService.getToken(['api://895fe467-4fe0-4f4d-bd8e-ec38e486c5b0/api1']).then(result => { return result.accessToken; });
		const url = new URL('http://localhost:5000/person');
		_client.getJSON(url, token)
		.done(data => {console.log(data)})
		.fail(error => {console.error(error)});
	}
</script>

<Menu/>

<main>
	<div class="uk-section">
		<p>User details: 
			{ #await _authService.getUser()} <p>Waiting for user status...</p>
			{ :then user } <p>{ JSON.stringify(user.account) }</p>
			{ :catch error } <p>User not logged in</p>
			{ /await }
		</p>
		<button on:click={ api }>Call API</button>
		<button on:click={ graph }>Call Graph</button>
		<button on:click={ async () => { await _authService.login(); } }>Login</button>
		<button on:click={ async () => { await _authService.logout(); } }>Logout</button>
	</div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>