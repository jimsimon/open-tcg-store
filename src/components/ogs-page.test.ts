import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { screen } from 'shadow-dom-testing-library'
import { html } from 'lit'
import './ogs-page.ts'
import { OgsPage } from './ogs-page.ts'

describe('ogs-page', () => {
  let element: OgsPage;
  beforeEach(async () => {
    element = document.createElement('ogs-page') as OgsPage
    document.body.appendChild(element)

    // Wait for the component to render
    await element.updateComplete;
  })

  afterEach(() => {
    element.remove();
  })

  test('renders page component with navigation', async () => {
    // Check if the component renders
    const navigation = await screen.findByShadowRole('navigation')
    expect(navigation).toBeInTheDocument()
    
    // Check if navigation links are present
    const dashboardLink = await screen.findByShadowText('Dashboard')
    const inventoryLink = await screen.findByShadowText('Inventory')
    const salesLink = await screen.findByShadowText('Sales')
    const settingsLink = await screen.findByShadowText('Settings')
    
    expect(dashboardLink).toBeInTheDocument()
    expect(inventoryLink).toBeInTheDocument()
    expect(salesLink).toBeInTheDocument()
    expect(settingsLink).toBeInTheDocument()
  })

  test('theme switcher is present', async () => {
    // Check if theme switcher button exists
    const themeButton = await screen.findByShadowRole('combobox', { name: /choose theme/i })
    expect(themeButton).toBeInTheDocument()
  })
})
