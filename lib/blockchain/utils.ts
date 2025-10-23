import { formatEther, parseEther, type Address } from 'viem';

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: Address, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format ETH amount for display
 */
export function formatEth(value: bigint, decimals: number = 4): string {
  const eth = formatEther(value);
  const num = parseFloat(eth);
  return num.toFixed(decimals);
}

/**
 * Parse ETH string to bigint
 */
export function parseEth(value: string): bigint {
  try {
    return parseEther(value);
  } catch (error) {
    throw new Error('Invalid ETH amount');
  }
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Compare addresses (case-insensitive)
 */
export function isSameAddress(a: Address, b: Address): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Get block explorer URL
 */
export function getExplorerUrl(
  chainId: number,
  type: 'tx' | 'address' | 'block',
  value: string
): string {
  const baseUrl =
    chainId === 8453 ? 'https://basescan.org' : 'https://sepolia.basescan.org';

  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${value}`;
    case 'address':
      return `${baseUrl}/address/${value}`;
    case 'block':
      return `${baseUrl}/block/${value}`;
    default:
      return baseUrl;
  }
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: bigint, total: bigint): number {
  if (total === BigInt(0)) return 0;
  return Number((part * BigInt(10000)) / total) / 100;
}

/**
 * Add percentage to amount
 */
export function addPercentage(amount: bigint, percentage: number): bigint {
  const multiplier = BigInt(Math.floor((100 + percentage) * 100));
  return (amount * multiplier) / BigInt(10000);
}

/**
 * Subtract percentage from amount
 */
export function subtractPercentage(amount: bigint, percentage: number): bigint {
  const multiplier = BigInt(Math.floor((100 - percentage) * 100));
  return (amount * multiplier) / BigInt(10000);
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Check if timestamp is in the past
 */
export function isPastTimestamp(timestamp: number): boolean {
  return timestamp * 1000 < Date.now();
}

/**
 * Get time remaining until timestamp
 */
export function getTimeRemaining(timestamp: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const total = timestamp * 1000 - Date.now();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

/**
 * Format time remaining as string
 */
export function formatTimeRemaining(timestamp: number): string {
  const { days, hours, minutes, total } = getTimeRemaining(timestamp);

  if (total <= 0) {
    return 'Ended';
  }

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}
