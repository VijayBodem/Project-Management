import axios from 'axios';

export interface GeolocationData {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

class GeolocationService {
  private readonly apiKey: string;
  private readonly baseUrl = 'http://ip-api.com/json';

  constructor() {
    this.apiKey = process.env.IP_API_KEY || ''; // Optional API key for higher limits
  }

  /**
   * Get geolocation data for an IP address
   */
  async getLocation(ip: string): Promise<GeolocationData> {
    try {
      // Skip geolocation for local/private IPs in development
      if (this.isPrivateIP(ip) || ip === '127.0.0.1' || ip === '::1') {
        return {
          ip,
          country: 'Local',
          region: 'Development',
          city: 'Development',
          latitude: 0,
          longitude: 0,
          timezone: 'UTC',
          isp: 'Local Network'
        };
      }

      const url = `${this.baseUrl}/${ip}?fields=status,message,country,region,city,lat,lon,timezone,isp${this.apiKey ? `&key=${this.apiKey}` : ''}`;

      const response = await axios.get(url, {
        timeout: 5000, // 5 second timeout
        headers: {
          'User-Agent': 'ProjectManagement/1.0'
        }
      });

      const data = response.data;

      if (data.status !== 'success') {
        console.warn(`⚠️ Geolocation failed for IP ${ip}:`, data.message);
        return { ip };
      }

      return {
        ip,
        country: data.country,
        region: data.region,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone,
        isp: data.isp
      };
    } catch (error) {
      console.error(`❌ Geolocation service error for IP ${ip}:`, error);
      // Return basic data on error
      return { ip };
    }
  }

  /**
   * Check if IP is private/local
   */
  private isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    if (ip.includes('.')) {
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4) return false;

      // 10.0.0.0/8
      if (parts[0] === 10) return true;
      // 172.16.0.0/12
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) return true;
      // 127.0.0.0/8 (loopback)
      if (parts[0] === 127) return true;
    }

    // IPv6 loopback
    if (ip === '::1') return true;

    return false;
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Assess risk score based on location changes
   */
  assessRiskScore(currentLocation: GeolocationData, previousLocations: GeolocationData[]): number {
    if (!currentLocation.latitude || !currentLocation.longitude) {
      return 50; // Medium risk if no location data
    }

    if (previousLocations.length === 0) {
      return 10; // Low risk for first login
    }

    // Check distance from previous locations
    const distances = previousLocations
      .filter(loc => loc.latitude && loc.longitude)
      .map(loc => this.calculateDistance(
        currentLocation.latitude!,
        currentLocation.longitude!,
        loc.latitude!,
        loc.longitude!
      ));

    if (distances.length === 0) {
      return 40; // Medium risk if no previous location data
    }

    const avgDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
    const maxDistance = Math.max(...distances);

    // Risk scoring based on distance
    if (avgDistance < 100) return 10; // Within same country/region - low risk
    if (avgDistance < 1000) return 30; // Within same continent - medium risk
    if (maxDistance > 5000) return 80; // Very far location - high risk

    return 50; // Default medium risk
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();
export default geolocationService;
