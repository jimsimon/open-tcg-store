import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '../../components/ogs-page.ts';
import '../../components/ogs-two-pane-panel.ts';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { GetSupportedGamesQuery } from '../../lib/shared-queries';
import { TypedDocumentString } from '../../graphql/graphql';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const SearchProductsQuery = new TypedDocumentString(`
  query SearchProductsForLot($searchTerm: String!, $isSingle: Boolean, $isSealed: Boolean) {
    searchProducts(searchTerm: $searchTerm, isSingle: $isSingle, isSealed: $isSealed) {
      id name gameName setName rarity imageUrl isSingle isSealed
      prices { subTypeName marketPrice midPrice }
    }
  }
`) as unknown as TypedDocumentString<
  {
    searchProducts: Array<{
      id: number;
      name: string;
      gameName: string;
      setName: string;
      rarity: string | null;
      imageUrl: string | null;
      isSingle: boolean;
      isSealed: boolean;
      prices: Array<{ subTypeName: string; marketPrice: number | null; midPrice: number | null }>;
    }>;
  },
  { searchTerm: string; isSingle?: boolean | null; isSealed?: boolean | null }
>;

const GetLotQuery = new TypedDocumentString(`
  query GetLot($id: Int!) {
    getLot(id: $id) {
      id name description amountPaid acquisitionDate useBuyListForCost
      items {
        id productId productName gameName setName rarity isSingle isSealed
        condition quantity costBasis costOverridden marketValue
      }
      totalMarketValue totalCost projectedProfitLoss projectedProfitMargin
    }
  }
`) as unknown as TypedDocumentString<
  {
    getLot: {
      id: number;
      name: string;
      description: string | null;
      amountPaid: number;
      acquisitionDate: string;
      useBuyListForCost: boolean;
      items: Array<{
        id: number;
        productId: number;
        productName: string;
        gameName: string;
        setName: string;
        rarity: string | null;
        isSingle: boolean;
        isSealed: boolean;
        condition: string | null;
        quantity: number;
        costBasis: number;
        costOverridden: boolean;
        marketValue: number | null;
      }>;
      totalMarketValue: number;
      totalCost: number;
      projectedProfitLoss: number;
      projectedProfitMargin: number;
    } | null;
  },
  { id: number }
>;

const GetBuyRatesQuery = new TypedDocumentString(`
  query GetBuyRatesForLot($categoryId: Int!) {
    getBuyRates(categoryId: $categoryId) {
      id description rate type rarity sortOrder
    }
  }
`) as unknown as TypedDocumentString<
  {
    getBuyRates: Array<{
      id: number;
      description: string;
      rate: number;
      type: string;
      rarity: string | null;
      sortOrder: number;
    }>;
  },
  { categoryId: number }
>;

const CreateLotMutation = new TypedDocumentString(`
  mutation CreateLot($input: CreateLotInput!) {
    createLot(input: $input) { id }
  }
`) as unknown as TypedDocumentString<{ createLot: { id: number } }, { input: unknown }>;

const UpdateLotMutation = new TypedDocumentString(`
  mutation UpdateLot($input: UpdateLotInput!) {
    updateLot(input: $input) { id }
  }
`) as unknown as TypedDocumentString<{ updateLot: { id: number } }, { input: unknown }>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LotItemRow {
  id?: number;
  clientId: string; // local unique key
  productId: number | null;
  productName: string;
  gameName: string;
  setName: string;
  rarity: string | null;
  isSingle: boolean;
  condition: string;
  quantity: number;
  costBasis: number;
  costOverridden: boolean;
  marketPrice: number; // per unit
  searching: boolean;
  searchTerm: string;
  searchResults: Array<{
    id: number;
    name: string;
    gameName: string;
    setName: string;
    rarity: string | null;
    isSingle: boolean;
    isSealed: boolean;
    marketPrice: number;
  }>;
}

