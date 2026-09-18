import './theme'
import './shared.css'

import { mount } from 'svelte'
import App from './App.svelte'
import Bar from './Bar.svelte'
import Navigator from './Navigator.svelte'

const app = document.getElementById('app')!
mount(App, { target: app })
// The chrome, drawn with the page's own components.
mount(Bar, { target: document.getElementById('chrome')! })
mount(Navigator, { target: document.body.appendChild(Object.assign(document.createElement('div'), { id: 'navigator' })), props: { app } })
