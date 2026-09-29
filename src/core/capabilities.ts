export type CapabilityStatus = 'verified' | 'available' | 'configured' | 'unavailable' | 'simulated';

export interface Capability {
  id: string;
  name: string;
  status: CapabilityStatus;
  verifiedAt?: string;
  version?: string;
  details?: Record<string, unknown>;
  reason?: string;
}

export interface HardwareCapabilities {
  platform: string;
  arch: string;
  cpuCores: number;
  memoryBytes: number;
  gpu: Array<{
    name: string;
    vendor?: string;
    backend: 'ROCm' | 'DirectML' | 'CUDA' | 'CPU' | 'Unknown';
    status: CapabilityStatus;
    details?: Record<string, unknown>;
  }>;
  ffmpeg: Capability;
}

export interface ProviderCapability {
  provider: string;
  status: CapabilityStatus;
  endpoint?: string;
  models?: string[];
  voices?: number;
  reason?: string;
  checkedAt: string;
}

export interface CapabilitySnapshot {
  timestamp: string;
  hardware: HardwareCapabilities;
  providers: ProviderCapability[];
}
