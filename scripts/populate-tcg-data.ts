#!/usr/bin/env -S npx tsx

// Types for the API responses
interface Group {
  groupId: number;
  name: string;
}

interface Product {
  productId: number;
  name: string;
  groupId: number;
}

interface Price {
  productId: number;
  subTypeName: string;
  midPrice: number | null;
  lowPrice: number | null;
  highPrice: number | null;
  marketPrice: number | null;
}

interface ApiResponse<T> {
  results: T[];
}

const pokemonCategory = '3';

async function fetchTcgData() {
  try {
    // Fetch all groups for Pokemon category
    console.log(`Fetching groups for category ${pokemonCategory}...`);
    const groupsResponse = await fetch(`https://tcgcsv.com/tcgplayer/${pokemonCategory}/groups`);
    
    if (!groupsResponse.ok) {
      throw new Error(`Failed to fetch groups: ${groupsResponse.status} ${groupsResponse.statusText}`);
    }
    
    const groupsData: ApiResponse<Group> = await groupsResponse.json();
    const allGroups = groupsData.results;
    
    console.log(`Found ${allGroups.length} groups`);

    for (const group of allGroups) {
      const groupId = group.groupId;
      console.log(`\nProcessing group ${groupId}: ${group.name}`);
      
      // Fetch products for this group
      console.log('Fetching products...');
      const productsResponse = await fetch(`https://tcgcsv.com/tcgplayer/${pokemonCategory}/${groupId}/products`);
      
      if (!productsResponse.ok) {
        console.error(`Failed to fetch products for group ${groupId}: ${productsResponse.status}`);
        continue;
      }
      
      const productsData: ApiResponse<Product> = await productsResponse.json();
      const products = productsData.results;
      
      console.log(`Found ${products.length} products`);
      for (const product of products) {
        // Process product information
        console.log(`${product.productId} - ${product.name}`);
      }

      // Fetch prices for this group
      console.log('Fetching prices...');
      const pricesResponse = await fetch(`https://tcgcsv.com/tcgplayer/${pokemonCategory}/${groupId}/prices`);
      
      if (!pricesResponse.ok) {
        console.error(`Failed to fetch prices for group ${groupId}: ${pricesResponse.status}`);
        continue;
      }
      
      const pricesData: ApiResponse<Price> = await pricesResponse.json();
      const prices = pricesData.results;
      
      console.log(`Found ${prices.length} prices`);
      for (const price of prices) {
        // Process prices
        console.log(`${price.productId} - ${price.subTypeName} - ${price.midPrice}`);
      }

      // Only process the first group and break for testing
      console.log('\nBreaking after first group for testing...');
      break;
    }
  } catch (error) {
    console.error('Error fetching TCG data:', error);
    process.exit(1);
  }
}

// Run the script
fetchTcgData();
