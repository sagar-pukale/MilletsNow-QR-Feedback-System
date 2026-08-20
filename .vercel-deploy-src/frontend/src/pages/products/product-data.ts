export type ProductRecord = {
  id: string
  name: string
  sku: string
  category: string
  price: string
  stock: number
  status: 'Active' | 'Draft' | 'Archived'
  qrGenerated: number
  createdDate: string
  image: string
}
