import Home from './Home.svelte'
import NotFound from './NotFound.svelte'

const routes = [
    { name: '/', component: Home },
    { name: '404', path: '404', component: NotFound }
]

export { routes }