interface BuyRateEntry {
  description: string;
  rate: number;
  type: string;
  rarity: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let clientIdCounter = 0;
function nextClientId(): string {
  return `lot-item-${++clientIdCounter}`;
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: never[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T;
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('ogs-lot-page')
export class OgsLotPage extends LitElement {
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean }) canManageLots = false;
  @property({ type: Boolean }) canViewDashboard = false;
  @property({ type: Boolean }) canAccessSettings = false;
  @property({ type: Boolean }) canManageStoreLocations = false;
  @property({ type: Boolean }) canManageUsers = false;
  @property({ type: Boolean }) canViewTransactionLog = false;
  @property({ type: String }) activeOrganizationId = '';
  @property({ type: Boolean }) showStoreSelector = false;
  @property({ type: String }) lotId = '';

  static styles = [
    css`
      ${unsafeCSS(nativeStyle)}
    `,
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    css`
      :host {
        box-sizing: border-box;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      .page-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }
      .page-header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: var(--wa-border-radius-l);
        background: var(--wa-color-brand-fill-normal);
        color: var(--wa-color-brand-on-normal);
        flex-shrink: 0;
      }
      .page-header h2 {
        margin: 0;
        font-size: var(--wa-font-size-2xl);
        font-weight: 700;
      }

      .form-section {
        margin-bottom: 1.5rem;
      }
      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .summary-item {
        padding: 0.75rem;
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-surface-alt);
      }
      .summary-item .label {
        font-size: var(--wa-font-size-xs);
        color: var(--wa-color-text-muted);
        margin-bottom: 0.25rem;
      }
      .summary-item .value {
        font-size: var(--wa-font-size-l);
        font-weight: 600;
      }
      .profit-positive {
        color: var(--wa-color-success-text);
      }
      .profit-negative {
        color: var(--wa-color-danger-text);
      }

      .product-section {
        margin-top: 1.5rem;
      }
      .tab-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        text-align: left;
        padding: 0.5rem 0.5rem;
        font-size: var(--wa-font-size-xs);
        font-weight: 600;
        color: var(--wa-color-text-muted);
        border-bottom: 2px solid var(--wa-color-surface-border);
        white-space: nowrap;
      }
      td {
        padding: 0.375rem 0.5rem;
        vertical-align: middle;
        font-size: var(--wa-font-size-s);
      }
      tr:not(:last-child) td {
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .product-cell {
        position: relative;
        min-width: 200px;
      }
      .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 100;
        max-height: 200px;
        overflow-y: auto;
        background: var(--wa-color-surface-base);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
        box-shadow: var(--wa-shadow-m);
      }
      .search-result-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        cursor: pointer;
        font-size: var(--wa-font-size-s);
      }
      .search-result-item:hover {
        background: var(--wa-color-surface-alt);
      }
      .result-info {
        display: flex;
        flex-direction: column;
      }
      .result-info strong {
        font-size: var(--wa-font-size-s);
      }
      .result-info small {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-xs);
      }

      .quantity-cell {
        width: 70px;
      }
      .cost-cell {
        width: 100px;
        position: relative;
      }
      .cost-cell .reset-btn {
        position: absolute;
        top: 2px;
        right: 2px;
      }
      .market-cell {
        width: 100px;
      }
      .condition-cell {
        width: 100px;
      }
      .actions-cell-td {
        width: 50px;
      }

      .empty-table {
        text-align: center;
        padding: 2rem;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }

      .save-bar {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }
      .save-bar .spacer {
        flex: 1;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        gap: 1rem;
      }

      wa-input {
        --wa-input-height-m: 2.25rem;
      }
      wa-select {
        --wa-input-height-m: 2.25rem;
      }
    `,
  ];

  // --- State ---
  @state() name = '';
  @state() description = '';
  @state() amountPaid = 0;
  @state() acquisitionDate = getTodayDateString();
  @state() useBuyListForCost = true;
  @state() activeTab = 'singles';
  @state() singlesItems: LotItemRow[] = [];
  @state() sealedItems: LotItemRow[] = [];
  @state() saving = false;
  @state() loading = false;
  @state() validationErrors: string[] = [];
  @state() buyRatesByGame: Map<number, BuyRateEntry[]> = new Map();
  @state() gameCategoryMap: Map<string, number> = new Map();

  private isEditMode = false;
  private editLotId: number | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadBuyRates();
    if (this.lotId) {
      this.isEditMode = true;
      this.editLotId = parseInt(this.lotId, 10);
      this.loadLot();
    }
  }

