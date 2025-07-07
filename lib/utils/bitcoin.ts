import { UTXO } from '@/types'

export class BitcoinUtils {
  // Filter out inscribed UTXOs to prevent burning ordinals
  static filterInscribedUTXOs(utxos: UTXO[]): UTXO[] {
    return utxos.filter(utxo => {
      if (utxo.inscriptions && utxo.inscriptions.length > 0) {
        return false
      }
      
      if (utxo.value <= 546) { // Dust limit
        return false
      }
      
      return true
    })
  }

  // Calculate total value of UTXOs
  static calculateTotalValue(utxos: UTXO[]): number {
    return utxos.reduce((total, utxo) => total + utxo.value, 0)
  }

  // Select UTXOs for a transaction
  static selectUTXOs(
    utxos: UTXO[],
    targetAmount: number,
    feeRate: number,
    inputSize: number = 148,
    outputSize: number = 34
  ): {
    selectedUTXOs: UTXO[]
    totalInput: number
    estimatedFee: number
    change: number
  } {
    const safeUTXOs = this.filterInscribedUTXOs(utxos)
    const sortedUTXOs = [...safeUTXOs].sort((a, b) => b.value - a.value)
    
    const selectedUTXOs: UTXO[] = []
    let totalInput = 0
    
    for (const utxo of sortedUTXOs) {
      selectedUTXOs.push(utxo)
      totalInput += utxo.value
      
      const estimatedSize = selectedUTXOs.length * inputSize + 2 * outputSize + 10
      const estimatedFee = Math.ceil(estimatedSize * feeRate)
      
      if (totalInput >= targetAmount + estimatedFee) {
        const change = totalInput - targetAmount - estimatedFee
        return {
          selectedUTXOs,
          totalInput,
          estimatedFee,
          change
        }
      }
    }
    
    throw new Error('Insufficient funds for transaction')
  }

  // Estimate transaction size
  static estimateTransactionSize(inputCount: number, outputCount: number): number {
    return inputCount * 68 + outputCount * 31 + 10
  }

  // Calculate fee for transaction
  static calculateFee(inputCount: number, outputCount: number, feeRate: number): number {
    const size = this.estimateTransactionSize(inputCount, outputCount)
    return Math.ceil(size * feeRate)
  }


  // Convert satoshis to BTC
  static satsToBTC(sats: number): number {
    return sats / 100000000
  }

  // Convert BTC to satoshis
  static btcToSats(btc: number): number {
    return Math.round(btc * 100000000)
  }

  // Format satoshis for display
  static formatSats(sats: number, showUnit: boolean = true): string {
    const formatted = sats.toLocaleString()
    return showUnit ? `${formatted} sats` : formatted
  }

  // Validate Bitcoin address format
  static validateAddress(address: string, network: 'mainnet' | 'testnet' = 'mainnet'): boolean {
    if (!address || typeof address !== 'string') return false
    
    if (network === 'mainnet') {
      const p2pkh = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/
      const p2sh = /^3[1-9A-HJ-NP-Za-km-z]{25,34}$/
      const bech32 = /^bc1[a-z0-9]{39,59}$/
      const taproot = /^bc1p[a-z0-9]{58}$/
      
      return p2pkh.test(address) || p2sh.test(address) || bech32.test(address) || taproot.test(address)
    } else {
      const testP2pkh = /^[mn][1-9A-HJ-NP-Za-km-z]{25,34}$/
      const testP2sh = /^2[1-9A-HJ-NP-Za-km-z]{25,34}$/
      const testBech32 = /^tb1[a-z0-9]{39,59}$/
      const testTaproot = /^tb1p[a-z0-9]{58}$/
      
      return testP2pkh.test(address) || testP2sh.test(address) || testBech32.test(address) || testTaproot.test(address)
    }
  }

  // Get address type
  static getAddressType(address: string): 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr' | 'unknown' {
    if (address.startsWith('1') || address.startsWith('m') || address.startsWith('n')) {
      return 'p2pkh'
    }
    if (address.startsWith('3') || address.startsWith('2')) {
      return 'p2sh'
    }
    if (address.startsWith('bc1') && address.length === 42) {
      return 'p2wpkh'
    }
    if (address.startsWith('bc1p') || address.startsWith('tb1p')) {
      return 'p2tr'
    }
    return 'unknown'
  }

  // Get network from address
  static getNetworkFromAddress(address: string): 'mainnet' | 'testnet' | 'unknown' {
    if (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1')) {
      return 'mainnet'
    }
    if (address.startsWith('m') || address.startsWith('n') || address.startsWith('2') || address.startsWith('tb1')) {
      return 'testnet'
    }
    return 'unknown'
  }

  // Generate inscription content for BRC-20
  static generateBRC20Content(operation: 'deploy' | 'mint' | 'transfer', params: any): string {
    const content = {
      p: 'brc-20',
      op: operation,
      ...params
    }
    return JSON.stringify(content)
  }

  // Validate BRC-20 ticker
  static validateBRC20Ticker(ticker: string): boolean {
    return /^[a-zA-Z0-9]{1,4}$/.test(ticker)
  }

  // Calculate inscription size
  static calculateInscriptionSize(content: string): number {
    return Buffer.byteLength(content, 'utf8')
  }

  // Estimate inscription fee
  static estimateInscriptionFee(contentSize: number, feeRate: number): number {
    const estimatedSize = contentSize + 150
    return Math.ceil(estimatedSize * feeRate)
  }
}
