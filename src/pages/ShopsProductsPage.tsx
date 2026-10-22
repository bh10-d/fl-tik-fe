import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ShoppingBag,
  ExternalLink,
  Package,
  Search,
  RefreshCw,
  Loader2,
  Tag,
  Store,
  Users,
  Video as VideoIcon,
  Eye,
  Heart,
  ArrowRight,
} from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useApp } from '@/context/AppContext'
import { Shop, Product } from '@/types'
import { shopService } from '@/services/shop.service'
import { productService } from '@/services/product.service'
import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatTimeAgo,
} from '@/utils/formatters'

export function ShopsProductsPage() {
  const { settings, refreshKey } = useApp()

  const [shops, setShops] = useState<Shop[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'shops' | 'products'>('shops')
  const [search, setSearch] = useState('')
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loadingProductDetail, setLoadingProductDetail] = useState(false)
  const [loadingShopDetail, setLoadingShopDetail] = useState(false)
  const [shopSheetOpen, setShopSheetOpen] = useState(false)
  const [productSheetOpen, setProductSheetOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [shopsData, productsData] = await Promise.all([
        shopService.getShops().catch(() => []),
        productService.getProducts().catch(() => []),
      ])
      setShops(shopsData)
      setProducts(productsData)
    } catch (err) {
      console.error('Failed to load shops and products:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  // Filtered Shops
  const filteredShops = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return shops
    return shops.filter((s) => s.name.toLowerCase().includes(q))
  }, [shops, search])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return products
    return products.filter((p) => {
      const shopName = p.shop?.name || ''
      return p.name.toLowerCase().includes(q) || shopName.toLowerCase().includes(q)
    })
  }, [products, search])

  const openShopDetails = async (shop: Shop) => {
    setSelectedShop(shop)
    setShopSheetOpen(true)
    setLoadingShopDetail(true)
    try {
      const full = await shopService.getShopById(shop.id)
      setSelectedShop(full)
    } catch (err) {
      console.error('Failed to load shop full details:', err)
    } finally {
      setLoadingShopDetail(false)
    }
  }

  const openProductDetails = async (product: Product) => {
    setSelectedProduct(product)
    setProductSheetOpen(true)
    setLoadingProductDetail(true)
    try {
      const full = await productService.getProductById(product.id)
      setSelectedProduct(full)
    } catch (err) {
      console.error('Failed to load product full details:', err)
    } finally {
      setLoadingProductDetail(false)
    }
  }

  const totalAssociations = useMemo(() => {
    return products.reduce((sum, p) => sum + (p._count?.videoAssociations || 0), 0)
  }, [products])

  const activeShopsCount = useMemo(() => {
    return shops.filter(
      (s) => !s.trackingStatus || s.trackingStatus.toUpperCase() === 'ACTIVE'
    ).length
  }, [shops])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Competitor Shops & Products
            </h1>
            <Badge variant="outline" className="text-xs">
              TikTok Shop US
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            TikTok Shop US Intelligence: Track seller storefronts, product catalog associations, and affiliate creator networks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs"
            title="Refresh shops and products"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tracked US Shops</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {formatCompactNumber(shops.length)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Brand sellers & storefronts</p>
        </Card>

        <Card className="p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Catalog Products</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {formatCompactNumber(products.length)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Indexed TikTok Shop items</p>
        </Card>

        <Card className="p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Storefronts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {formatCompactNumber(activeShopsCount)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Active monitoring status</p>
        </Card>

        <Card className="p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Linked Video Promos</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <VideoIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {formatCompactNumber(totalAssociations)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Videos tagging products</p>
        </Card>
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'shops' | 'products')}
        >
          <TabsList className="h-8">
            <TabsTrigger value="shops" className="h-7 text-xs gap-1.5">
              <Store className="h-3.5 w-3.5" /> Tracked Shops ({shops.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="h-7 text-xs gap-1.5">
              <Package className="h-3.5 w-3.5" /> Tagged Products ({products.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === 'shops'
                ? 'Search brand shops...'
                : 'Search products or shops...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Shops Table */}
      {activeTab === 'shops' && (
        <Card className="shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead className="text-center">Catalog Products</TableHead>
                  <TableHead>First Indexed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Loading shops from database...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredShops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      No competitor shops found in database.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShops.map((shop) => {
                    const statusVariant =
                      shop.trackingStatus?.toUpperCase() === 'ACTIVE' ? 'success' : 'secondary'
                    const productCount = shop._count?.products ?? 0

                    return (
                      <TableRow key={shop.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground border shrink-0">
                              <Store className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p
                                className="font-semibold text-xs text-foreground hover:underline cursor-pointer truncate"
                                onClick={() => openShopDetails(shop)}
                              >
                                {shop.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono truncate">
                                ID: {shop.externalShopId || shop.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {shop.market || 'US'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center font-mono text-xs">
                          <Badge variant="secondary" className="text-[10px]">
                            {productCount} items
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs">
                            <span className="text-foreground block">
                              {formatDate(shop.createdAt, settings.displayTimezone)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimeAgo(shop.createdAt)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={statusVariant} className="capitalize text-[10px]">
                            {shop.trackingStatus || 'Active'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => openShopDetails(shop)}
                            >
                              Details
                            </Button>
                            {shop.shopUrl && (
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2"
                              >
                                <a href={shop.shopUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      {activeTab === 'products' && (
        <Card className="shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[340px]">Product</TableHead>
                  <TableHead>Shop Brand</TableHead>
                  <TableHead>External SKU</TableHead>
                  <TableHead className="text-center">Promoting Promos</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Loading product catalog...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      No TikTok Shop products found in catalog.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((prod) => {
                    const shopName = prod.shop?.name || 'Unassigned'
                    const promoCount = prod._count?.videoAssociations ?? 0

                    return (
                      <TableRow key={prod.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded border bg-muted overflow-hidden shrink-0">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                  <Tag className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p
                                className="font-semibold text-xs text-foreground hover:underline cursor-pointer truncate"
                                onClick={() => openProductDetails(prod)}
                              >
                                {prod.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                Internal ID: {prod.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Store className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground truncate">
                              {shopName}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {prod.externalProductId || '—'}
                        </TableCell>

                        <TableCell className="text-center font-mono text-xs">
                          <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                            <VideoIcon className="h-2.5 w-2.5" />
                            {promoCount} videos
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs">
                            <span className="text-foreground block">
                              {formatDate(prod.createdAt, settings.displayTimezone)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimeAgo(prod.createdAt)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => openProductDetails(prod)}
                            >
                              Details
                            </Button>
                            {prod.productUrl && (
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2"
                              >
                                <a href={prod.productUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Shop Detail Sheet */}
      <Sheet open={shopSheetOpen} onOpenChange={setShopSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedShop && (
            <div className="space-y-4">
              <SheetHeader className="text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="text-base font-bold flex items-center gap-2">
                      <Store className="h-4 w-4 text-primary" />
                      {selectedShop.name}
                    </SheetTitle>
                    <SheetDescription className="text-xs mt-0.5">
                      TikTok Shop US Merchant Profile
                    </SheetDescription>
                  </div>
                  {selectedShop.shopUrl && (
                    <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs shrink-0">
                      <a href={selectedShop.shopUrl} target="_blank" rel="noreferrer">
                        Storefront <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border p-2.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Market Region
                  </span>
                  <span className="font-semibold text-xs mt-0.5 block uppercase">
                    {selectedShop.market || 'US'}
                  </span>
                </div>
                <div className="rounded-md border p-2.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Monitoring Status
                  </span>
                  <Badge variant="outline" className="text-[10px] mt-0.5 capitalize">
                    {selectedShop.trackingStatus || 'Active'}
                  </Badge>
                </div>
              </div>

              <div className="rounded-md border p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">External Shop ID:</span>
                  <span className="font-mono">{selectedShop.externalShopId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registered In DB:</span>
                  <span className="font-mono">
                    {formatDateTime(selectedShop.createdAt, settings.displayTimezone)}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Products In Catalog
                </h4>
                {loadingShopDetail ? (
                  <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading catalog...
                  </div>
                ) : products.filter((p) => p.shopId === selectedShop.id).length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No products indexed under this shop yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products
                      .filter((p) => p.shopId === selectedShop.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-2 rounded-md border text-xs hover:bg-muted/30 transition-colors"
                        >
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="h-9 w-9 rounded object-cover border shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded bg-muted flex items-center justify-center text-muted-foreground border shrink-0">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p
                              className="font-medium truncate hover:underline cursor-pointer"
                              onClick={() => {
                                setShopSheetOpen(false)
                                openProductDetails(p)
                              }}
                            >
                              {p.name}
                            </p>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              SKU: {p.externalProductId || p.id}
                            </span>
                          </div>
                          {p.productUrl && (
                            <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <a href={p.productUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Product Detail Sheet */}
      <Sheet open={productSheetOpen} onOpenChange={setProductSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedProduct && (
            <div className="space-y-4">
              <SheetHeader className="text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="text-base font-bold">
                      {selectedProduct.name}
                    </SheetTitle>
                    <SheetDescription className="text-xs mt-0.5">
                      TikTok Shop SKU Details
                    </SheetDescription>
                  </div>
                  {selectedProduct.productUrl && (
                    <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs shrink-0">
                      <a href={selectedProduct.productUrl} target="_blank" rel="noreferrer">
                        Store <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </SheetHeader>

              {selectedProduct.imageUrl && (
                <div className="rounded-md border overflow-hidden aspect-video bg-muted">
                  <img
                    src={selectedProduct.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="rounded-md border p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shop Brand:</span>
                  <span className="font-semibold text-foreground">{selectedProduct.shop?.name || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">External SKU:</span>
                  <span className="font-mono text-foreground">{selectedProduct.externalProductId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Tracked:</span>
                  <span className="font-mono text-foreground">
                    {formatDateTime(selectedProduct.createdAt, settings.displayTimezone)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Promoting Videos & Creators Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Promoting Videos & Creators ({selectedProduct.videoAssociations?.length || 0})
                  </h4>
                  <span className="text-[10px] text-muted-foreground">US Affiliate Promos</span>
                </div>

                {loadingProductDetail ? (
                  <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading promoting videos...
                  </div>
                ) : !selectedProduct.videoAssociations || selectedProduct.videoAssociations.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground space-y-1">
                    <VideoIcon className="h-5 w-5 mx-auto text-muted-foreground/40" />
                    <p className="font-medium text-foreground">No Video Promotions Linked Yet</p>
                    <p className="text-[11px]">
                      When creators tag this product in their videos, the associations and creator analytics will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedProduct.videoAssociations.map((assoc) => {
                      const v = assoc.video
                      if (!v) return null
                      const creator = (v as any).creator

                      return (
                        <div
                          key={assoc.id}
                          className="rounded-md border p-2.5 hover:bg-muted/30 transition-colors text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {creator?.avatarUrl ? (
                                <img
                                  src={creator.avatarUrl}
                                  alt=""
                                  className="h-5 w-5 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="font-medium text-foreground truncate">
                                @{creator?.username || 'creator'}
                              </span>
                            </div>

                            <a
                              href={v.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 shrink-0"
                            >
                              Watch Video <ArrowRight className="h-2.5 w-2.5" />
                            </a>
                          </div>

                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {v.caption || 'No caption'}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                            <div className="flex items-center gap-2.5">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {formatCompactNumber(v.views)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" /> {formatCompactNumber(v.likes)}
                              </span>
                            </div>
                            <span>{formatDate(v.publishedAt, settings.displayTimezone)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