  private async loadBuyRates() {
    try {
      const gamesResult = await execute(GetSupportedGamesQuery);
      const games = gamesResult?.data?.getSupportedGames ?? [];
      const map = new Map<string, number>();
      for (const g of games) map.set(g.name, g.categoryId);
      this.gameCategoryMap = map;

      const ratePromises = games.map(async (game) => {
        const result = await execute(GetBuyRatesQuery, { categoryId: game.categoryId });
        return { categoryId: game.categoryId, entries: result?.data?.getBuyRates ?? [] };
      });
      const results = await Promise.all(ratePromises);
      const rateMap = new Map<number, BuyRateEntry[]>();
      for (const r of results) rateMap.set(r.categoryId, r.entries);
      this.buyRatesByGame = rateMap;
    } catch {
      /* ignore */
    }
  }

  private async loadLot() {
    if (!this.editLotId) return;
    this.loading = true;
    try {
      const result = await execute(GetLotQuery, { id: this.editLotId });
      const lot = result?.data?.getLot;
      if (!lot) return;

      this.name = lot.name;
      this.description = lot.description ?? '';
      this.amountPaid = lot.amountPaid;
      this.acquisitionDate = lot.acquisitionDate;
      this.useBuyListForCost = lot.useBuyListForCost;

      const singles: LotItemRow[] = [];
      const sealed: LotItemRow[] = [];
      for (const item of lot.items) {
        const row: LotItemRow = {
          id: item.id,
          clientId: nextClientId(),
          productId: item.productId,
          productName: item.productName,
          gameName: item.gameName,
          setName: item.setName,
          rarity: item.rarity,
          isSingle: item.isSingle,
          condition: item.condition ?? 'NM',
          quantity: item.quantity,
          costBasis: item.costBasis,
          costOverridden: item.costOverridden,
          marketPrice: item.marketValue != null ? item.marketValue / item.quantity : 0,
          searching: false,
          searchTerm: '',
          searchResults: [],
        };
        if (item.isSingle) singles.push(row);
        else sealed.push(row);
      }
      this.singlesItems = singles;
      this.sealedItems = sealed;
    } catch {
      /* ignore */
    } finally {
      this.loading = false;
    }
  }

  // --- Buy rate helpers ---

  private getBuyRateForRarity(gameName: string, rarity: string | null): BuyRateEntry | null {
    const categoryId = this.gameCategoryMap.get(gameName);
    if (!categoryId) return null;
    const entries = this.buyRatesByGame.get(categoryId) ?? [];
    if (!rarity) return entries[0] ?? null; // fallback to first entry for sealed
    return entries.find((e) => e.rarity === rarity) ?? null;
  }

