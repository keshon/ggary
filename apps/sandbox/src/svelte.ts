import '@ggary/styles'
import './shared.css'
import '@ggary/elements' // only for the theme toggle in the page chrome

import { mount } from 'svelte'
import App from './App.svelte'
import { installThemeToggle } from './demo-data'

installThemeToggle(document.getElementById('theme-toggle')!)

mount(App, { target: document.getElementById('app')! })
