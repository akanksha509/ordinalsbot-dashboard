import { NextRequest, NextResponse } from 'next/server'
import {
  Order,
  OrderResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  OrdinalsOrderPayload,
} from '@/types'
import { getNetworkFromEnv } from '@/lib/utils/index'

function getOrdinalsApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }
  
  const network = getNetworkFromEnv()
  return network === 'testnet' 
    ? 'https://testnet-api.ordinalsbot.com'
    : 'https://api.ordinalsbot.com'
}

const API_KEY = process.env.ORDINALSBOT_API_KEY!
const BASE_URL = getOrdinalsApiUrl()

// Generic fetch wrapper 
async function ordinalsFetch(path: string, opts: RequestInit = {}) {
  if (!API_KEY) throw new Error('OrdinalsBot API key is not configured')
  const url = path.startsWith('http') ? path : BASE_URL + path
  
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  })
  
  const responseText = await res.text()
  
  if (!res.ok) {
    throw new Error(`OrdinalsBot API error ${res.status}: ${responseText}`)
  }
  
  try {
    return JSON.parse(responseText)
  } catch (e) {
    throw new Error(`Invalid JSON response: ${responseText}`)
  }
}

// Simple BRC-20 validator
function validateBRC20(details: any, op: string): string | null {
  if (!details) return 'BRC-20 details required'
  if (typeof details.ticker !== 'string') return 'Ticker must be a string'
  if (details.ticker.length < 1 || details.ticker.length > 4)
    return 'Ticker must be 1–4 chars'
  if (details.operation !== op) return `Operation must be "${op}"`
  if (op === 'deploy') {
    const max = Number(details.maxSupply)
    if (isNaN(max) || max <= 0) return 'Max supply must be positive'
    const lim = Number(details.mintLimit)
    if (isNaN(lim) || lim <= 0) return 'Mint limit must be positive'
    if (lim > max) return 'Mint limit cannot exceed maxSupply'
    if (details.decimals !== undefined) {
      const d = Number(details.decimals)
      if (isNaN(d) || d < 0 || d > 18) return 'Decimals must be 0–18'
    }
  }
  if (op === 'mint' || op === 'transfer') {
    const amt = Number(details.amount)
    if (isNaN(amt) || amt <= 0) return 'Amount must be positive'
    if (op === 'transfer') {
      if (typeof details.to !== 'string') return 'Recipient must be a string'
      const rx = [
        /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
        /^bc1[0-9a-z]{39,59}$/,
        /^tb1[0-9a-z]{39,59}$/,
      ]
      if (!rx.some(r => r.test(details.to))) return 'Recipient address invalid'
    }
  }
  return null
}