  private recalculateAutoCosts() {
    if (!this.useBuyListForCost) return;
    const allItems = [...this.singlesItems, ...this.sealedItems];

    // Pass 1: compute overridden total
    let overriddenTotal = 0;
    for (const item of allItems) {
      if (item.costOverridden && item.productId) {
        overriddenTotal += item.costBasis * item.quantity;
      }
    }

    // Pass 2: compute buy-rate-weighted costs for auto items
    const autoItems = allItems.filter((i) => !i.costOverridden && i.productId);
    let totalBuyRateCost = 0;
    const itemBuyRateCosts: Map<string, number> = new Map();
    for (const item of autoItems) {
      const rate = this.getBuyRateForRarity(item.gameName, item.rarity);
      let buyRateCost = 0;
      if (rate) {
        buyRateCost =
          rate.type === 'percentage' ? rate.rate * item.marketPrice * item.quantity : rate.rate * item.quantity;
      }
      itemBuyRateCosts.set(item.clientId, buyRateCost);
      totalBuyRateCost += buyRateCost;
    }

    // Pass 3: distribute remaining budget
    const remainingBudget = this.amountPaid - overriddenTotal;
    for (const item of autoItems) {
      const buyRateCost = itemBuyRateCosts.get(item.clientId) ?? 0;
      if (totalBuyRateCost > 0 && item.quantity > 0) {
        item.costBasis = Math.round((((buyRateCost / totalBuyRateCost) * remainingBudget) / item.quantity) * 100) / 100;
      } else if (autoItems.length > 0 && item.quantity > 0) {
        item.costBasis = Math.round((remainingBudget / autoItems.reduce((s, i) => s + i.quantity, 0)) * 100) / 100;
      }
    }

    this.singlesItems = [...this.singlesItems];
    this.sealedItems = [...this.sealedItems];
  }

  // --- Computed values ---

  private get allItems(): LotItemRow[] {
    return [...this.singlesItems, ...this.sealedItems];
  }

  private get totalMarketValue(): number {
    return this.allItems.reduce((sum, i) => sum + (i.productId ? i.marketPrice * i.quantity : 0), 0);
  }

  private get totalCost(): number {
    return this.allItems.reduce((sum, i) => sum + (i.productId ? i.costBasis * i.quantity : 0), 0);
  }

  private get projectedProfitLoss(): number {
    return this.totalMarketValue - this.totalCost;
  }

  private get projectedProfitMargin(): number {
    return this.totalMarketValue > 0 ? ((this.totalMarketValue - this.totalCost) / this.totalMarketValue) * 100 : 0;
  }

  // --- Actions ---

  private addProductRow(isSingle: boolean) {
    const row: LotItemRow = {
      clientId: nextClientId(),
      productId: null,
      productName: '',
      gameName: '',
      setName: '',
      rarity: null,
      isSingle,
      condition: 'NM',
      quantity: 1,
      costBasis: 0,
      costOverridden: false,
      marketPrice: 0,
      searching: false,
      searchTerm: '',
      searchResults: [],
    };
    if (isSingle) {
      this.singlesItems = [...this.singlesItems, row];
    } else {
      this.sealedItems = [...this.sealedItems, row];
    }
  }

  private removeRow(clientId: string, isSingle: boolean) {
    if (isSingle) {
      this.singlesItems = this.singlesItems.filter((i) => i.clientId !== clientId);
    } else {
      this.sealedItems = this.sealedItems.filter((i) => i.clientId !== clientId);
    }
    this.recalculateAutoCosts();
  }

  private debouncedSearch = debounce((clientId: string, term: string, isSingle: boolean) => {
    this.searchProducts(clientId, term, isSingle);
  }, 300);

