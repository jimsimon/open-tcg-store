import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { screen } from 'shadow-dom-testing-library'
import { html } from 'lit'
import './home.client'
import { HomePage } from './home.client'

describe('ogs-home-page', () => {
  let element: HomePage;
  beforeEach(async () => {
    element = document.createElement('ogs-home-page') as HomePage
    document.body.appendChild(element)

    // Wait for the component to render
    await element.updateComplete;
  })
  
  afterEach(() => {
    element.remove();
  })

  test('dashboard content is present', async () => {
    // Check if dashboard title is present
    const dashboardTitle = await screen.findByShadowRole('heading', { name: 'Dashboard', level: 1 })
    expect(dashboardTitle).toBeInTheDocument()
    
    // Check if dashboard cards are present
    const monthlySalesCard = await screen.findByShadowText('Monthly Sales')
    const bestSellersCard = await screen.findByShadowText('Best Sellers')
    
    expect(monthlySalesCard).toBeInTheDocument()
    expect(bestSellersCard).toBeInTheDocument()
  })
})