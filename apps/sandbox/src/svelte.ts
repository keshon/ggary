import './theme'
import './shared.css'
import './chrome'

import { mount } from 'svelte'
import App from './App.svelte'

mount(App, { target: document.getElementById('app')! })