  private async searchProducts(clientId: string, term: string, isSingle: boolean) {
    if (term.length < 2) return;
    const items = isSingle ? this.singlesItems : this.sealedItems;
    const idx = items.findIndex((i) => i.clientId === clientId);
    if (idx === -1) return;

    items[idx] = { ...items[idx], searching: true };
    if (isSingle) this.singlesItems = [...items];
    else this.sealedItems = [...items];

    try {
      const result = await execute(SearchProductsQuery, {
        searchTerm: term,
        isSingle: isSingle ? true : null,
        isSealed: isSingle ? null : true,
      });
      const products = result?.data?.searchProducts ?? [];
      const mapped = products.map((p) => {
        const normalPrice = p.prices.find((pr) => pr.subTypeName === 'Normal');
        const fallback = p.prices[0];
        const priceRow = normalPrice ?? fallback;
        return {
          id: p.id,
          name: p.name,
          gameName: p.gameName,
          setName: p.setName,
          rarity: p.rarity,
          isSingle: p.isSingle,
          isSealed: p.isSealed,
          marketPrice: priceRow?.marketPrice ?? priceRow?.midPrice ?? 0,
        };
      });

      const latestItems = isSingle ? this.singlesItems : this.sealedItems;
      const latestIdx = latestItems.findIndex((i) => i.clientId === clientId);
      if (latestIdx !== -1) {
        latestItems[latestIdx] = { ...latestItems[latestIdx], searching: false, searchResults: mapped };
        if (isSingle) this.singlesItems = [...latestItems];
        else this.sealedItems = [...latestItems];
      }
    } catch {
      const latestItems = isSingle ? this.singlesItems : this.sealedItems;
      const latestIdx = latestItems.findIndex((i) => i.clientId === clientId);
      if (latestIdx !== -1) {
        latestItems[latestIdx] = { ...latestItems[latestIdx], searching: false };
        if (isSingle) this.singlesItems = [...latestItems];
        else this.sealedItems = [...latestItems];
      }
    }
  }

  private selectProduct(clientId: string, product: LotItemRow['searchResults'][0], isSingle: boolean) {
    const items = isSingle ? this.singlesItems : this.sealedItems;
    const idx = items.findIndex((i) => i.clientId === clientId);
    if (idx === -1) return;

    items[idx] = {
      ...items[idx],
      productId: product.id,
      productName: product.name,
      gameName: product.gameName,
      setName: product.setName,
      rarity: product.rarity,
      isSingle: product.isSingle,
      marketPrice: product.marketPrice,
      searchResults: [],
      searchTerm: '',
    };
    if (isSingle) this.singlesItems = [...items];
    else this.sealedItems = [...items];
    this.recalculateAutoCosts();
  }

  private updateItemField(clientId: string, isSingle: boolean, field: string, value: unknown) {
    const items = isSingle ? this.singlesItems : this.sealedItems;
    const idx = items.findIndex((i) => i.clientId === clientId);
    if (idx === -1) return;
    items[idx] = { ...items[idx], [field]: value };
    if (isSingle) this.singlesItems = [...items];
    else this.sealedItems = [...items];

    if (field === 'quantity') this.recalculateAutoCosts();
  }

  private overrideCost(clientId: string, isSingle: boolean, value: number) {
    const items = isSingle ? this.singlesItems : this.sealedItems;
    const idx = items.findIndex((i) => i.clientId === clientId);
    if (idx === -1) return;
    items[idx] = { ...items[idx], costBasis: value, costOverridden: true };
    if (isSingle) this.singlesItems = [...items];
    else this.sealedItems = [...items];
    this.recalculateAutoCosts();
  }

  private resetCost(clientId: string, isSingle: boolean) {
    const items = isSingle ? this.singlesItems : this.sealedItems;
    const idx = items.findIndex((i) => i.clientId === clientId);
    if (idx === -1) return;
    items[idx] = { ...items[idx], costOverridden: false };
    if (isSingle) this.singlesItems = [...items];
    else this.sealedItems = [...items];
    this.recalculateAutoCosts();
  }

  private validate(): string[] {
    const errors: string[] = [];
    if (!this.name.trim()) errors.push('Lot name is required');
    if (this.amountPaid < 0) errors.push('Amount paid must be non-negative');
    if (!this.acquisitionDate) errors.push('Acquisition date is required');

    const allItems = this.allItems.filter((i) => i.productId != null);
    if (allItems.length === 0) errors.push('At least one product must be added');

    for (const item of allItems) {
      if (item.quantity < 1) errors.push(`${item.productName}: quantity must be at least 1`);
    }

    const totalCost = allItems.reduce((sum, i) => sum + i.costBasis * i.quantity, 0);
    if (Math.abs(totalCost - this.amountPaid) > 0.01) {
      errors.push(
        `Total cost (${formatCurrency(totalCost)}) does not match amount paid (${formatCurrency(this.amountPaid)})`,
      );
    }

    return errors;
  }

