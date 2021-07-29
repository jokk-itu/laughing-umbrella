import Home  from './Home.svelte'

const routes = [
    {name: '/', component: Home},
    {name: '*', component: Home}
]

export { routes }