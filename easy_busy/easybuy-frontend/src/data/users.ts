import type { ShippingAddress, User } from '@/types'

export const demoCustomer: User = {
  id: 'u-1001',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@example.com',
  phone: '9876543210',
  role: 'CUSTOMER',
}

export const demoAdmin: User = {
  id: 'u-0001',
  name: 'Store Admin',
  email: 'admin@easybuy.dev',
  phone: '9000000000',
  role: 'ADMIN',
}

export const demoAddress: ShippingAddress = {
  fullName: 'Aarav Sharma',
  phone: '9876543210',
  email: 'aarav.sharma@example.com',
  line1: '221, Lakeview Residency',
  line2: 'HSR Layout, Sector 2',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560102',
  country: 'India',
}

export const indianStates = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]