  private async handleSave() {
    const errors = this.validate();
    if (errors.length > 0) {
      this.validationErrors = errors;
      return;
    }
    this.validationErrors = [];
    this.saving = true;

    const allItems = this.allItems.filter((i) => i.productId != null);
    const items = allItems.map((i) => ({
      id: i.id ?? undefined,
      productId: i.productId!,
      condition: i.isSingle ? i.condition : null,
      quantity: i.quantity,
      costBasis: i.costBasis,
      costOverridden: i.costOverridden,
    }));

    const input = {
      ...(this.isEditMode ? { id: this.editLotId } : {}),
      name: this.name.trim(),
      description: this.description.trim() || null,
      amountPaid: this.amountPaid,
      acquisitionDate: this.acquisitionDate,
      useBuyListForCost: this.useBuyListForCost,
      items,
    };

    try {
      if (this.isEditMode) {
        await execute(UpdateLotMutation, { input });
      } else {
        await execute(CreateLotMutation, { input });
      }
      window.location.href = '/lots';
    } catch (e) {
      this.validationErrors = [e instanceof Error ? e.message : 'Failed to save lot'];
    } finally {
      this.saving = false;
    }
  }

  // --- Render ---

  render() {
    return html`
      <ogs-page
        activePage="lots"
        ?showUserMenu="${true}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
        ?canManageInventory="${this.canManageInventory}"
        ?canManageLots="${this.canManageLots}"
        ?canViewDashboard="${this.canViewDashboard}"
        ?canAccessSettings="${this.canAccessSettings}"
        ?canManageStoreLocations="${this.canManageStoreLocations}"
        ?canManageUsers="${this.canManageUsers}"
        ?canViewTransactionLog="${this.canViewTransactionLog}"
        activeOrganizationId="${this.activeOrganizationId}"
        ?showStoreSelector="${this.showStoreSelector}"
      >
        <div class="page-header">
          <div class="page-header-icon">
            <wa-icon name="layer-group" style="font-size: 1.5rem;"></wa-icon>
          </div>
          <h2>${this.isEditMode ? 'Edit Lot' : 'Add Lot'}</h2>
        </div>

        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading lot...</span>
            </div>
          `,
          () => html`
            ${this.validationErrors.length > 0
              ? html`
                  <wa-callout variant="danger" style="margin-bottom: 1rem;">
                    <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                    ${this.validationErrors.map((e) => html`<div>${e}</div>`)}
                  </wa-callout>
                `
              : nothing}

            <ogs-two-pane-panel>
              <div slot="start">${this.renderLotDetails()}</div>
              <div slot="end">${this.renderSummary()}</div>
            </ogs-two-pane-panel>

            <div class="product-section">${this.renderProductList()}</div>

            <div class="save-bar">
              <wa-button variant="neutral" href="/lots">Cancel</wa-button>
              <div class="spacer"></div>
              <wa-button variant="brand" ?loading="${this.saving}" @click="${this.handleSave}">
                <wa-icon slot="start" name="floppy-disk"></wa-icon>
                ${this.isEditMode ? 'Update Lot' : 'Save Lot'}
              </wa-button>
            </div>
          `,
        )}
      </ogs-page>
    `;
  }

  private renderLotDetails() {
    return html`
      <wa-card appearance="outline">
        <div slot="header" style="font-weight: 600;">Lot Details</div>
        <div class="form-fields">
          <wa-input
            label="Lot Name"
            .value="${this.name}"
            @input="${(e: Event) => {
              this.name = (e.target as HTMLInputElement).value;
            }}"
          ></wa-input>
          <wa-textarea
            label="Description"
            .value="${this.description}"
            @input="${(e: Event) => {
              this.description = (e.target as HTMLTextAreaElement).value;
            }}"
            rows="2"
          ></wa-textarea>
          <wa-input
            label="Amount Paid"
            type="number"
            step="0.01"
            min="0"
            .value="${String(this.amountPaid)}"
            @input="${(e: Event) => {
              this.amountPaid = parseFloat((e.target as HTMLInputElement).value) || 0;
              this.recalculateAutoCosts();
            }}"
          >
            <span slot="prefix">$</span>
          </wa-input>
          <wa-input
            label="Acquisition Date"
            type="date"
            .value="${this.acquisitionDate}"
            @input="${(e: Event) => {
              this.acquisitionDate = (e.target as HTMLInputElement).value;
            }}"
          ></wa-input>
          <wa-checkbox
            ?checked="${this.useBuyListForCost}"
            @wa-change="${(e: CustomEvent) => {
              this.useBuyListForCost = (e.target as HTMLInputElement).checked;
              this.recalculateAutoCosts();
            }}"
          >
            Use buy list for cost
          </wa-checkbox>
        </div>
      </wa-card>
    `;
  }

  private renderSummary() {
    return html`
      <wa-card appearance="outline">
        <div slot="header" style="font-weight: 600;">Summary</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="label">Total Market Value</div>
            <div class="value">${formatCurrency(this.totalMarketValue)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Cost</div>
            <div class="value">${formatCurrency(this.totalCost)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Projected Profit/Loss</div>
            <div class="value ${this.projectedProfitLoss >= 0 ? 'profit-positive' : 'profit-negative'}">
              ${formatCurrency(this.projectedProfitLoss)}
            </div>
          </div>
          <div class="summary-item">
            <div class="label">Projected Margin</div>
            <div class="value ${this.projectedProfitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">
              ${this.projectedProfitMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      </wa-card>
    `;
  }

  private renderProductList() {
    return html`
      <wa-card appearance="outline">
        <wa-tab-group
          @wa-tab-show="${(e: CustomEvent) => {
            this.activeTab =
              (e.target as HTMLElement).querySelector('wa-tab[active]')?.getAttribute('panel') ?? 'singles';
          }}"
        >
          <wa-tab slot="nav" panel="singles">Singles</wa-tab>
          <wa-tab slot="nav" panel="sealed">Sealed</wa-tab>

          <wa-tab-panel name="singles">
            <div class="tab-actions">
              <wa-button variant="neutral" size="small" @click="${() => this.addProductRow(true)}">
                <wa-icon slot="start" name="plus"></wa-icon>
                Add Product
              </wa-button>
            </div>
            ${this.renderItemsTable(this.singlesItems, true)}
          </wa-tab-panel>

          <wa-tab-panel name="sealed">
            <div class="tab-actions">
              <wa-button variant="neutral" size="small" @click="${() => this.addProductRow(false)}">
                <wa-icon slot="start" name="plus"></wa-icon>
                Add Product
              </wa-button>
            </div>
            ${this.renderItemsTable(this.sealedItems, false)}
          </wa-tab-panel>
        </wa-tab-group>
      </wa-card>
    `;
  }

  private renderItemsTable(items: LotItemRow[], isSingle: boolean) {
    if (items.length === 0) {
      return html`<div class="empty-table">No products added yet. Click "Add Product" to get started.</div>`;
    }

    return html`
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Game</th>
            <th>Set</th>
            ${isSingle
              ? html`<th>Rarity</th>
                  <th class="condition-cell">Condition</th>`
              : nothing}
            <th class="quantity-cell">Qty</th>
            <th class="cost-cell">Cost</th>
            <th class="market-cell">Market</th>
            <th class="actions-cell-td"></th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => this.renderItemRow(item, isSingle))}
        </tbody>
      </table>
    `;
  }

  private renderItemRow(item: LotItemRow, isSingle: boolean) {
    const costReadOnly = this.useBuyListForCost && !item.costOverridden;

    return html`
      <tr>
        <td class="product-cell">
          ${item.productId
            ? html`<strong>${item.productName}</strong>`
            : html`
                <wa-input
                  size="small"
                  placeholder="Search product..."
                  .value="${item.searchTerm}"
                  @input="${(e: Event) => {
                    const val = (e.target as HTMLInputElement).value;
                    this.updateItemField(item.clientId, isSingle, 'searchTerm', val);
                    this.debouncedSearch(item.clientId, val, isSingle);
                  }}"
                >
                  <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
                  ${when(item.searching, () => html`<wa-spinner slot="suffix"></wa-spinner>`)}
                </wa-input>
                ${item.searchResults.length > 0
                  ? html`
                      <div class="search-results">
                        ${item.searchResults.map(
                          (p) => html`
                            <div
                              class="search-result-item"
                              @click="${() => this.selectProduct(item.clientId, p, isSingle)}"
                            >
                              <div class="result-info">
                                <strong>${p.name}</strong>
                                <small>${p.setName}${p.rarity ? ` - ${p.rarity}` : ''}</small>
                              </div>
                            </div>
                          `,
                        )}
                      </div>
                    `
                  : nothing}
              `}
        </td>
        <td>${item.gameName}</td>
        <td>${item.setName}</td>
        ${isSingle
          ? html`
              <td>${item.rarity ?? ''}</td>
              <td class="condition-cell">
                <wa-select
                  size="small"
                  .value="${item.condition}"
                  @wa-change="${(e: CustomEvent) => {
                    this.updateItemField(item.clientId, isSingle, 'condition', (e.target as HTMLSelectElement).value);
                  }}"
                >
                  <wa-option value="NM">NM</wa-option>
                  <wa-option value="LP">LP</wa-option>
                  <wa-option value="MP">MP</wa-option>
                  <wa-option value="HP">HP</wa-option>
                  <wa-option value="D">D</wa-option>
                </wa-select>
              </td>
            `
          : nothing}
        <td class="quantity-cell">
          <wa-input
            size="small"
            type="number"
            min="1"
            .value="${String(item.quantity)}"
            @input="${(e: Event) => {
              this.updateItemField(
                item.clientId,
                isSingle,
                'quantity',
                parseInt((e.target as HTMLInputElement).value, 10) || 1,
              );
            }}"
          ></wa-input>
        </td>
        <td class="cost-cell">
          <wa-input
            size="small"
            type="number"
            step="0.01"
            min="0"
            .value="${String(item.costBasis)}"
            ?readonly="${costReadOnly}"
            @input="${(e: Event) => {
              if (!costReadOnly) {
                this.overrideCost(item.clientId, isSingle, parseFloat((e.target as HTMLInputElement).value) || 0);
              }
            }}"
            @focus="${() => {
              if (this.useBuyListForCost && !item.costOverridden) {
                this.overrideCost(item.clientId, isSingle, item.costBasis);
              }
            }}"
          >
            <span slot="prefix">$</span>
          </wa-input>
          ${this.useBuyListForCost && item.costOverridden
            ? html`
                <wa-button
                  class="reset-btn"
                  variant="text"
                  size="small"
                  @click="${() => this.resetCost(item.clientId, isSingle)}"
                  title="Reset to auto-calculated"
                >
                  <wa-icon name="rotate-left" style="font-size: 0.75rem;"></wa-icon>
                </wa-button>
              `
            : nothing}
        </td>
        <td class="market-cell">${item.marketPrice > 0 ? formatCurrency(item.marketPrice) : '-'}</td>
        <td class="actions-cell-td">
          <wa-button variant="text" size="small" @click="${() => this.removeRow(item.clientId, isSingle)}">
            <wa-icon name="trash"></wa-icon>
          </wa-button>
        </td>
      </tr>
    `;
  }
}