// Convert CreateOrderRequest -> OrdinalsBot payload
function convertToOrdinalsFormat(order: CreateOrderRequest): OrdinalsOrderPayload {
  const network = getNetworkFromEnv()
  const isTestnet = getNetworkFromEnv() === 'testnet'
  const defaultFee = isTestnet ? 3000 : 15000
  const payload: OrdinalsOrderPayload = {
    receiveAddress: order.receiveAddress,
    fee: order.fee ?? defaultFee,
  }

  const toB64 = (v: string | ArrayBuffer) =>
    typeof v === 'string' && v.startsWith('data:')
      ? v
      : `data:${(v as any).type ?? 'application/octet-stream'};base64/${
          typeof v === 'string' ? v : Buffer.from(v).toString('base64')
        }`

  if (order.type === 'inscription') {
    if (order.files?.length) {
      payload.files = order.files.map(f => ({
        name: f.name,
        dataURL: toB64(f.content),
        size: f.size,
      }))
    } else if (order.textContent) {
      const b64 = Buffer.from(order.textContent).toString('base64')
      payload.files = [
        {
          name: order.title || 'text.txt',
          dataURL: `data:text/plain;base64,${b64}`,
          size: order.textContent.length,
        },
      ]
    }
  }

  else if (order.type.startsWith('brc20')) {
    const op = order.type.replace('brc20-', '') as 'deploy' | 'mint' | 'transfer'
    const js: any = { p: 'brc-20', op, tick: order.brc20Details!.ticker }
    if (op === 'deploy') {
      js.max = String(order.brc20Details!.maxSupply)
      js.lim = String(order.brc20Details!.mintLimit)
      if (order.brc20Details!.decimals !== undefined)
        js.dec = String(order.brc20Details!.decimals)
    } else {
      js.amt = String(order.brc20Details!.amount)
      if (op === 'transfer') js.to = order.brc20Details!.to
    }
    const txt = JSON.stringify(js)
    const b64 = Buffer.from(txt).toString('base64')
    payload.files = [
      {
        name: `${order.brc20Details!.ticker}-${op}.txt`,
        dataURL: `data:application/json;base64,${b64}`,
        size: txt.length,
      },
    ]
  }

  if (order.title) payload.title = order.title
  if (order.description) payload.description = order.description

  return payload
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Order ID required' },
      { status: 400 }
    )
  }

  try {
    const data = await ordinalsFetch(`/order?id=${encodeURIComponent(id)}`)
    const network = getNetworkFromEnv()
    
    // Handle the response format 
    const orderData = data.data || data
    
    const order: Order = {
      id: orderData.id || id,
      type: orderData.type || 'inscription',
      status: orderData.status || orderData.state || 'pending',
      createdAt: orderData.createdAt || orderData.timestamp || Date.now(),
      updatedAt: orderData.updatedAt || orderData.createdAt || Date.now(),
      paymentAddress: orderData.paymentAddress || orderData.charge?.address || orderData.feeCharge?.address || '',
      paymentAmount: orderData.paymentAmount || orderData.charge?.amount || orderData.feeCharge?.amount || 0,
      feeRate: orderData.feeRate || 15,
      totalFee: orderData.totalFee || orderData.fee || orderData.paymentAmount || 0,
      receiveAddress: orderData.receiveAddress || orderData.paymentAddress || '',
      network: network as 'mainnet' | 'testnet',
      
      // Additional fields that might be present
      txid: orderData.txid,
      inscriptionId: orderData.inscriptionId,
      inscriptionNumber: orderData.inscriptionNumber,
      confirmations: orderData.confirmations,
      files: orderData.files,
      brc20Details: orderData.brc20Details,
      
      // Keep raw data for debugging
      metadata: {
        rawResponse: orderData
      }
    }
    
    return NextResponse.json({ success: true, data: order } as OrderResponse, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    })
    
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    )
  }
}

// POST: create new order
export async function POST(req: NextRequest) {
  let body: CreateOrderRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  if (!body.receiveAddress)
    return NextResponse.json(
      { success: false, error: 'Receive address required' },
      { status: 400 }
    )
  if (!body.type)
    return NextResponse.json(
      { success: false, error: 'Order type required' },
      { status: 400 }
    )
  if (body.type === 'inscription' && !body.files?.length && !body.textContent)
    return NextResponse.json(
      { success: false, error: 'Files or text required for inscription' },
      { status: 400 }
    )

  if (body.type.startsWith('brc20')) {
    const op = body.type.replace('brc20-', '')
    const err = validateBRC20(body.brc20Details, op)
    if (err)
      return NextResponse.json(
        { success: false, error: `BRC-20 validation failed: ${err}` },
        { status: 400 }
      )
  }

  try {
    const payload = convertToOrdinalsFormat(body)
    
    const data = await ordinalsFetch('/order', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const network = getNetworkFromEnv()

    const resp: CreateOrderResponse = {
      success: true,
      data: {
        orderId: data.data?.id || data.id,
        paymentAddress: data.data?.paymentAddress || data.paymentAddress,
        amount: data.data?.amount || data.amount || payload.fee,
        feeRate: data.data?.feeRate || payload.fee,
        network,
      },
    }
    return NextResponse.json(resp, { status: 201 })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id)
    return NextResponse.json(
      { success: false, error: 'Order ID required' },
      { status: 400 }
    )
  const update = await req.json()
  try {
    const data = await ordinalsFetch(`/order/${id}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    })
    const network = getNetworkFromEnv()
    const order: Order = { ...(data.data || data), network }
    return NextResponse.json({ success: true, data: order })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id)
    return NextResponse.json(
      { success: false, error: 'Order ID required' },
      { status: 400 }
    )
  try {
    const data = await ordinalsFetch(`/order/${id}`, { method: 'DELETE' })
    const network = getNetworkFromEnv()
    const order: Order = { ...(data.data || data), network }
    return NextResponse.json({ success: true, data: order })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  })
}